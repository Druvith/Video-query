import os
import subprocess
import yt_dlp
import logging
from config import UPLOAD_FOLDER, CLIP_FOLDER

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        # Use paths from config
        self.upload_folder = UPLOAD_FOLDER
        self.clip_folder = CLIP_FOLDER
        os.makedirs(self.upload_folder, exist_ok=True)
        os.makedirs(self.clip_folder, exist_ok=True)

    def download_video(self, url):
        """Downloads a video from YouTube."""
        ydl_opts = {
            'outtmpl': os.path.join(self.upload_folder, '%(title)s.%(ext)s'),
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'restrictfilenames': True,
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                return filename
        except Exception as e:
            logger.error(f"Failed to download video: {e}")
            raise

    def create_clip(self, input_path, start_time, end_time):
        """Creates a video clip using ffmpeg."""
        filename = os.path.basename(input_path)
        # Create a safe name for the clip
        safe_start = start_time.replace(':', '-')
        safe_end = end_time.replace(':', '-')
        output_filename = f"clip_{safe_start}_{safe_end}_{filename}"
        output_path = os.path.join(self.clip_folder, output_filename)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"Clip already exists: {output_path}")
            return output_filename

        # More robust FFMPEG command:
        # Putting -i before -ss/-to ensures accurate seeking relative to the file
        cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-ss', str(start_time),
            '-to', str(end_time),
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-preset', 'ultrafast', # Fast encoding
            '-strict', 'experimental',
            output_path
        ]
        
        logger.info(f"Executing FFmpeg: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"FFmpeg successful: {output_path}")
            return output_filename
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed with exit code {e.returncode}")
            logger.error(f"FFmpeg stderr: {e.stderr}")
            raise RuntimeError(f"FFmpeg failed: {e.stderr}")