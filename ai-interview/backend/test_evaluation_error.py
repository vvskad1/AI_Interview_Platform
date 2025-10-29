"""
Test script to debug the 500 error during speech submission
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

def test_evaluation_flow():
    """Test the evaluation flow that's causing the 500 error"""
    
    print("Testing evaluation flow...")
    
    try:
        # Import the services
        from app.services.rag import rag_service
        from app.services.groq_client import groq_client
        
        # Test data similar to what's being processed
        question = "How would you design a scalable RESTful API with FastAPI and PostgreSQL for a real-time analytics dashboard?"
        
        transcript = "To design a scalable RESTful API with fast API and PostgreSQL for real-time analytics dashboard, I would start with modular architecture separating routes, services, and database layers using SQL Alchemy or asynchronous ORM for non-blocking I.O."
        
        job_description = "Senior Python Developer with FastAPI and PostgreSQL experience"
        
        print(f"\n📋 Question: {question[:80]}...")
        print(f"📋 Transcript: {transcript[:80]}...")
        print(f"📋 Job Description: {job_description}")
        
        # Test the evaluation
        print("\n🔍 Testing RAG service evaluation...")
        evaluation = rag_service.generate_followup_question(
            question, transcript, job_description
        )
        
        print(f"\n✅ Evaluation successful!")
        print(f"   Score: {evaluation.get('score')}")
        print(f"   Missing: {evaluation.get('missing', [])[:2]}")
        print(f"   Follow-up: {evaluation.get('followup', '')[:80]}...")
        print(f"   Complete: {evaluation.get('complete')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during evaluation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_empty_job_description():
    """Test with empty job description"""
    
    print("\n" + "="*70)
    print("Testing with empty job description...")
    
    try:
        from app.services.rag import rag_service
        
        question = "How would you design a scalable API?"
        transcript = "I would use FastAPI with async patterns."
        job_description = ""  # Empty!
        
        evaluation = rag_service.generate_followup_question(
            question, transcript, job_description
        )
        
        print(f"✅ Handled empty job description successfully!")
        print(f"   Score: {evaluation.get('score')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed with empty job description: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_none_job_description():
    """Test with None job description"""
    
    print("\n" + "="*70)
    print("Testing with None job description...")
    
    try:
        from app.services.rag import rag_service
        
        question = "How would you design a scalable API?"
        transcript = "I would use FastAPI with async patterns."
        job_description = None  # None!
        
        evaluation = rag_service.generate_followup_question(
            question, transcript, job_description
        )
        
        print(f"✅ Handled None job description successfully!")
        print(f"   Score: {evaluation.get('score')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed with None job description: {str(e)}")
        print(f"   This might be the cause of the 500 error!")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("Testing Speech Evaluation Flow")
    print("=" * 70)
    
    test1 = test_evaluation_flow()
    test2 = test_empty_job_description()
    test3 = test_none_job_description()
    
    print("\n" + "=" * 70)
    print("Summary:")
    print(f"  Normal Flow:           {'✅ PASS' if test1 else '❌ FAIL'}")
    print(f"  Empty Job Description: {'✅ PASS' if test2 else '❌ FAIL'}")
    print(f"  None Job Description:  {'✅ PASS' if test3 else '❌ FAIL'}")
    print("=" * 70)
    
    if not test3:
        print("\n🔍 DIAGNOSIS: The issue is likely None job description!")
        print("   Fix: Add None check in sessions.py before calling generate_followup_question")
