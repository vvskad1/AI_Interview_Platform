"""
Fix sentence transformers by pre-downloading models and configuring SSL
"""
import os
import sys
import ssl
import urllib3
from pathlib import Path

def fix_ssl_and_download_model():
    """Fix SSL configuration and download sentence transformer model"""
    
    # Step 1: Fix SSL certificate configuration
    print("🔧 Fixing SSL configuration...")
    
    # Clear problematic environment variables
    env_vars_to_clear = [
        'REQUESTS_CA_BUNDLE',
        'CURL_CA_BUNDLE', 
        'SSL_CERT_FILE',
        'SSL_CERT_DIR'
    ]
    
    for var in env_vars_to_clear:
        if var in os.environ:
            print(f"   Clearing {var}: {os.environ[var]}")
            del os.environ[var]
    
    # Disable SSL warnings
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Step 2: Set up offline mode and cache directory
    cache_dir = Path.home() / '.cache' / 'huggingface'
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    os.environ['TRANSFORMERS_CACHE'] = str(cache_dir)
    os.environ['HF_HOME'] = str(cache_dir)
    
    print(f"📁 Cache directory: {cache_dir}")
    
    # Step 3: Try to import and initialize sentence transformers
    try:
        print("📦 Importing sentence_transformers...")
        from sentence_transformers import SentenceTransformer
        
        print("🤖 Attempting to load model...")
        
        # Try with different SSL settings
        original_verify = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context
        
        try:
            # This will download the model if not cached
            model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Model loaded successfully!")
            
            # Test embedding generation
            test_text = "This is a test sentence."
            embedding = model.encode([test_text])
            print(f"✅ Test embedding shape: {embedding.shape}")
            
            return True
            
        except Exception as e:
            print(f"❌ Model loading failed: {str(e)}")
            return False
            
        finally:
            # Restore original SSL context
            ssl._create_default_https_context = original_verify
            
    except ImportError as e:
        print(f"❌ Import failed: {str(e)}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_sentence_transformers_integration():
    """Test the sentence transformers integration with our RAG system"""
    try:
        print("\n🧪 Testing RAG integration...")
        sys.path.append('.')
        
        from app.services.vectorstore import VectorStore
        
        # Initialize vector store
        vs = VectorStore()
        print("✅ VectorStore initialized")
        
        # Test document indexing
        documents = [
            "I am a Python developer with 5 years of experience",
            "I have worked on machine learning projects",
            "I am experienced in React and JavaScript"
        ]
        metadata = [
            {"type": "resume", "section": "summary"},
            {"type": "resume", "section": "experience"},
            {"type": "resume", "section": "skills"}
        ]
        
        vs.add_documents(documents, metadata)
        print("✅ Documents indexed successfully")
        
        # Test search
        results = vs.search("Python programming experience", k=2)
        print(f"✅ Search results: {len(results)} documents found")
        
        for i, result in enumerate(results):
            print(f"   Result {i+1}: {result['document'][:50]}... (score: {result['score']:.3f})")
        
        return True
        
    except Exception as e:
        print(f"❌ RAG integration test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Sentence Transformers Fix...")
    
    # Step 1: Fix SSL and download model
    model_success = fix_ssl_and_download_model()
    
    # Step 2: Test RAG integration
    if model_success:
        rag_success = test_sentence_transformers_integration()
        
        if rag_success:
            print("\n🎉 SUCCESS: Sentence Transformers is fully working!")
            print("✅ Model downloaded and cached")
            print("✅ RAG system integration working")
            print("✅ Ready for AI interviews")
        else:
            print("\n⚠️ PARTIAL SUCCESS: Model works but RAG integration needs fixing")
    else:
        print("\n❌ FAILED: Could not fix sentence transformers")
        print("   Will continue using enhanced mock RAG service")
    
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test with /session/debug-rag/{candidate_id}")
    print("3. Check if RAG service type changed from MockRagService to RAGService")