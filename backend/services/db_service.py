import chromadb
from chromadb.config import Settings
from config import settings
from typing import List, Dict, Any

class DBService:
    def __init__(self):
        # Initialize Persistent Client
        self.client = chromadb.PersistentClient(path=settings.DB_DIR)
        
        # Get or Create Collection
        # We use cosine similarity (default is l2, but cosine is better for semantic search)
        self.collection = self.client.get_or_create_collection(
            name="video_segments",
            metadata={"hnsw:space": "cosine"}
        )

    def add_segments(self, segments: List[Dict[str, Any]], embeddings: List[List[float]], video_filename: str):
        """Batch inserts segments into ChromaDB."""
        if not segments:
            return

        ids = []
        documents = []
        metadatas = []
        
        for i, segment in enumerate(segments):
            # Create a unique ID for each segment
            seg_id = f"{video_filename}_{i}_{segment['start_time']}"
            ids.append(seg_id)
            
            # Document content (what we search against)
            documents.append(segment['description'])
            
            # Metadata (info we retrieve)
            metadatas.append({
                "filename": video_filename,
                "start_time": segment['start_time'],
                "end_time": segment['end_time'],
                "key_elements": ", ".join(segment['key_elements']),
                "full_description": segment['description'] # Store full desc in metadata for easy display
            })

        # Batch Add
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        print(f"Indexed {len(segments)} segments for {video_filename}")

    def search(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """Searches for relevant segments using the query embedding."""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=limit
        )

        formatted_results = []
        
        # Parse ChromaDB result format
        if results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                meta = results['metadatas'][0][i]
                score = results['distances'][0][i] # In cosine space, lower might be better or worse depending on impl, usually 1 - cosine
                
                formatted_results.append({
                    "start_time": meta['start_time'],
                    "end_time": meta['end_time'],
                    "description": meta['full_description'],
                    "key_elements": meta['key_elements'].split(", "),
                    "score": score,
                    "filename": meta['filename']
                })
        
        return formatted_results

    def clear_index(self):
        """Deletes the collection and starts fresh."""
        self.client.delete_collection("video_segments")
        self.collection = self.client.create_collection(
            name="video_segments",
            metadata={"hnsw:space": "cosine"}
        )

db_service = DBService()
