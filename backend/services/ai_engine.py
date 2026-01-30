import os
import time
import logging
import torch
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
        
        # Detect device: CUDA > MPS (Apple) > CPU
        if torch.cuda.is_available():
            device = "cuda"
        elif torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"
            
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME} on {device}...")
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=device)
        
        # Load prompt from file
        self.prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', 'video_analysis.txt')

    def _get_prompt(self):
        """Reads the analysis prompt from the text file."""
        try:
            with open(self.prompt_path, 'r') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read prompt file: {e}")
            # Fallback to a basic prompt if file reading fails
            return "Analyze this video and break it down into segments."

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
            prompt = self._get_prompt()
            
            response = self.client.models.generate_content(
                model=GENAI_MODEL_NAME,
                contents=[file_ref, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    response_schema=VideoAnalysis
                )
            )
            
            # Clean up the file from Gemini after analysis to be tidy
            try:
                self.client.files.delete(name=file_ref.name)
            except:
                pass

            if not response.parsed:
                logger.error("No parsed response received")
                return []

            return response.parsed.segments

        except Exception as e:
            logger.error(f"AI Analysis failed: {e}")
            raise

    def get_embedding(self, text):
        """Generates vector embedding for a single string."""
        return self.embedding_model.encode(text).tolist()

    def get_embeddings(self, texts):
        """Generates vector embeddings for a list of strings (batched)."""
        logger.info(f"Generating embeddings for {len(texts)} segments...")
        embeddings = self.embedding_model.encode(texts, batch_size=32, show_progress_bar=False)
        return embeddings.tolist()