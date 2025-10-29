import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Any
from ..config import settings


class VectorStore:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.documents = []
        self.metadata = []
        self.dimension = 384  # Dimension for all-MiniLM-L6-v2
        
    def initialize_index(self):
        """Initialize FAISS index"""
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        
    def add_documents(self, documents: List[str], metadata: List[Dict[str, Any]]):
        """Add documents to the vector store"""
        if self.index is None:
            self.initialize_index()
            
        # Generate embeddings
        embeddings = self.model.encode(documents)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Add to index
        self.index.add(embeddings.astype('float32'))
        
        # Store documents and metadata
        self.documents.extend(documents)
        self.metadata.extend(metadata)
        
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        if self.index is None or self.index.ntotal == 0:
            return []
            
        # Generate query embedding
        query_embedding = self.model.encode([query])
        faiss.normalize_L2(query_embedding)
        
        # Search
        scores, indices = self.index.search(query_embedding.astype('float32'), k)
        
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(self.documents):
                results.append({
                    'document': self.documents[idx],
                    'metadata': self.metadata[idx],
                    'score': float(score)
                })
                
        return results
    
    def save(self, path: str):
        """Save vector store to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        # Save FAISS index
        if self.index is not None:
            faiss.write_index(self.index, f"{path}.faiss")
        
        # Save documents and metadata
        with open(f"{path}.pkl", 'wb') as f:
            pickle.dump({
                'documents': self.documents,
                'metadata': self.metadata
            }, f)
    
    def load(self, path: str):
        """Load vector store from disk"""
        try:
            # Load FAISS index
            if os.path.exists(f"{path}.faiss"):
                self.index = faiss.read_index(f"{path}.faiss")
            
            # Load documents and metadata
            if os.path.exists(f"{path}.pkl"):
                with open(f"{path}.pkl", 'rb') as f:
                    data = pickle.load(f)
                    self.documents = data['documents']
                    self.metadata = data['metadata']
        except Exception as e:
            # TODO: Add proper logging
            print(f"Error loading vector store: {e}")
            self.initialize_index()


# Global vector store instance
vector_store = VectorStore()