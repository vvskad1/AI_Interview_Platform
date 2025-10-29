"""
Test Groq transcription with a real audio file
"""
import sys
import os
import requests

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.groq_client import groq_client

def test_groq_transcription():
    """Test Groq transcription API with a dummy audio file"""
    
    print("🧪 Testing Groq Transcription API")
    print("=" * 40)
    
    # Create a very small dummy WebM file (just headers)
    dummy_webm_data = b'\x1A\x45\xDF\xA3'  # Basic WebM container header
    
    # Save to temp file
    test_audio_path = "test_transcription.webm"
    
    try:
        with open(test_audio_path, "wb") as f:
            f.write(dummy_webm_data)
        
        print(f"✅ Created test audio file: {test_audio_path}")
        
        # Test the transcription
        print("Testing Groq transcription...")
        
        try:
            transcript = groq_client.transcribe_audio(test_audio_path)
            print(f"✅ Transcription successful: '{transcript}'")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Groq API request error: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response text: {e.response.text}")
            
        except Exception as e:
            print(f"❌ Transcription error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
    
    finally:
        # Clean up
        if os.path.exists(test_audio_path):
            os.remove(test_audio_path)
            print("✅ Test file cleaned up")

if __name__ == "__main__":
    test_groq_transcription()