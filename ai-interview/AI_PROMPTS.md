# AI Prompts Used in Interview System

## Overview
The interview system uses multiple AI prompts at different stages to generate questions and evaluate candidate responses. All prompts use the **Groq API** with **llama-3.3-70b-versatile** model.

---

## 1. Initial Question Generation Prompt

**When:** At the start of the interview  
**Purpose:** Generate the first interview question based on job description and candidate resume  
**Model:** llama-3.3-70b-versatile  
**Temperature:** 0.3  
**Max Tokens:** 300  

### Prompt Structure:
```
Job Description: {job_description}
Resume: {resume_text}

Generate an opening interview question that assesses system design, problem-solving, 
and technical depth appropriate for this role. 
The question should be open-ended and allow the candidate to demonstrate their 
experience and thought process.
Return only the question text, no additional formatting.
```

### Example Output:
```
"Can you describe a complex system you've designed and explain how you handled 
scalability challenges? Walk me through your architecture decisions and trade-offs."
```

---

## 2. Answer Evaluation & Follow-up Prompt

**When:** After each candidate answer  
**Purpose:** Evaluate the answer and generate next question  
**Model:** llama-3.3-70b-versatile  
**Temperature:** 0.3  
**Max Tokens:** 500  

### System Prompt:
```
You are an expert technical interview evaluator. Return ONLY valid JSON in this exact format:
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
```

### User Prompt:
```
Job Requirements: {job_description}

Evaluation Criteria: System Design, Technical Evidence, Clarity, 
                     Problem-solving approach, Job requirement alignment

Question: {previous_question}
Candidate's Answer: {transcribed_answer}

Evaluate this answer considering:
1. Technical accuracy and depth
2. Relevance to the job requirements
3. Problem-solving demonstration
4. Communication clarity
5. Practical application knowledge

Provide the next follow-up question if more depth is needed, 
or acknowledge completion if thoroughly covered.
```

### Example Response:
```json
{
  "score": 7,
  "missing": [
    "Didn't mention caching strategies",
    "No discussion of database indexing",
    "Limited explanation of load balancing approach"
  ],
  "followup": "You mentioned using a microservices architecture. How did you handle 
              inter-service communication and what patterns did you use for 
              distributed data consistency?",
  "complete": false
}
```

---

## 3. Audio Transcription

**When:** Processing candidate's voice response  
**Purpose:** Convert audio to text  
**Model:** whisper-large-v3  
**API:** Groq Audio API  

### Process:
1. Audio file (WebM format) uploaded
2. Whisper model transcribes to text
3. Transcription fed into evaluation prompt

### Error Handling:
- Files < 1KB rejected (likely silent/invalid)
- Failed transcriptions don't count toward question limit
- Friendly error messages returned to candidate

---

## Key Features of the Prompts

### 1. **Job Description Integration** ✅
- ✅ First question tailored to job requirements
- ✅ Every answer evaluated against job description
- ✅ Scoring considers role-specific competencies
- ✅ Follow-ups probe job-relevant skills

### 2. **Adaptive Questioning** 🎯
- Questions build on previous answers
- Probes deeper when gaps are detected
- Acknowledges when topic is thoroughly covered
- Generates natural conversation flow

### 3. **Comprehensive Evaluation** 📊
Evaluates on 5 dimensions:
1. **Technical Accuracy**: Correct concepts and terminology
2. **Job Relevance**: Alignment with role requirements
3. **Problem-Solving**: Approach to challenges
4. **Communication**: Clarity and structure
5. **Practical Application**: Real-world experience

### 4. **Structured Output** 📝
- Score: 1-10 scale for each answer
- Missing Points: What candidate didn't cover
- Follow-up: Next question based on answer
- Complete: Boolean indicating topic coverage

---

## Prompt Configuration

