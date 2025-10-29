from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import os
import uuid
import logging

logger = logging.getLogger(__name__)

from ..database import get_db
from ..models import Invite, Job, Candidate, Session as SessionModel, Turn, TurnStatus
from ..schemas import (
    SessionStartRequest, SessionStartResponse, SpeechSubmissionResponse,
    TimeoutRequest
)
from ..services.groq_client import groq_client
from ..config import settings
from ..services.scoring import get_final_assessment
from ..services.proctor_signals import proctor_signals
from ..services.interview_structure import interview_structure

def get_conversation_history(session_id: int, current_turn: int, db: Session) -> list:
    """Get previous questions and answers for context"""
    previous_turns = db.query(Turn).filter(
        Turn.session_id == session_id,
        Turn.question_number < current_turn,
        Turn.answer_text.isnot(None)
    ).order_by(Turn.question_number).all()
    
    history = []
    for turn in previous_turns:
        history.append({
            "question": turn.question_text or "N/A",
            "answer": turn.answer_text or "N/A"
        })
    return history

# Import the RAG service with improved error handling
try:
    # Set SSL environment for model loading
    import os
    
    # Clear problematic SSL environment variables (from startup_config)
    ssl_vars_to_clear = ['REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE', 'SSL_CERT_FILE']
    for var in ssl_vars_to_clear:
        if var in os.environ:
            del os.environ[var]
    
    from ..services.rag import RAGService
    rag_service = RAGService()
    logger.info("✅ RAG service loaded successfully (may use fallback vectorstore)")
    
except Exception as e:
    logger.warning(f"⚠️ Failed to load RAG service, using enhanced mock: {str(e)}")
    
    # Enhanced mock service that uses resume content (fallback)
    class EnhancedMockRagService:
        def generate_initial_question(self, jd_text, resume_text=""):
            if resume_text and len(resume_text) > 100:
                # Extract some context from resume for a more personalized question
                if "python" in resume_text.lower():
                    return "I can see you have Python experience on your resume. Can you tell me about a challenging Python project you've worked on?"
                elif "javascript" in resume_text.lower() or "react" in resume_text.lower():
                    return "I notice you have frontend development experience. Can you walk me through your approach to building scalable web applications?"
                elif "machine learning" in resume_text.lower() or "ai" in resume_text.lower():
                    return "Your resume mentions machine learning experience. Can you describe a specific ML project and the challenges you faced?"
                else:
                    return f"I can see from your resume that you have {len(resume_text)} characters of experience to discuss. Tell me about your most significant professional accomplishment."
            return "Tell me about yourself and your professional background."
        
        def generate_followup_question(self, current_question, answer, context=""):
            return {
                "question": "That's interesting. Can you provide more technical details about your approach?",
                "score": 7.5,
                "feedback": "Good response. Consider providing more specific examples."
            }

    rag_service = EnhancedMockRagService()

router = APIRouter()


@router.get("/debug-rag/{candidate_id}")
async def debug_rag_integration(candidate_id: int, db: Session = Depends(get_db)):
    """Debug endpoint to test RAG integration with resume data"""
    try:
        # Get candidate
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return {"error": "Candidate not found"}
        
        # Get a job for testing
        job = db.query(Job).first()
        if not job:
            return {"error": "No jobs available for testing"}
        
        resume_text = candidate.resume_text or ""
        service_type = type(rag_service).__name__
        
        # Test vector store capabilities (sentence transformers)
        vector_test_result = "Not tested"
        try:
            if hasattr(rag_service, 'vector_store'):
                # Test vector store directly
                test_docs = [resume_text[:500]] if resume_text else ["Test document"]
                test_metadata = [{"type": "test"}]
                rag_service.vector_store.add_documents(test_docs, test_metadata)
                search_results = rag_service.vector_store.search("Python experience", k=1)
                vector_test_result = f"✅ Vector store working - {len(search_results)} results"
            else:
                vector_test_result = "⚠️ No vector store available"
        except Exception as ve:
            vector_test_result = f"❌ Vector store error: {str(ve)[:100]}"
        
        # Test RAG service (may fail due to API issues)
        try:
            question = rag_service.generate_initial_question(job.description, resume_text)
            rag_status = "✅ Full RAG working"
        except Exception as e:
            error_msg = str(e)
            if "groq" in error_msg.lower() or "api" in error_msg.lower():
                question = f"RAG vector processing works, but API error: {error_msg[:100]}"
                rag_status = "⚠️ RAG vectors working, API issue"
            else:
                question = f"RAG error: {error_msg[:100]}"
                rag_status = "❌ RAG failed"
        
        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.name,
            "has_resume": bool(resume_text),
            "resume_length": len(resume_text),
            "resume_preview": resume_text[:200] + "..." if len(resume_text) > 200 else resume_text,
            "job_description": job.description[:100] + "..." if len(job.description) > 100 else job.description,
            "rag_service_type": service_type,
            "vector_store_test": vector_test_result,
            "generated_question": question,
            "status": rag_status,
            "sentence_transformers_working": service_type == "RAGService" and "✅" in vector_test_result
        }
        
    except Exception as e:
        return {"error": f"Debug failed: {str(e)}"}


