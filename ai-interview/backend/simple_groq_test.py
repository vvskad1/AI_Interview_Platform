"""
Simple Groq API test
"""
import sys
import os
import requests

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def simple_groq_test():
    """Simple test of Groq API"""
    
    print("🧪 Simple Groq Test")
    print("-" * 30)
    
    api_key = settings.groq_api_key
    base_url = "https://api.groq.com/openai/v1"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Test simple chat completion
    url = f"{base_url}/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": "Say 'Groq is working!' and nothing else."}
        ],
        "temperature": 0.1,
        "max_tokens": 20
    }
    
    try:
        print("Testing chat completion...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            message = result["choices"][0]["message"]["content"].strip()
            print(f"✅ Response: {message}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

if __name__ == "__main__":
    success = simple_groq_test()
    print(f"\nGroq Status: {'✅ Working' if success else '❌ Failed'}")