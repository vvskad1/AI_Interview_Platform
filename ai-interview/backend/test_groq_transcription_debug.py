#!/usr/bin/env python3

import os
import sys
import requests
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def test_groq_transcription():
    """Test Groq transcription API with existing WebM file"""
    
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment")
        return False
    
    # Use an existing audio file
    audio_file_path = "audio_files/session_12_turn_1_e30ca25405354fb18242e1ad4b3b223c.webm"
    
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
            # Try different approaches
            test_cases = [
                {
                    "name": "Standard WebM approach",
                    "files": {"file": (os.path.basename(audio_file_path), audio_file, "audio/webm")},
                    "data": {"model": "whisper-large-v3", "response_format": "json"}
                },
                {
                    "name": "Generic audio approach",
                    "files": {"file": (os.path.basename(audio_file_path), audio_file, "audio/webm")},
                    "data": {"model": "whisper-large-v3"}
                },
                {
                    "name": "No content type approach",
                    "files": {"file": audio_file},
                    "data": {"model": "whisper-large-v3", "response_format": "json"}
                }
            ]
            
            for i, test_case in enumerate(test_cases):
                print(f"\n🧪 Test {i+1}: {test_case['name']}")
                
                # Reset file pointer
                audio_file.seek(0)
                
                headers = {"Authorization": f"Bearer {api_key}"}
                
                try:
                    response = requests.post(
                        url, 
                        headers=headers, 
                        files=test_case["files"], 
                        data=test_case["data"],
                        timeout=30
                    )
                    
                    print(f"📋 Status Code: {response.status_code}")
                    print(f"📋 Response Headers: {dict(response.headers)}")
                    
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
                            
                except Exception as e:
                    print(f"❌ Request exception: {str(e)}")
    
    except Exception as e:
        print(f"❌ General exception: {str(e)}")
        return False
    
    finally:
        # Restore original SSL environment variables
        for var, value in original_values.items():
            os.environ[var] = value
    
    return False

if __name__ == "__main__":
    test_groq_transcription()