@router.options("/start")
async def start_session_options():
    """Handle CORS preflight requests for start session endpoint"""
    return {"message": "OK"}

@router.post("/start", response_model=SessionStartResponse)
async def start_session(request: SessionStartRequest, db: Session = Depends(get_db)):
    """Start interview session and generate first question"""
    
    print(f"DEBUG: Received session start request: {request}")
    
    # Validate invite
    invite = db.query(Invite).filter(Invite.id == request.invite_id).first()
    if not invite:
        print(f"DEBUG: Invite not found with ID: {request.invite_id}")
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.status != "pending":
        print(f"DEBUG: Invite status is '{invite.status}', not 'pending'")
        raise HTTPException(status_code=400, detail="Invite already used")
    
    # Check if session already exists for this invite
    existing_session = db.query(SessionModel).filter(
        SessionModel.invite_id == request.invite_id
    ).first()
    if existing_session:
        raise HTTPException(status_code=400, detail="Session already exists for this invite")
    
    # Get job and candidate from invite
    job = db.query(Job).filter(Job.id == invite.job_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == invite.candidate_id).first()
    
    if not job or not candidate:
        raise HTTPException(status_code=404, detail="Job or candidate not found")
    
    # Mark invite as used
    invite.status = "used"
    
    # Create session with unique token
    session_token = str(uuid.uuid4())
    session = SessionModel(
        invite_id=request.invite_id,
        session_token=session_token,
        status="started"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Generate first question using RAG
    try:
        # Get resume text from candidate
        resume_text = candidate.resume_text or ""
        if resume_text:
            first_question = rag_service.generate_initial_question(job.description, resume_text)
        else:
            # If no resume text, generate a generic question
            first_question = f"Tell me about your experience that makes you suitable for this {job.title} role."
    except Exception:
        # Fallback question
        first_question = f"Tell me about your experience that makes you suitable for this {job.title} role."
    
    # Create first turn
    now_utc = datetime.now(timezone.utc)
    deadline = now_utc + timedelta(seconds=settings.answer_seconds)
    
    turn = Turn(
        session_id=session.id,
        question_number=1,
        idx=1,  # Add idx field
        question_text=first_question,
        prompt=first_question,  # Add prompt field
        started_at=now_utc,
        start_time=now_utc,  # Add start_time field
        deadline=deadline,  # Add deadline field
        status=TurnStatus.NOT_STARTED.value  # Add status field
    )
    db.add(turn)
    db.commit()
    
    return SessionStartResponse(
        session_id=session.id,
        question=first_question,
        turn_idx=1,
        answer_seconds=settings.answer_seconds,
        buffer_seconds=settings.buffer_seconds,
        deadline_utc=deadline
    )


@router.options("/{session_id}/speech")
async def speech_options(session_id: int):
    """Handle CORS preflight requests for speech endpoint"""
    return {"message": "OK"}

@router.post("/{session_id}/speech", response_model=SpeechSubmissionResponse)
async def submit_speech_answer(
    session_id: int,
    audio: UploadFile = File(...),
    question: str = Form(...),
    turn_idx: int = Form(...),
    db: Session = Depends(get_db)
):
    """Process speech answer and generate follow-up"""
    
    # Validate session
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Validate turn
    turn = db.query(Turn).filter(
        Turn.session_id == session_id,
        Turn.question_number == turn_idx
    ).first()
    if not turn:
        raise HTTPException(status_code=404, detail="Turn not found")
    
    # Check timing
    now_utc = datetime.now(timezone.utc)
    
    # Handle case where deadline might be None
    if turn.deadline:
        grace_deadline = turn.deadline + timedelta(seconds=settings.grace_seconds)
        if now_utc > grace_deadline:
            turn.status = TurnStatus.LATE.value
        else:
            turn.status = TurnStatus.ONTIME.value
    else:
        # If no deadline set, assume on time
        turn.status = TurnStatus.ONTIME.value
    
    turn.submitted_at = now_utc
    
    try:
        # Save audio file
        audio_filename = f"session_{session_id}_turn_{turn_idx}_{uuid.uuid4().hex}.webm"
        audio_path = os.path.join(settings.audio_storage_path, audio_filename)
        
        with open(audio_path, "wb") as audio_file:
            audio_file.write(await audio.read())
        
        turn.audio_url = f"/audio/{audio_filename}"
        
        # Transcribe audio
        transcript = groq_client.transcribe_audio(audio_path)
        turn.answer_text = transcript
        
        # Check if transcription failed (contains error messages)
        transcription_failed = any(error_phrase in transcript.lower() for error_phrase in [
            "unable to transcribe", "audio file not found", "recording too short",
            "audio format not supported", "transcription service", "unable to process"
        ])
        
        # Check if scoring should be skipped for this question
        should_skip_scoring = interview_structure.should_skip_scoring(turn.question_number)
        
        if transcription_failed:
            # Use a default evaluation for failed transcriptions
            evaluation = {
                "score": 3,  # Neutral score for technical issues
                "missing": ["Could not evaluate due to audio issues"],
                "followup": "I'm sorry, there was an issue with the audio. Could you please try answering again?",
                "complete": False
            }
            turn.followup_reason = "Audio transcription failed"
            print(f"⚠️  Transcription failed for session {session_id}, turn {turn_idx}: {transcript}")
        elif should_skip_scoring:
            # Skip evaluation for this question - generate next question without scoring
            try:
                # Get job description and resume for context
                job_description = ""
                resume_text = ""
                if session.invite and session.invite.job:
                    job_description = session.invite.job.description or ""
                if session.invite and session.invite.candidate:
                    resume_text = session.invite.candidate.resume_text or ""
                
                # Get conversation history to avoid repetition
                conversation_history = get_conversation_history(session_id, turn.question_number, db)
                
                # Generate next question based on current section
                evaluation = rag_service.generate_followup_question(
                    question, transcript, job_description, turn.question_number, conversation_history
                )
                # Override to not show score for non-scored questions
                evaluation["score"] = None  
                section_info = interview_structure.get_section_info(turn.question_number)
                turn.followup_reason = f"{section_info['name']} section - no scoring"
                print(f"✅ Question {turn.question_number} completed (no scoring) for session {session_id}")
            except Exception as eval_error:
                print(f"❌ Error generating first question: {str(eval_error)}")
                import traceback
                traceback.print_exc()
                # Fallback to section-appropriate question
                section_info = interview_structure.get_section_info(turn.question_number + 1)
                if section_info['name'] == 'technology':
                    fallback_q = "Let's discuss programming fundamentals. Can you explain the difference between arrays and linked lists?"
                else:
                    fallback_q = "Let's continue with the next question. Can you tell me more about your experience?"
                    
                evaluation = {
                    "score": None,
                    "missing": [],
                    "followup": fallback_q,
                    "complete": False
                }
                turn.followup_reason = f"Question generation error - {section_info['name']} fallback"
        else:
            # Normal evaluation process
            try:
                # Get job description safely
                job_description = ""
                if session.invite and session.invite.job:
                    job_description = session.invite.job.description or ""
                
                # Get conversation history to avoid repetition
                conversation_history = get_conversation_history(session_id, turn.question_number, db)
                
                evaluation = rag_service.generate_followup_question(
                    question, transcript, job_description, turn.question_number, conversation_history
                )
                turn.followup_reason = "Generated based on candidate response"
            except Exception as eval_error:
                print(f"❌ Error evaluating answer: {str(eval_error)}")
                import traceback
                traceback.print_exc()
                # Fallback evaluation
                evaluation = {
                    "score": 5,
                    "missing": ["Error during evaluation"],
                    "followup": "Thank you for your answer. Let's continue with the next topic.",
                    "complete": False
                }
                turn.followup_reason = "Evaluation error - fallback response"
        
        # Store scores (None for introduction, actual score for technical questions)
        turn.scores_json = {
            "score": evaluation.get("score"),
            "missing": evaluation.get("missing", [])
        }
        
        db.commit()
        
        # Count successful questions (non-failed transcriptions) and total turns
        all_turns = db.query(Turn).filter(Turn.session_id == session_id).all()
        successful_questions = len([t for t in all_turns if t.followup_reason != "Audio transcription failed"])
        total_attempts = len(all_turns)
        failed_attempts = total_attempts - successful_questions
        
        # Determine if interview is complete
        # Complete if: reached max questions OR exceeded max retries OR AI says complete
        max_questions_reached = successful_questions >= settings.max_questions
        max_retries_exceeded = failed_attempts >= settings.max_retries
        ai_complete = evaluation.get("complete", False)
        
        complete = max_questions_reached or max_retries_exceeded or ai_complete
        
        response_data = {
            "transcript": transcript,
            "score": evaluation.get("score") if not transcription_failed and not should_skip_scoring else None,  # Don't show score for failed audio or non-scored questions
            "missing": evaluation.get("missing", []),
            "buffer_seconds": settings.buffer_seconds,
            "answer_seconds": settings.answer_seconds,
            "complete": complete,
            "successful_questions": successful_questions,
            "failed_attempts": failed_attempts
        }
        
        if not complete:
            # Create next turn
            next_start_time = now_utc + timedelta(seconds=settings.buffer_seconds)
            next_deadline = next_start_time + timedelta(seconds=settings.answer_seconds)
            
            next_turn = Turn(
                session_id=session_id,
                question_number=turn_idx + 1,  # Required field
                question_text=evaluation.get("followup", "Thank you for your response."),  # Required field
                idx=turn_idx + 1,
                prompt=evaluation.get("followup", "Thank you for your response."),
                start_time=next_start_time,
                deadline=next_deadline,
                status=TurnStatus.PENDING.value
            )
            db.add(next_turn)
            db.commit()
            
            response_data.update({
                "next_question": evaluation.get("followup"),
                "next_turn_idx": turn_idx + 1,
                "show_at_utc": next_start_time
            })
        else:
            # Mark session as completed
            session.status = "completed"
            session.ended_at = now_utc
            
            # Calculate overall score and category (excluding None scores from introduction)
            all_turns = db.query(Turn).filter(Turn.session_id == session_id).all()
            scores = [
                t.scores_json.get("score") 
                for t in all_turns 
                if t.scores_json and t.scores_json.get("score") is not None
            ]
            
            if scores:
                average_score = sum(scores) / len(scores)
                session.score = average_score
                
                # Get proctor risk assessment
                risk_assessment = proctor_signals.get_risk_assessment(session_id, db)
                proctor_risk = risk_assessment.get('risk_score', 0)
                
                # Calculate final assessment with category
                final_assessment = get_final_assessment(
                    average_score=average_score,
                    successful_questions=successful_questions,
                    failed_attempts=failed_attempts,
                    proctor_risk=proctor_risk
                )
                
                # Save score category
                session.score_category = final_assessment['score_category']
                
                # Store detailed assessment in metadata
                if not session.session_metadata:
                    session.session_metadata = {}
                session.session_metadata['final_assessment'] = final_assessment
                
            db.commit()
        
        return SpeechSubmissionResponse(**response_data)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in submit_speech_answer: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()  # Rollback any pending changes
        raise HTTPException(status_code=500, detail=f"Error processing speech: {str(e)}")


@router.options("/{session_id}/timeout")
async def timeout_options(session_id: int):
    """Handle CORS preflight requests for timeout endpoint"""
    return {"message": "OK"}

@router.post("/{session_id}/timeout")
def handle_timeout(
    session_id: int,
    request: TimeoutRequest,
    db: Session = Depends(get_db)
):
    """Handle answer timeout"""
    
    # Validate session and turn
    turn = db.query(Turn).filter(
        Turn.session_id == session_id,
        Turn.question_number == request.turn_idx
    ).first()
    
    if not turn:
        raise HTTPException(status_code=404, detail="Turn not found")
    
    # Mark turn as timeout
    turn.status = TurnStatus.TIMEOUT.value
    turn.submitted_at = datetime.now(timezone.utc)
    turn.answer_text = "[No response - timeout]"
    
    # Count successful questions and total attempts to determine if we should continue
    all_turns = db.query(Turn).filter(Turn.session_id == session_id).all()
    successful_questions = len([t for t in all_turns if t.followup_reason != "Audio transcription failed" and t.answer_text != "[No response - timeout]"])
    
    # Create next turn with generic follow-up if within limits
    if successful_questions < settings.max_questions:  # Continue until max questions reached
        next_start_time = datetime.now(timezone.utc) + timedelta(seconds=settings.buffer_seconds)
        next_deadline = next_start_time + timedelta(seconds=settings.answer_seconds)
        
        next_turn = Turn(
            session_id=session_id,
            question_number=request.turn_idx + 1,  # Required field
            question_text="Let's move on to another question. Can you tell me about a challenging project you've worked on?",  # Required field
            idx=request.turn_idx + 1,
            prompt="Let's move on to another question. Can you tell me about a challenging project you've worked on?",
            start_time=next_start_time,
            deadline=next_deadline,
            status=TurnStatus.PENDING.value
        )
        db.add(next_turn)
        
        db.commit()
        
        return {
            "next_question": next_turn.prompt,
            "next_turn_idx": request.turn_idx + 1,
            "buffer_seconds": settings.buffer_seconds,
            "show_at_utc": next_start_time,
            "answer_seconds": settings.answer_seconds,
            "complete": False
        }
    else:
        # End session
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        session.status = "completed"
        session.ended_at = datetime.now(timezone.utc)
        
        db.commit()
        
        return {
            "complete": True,
            "message": "Interview completed"
        }