# Video Query

A local-first application for semantic video search and discovery. Index videos via YouTube URL or local upload and perform natural language queries to find, play, and download specific moments.

## Features

- **Semantic Search**: Query video content using natural language (e.g., "Where is the battery replaced?").
- **Local Vector Storage**: Uses ChromaDB for local indexing and storage.
- **Hardware Acceleration**: Optimized with hardware-accelerated transcoding (h264_videotoolbox) for near-instant clipping.
- **Progress Tracking**: Real-time feedback during the multi-stage indexing process.
- **Segment Downloads**: Export any discovered video segment directly to your disk.
- **Project-Based Library**: Each ingestion creates its own project index so previously indexed videos are preserved.

## Prerequisites

- **Python 3.10+**
- **FFmpeg**
- **uv** (Recommended for dependency management)
- **Node.js & npm**
- **Google AI API Key** (Set in `backend/.env` as `GOOGLE_API_KEY`)

## Installation & Usage

The project includes a `Makefile` for simplified orchestration.

### 1. Initial Setup
This will configure the Python environment and install frontend dependencies.
```bash
make setup
```

### 2. Set API Key
Create a `.env` file in the `backend/` directory:
```bash
echo "GOOGLE_API_KEY=your_key_here" > backend/.env
```

### 3. Run Application
Launches both the Backend and Frontend in a single terminal.
```bash
make dev
```
Press `Ctrl+C` to stop both servers.

## API Reference

- `POST /process`: Index a YouTube video via URL.
- `POST /upload`: Index a local video file.
- `POST /query`: Search within a project index (requires `project_id` and `query`).
- `POST /clip`: Generate a segment from a project video (requires `project_id`, `start_time`, `end_time`).
- `GET /projects`: List indexed projects.
- `GET /projects/{project_id}`: Get project metadata.
- `DELETE /projects/{project_id}`: Delete a project and its indexed data.

## Tech Stack

- **AI**: Gemini (Analysis), sentence-transformers (Local Embeddings).
- **Database**: ChromaDB.
- **Media**: FFmpeg, yt-dlp.
- **Frontend**: React, Tailwind CSS.
- **Backend**: Flask.

## License
MIT
