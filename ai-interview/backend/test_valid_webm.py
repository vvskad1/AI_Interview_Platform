#!/usr/bin/env python3

import os
import sys
import requests
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def test_groq_with_valid_webm():
    """Test Groq transcription API with a valid WebM file"""
    
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment")
        return False
    
    # Use a valid WebM file (larger one)
    audio_file_path = "audio_files/session_11_turn_1_2ca0dce6efbf49b4b5db1e531111dbab.webm"
    
    if not os.path.exists(audio_file_path):
        print(f"❌ Audio file not found: {audio_file_path}")
        return False
    
    # Check file size and properties
    file_size = os.path.getsize(audio_file_path)
    print(f"📄 Audio file: {audio_file_path}")
    print(f"📊 File size: {file_size} bytes")
    
    # Clear SSL environment variables to avoid certificate issues
    ssl_vars = ['REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE', 'SSL_CERT_FILE']
    original_values = {}
    for var in ssl_vars:
        if var in os.environ:
            original_values[var] = os.environ[var]
            del os.environ[var]
    
    try:
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        
        print(f"🔊 Testing Groq Whisper API...")
        print(f"📡 URL: {url}")
        
        with open(audio_file_path, "rb") as audio_file:
            files = {"file": (os.path.basename(audio_file_path), audio_file, "audio/webm")}
            data = {"model": "whisper-large-v3", "response_format": "json"}
            headers = {"Authorization": f"Bearer {api_key}"}
            
            response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
            
            print(f"📋 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                transcript = result.get("text", "")
                print(f"✅ Success! Transcript: '{transcript}'")
                return True
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                
                # Try to parse error as JSON
                try:
                    error_json = response.json()
                    print(f"📝 Parsed error: {json.dumps(error_json, indent=2)}")
                except:
                    pass
                return False
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False
    
    finally:
        # Restore original SSL environment variables
        for var, value in original_values.items():
            os.environ[var] = value

if __name__ == "__main__":
    test_groq_with_valid_webm()