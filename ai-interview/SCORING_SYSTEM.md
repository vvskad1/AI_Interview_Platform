# AI Interview Scoring System Documentation

## Overview
The AI interview system now includes a comprehensive 5-tier scoring system that evaluates candidates based on their interview performance, completion rate, and integrity monitoring.

## Score Categories

### 1. Best Fit (9.0-10.0)
- **Description**: Exceptional performance demonstrating deep technical knowledge, strong problem-solving skills, and excellent communication.
- **Recommendation**: Highly recommended for immediate hiring consideration
- **Characteristics**:
  - Mastery of technical concepts
  - Clear and articulate communication
  - Practical application knowledge
  - Strong problem-solving approach

### 2. Good Fit (7.5-8.9)
- **Description**: Strong performance with solid technical understanding and good problem-solving abilities.
- **Recommendation**: Recommended for next round of interviews
- **Characteristics**:
  - Solid technical competency
  - Good communication skills
  - Minor gaps may exist
  - Shows promise and learning capability

### 3. Average (6.0-7.4)
- **Description**: Adequate performance with basic technical competency.
- **Recommendation**: Consider for positions requiring moderate technical expertise
- **Characteristics**:
  - Basic technical knowledge
  - Adequate communication
  - May require additional support
  - Shows potential but needs development

### 4. Needs Improvement (4.0-5.9)
- **Description**: Below expectations with significant gaps in technical knowledge or communication.
- **Recommendation**: May require additional training or mentorship
- **Characteristics**:
  - Limited technical depth
  - Communication challenges
  - Requires substantial training
  - Significant skill gaps

### 5. Not Recommended (0.0-3.9)
- **Description**: Performance does not meet minimum requirements for the position.
- **Recommendation**: Not recommended for the current position
- **Characteristics**:
  - Fundamental gaps in knowledge
  - Poor problem-solving
  - Inadequate communication
  - Unsuitable for role requirements

## Scoring Methodology

### 1. Question-Level Scoring (1-10 scale)
Each answer is evaluated by AI on these criteria:
- **Technical Accuracy**: Correctness of concepts and terminology
- **Depth of Knowledge**: Understanding beyond surface-level
- **Problem-Solving**: Approach to challenges and edge cases
- **Job Alignment**: Relevance to job requirements
- **Communication**: Clarity and structure of explanation

### 2. Overall Score Calculation

#### Raw Score
```
Raw Score = Average of all question scores
```

#### Adjusted Score
The system applies adjustments based on:

**Completion Rate Penalty**:
```
Completion Rate = Successful Questions / (Successful Questions + Failed Attempts)
Adjusted Score = Raw Score × Completion Rate
```

**Integrity Risk Penalty**:
- High Risk (≥60): 10% penalty
- Medium Risk (40-59): 5% penalty
- Low Risk (<40): No penalty

```
Final Adjusted Score = Adjusted Score × (1 - Penalty)
```

### 3. Final Category Assignment
The adjusted score determines the final category:
```
Score >= 9.0  → Best Fit
Score >= 7.5  → Good Fit
Score >= 6.0  → Average
Score >= 4.0  → Needs Improvement
Score < 4.0   → Not Recommended
```

## Integration with Job Description

### RAG (Retrieval-Augmented Generation) System
The system uses job descriptions to:

1. **Generate Initial Questions**: First question is tailored to job requirements
2. **Evaluate Answers**: Each response is assessed against job-specific criteria
3. **Provide Context**: RAG system retrieves relevant job requirements during evaluation
4. **Score Alignment**: Evaluates how well answers match role expectations

### Evaluation Prompt Enhancement
The AI evaluator receives:
```
Job Requirements: [Full job description]
Evaluation Criteria: Technical depth, Job alignment, Problem-solving, Communication
Question: [Interview question]
Candidate's Answer: [Transcribed response]
```

The evaluator considers:
- Technical accuracy relative to role requirements
- Relevance to specific job responsibilities
- Problem-solving approach for role-typical scenarios
- Practical application for the position

## Interview Configuration

### Current Settings (config.py)
```python
answer_seconds = 120      # 2 minutes per question
max_questions = 15        # Primary questions
max_retries = 5          # Buffer for failed audio
```

### Completion Logic
- Interview continues until **15 successful questions** OR **5 failed attempts**
- Failed audio attempts don't count toward the 15-question limit
- Only successfully transcribed answers are evaluated

## Report Generation

### PDF Report Includes:
1. **Session Information**: Candidate details, job, timing
2. **Score Summary**: 
   - Raw average score
   - Adjusted score
   - Score category (highlighted with color)
   - Completion rate
3. **Question Transcript**: All Q&A with individual scores
4. **Proctoring Summary**: Integrity risk and events
5. **Final Assessment**:
   - Overall rating (category)
   - Detailed metrics table
   - Assessment summary
   - Hiring recommendation
   - Category explanation

### Score Category Colors:
- Best Fit: Green
- Good Fit: Dark Green
- Average: Orange
- Needs Improvement: Dark Orange
- Not Recommended: Red

## Database Schema

### Session Table
```sql
score FLOAT           -- Raw average score (0-10)
score_category VARCHAR(50)  -- Final category
session_metadata JSON    -- Includes final_assessment details
```

### Final Assessment Metadata
```json
{
  "final_assessment": {
    "raw_score": 7.8,
    "adjusted_score": 7.6,
    "score_category": "Good Fit",
    "completion_rate": 93.3,
    "successful_questions": 14,
    "failed_attempts": 1,
    "proctor_risk": 20.0,
    "recommendation": "Recommended for next round of interviews",
    "assessment_summary": "Candidate achieved a GOOD FIT rating..."
  }
}
```

## API Endpoints

### Session List Response
```json
{
  "score": 7.8,
  "score_category": "Good Fit"
}
```

### Session Details Response
```json
{
  "score": 7.8,
  "score_category": "Good Fit",
  "session_metadata": {
    "final_assessment": { ... }
  }
}
```

## Example Scenarios

### Scenario 1: High Performer
- 15 questions answered successfully
- Average score: 9.2
- No failed attempts
- Low integrity risk (10)
- **Result**: Best Fit (9.2)

### Scenario 2: Good with Minor Issues
- 13 successful questions
- 2 failed audio attempts
- Average score: 8.1
- Completion rate: 86.7%
- Adjusted: 8.1 × 0.867 = 7.0
- Medium integrity risk (45)
- Further adjusted: 7.0 × 0.95 = 6.65
- **Result**: Average (6.65)

### Scenario 3: Multiple Failures
- 10 successful questions
- 5 failed attempts (hit buffer limit)
- Average score: 6.5
- Completion rate: 66.7%
- Adjusted: 6.5 × 0.667 = 4.34
- **Result**: Needs Improvement (4.34)

## Benefits

1. **Fair Evaluation**: Accounts for technical issues while maintaining standards
2. **Job-Specific**: Evaluation considers role requirements
3. **Comprehensive**: Combines performance, completion, and integrity
4. **Clear Categories**: Easy-to-understand 5-tier system
5. **Transparent**: Detailed breakdown of scoring factors
6. **Actionable**: Provides specific hiring recommendations

## Testing

To verify the system is working correctly:

1. Complete an interview with varied performance
2. Check session record for `score_category`
3. Generate PDF report
4. Verify "Final Assessment & Recommendation" section appears
5. Confirm category matches score range
6. Review metadata contains `final_assessment` object

---

**Last Updated**: October 15, 2025
**Version**: 2.0
