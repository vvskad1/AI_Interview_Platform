"""
Test the speech endpoint with actual form data to replicate the frontend error
"""
import requests
import io

def test_speech_endpoint():
    """Test the speech endpoint with simulated form data"""
    
    print("🧪 Testing Speech Endpoint with Form Data")
    print("=" * 50)
    
    # Create a small test audio file in memory
    audio_data = b'\x1A\x45\xDF\xA3' * 100  # Dummy WebM-like data
    audio_file = io.BytesIO(audio_data)
    
    # Prepare form data as the frontend would send it
    files = {
        'audio': ('test_audio.webm', audio_file, 'audio/webm')
    }
    
    data = {
        'question': 'Tell me about your experience.',
        'turn_idx': '1'
    }
    
    url = 'http://localhost:8000/session/12/speech'
    
    try:
        print(f"📤 Sending POST request to: {url}")
        print(f"📋 Form data: {data}")
        
        response = requests.post(url, files=files, data=data)
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📄 Response content: {response.text}")
        
        if response.status_code == 200:
            print("✅ Speech endpoint is working!")
        else:
            print(f"❌ Speech endpoint failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_speech_endpoint()