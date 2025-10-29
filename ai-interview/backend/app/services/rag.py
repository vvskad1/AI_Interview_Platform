from typing import List, Dict, Any
import logging

# Try to import the complex vectorstore first, fallback to simple one
try:
    from .vectorstore import vector_store
    logger = logging.getLogger(__name__)
    logger.info("✅ Using advanced vectorstore with FAISS")
except ImportError as e:
    from .simple_vectorstore import simple_vector_store as vector_store
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Using simple vectorstore due to import error: {str(e)}")

from .groq_client import groq_client
from .interview_structure import interview_structure


class RAGService:
    def __init__(self):
        self.vector_store = vector_store
        self.groq_client = groq_client
        logger.info("RAG Service initialized successfully")
        
    def prepare_context(self, job_description: str, resume_text: str = ""):
        """Prepare and index context documents for RAG"""
        documents = []
        metadata = []
        
        # Add job description
        if job_description.strip():
            documents.append(job_description)
            metadata.append({'type': 'job_description'})
        
        # Add resume if provided
        if resume_text.strip():
            # Split resume into sections for better retrieval
            resume_sections = self._split_resume(resume_text)
            for section_name, section_text in resume_sections.items():
                if section_text.strip():
                    documents.append(section_text)
                    metadata.append({'type': 'resume', 'section': section_name})
        
        # Add to vector store
        if documents:
            self.vector_store.add_documents(documents, metadata)
    
    def _split_resume(self, resume_text: str) -> Dict[str, str]:
        """Split resume into logical sections"""
        # TODO: Implement more sophisticated resume section detection
        sections = {
            'full_resume': resume_text
        }
        
        lines = resume_text.split('\n')
        current_section = 'summary'
        section_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect section headers
            lower_line = line.lower()
            if any(keyword in lower_line for keyword in ['experience', 'employment', 'work history']):
                if section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'experience'
                section_content = []
            elif any(keyword in lower_line for keyword in ['education', 'qualification', 'degree']):
                if section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'education'
                section_content = []
            elif any(keyword in lower_line for keyword in ['skill', 'technical', 'competenc']):
                if section_content:
                    sections[current_section] = '\n'.join(section_content)
                current_section = 'skills'
                section_content = []
            else:
                section_content.append(line)
        
        # Add the last section
        if section_content:
            sections[current_section] = '\n'.join(section_content)
        
        return sections
    
    def generate_initial_question(self, job_description: str, resume_text: str = "") -> str:
        """Generate first interview question using RAG"""
        # Prepare context
        self.prepare_context(job_description, resume_text)
        
        # Use GROQ to generate initial question
        return self.groq_client.generate_initial_question(job_description, resume_text)
    
    def get_relevant_context(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Get relevant context for a query"""
        return self.vector_store.search(query, k=k)
    
    def generate_followup_question(self, current_question: str, candidate_answer: str, 
                                 job_context: str, question_number: int = 2, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """Generate follow-up question with context based on interview structure"""
        # Get relevant context
        context_docs = self.get_relevant_context(candidate_answer)
        
        # Build context string
        context_text = "\n".join([doc['document'] for doc in context_docs[:2]])
        
        # Get question context based on interview structure
        next_question_number = question_number + 1
        question_context = interview_structure.get_question_context(
            next_question_number, job_context, ""
        )
        
        # Define evaluation criteria
        criteria = "System Design, Technical Evidence, Clarity, Problem-solving approach, Job requirement alignment"
        
        # Use GROQ to evaluate and generate follow-up with structured context
        return self.groq_client.chat_followup_json(
            criteria, 
            current_question, 
            candidate_answer,
            job_context,  # Pass job description for better evaluation
            question_context,  # Pass structured question context
            conversation_history  # Pass conversation history to avoid repetition
        )


# Global RAG service instance
rag_service = RAGService()