# Video Query - AI-Powered Video Semantic Search

A modern, local-first stack for indexing and searching video content using AI. This application allows you to process YouTube videos or local uploads, generate semantic descriptions using Gemini 2.0, and perform natural language queries to find and play specific moments.

## Key Features

- **Semantic Video Search**: Find moments in videos using natural language (e.g., "Where does he talk about the iPhone launch?").
- **Local-First Vector Store**: Uses **ChromaDB** for local vector storage—no external database subscription required.
- **Local Embeddings**: Generates embeddings locally using `sentence-transformers` (`all-MiniLM-L6-v2`).
- **Gemini 2.0 Integration**: Utilizes the latest `google-genai` SDK for high-accuracy structured video analysis.
- **Instant Clipping**: High-speed video clipping using **FFmpeg** with re-encoding for accurate seeking.
- **Modern Tooling**: Powered by **uv** for ultra-fast Python dependency management.

## Prerequisites

- **Python 3.10+**
- **FFmpeg**: Required for video processing and clipping.
- **uv**: Recommended for package management ([Install uv](https://github.com/astral-sh/uv)).
- **Node.js & npm**: Required for the frontend.
- **Google AI API Key**: Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey).

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Druvith/video-query.git
cd video-query
```

### 2. Backend Setup
```bash
cd backend

# Setup environment and install dependencies using uv
chmod +x setup_env.sh
./setup_env.sh

# Set your API Key
echo "GOOGLE_API_KEY=your_key_here" > .env

# Run the server
source .venv/bin/activate
python app.py
```
The backend will run at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
The frontend will run at `http://localhost:3000`.

## How it Works

1. **Ingestion**: Videos are downloaded via `yt-dlp` or uploaded manually.
2. **Analysis**: Gemini 2.0 Flash analyzes the video and returns structured JSON containing segment timestamps and descriptions.
3. **Indexing**: Descriptions are converted into 384-dimensional vectors using `all-MiniLM-L6-v2` and stored in a local **ChromaDB** instance (`backend/video_index_db`).
4. **Search**: User queries are embedded locally and compared against the vector store using cosine similarity.
5. **Playback**: When a result is selected, FFmpeg creates a precise clip on-the-fly for instant playback.

## Backend API

- `POST /process`: Index a YouTube video by URL.
- `POST /upload`: Index a local MP4 file.
- `POST /query`: Search the index using natural language.
- `POST /clip`: Generate a specific video segment.
- `POST /delete-index`: Wipe the local vector store.

## Tech Stack

- **Frontend**: React, Tailwind CSS.
- **Backend**: Flask, `uv`.
- **AI/ML**: `google-genai`, `sentence-transformers`, `chromadb`.
- **Media**: `ffmpeg`, `yt-dlp`.

## License
MIT