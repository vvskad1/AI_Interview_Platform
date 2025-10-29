"""
Test script to verify Groq API is active and working
"""
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.groq_client import groq_client
import requests

def test_groq_api():
    """Test Groq API connectivity and functionality"""
    
    print("🔧 Testing Groq API Configuration")
    print("=" * 50)
    
    # Test 1: Check API key is configured
    print("\n1️⃣ Checking API Key Configuration...")
    if groq_client.api_key and groq_client.api_key != "":
        print(f"✅ API Key configured: {groq_client.api_key[:10]}...{groq_client.api_key[-5:]}")
    else:
        print("❌ No API Key found!")
        return False
    
    # Test 2: Check basic connectivity
    print("\n2️⃣ Testing API Connectivity...")
    try:
        url = f"{groq_client.base_url}/models"
        response = requests.get(url, headers=groq_client.headers)
        
        if response.status_code == 200:
            print("✅ Groq API is accessible")
            models = response.json()
            print(f"✅ Available models: {len(models.get('data', []))} models found")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return False
    
    # Test 3: Test text generation (chat completion)
    print("\n3️⃣ Testing Chat Completion...")
    try:
        url = f"{groq_client.base_url}/chat/completions"
        test_payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system", 
                    "content": "You are a helpful assistant. Respond with just 'Hello from Groq!' and nothing else."
                },
                {
                    "role": "user", 
                    "content": "Say hello"
                }
            ],
            "temperature": 0.1,
            "max_tokens": 50
        }
        
        response = requests.post(url, headers=groq_client.headers, json=test_payload)
        
        if response.status_code == 200:
            result = response.json()
            message = result["choices"][0]["message"]["content"].strip()
            print(f"✅ Chat Completion Working: '{message}'")
        else:
            print(f"❌ Chat Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chat Test Error: {str(e)}")
        return False
    
    # Test 4: Test interview question generation
    print("\n4️⃣ Testing Interview Question Generation...")
    try:
        test_job_desc = "Senior Python Developer position requiring FastAPI and PostgreSQL experience"
        test_resume = "Software engineer with 3 years Python experience, FastAPI expert, built REST APIs"
        
        question = groq_client.generate_initial_question(test_job_desc, test_resume)
        print(f"✅ Generated Question: '{question[:100]}{'...' if len(question) > 100 else ''}'")
        
    except Exception as e:
        print(f"❌ Question Generation Error: {str(e)}")
        return False
    
    # Test 5: Test follow-up question generation
    print("\n5️⃣ Testing Follow-up Question Generation...")
    try:
        criteria = "Technical depth, Problem-solving, Communication"
        current_q = "Tell me about your Python experience"
        answer = "I have worked with Python for 3 years building web APIs"
        
        followup = groq_client.chat_followup_json(criteria, current_q, answer)
        print(f"✅ Generated Follow-up: Score={followup.get('score', 'N/A')}, Complete={followup.get('complete', 'N/A')}")
        
        if 'followup' in followup:
            print(f"✅ Next Question: '{followup['followup'][:80]}{'...' if len(followup['followup']) > 80 else ''}'")
        
    except Exception as e:
        print(f"❌ Follow-up Generation Error: {str(e)}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 ALL GROQ TESTS PASSED!")
    print("✅ Groq API is fully operational for AI interviews")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    success = test_groq_api()
    if not success:
        print("\n❌ Groq API testing failed!")
        sys.exit(1)
    else:
        print("\n🚀 Groq AI interview system is ready!")