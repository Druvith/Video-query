import os
import time
import logging
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer
from config import GENAI_MODEL_NAME, EMBEDDING_MODEL_NAME, VideoAnalysis

logger = logging.getLogger(__name__)

class AIEngine:
    def __init__(self):
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        if not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        self.client = genai.Client(api_key=self.google_api_key)
        
        # Load local embedding model
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    def analyze_video(self, video_path):
        """Uploads video to Gemini and gets structured analysis."""
        try:
            # 1. Upload file
            logger.info(f"Uploading {video_path} to Gemini...")
            file_ref = self.client.files.upload(file=video_path)
            
            # 2. Wait for processing
            while file_ref.state.name == "PROCESSING":
                time.sleep(2)
                file_ref = self.client.files.get(name=file_ref.name)
            
            if file_ref.state.name == "FAILED":
                raise RuntimeError("Video processing failed on Gemini side")

            # 3. Generate Content with Structured Output
            logger.info(f"Generating analysis using {GENAI_MODEL_NAME}...")
            prompt = """
            Analyze this video and break it down into chronological segments.
            For each segment, provide the start/end times, a detailed description, and key elements.
            Ensure segments cover the entire video duration.
            """
            
            response = self.client.models.generate_content(
                model=GENAI_MODEL_NAME,
                contents=[file_ref, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    response_schema=VideoAnalysis
                )
            )
            
            if not response.parsed:
                logger.error("No parsed response received")
                return []

            return response.parsed.segments

        except Exception as e:
            logger.error(f"AI Analysis failed: {e}")
            raise

    def get_embedding(self, text):
        """Generates vector embedding for text."""
        return self.embedding_model.encode(text).tolist()