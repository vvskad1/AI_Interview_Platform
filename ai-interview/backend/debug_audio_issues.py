#!/usr/bin/env python3

"""
Debug script to test if we can create a valid audio file for Groq
"""

import os
import requests
import tempfile
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_test_audio():
    """Create a simple test audio file"""
    # Create a simple WAV file using system tools
    output_file = "test_audio.wav"
    
    # Try to create a simple tone using system commands (if available)
    try:
        # This creates a 3-second 440Hz sine wave
        subprocess.run([
            "ffmpeg", "-f", "lavfi", "-i", "sine=440:duration=3", 
            "-ar", "16000", "-ac", "1", output_file, "-y"
        ], check=True, capture_output=True)
        print(f"✅ Created test audio file: {output_file}")
        return output_file
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ FFmpeg not available, skipping audio file creation")
        return None

def test_groq_with_valid_audio():
    """Test Groq API with a known good audio file"""
    
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment")
        return False
    
    # Create test audio file
    audio_file = create_test_audio()
    if not audio_file:
        print("⚠️  No test audio file available")
        return False
    
    try:
        # Clear SSL environment variables to avoid certificate issues
        ssl_vars = ['REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE', 'SSL_CERT_FILE']
        original_values = {}
        for var in ssl_vars:
            if var in os.environ:
                original_values[var] = os.environ[var]
                del os.environ[var]
        
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        
        print(f"🔊 Testing Groq Whisper API with valid audio file...")
        
        with open(audio_file, "rb") as audio:
            files = {"file": (audio_file, audio, "audio/wav")}
            data = {"model": "whisper-large-v3", "response_format": "json"}
            headers = {"Authorization": f"Bearer {api_key}"}
            
            response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
            
            print(f"📋 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                transcript = result.get("text", "")
                print(f"✅ Success! Transcript: '{transcript}'")
                return True
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                return False
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False
    
    finally:
        # Restore original SSL environment variables
        for var, value in original_values.items():
            os.environ[var] = value
        
        # Cleanup
        if audio_file and os.path.exists(audio_file):
            os.remove(audio_file)

def analyze_webm_files():
    """Analyze the existing WebM files to understand the issue"""
    
    audio_dir = "audio_files"
    if not os.path.exists(audio_dir):
        print(f"❌ Audio directory not found: {audio_dir}")
        return
    
    webm_files = [f for f in os.listdir(audio_dir) if f.endswith('.webm')]
    
    for file in webm_files[:3]:  # Check first 3 files
        file_path = os.path.join(audio_dir, file)
        file_size = os.path.getsize(file_path)
        
        print(f"\n📄 Analyzing: {file}")
        print(f"📊 Size: {file_size} bytes")
        
        # Read first 20 bytes to check file structure
        with open(file_path, "rb") as f:
            header = f.read(20)
            print(f"📝 Header (hex): {header.hex()}")
            print(f"📝 Header (bytes): {list(header)}")
            
        # Check if it's a valid WebM file (should start with specific bytes)
        # WebM files start with EBML header: 0x1A 0x45 0xDF 0xA3
        if file_size < 100:
            print("⚠️  File too small to be valid audio")
        elif len(header) >= 4 and header[:4] == b'\x1a\x45\xdf\xa3':
            print("✅ Valid WebM/EBML header detected")
        else:
            print("❌ Invalid WebM/EBML header - file may be corrupted")

if __name__ == "__main__":
    print("🔍 Debugging Groq Audio Transcription Issues")
    print("=" * 50)
    
    print("\n1. Analyzing existing WebM files:")
    analyze_webm_files()
    
    print("\n2. Testing Groq API with valid audio:")
    test_groq_with_valid_audio()