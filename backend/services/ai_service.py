import time
import json
import ast
import re
import os
from typing import List, Dict, Any
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer
from config import settings
from models import VideoSegment, VideoAnalysisResponse

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        # Load embedding model on startup (lazy loading could be an option too)
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

    def analyze_video(self, video_path: str) -> List[Dict[str, Any]]:
        """Uploads video to Gemini and returns structured segments."""
        
        # 1. Upload File
        print(f"Uploading {video_path} to Gemini...")
        video_file = self.client.files.upload(file=video_path)
        
        # 2. Wait for Processing
        while video_file.state.name == "PROCESSING":
            print(".", end='', flush=True)
            time.sleep(2)
            video_file = self.client.files.get(name=video_file.name)
            
        if video_file.state.name == "FAILED":
            raise Exception("Video processing failed by Gemini.")

        print("\nVideo processed. Generating analysis...")

        # 3. Generate Content
        prompt_path = os.path.join(settings.BASE_DIR, "prompt.txt")
        with open(prompt_path, "r") as f:
            prompt = f.read()
            
        # Add explicit instruction for the wrapping key
        prompt += "\nOutput the result as a JSON object with a 'segments' key containing the list of segments."
        
        response = self.client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=video_file.uri,
                            mime_type=video_file.mime_type
                        ),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VideoAnalysisResponse,
            )
        )
        
        # 4. Clean up (delete file from Gemini storage)
        # self.client.files.delete(name=video_file.name) # Optional: delete to save storage

        # 5. Parse Response (Pydantic does the heavy lifting now)
        try:
            # The response.text is now guaranteed to be valid JSON matching our schema
            parsed_data = VideoAnalysisResponse.model_validate_json(response.text)
            # Convert back to list of dicts for DB service compatibility
            return [segment.model_dump() for segment in parsed_data.segments]
        except Exception as e:
            print(f"Error parsing Gemini response: {response.text}")
            raise e

    def get_embedding(self, text: str) -> List[float]:
        """Generates a vector embedding for the given text."""
        return self.embedding_model.encode(text).tolist()

ai_service = AIService()