### Current Settings (in code):
```python
# groq_client.py
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BASE_URL = "https://api.groq.com/openai/v1"

# Question Generation
model = "llama-3.3-70b-versatile"
temperature = 0.3  # Lower = more focused
max_tokens = 300   # Initial questions

# Evaluation
model = "llama-3.3-70b-versatile"
temperature = 0.3  # Consistent scoring
max_tokens = 500   # Detailed feedback

# Transcription
model = "whisper-large-v3"
```

### Evaluation Criteria (in RAG service):
```python
criteria = "System Design, Technical Evidence, Clarity, 
           Problem-solving approach, Job requirement alignment"
```

---

## Example Interview Flow

### Question 1:
**AI Prompt Input:**
```
Job: Senior Python Developer with FastAPI experience
Resume: 5 years Python, built REST APIs

Generate opening question...
```

**AI Generated Question:**
```
"Can you walk me through how you would design a high-throughput REST API 
using FastAPI that needs to handle 10,000 requests per second?"
```

**Candidate Answer (Transcribed):**
```
"I would use FastAPI with async/await patterns. I'd implement connection pooling 
for the database and use Redis for caching frequently accessed data. I'd also 
set up load balancing with Nginx..."
```

**AI Evaluation Prompt:**
```
Job Requirements: Senior Python Developer, FastAPI, high-performance systems
Question: [API design question]
Answer: [candidate's transcribed answer]

Evaluate considering job requirements...
```

**AI Evaluation Response:**
```json
{
  "score": 8,
  "missing": [
    "No mention of rate limiting",
    "Could elaborate on database query optimization"
  ],
  "followup": "That's a solid approach. How would you implement rate limiting 
              to prevent abuse, and what database optimization techniques 
              would you use to maintain performance?",
  "complete": false
}
```

---

## How to Customize Prompts

### 1. **Modify Evaluation Criteria**
Edit `app/services/rag.py` line 112:
```python
criteria = "Your custom criteria here"
```

### 2. **Change System Prompt**
Edit `app/services/groq_client.py` line 107-124:
```python
system_prompt = """Your custom instructions here"""
```

### 3. **Adjust Initial Question Style**
Edit `app/services/groq_client.py` line 178-182:
```python
prompt = f"""
Custom initial question prompt...
"""
```

### 4. **Modify Temperature**
Lower (0.1-0.3): More focused, consistent  
Higher (0.7-0.9): More creative, varied  

Current: 0.3 (good balance for interviews)

---

## Best Practices

### ✅ DO:
- Include job description in all prompts
- Use structured JSON output for consistency
- Set appropriate max_tokens to avoid truncation
- Keep temperature low (0.3) for consistent scoring
- Validate JSON responses with fallback handling

### ❌ DON'T:
- Use temperature > 0.5 for evaluation (inconsistent scores)
- Omit job description context
- Make prompts too prescriptive (reduces flexibility)
- Forget to handle JSON parsing errors

---

## Performance Metrics

### Current Setup:
- **Model:** llama-3.3-70b-versatile (latest, most capable)
- **Response Time:** ~2-3 seconds per evaluation
- **Accuracy:** High (70B parameter model)
- **Cost:** Groq provides free tier with rate limits
- **Reliability:** JSON parsing with fallback mechanism

### API Rate Limits (Groq Free Tier):
- Requests per minute: 30
- Requests per day: 14,400
- Tokens per minute: 6,000

**Note:** Current interview flow stays well within limits (15 questions max)

---

## Testing the Prompts

To see actual prompts in action, check the backend logs during an interview:
```bash
# Enable verbose logging
# The system prints prompts and responses during development
```

Or test the AI directly:
```python
from app.services.groq_client import groq_client

# Test initial question
question = groq_client.generate_initial_question(
    job_description="Senior Python Developer role...",
    resume_text="5 years experience..."
)

# Test evaluation
evaluation = groq_client.chat_followup_json(
    criteria="Technical depth",
    question="How would you design...",
    answer="I would use...",
    job_description="Senior Python Developer role..."
)
```

---

**Last Updated:** October 15, 2025  
**Models Used:** llama-3.3-70b-versatile, whisper-large-v3  
**API Provider:** Groq
