import chromadb
import logging
import uuid
from config import DB_PATH

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name="video_segments",
            metadata={"hnsw:space": "cosine"}
        )

    def clear_index(self):
        """Deletes and recreates the collection."""
        self.client.delete_collection("video_segments")
        self.collection = self.client.get_or_create_collection(
            name="video_segments",
            metadata={"hnsw:space": "cosine"}
        )

    def add_segments(self, segments, embeddings, video_filename):
        """
        Adds video segments and their embeddings to the DB.
        segments: List of VideoSegment objects
        embeddings: List of vector lists
        video_filename: The name of the video file
        """
        if not segments:
            return

        ids = [str(uuid.uuid4()) for _ in segments]
        documents = [seg.description for seg in segments]
        metadatas = [
            {
                "start_time": seg.start_time,
                "end_time": seg.end_time,
                "key_elements": ", ".join(seg.key_elements),
                "video_filename": video_filename
            }
            for seg in segments
        ]

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Added {len(segments)} segments to index.")
        if metadatas:
             logger.info(f"Sample metadata being added: {metadatas[0]}")

    def query(self, query_embedding, n_results=5):
        """
        Queries the database for similar segments.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        formatted_results = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                meta = results['metadatas'][0][i]
                logger.info(f"Retrieved metadata for result {i}: {meta}")
                formatted_results.append({
                    'id': results['ids'][0][i],
                    'description': results['documents'][0][i],
                    'start_time': meta['start_time'],
                    'end_time': meta['end_time'],
                    'filename': meta.get('video_filename'),
                    'score': 1 - results['distances'][0][i] if 'distances' in results else 0
                })
        
        return formatted_results