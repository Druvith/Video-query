import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import video
from config import settings

app = FastAPI(title="Video Query API")

# CORS (Allow Frontend)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Clips
# This allows access like http://localhost:8000/clips/clip_name.mp4
app.mount("/clips", StaticFiles(directory=settings.CLIPS_DIR), name="clips")

# Include Routers
app.include_router(video.router)