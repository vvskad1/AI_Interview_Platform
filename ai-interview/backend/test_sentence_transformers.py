"""
Simple test to check if we can initialize sentence transformers without downloading
"""
import sys
import os
sys.path.append('.')

def test_sentence_transformers():
    try:
        print("Testing sentence transformers import...")
        from sentence_transformers import SentenceTransformer
        print("✅ sentence_transformers imported successfully")
        
        # Try to use a smaller model or skip model loading
        print("Attempting to load model...")
        
        # Try with offline mode first
        try:
            import os
            os.environ["HF_HUB_OFFLINE"] = "1"
            model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Model loaded in offline mode")
            return True
        except Exception as e:
            print(f"❌ Offline model loading failed: {e}")
            
            # Try downloading with different approach
            try:
                os.environ["HF_HUB_OFFLINE"] = "0"
                # Use a different model or approach
                print("Trying alternative model loading...")
                # This would normally download the model
                model = SentenceTransformer('all-MiniLM-L6-v2')
                print("✅ Model loaded successfully")
                return True
            except Exception as e2:
                print(f"❌ Model loading failed: {e2}")
                return False
                
    except ImportError as e:
        print(f"❌ sentence_transformers not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_sentence_transformers()
    if success:
        print("\n🎉 Sentence transformers is working!")
    else:
        print("\n⚠️ Using mock RAG service instead")