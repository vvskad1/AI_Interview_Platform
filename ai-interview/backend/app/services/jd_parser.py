import PyPDF2
import io


def extract_jd_from_pdf(pdf_bytes: bytes) -> str:
    """Extract job description text from PDF"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    
    except Exception as e:
        return f"Error extracting JD text: {str(e)}"


def parse_job_description(jd_text: str) -> dict:
    """
    Parse job description and extract key requirements
    This is a simplified version - production would use more sophisticated NLP
    """
    # TODO: Implement proper JD parsing with NLP to extract:
    # - Required skills
    # - Experience level
    # - Key responsibilities
    # - Technical requirements
    
    return {
        'raw_text': jd_text,
        'requirements': extract_requirements(jd_text),
        'skills': extract_skills(jd_text),
        'level': extract_level(jd_text)
    }


def extract_requirements(text: str) -> list:
    """Extract requirements from job description"""
    requirements = []
    lines = text.lower().split('\n')
    
    for line in lines:
        if any(keyword in line for keyword in ['require', 'must have', 'essential', 'mandatory']):
            requirements.append(line.strip())
    
    return requirements[:10]  # Limit to top 10


def extract_skills(text: str) -> list:
    """Extract technical skills from job description"""
    # Common technical skills - this would be more comprehensive in production
    skill_keywords = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue',
        'node.js', 'express', 'django', 'flask', 'spring', 'bootstrap',
        'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
        'git', 'ci/cd', 'agile', 'scrum', 'microservices', 'rest',
        'graphql', 'api', 'sql', 'nosql', 'machine learning', 'ai'
    ]
    
    found_skills = []
    text_lower = text.lower()
    
    for skill in skill_keywords:
        if skill in text_lower:
            found_skills.append(skill.title())
    
    return list(set(found_skills))


def extract_level(text: str) -> str:
    """Extract experience level from job description"""
    text_lower = text.lower()
    
    if any(term in text_lower for term in ['senior', 'lead', 'principal', '5+ years', '6+ years']):
        return 'Senior'
    elif any(term in text_lower for term in ['junior', 'entry', 'graduate', '0-2 years', '1-3 years']):
        return 'Junior'
    else:
        return 'Mid-level'