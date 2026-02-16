import os
from typing import List, Optional
from pydantic import BaseModel, Field

# --- Constants ---
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
CLIP_FOLDER = os.getenv('CLIP_FOLDER', 'clips')
DB_PATH = os.getenv('DB_PATH', './video_index_db')
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}

# --- Model Configurations ---
GENAI_MODEL_NAME = "gemini-flash-lite-latest"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384 

# Skip proxy generation for small files where transcode overhead is not worth it.
AI_PROXY_MIN_SOURCE_MB = float(os.getenv('AI_PROXY_MIN_SOURCE_MB', '30'))

# --- Structured Output Schemas ---
class VideoSegment(BaseModel):
    start_time: str = Field(description="Start time of the segment in MM:SS format")
    end_time: str = Field(description="End time of the segment in MM:SS format")
    description: str = Field(description="Detailed description of what happens in this segment")
    key_elements: List[str] = Field(description="List of key objects, people, or concepts in the segment")
    thumbnail: Optional[str] = Field(default="", description="Base64 encoded thumbnail image")

class VideoAnalysis(BaseModel):
    segments: List[VideoSegment]
