import io
import re
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

try:
    import PyPDF2
    from PyPDF2 import PdfReader
except ImportError:
    PyPDF2 = None
    PdfReader = None

try:
    import docx
    from docx import Document
except ImportError:
    docx = None
    Document = None

try:
    from pdfminer.six import extract_text as pdfminer_extract_text # type: ignore
except ImportError:
    pdfminer_extract_text = None

logger = logging.getLogger(__name__)

class ResumeParser:
    """Resume parser to extract candidate information from PDF and DOC files"""
    
    def __init__(self):
        self.phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        self.skill_keywords = [
            # Programming Languages
            'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift',
            'kotlin', 'scala', 'r', 'matlab', 'typescript', 'dart', 'perl', 'shell', 'bash',
            
            # Web Technologies
            'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
            'spring', 'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap', 'sass', 'less',
            
            # Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
            'cassandra', 'elasticsearch', 'dynamodb', 'firebase',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
            'gitlab', 'bitbucket', 'terraform', 'ansible', 'chef', 'puppet', 'vagrant',
            
            # Data Science & AI
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
            'scikit-learn', 'keras', 'opencv', 'nlp', 'computer vision', 'data analysis',
            
            # Mobile Development
            'ios', 'android', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova',
            
            # Tools & Frameworks
            'jira', 'confluence', 'slack', 'trello', 'asana', 'figma', 'sketch', 'photoshop',
            'illustrator', 'postman', 'swagger', 'nginx', 'apache', 'linux', 'windows', 'macos'
        ]
        
        self.experience_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in\s*\w+',
            r'over\s*(\d+)\s*years?',
            r'more\s*than\s*(\d+)\s*years?'
        ]
        
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF using multiple methods"""
        text = ""
        
        # Try PyPDF2 first
        if PdfReader:
            try:
                pdf_file = io.BytesIO(file_content)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                if text.strip():
                    return text
            except Exception as e:
                logger.warning(f"PyPDF2 extraction failed: {e}")
        
        # Try pdfminer as fallback
        if pdfminer_extract_text:
            try:
                pdf_file = io.BytesIO(file_content)
                text = pdfminer_extract_text(pdf_file)
                if text.strip():
                    return text
            except Exception as e:
                logger.warning(f"PDFMiner extraction failed: {e}")
        
        return text


def parse_resume_text(resume_text: str) -> dict:
    """
    Parse resume text and extract key information
    This is a simple implementation - in production, you'd use more sophisticated NLP
    """
    # TODO: Implement proper resume parsing with NLP
    # For now, return the raw text with basic structure
    
    lines = resume_text.split('\n')
    sections = {
        'raw_text': resume_text,
        'experience': [],
        'skills': [],
        'education': [],
        'summary': ''
    }
    
    current_section = 'summary'
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Simple section detection
        lower_line = line.lower()
        if 'experience' in lower_line or 'employment' in lower_line:
            current_section = 'experience'
        elif 'skill' in lower_line or 'technical' in lower_line:
            current_section = 'skills'
        elif 'education' in lower_line or 'qualification' in lower_line:
            current_section = 'education'
        else:
            if current_section in sections and isinstance(sections[current_section], list):
                sections[current_section].append(line)
            elif current_section == 'summary':
                sections['summary'] += line + ' '
    
    return sections


# Global parser instance for backward compatibility
resume_parser = ResumeParser()

# Global function for backward compatibility with admin.py
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file content"""
    return resume_parser.extract_text_from_pdf(file_content)