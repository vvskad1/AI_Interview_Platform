"""
Scoring utilities for interview evaluation
"""
from typing import Dict, Any


def calculate_score_category(average_score: float) -> str:
    """
    Calculate score category based on average score (0-10 scale)
    
    Categories:
    1. Best Fit: 9.0-10.0
    2. Good Fit: 7.5-8.9
    3. Average: 6.0-7.4
    4. Needs Improvement: 4.0-5.9
    5. Not Recommended: 0.0-3.9
    
    Args:
        average_score: The average score from all interview turns (0-10 scale)
        
    Returns:
        Score category as string
    """
    if average_score >= 9.0:
        return "Best Fit"
    elif average_score >= 7.5:
        return "Good Fit"
    elif average_score >= 6.0:
        return "Average"
    elif average_score >= 4.0:
        return "Needs Improvement"
    else:
        return "Not Recommended"


def get_final_assessment(
    average_score: float,
    successful_questions: int,
    failed_attempts: int,
    proctor_risk: float = 0
) -> Dict[str, Any]:
    """
    Generate comprehensive final assessment with score category
    
    Args:
        average_score: Average score from all successful turns
        successful_questions: Number of successfully answered questions
        failed_attempts: Number of failed audio attempts
        proctor_risk: Proctoring risk score (0-100)
        
    Returns:
        Dictionary with final assessment details
    """
    # Calculate base category
    category = calculate_score_category(average_score)
    
    # Apply penalties for failed attempts
    completion_rate = successful_questions / (successful_questions + failed_attempts) if (successful_questions + failed_attempts) > 0 else 1.0
    
    # Adjust score based on completion rate
    adjusted_score = average_score * completion_rate
    
    # Apply proctoring risk penalty (reduce score if high risk)
    if proctor_risk >= 60:
        adjusted_score = adjusted_score * 0.9  # 10% penalty for high risk
    elif proctor_risk >= 40:
        adjusted_score = adjusted_score * 0.95  # 5% penalty for medium risk
    
    # Recalculate category with adjusted score
    final_category = calculate_score_category(adjusted_score)
    
    return {
        "raw_score": round(average_score, 2),
        "adjusted_score": round(adjusted_score, 2),
        "score_category": final_category,
        "completion_rate": round(completion_rate * 100, 1),
        "successful_questions": successful_questions,
        "failed_attempts": failed_attempts,
        "proctor_risk": proctor_risk,
        "recommendation": _get_recommendation(final_category, proctor_risk),
        "assessment_summary": _get_assessment_summary(
            final_category, 
            average_score, 
            adjusted_score, 
            completion_rate, 
            proctor_risk
        )
    }


def _get_recommendation(category: str, proctor_risk: float) -> str:
    """Get hiring recommendation based on category and risk"""
    if category == "Best Fit":
        if proctor_risk >= 60:
            return "Strong candidate but verify proctoring concerns before proceeding"
        return "Highly recommended for immediate hiring consideration"
    elif category == "Good Fit":
        if proctor_risk >= 60:
            return "Good potential but address proctoring concerns"
        return "Recommended for next round of interviews"
    elif category == "Average":
        return "Consider for positions requiring moderate technical expertise"
    elif category == "Needs Improvement":
        return "May require additional training or mentorship"
    else:
        return "Not recommended for the current position"


def _get_assessment_summary(
    category: str,
    raw_score: float,
    adjusted_score: float,
    completion_rate: float,
    proctor_risk: float
) -> str:
    """Generate human-readable assessment summary"""
    summary_parts = [
        f"Candidate achieved a {category.upper()} rating",
        f"with an average score of {raw_score:.1f}/10"
    ]
    
    if abs(raw_score - adjusted_score) > 0.3:
        summary_parts.append(f"(adjusted to {adjusted_score:.1f}/10 based on completion rate and integrity)")
    
    summary_parts.append(f"across {int(completion_rate * 100)}% successfully completed questions.")
    
    if proctor_risk >= 60:
        summary_parts.append("⚠️ HIGH integrity risk detected.")
    elif proctor_risk >= 40:
        summary_parts.append("⚠️ MODERATE integrity concerns noted.")
    
    return " ".join(summary_parts)


def get_score_breakdown_text(category: str) -> str:
    """Get detailed explanation of score category"""
    breakdown = {
        "Best Fit": "Exceptional performance demonstrating deep technical knowledge, strong problem-solving skills, and excellent communication. Candidate shows mastery of concepts and practical application.",
        "Good Fit": "Strong performance with solid technical understanding and good problem-solving abilities. Minor gaps may exist but candidate shows promise and learning capability.",
        "Average": "Adequate performance with basic technical competency. May require additional support or training. Shows potential but needs development in key areas.",
        "Needs Improvement": "Below expectations with significant gaps in technical knowledge or communication. Would require substantial training and mentorship to meet role requirements.",
        "Not Recommended": "Performance does not meet minimum requirements for the position. Fundamental gaps in technical knowledge, problem-solving, or communication make candidate unsuitable for this role."
    }
    return breakdown.get(category, "No assessment available")
