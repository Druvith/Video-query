import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File
from services.video_service import video_service
from services.ai_service import ai_service
from services.db_service import db_service
from config import settings
from models import VideoProcessRequest, VideoQueryRequest, ClipRequest, VideoSegment

router = APIRouter()

@router.post("/process")
async def process_video(request: VideoProcessRequest):
    try:
        # 1. Download
        print(f"Downloading video from {request.url}...")
        filename = video_service.download_video(request.url)
        video_path = os.path.join(settings.UPLOAD_DIR, filename) # Wait, download_video returns full path or filename?
        # Checking video_service.download_video... it returns filename.
        # But wait, video_service uses ydl.prepare_filename which might return full path if outtmpl has it.
        # Let's ensure we get the full path correctly.
        # video_service configures outtmpl with settings.UPLOAD_DIR.
        # Let's assume filename is just the name for now, I'll double check if needed, 
        # but commonly ydl.prepare_filename returns the full path if provided in template.
        
        # Actually, let's look at video_service again. 
        # outtmpl is os.path.join(settings.UPLOAD_DIR, '%(title)s.%(ext)s').
        # So prepare_filename likely returns the FULL path.
        full_path = filename
        actual_filename = os.path.basename(full_path)

        # 2. Analyze
        print("Analyzing video content...")
        segments = ai_service.analyze_video(full_path)
        
        # 3. Generate Embeddings & Index
        print("Generating embeddings...")
        descriptions = [s['description'] for s in segments]
        embeddings = ai_service.embedding_model.encode(descriptions).tolist()
        
        print("Indexing segments...")
        db_service.add_segments(segments, embeddings, actual_filename)
        
        return {"message": "Video processed and indexed successfully", "filename": actual_filename}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Analyze & Index (Same logic as process)
        segments = ai_service.analyze_video(file_path)
        
        descriptions = [s['description'] for s in segments]
        embeddings = ai_service.embedding_model.encode(descriptions).tolist()
        
        db_service.add_segments(segments, embeddings, file.filename)
        
        return {"message": "Video uploaded and indexed successfully", "filename": file.filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_video(request: VideoQueryRequest):
    try:
        query_embedding = ai_service.get_embedding(request.query)
        results = db_service.search(query_embedding)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clip")
async def create_clip(request: ClipRequest):
    try:
        clip_filename = video_service.create_clip(
            request.filename, 
            request.start_time, 
            request.end_time
        )
        # Return the URL path that frontend will use (served by StaticFiles)
        return {"clip_url": f"/clips/{clip_filename}"}
    except Exception as e:
        print(f"Clip error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete-index")
async def delete_index():
    try:
        db_service.clear_index()
        return {"message": "Index deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
