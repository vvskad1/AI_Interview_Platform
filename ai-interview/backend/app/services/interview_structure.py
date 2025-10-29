"""
Interview Structure Service - Manages the 15-question interview flow
"""

class InterviewStructure:
    """Manages the structured 15-question interview flow"""
    
    def __init__(self):
        # Define the interview structure
        self.structure = {
            # Introduction Section (Questions 1-4)
            "introduction": {
                "range": (1, 4),
                "description": "Introduction and follow-up questions",
                "skip_scoring": [1]  # Only skip scoring for question 1
            },
            
            # Technology Section (Questions 5-8)  
            "technology": {
                "range": (5, 8),
                "description": "Programming and technical questions (OOP, data structures, SQL, etc.)",
                "skip_scoring": []  # Score all tech questions
            },
            
            # Mixed Section (Questions 9-15)
            "mixed": {
                "range": (9, 15),
                "description": "Job + resume integrated questions with follow-ups", 
                "skip_scoring": []  # Score all mixed questions
            }
        }
    
    def get_section_type(self, question_number: int) -> str:
        """Get the section type for a given question number"""
        for section_name, section_info in self.structure.items():
            start, end = section_info["range"]
            if start <= question_number <= end:
                return section_name
        return "mixed"  # fallback
    
    def should_skip_scoring(self, question_number: int) -> bool:
        """Check if scoring should be skipped for this question number"""
        section_type = self.get_section_type(question_number)
        section_info = self.structure[section_type]
        return question_number in section_info["skip_scoring"]
    
    def get_question_context(self, question_number: int, job_description: str = "", resume_text: str = "") -> dict:
        """Get context for generating a question based on section type"""
        section_type = self.get_section_type(question_number)
        
        if section_type == "introduction":
            if question_number == 1:
                return {
                    "type": "introduction",
                    "prompt": "Please introduce yourself, tell us about your skills, and describe some of the projects you've worked on.",
                    "fixed": True
                }
            else:
                return {
                    "type": "introduction_followup", 
                    "context": "Follow-up questions based on the candidate's introduction",
                    "job_description": job_description,
                    "resume_text": resume_text
                }
        
        elif section_type == "technology":
            return {
                "type": "technology",
                "context": "Programming and technical questions covering OOP, arrays, strings, collections, data structures, SQL, algorithms, etc.",
                "job_description": job_description,
                "resume_text": resume_text,
                "focus": ["OOP", "data structures", "algorithms", "SQL", "arrays", "strings", "collections", "programming fundamentals"]
            }
        
        elif section_type == "mixed":
            return {
                "type": "mixed",
                "context": "Questions integrating both job requirements and candidate's resume/experience",
                "job_description": job_description,
                "resume_text": resume_text,
                "focus": ["job alignment", "experience relevance", "practical application"]
            }
    
    def get_section_info(self, question_number: int) -> dict:
        """Get detailed information about the current section"""
        section_type = self.get_section_type(question_number)
        section_info = self.structure[section_type].copy()
        section_info["name"] = section_type
        section_info["question_number"] = question_number
        start, end = section_info["range"]
        section_info["progress"] = f"{question_number - start + 1}/{end - start + 1}"
        return section_info


# Global instance
interview_structure = InterviewStructure()