import requests
import json
from typing import Dict, Any, List
from ..config import settings


class GroqClient:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribe audio using Groq Whisper API with enhanced error handling
        """
        import os
        
        # Check file size and validity first
        if not os.path.exists(audio_file_path):
            print(f"❌ Audio file not found: {audio_file_path}")
            return "Audio file not found."
        
        file_size = os.path.getsize(audio_file_path)
        print(f"📄 Processing audio file: {os.path.basename(audio_file_path)} ({file_size} bytes)")
        
        if file_size < 1000:  # Files smaller than 1KB are likely invalid
            print(f"⚠️  Audio file too small ({file_size} bytes) - likely invalid recording")
            return "Recording too short or invalid. Please try recording again."
        
        # Clear SSL environment variables to avoid certificate issues
        ssl_vars = ['REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE', 'SSL_CERT_FILE']
        original_values = {}
        for var in ssl_vars:
            if var in os.environ:
                original_values[var] = os.environ[var]
                del os.environ[var]
        
        try:
            url = f"{self.base_url}/audio/transcriptions"
            
            with open(audio_file_path, "rb") as audio_file:
                files = {
                    "file": (os.path.basename(audio_file_path), audio_file, "audio/webm")
                }
                data = {
                    "model": "whisper-large-v3",
                    "response_format": "json"
                }
                headers = {"Authorization": f"Bearer {self.api_key}"}
                
                response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
                
                if response.status_code == 200:
                    result = response.json()
                    transcript = result.get("text", "").strip()
                    print(f"✅ Transcription successful: '{transcript}'")
                    
                    if not transcript:
                        return "No speech detected in the recording. Please try speaking more clearly."
                    
                    return transcript
                
                else:
                    # Enhanced error handling with specific messages
                    error_msg = f"Groq API Error {response.status_code}: {response.text}"
                    print(f"❌ {error_msg}")
                    
                    # Parse specific error types
                    try:
                        error_json = response.json()
                        error_message = error_json.get("error", {}).get("message", "Unknown error")
                        
                        if "could not process file" in error_message.lower():
                            return "Audio format not supported. Please try recording again."
                        elif "invalid" in error_message.lower():
                            return "Invalid audio file. Please check your microphone and try again."
                        else:
                            return "Transcription service temporarily unavailable. Please try again."
                    except:
                        return "Transcription service error. Please try again."
        
        except Exception as e:
            print(f"❌ Transcription exception: {str(e)}")
            return "Unable to process audio. Please try again."
        
        finally:
            # Restore original SSL environment variables
            for var, value in original_values.items():
                os.environ[var] = value
    
    def chat_followup_json(self, criteria: str, question: str, answer: str, job_description: str = "", question_context: Dict = None, conversation_history: List = None) -> Dict[str, Any]:
        """
        Generate follow-up evaluation using Groq Chat API
        Returns structured JSON with score, missing points, followup question, and completion status
        
        Args:
            criteria: Evaluation criteria
            question: The question asked
            answer: Candidate's answer
            job_description: Job description to evaluate alignment with role requirements
            question_context: Context for the next question type
            conversation_history: Previous questions and answers to avoid repetition
        """
        url = f"{self.base_url}/chat/completions"
        
        system_prompt = """You are an expert technical interview evaluator. Return ONLY valid JSON in this exact format:
{
  "score": <number between 1-10>,
  "missing": ["list of missing key points or gaps"],
  "followup": "<next question or follow-up based on the answer>",
  "complete": <true if this topic is sufficiently covered, false otherwise>
}

Evaluation Guidelines:
- Consider job requirements and role-specific competencies
- Assess technical depth, clarity, and practical understanding
- Evaluate problem-solving approach and communication
- Be thorough but fair in scoring
- Focus on both theoretical knowledge and practical application
- Consider how well the answer aligns with the job requirements
- IMPORTANT: Only ask about specific technologies (like PostgreSQL, Redis, specific frameworks) if they are explicitly mentioned in the job requirements or candidate's background
- Keep questions diverse and avoid over-focusing on any single technology
- For database questions, use general terms unless PostgreSQL is specifically mentioned in job requirements"""
        
        # Build context-aware prompt based on question structure
        next_question_guidance = ""
        if question_context:
            if question_context.get("type") == "technology":
                next_question_guidance = f"""
NEXT QUESTION CONTEXT: Generate a programming/technical question focusing on: {', '.join(question_context.get('focus', []))}.
Ask about fundamental programming concepts, data structures, algorithms, or SQL based on the job requirements and candidate's background.
"""
            elif question_context.get("type") == "mixed":
                next_question_guidance = f"""
NEXT QUESTION CONTEXT: Generate a question that integrates job requirements with the candidate's resume/experience.
Focus on: {', '.join(question_context.get('focus', []))}.
"""
            elif question_context.get("type") == "introduction_followup":
                next_question_guidance = """
NEXT QUESTION CONTEXT: Generate a follow-up question based on the candidate's introduction.
Ask for clarification or deeper details about their mentioned skills, projects, or experience.
"""
        
        # Build conversation history context
        history_context = ""
        if conversation_history:
            history_context = "\n\nPREVIOUS CONVERSATION HISTORY (avoid repeating similar questions):\n"
            for i, turn in enumerate(conversation_history, 1):
                history_context += f"Q{i}: {turn.get('question', 'N/A')}\n"
                history_context += f"A{i}: {turn.get('answer', 'N/A')[:200]}...\n\n"
        
        user_prompt = f"""
Job Requirements: {job_description if job_description else "General technical role"}

Evaluation Criteria: {criteria}
Current Question: {question}
Current Answer: {answer}

{history_context}

{next_question_guidance}

IMPORTANT: Review the conversation history above and ensure your next question is NEW and DIFFERENT from previously asked questions. Avoid asking about the same projects, skills, or topics already covered.

Evaluate this answer considering:
1. Technical accuracy and depth
2. Relevance to the job requirements
3. Problem-solving demonstration
4. Communication clarity
5. Practical application knowledge

Provide the next follow-up question if more depth is needed, or acknowledge completion if thoroughly covered.
"""
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 500
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        content = result["choices"][0]["message"]["content"].strip()
        
        # Clean up the response to extract JSON
        content = content.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "score": 5,
                "missing": ["Could not parse evaluation"],
                "followup": "Could you elaborate on your previous answer?",
                "complete": False
            }
    
    def generate_initial_question(self, job_description: str, resume_text: str = "") -> str:
        """
        Generate the introduction question (always the same, not scored)
        """
        # Return a standard introduction question - no AI generation needed
        return "Please introduce yourself, tell us about your skills, and describe some of the projects you've worked on."


# Global instance
groq_client = GroqClient()