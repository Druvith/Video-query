from pydantic import BaseModel
from typing import List, Optional

class VideoProcessRequest(BaseModel):
    url: str

class VideoQueryRequest(BaseModel):
    query: str

class ClipRequest(BaseModel):
    filename: str
    start_time: str
    end_time: str

class VideoSegment(BaseModel):
    start_time: str
    end_time: str
    description: str
    key_elements: List[str]
    score: Optional[float] = None

class VideoAnalysisResponse(BaseModel):
    segments: List[VideoSegment]
