"""
Simple vectorstore implementation that avoids complex huggingface_hub dependencies
"""
import os
import pickle
import numpy as np
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SimpleVectorStore:
    """Simple vector store that works around dependency issues"""
    
    def __init__(self):
        self.embeddings = []
        self.documents = []
        self.metadata = []
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize sentence transformer model with error handling"""
        try:
            # Clear SSL environment variables
            ssl_vars = ['REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE', 'SSL_CERT_FILE']
            for var in ssl_vars:
                if var in os.environ:
                    del os.environ[var]
            
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ SentenceTransformer model loaded successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not load SentenceTransformer model: {str(e)}")
            self.model = None
    
    def add_documents(self, documents: List[str], metadata: List[Dict[str, Any]]):
        """Add documents to the vector store"""
        if not self.model:
            logger.warning("No model available, skipping document indexing")
            return
        
        try:
            # Generate embeddings
            new_embeddings = self.model.encode(documents)
            
            # Store documents and embeddings
            self.documents.extend(documents)
            self.metadata.extend(metadata)
            self.embeddings.extend(new_embeddings.tolist())
            
            logger.info(f"Added {len(documents)} documents to vector store")
            
        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}")
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        if not self.model or not self.embeddings:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.model.encode([query])[0]
            
            # Calculate similarities
            similarities = []
            for i, doc_embedding in enumerate(self.embeddings):
                # Simple cosine similarity
                dot_product = np.dot(query_embedding, doc_embedding)
                norm_query = np.linalg.norm(query_embedding)
                norm_doc = np.linalg.norm(doc_embedding)
                
                if norm_query > 0 and norm_doc > 0:
                    similarity = dot_product / (norm_query * norm_doc)
                else:
                    similarity = 0.0
                
                similarities.append((similarity, i))
            
            # Sort by similarity and return top k
            similarities.sort(reverse=True, key=lambda x: x[0])
            
            results = []
            for score, idx in similarities[:k]:
                if idx < len(self.documents):
                    results.append({
                        'document': self.documents[idx],
                        'metadata': self.metadata[idx],
                        'score': float(score)
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return []

# Global instance
simple_vector_store = SimpleVectorStore()