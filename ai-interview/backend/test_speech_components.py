"""
Debug script to test the speech submission endpoint components
"""
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.groq_client import groq_client
from app.config import settings
import tempfile

def test_speech_components():
    """Test individual components of the speech endpoint"""
    
    print("🧪 Testing Speech Endpoint Components")
    print("=" * 50)
    
    # Test 1: Audio file creation
    print("\n1️⃣ Testing Audio File Creation...")
    try:
        audio_filename = "test_audio.webm"
        audio_path = os.path.join(settings.audio_storage_path, audio_filename)
        
        # Create a dummy audio file
        with open(audio_path, "wb") as f:
            f.write(b"dummy audio data")
        
        print(f"✅ Audio file created: {audio_path}")
        print(f"✅ File exists: {os.path.exists(audio_path)}")
        
        # Clean up
        os.remove(audio_path)
        print("✅ File cleanup successful")
        
    except Exception as e:
        print(f"❌ Audio file test failed: {str(e)}")
        return False
    
    # Test 2: Groq transcription (without actual audio)
    print("\n2️⃣ Testing Groq Client Configuration...")
    try:
        print(f"✅ API Key: {groq_client.api_key[:10]}...{groq_client.api_key[-5:]}")
        print(f"✅ Base URL: {groq_client.base_url}")
        print("✅ Groq client configured properly")
        
    except Exception as e:
        print(f"❌ Groq client test failed: {str(e)}")
        return False
    
    # Test 3: Check if transcribe_audio method exists and is callable
    print("\n3️⃣ Testing Transcription Method...")
    try:
        method = getattr(groq_client, 'transcribe_audio', None)
        if method and callable(method):
            print("✅ transcribe_audio method is available and callable")
        else:
            print("❌ transcribe_audio method not found or not callable")
            return False
            
    except Exception as e:
        print(f"❌ Transcription method test failed: {str(e)}")
        return False
    
    # Test 4: RAG service evaluation
    print("\n4️⃣ Testing RAG Service...")
    try:
        from app.services.rag import rag_service
        
        if hasattr(rag_service, 'generate_followup_question'):
            print("✅ RAG service generate_followup_question method exists")
        else:
            print("❌ RAG service method missing")
            return False
            
    except Exception as e:
        print(f"❌ RAG service test failed: {str(e)}")
        return False
    
    print("\n" + "=" * 50)
    print("✅ ALL COMPONENT TESTS PASSED!")
    print("The speech endpoint should work correctly.")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    success = test_speech_components()
    if not success:
        print("\n❌ Component tests failed!")
        sys.exit(1)
    else:
        print("\n🚀 All components ready for speech processing!")