import base64
import os
import subprocess
import yt_dlp
import logging
import platform
import shutil
from config import UPLOAD_FOLDER, CLIP_FOLDER

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        # Use paths from config
        self.upload_folder = UPLOAD_FOLDER
        self.clip_folder = CLIP_FOLDER
        os.makedirs(self.upload_folder, exist_ok=True)
        os.makedirs(self.clip_folder, exist_ok=True)
        self.is_mac = platform.system() == 'Darwin'

    def extract_thumbnail(self, video_path, timestamp_str):
        """Extracts a tiny frame at timestamp and returns as base64 string."""
        # Output to a temporary small jpeg
        temp_thumb = os.path.join(self.upload_folder, f"thumb_{os.getpid()}.jpg")
        
        # -ss before -i for speed
        # scale to small width (e.g. 280px)
        # q:v 2-5 for decent quality but small size
        cmd = [
            'ffmpeg',
            '-y',
            '-ss', timestamp_str,
            '-i', video_path,
            '-frames:v', '1',
            '-vf', 'scale=280:-1',
            '-q:v', '4',
            temp_thumb
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            if os.path.exists(temp_thumb):
                with open(temp_thumb, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                os.remove(temp_thumb)
                return f"data:image/jpeg;base64,{encoded_string}"
        except Exception as e:
            logger.error(f"Thumbnail extraction failed: {e}")
            if os.path.exists(temp_thumb):
                os.remove(temp_thumb)
        return ""

    def clear_temp_folders(self):
        """Clears all files in the uploads and clips directories."""
        for folder in [self.upload_folder, self.clip_folder]:
            logger.info(f"Clearing folder: {folder}")
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        if filename != '.gitkeep':
                            os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    logger.error(f'Failed to delete {file_path}. Reason: {e}')

    def download_video(self, url):
        """Downloads a video from YouTube (Highest Quality)."""
        ydl_opts = {
            'outtmpl': os.path.join(self.upload_folder, '%(title)s.%(ext)s'),
            # Download best quality
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

    def get_ai_proxy(self, input_path):
        """Creates a low-res (480p) proxy of a video for faster AI upload."""
        filename = os.path.basename(input_path)
        proxy_filename = f"proxy_480p_{filename}"
        proxy_path = os.path.join(self.upload_folder, proxy_filename)

        if os.path.exists(proxy_path):
            return proxy_path

        logger.info(f"Creating low-res AI proxy: {proxy_path}")
        # Downscale to 480p, reduce bitrate for fast upload
        encoder = 'h264_videotoolbox' if self.is_mac else 'libx264'
        cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-vf', 'scale=-2:360',
            '-c:v', encoder,
        ]
        
        if self.is_mac:
            cmd.extend(['-b:v', '1000k']) # Videotoolbox uses bitrate
        else:
            cmd.extend(['-preset', 'ultrafast', '-crf', '28'])

        cmd.extend([
            '-c:a', 'aac',
            '-ar', '22050',
            proxy_path
        ])
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return proxy_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Proxy generation failed: {e.stderr.decode()}")
            return input_path # Fallback to original if proxy fails

    def _parse_time(self, time_str):
        """Converts MM:SS or HH:MM:SS to seconds."""
        parts = time_str.split(':')
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        return float(time_str)

    def create_clip(self, input_path, start_time, end_time):
        """Creates a video clip using ffmpeg."""
        filename = os.path.basename(input_path)
        # Create a safe name for the clip
        safe_start = start_time.replace(':', '-')
        safe_end = end_time.replace(':', '-')
        # Ensure filename is safe (replace spaces)
        safe_filename = filename.replace(' ', '_')
        output_filename = f"clip_{safe_start}_{safe_end}_{safe_filename}"
        output_path = os.path.join(self.clip_folder, output_filename)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"Clip already exists: {output_path}")
            return output_filename

        # Calculate duration for -t
        start_secs = self._parse_time(start_time)
        end_secs = self._parse_time(end_time)
        duration = max(0, end_secs - start_secs)

        encoder = 'h264_videotoolbox' if self.is_mac else 'libx264'

        # Fast seeking: -ss before -i
        # Accurate duration: -t
        # Web optimized: +faststart, yuv420p
        cmd = [
            'ffmpeg',
            '-y',
            '-ss', str(start_time),
            '-i', input_path,
            '-t', str(duration),
            '-c:v', encoder,
        ]

        if self.is_mac:
            cmd.extend(['-b:v', '4000k']) # High quality for clips
        else:
            cmd.extend(['-preset', 'ultrafast'])

        cmd.extend([
            '-c:a', 'aac',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-strict', 'experimental',
            output_path
        ])
        
        logger.info(f"Executing FFmpeg: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"FFmpeg successful: {output_path}")
            return output_filename
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed with exit code {e.returncode}")
            logger.error(f"FFmpeg stderr: {e.stderr}")
            raise RuntimeError(f"FFmpeg failed: {e.stderr}")