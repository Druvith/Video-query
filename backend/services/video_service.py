import os
import subprocess
import yt_dlp
from config import settings

class VideoService:
    def download_video(self, url: str) -> str:
        """Downloads a video from YouTube and returns the absolute path."""
        # Use video_id as filename to avoid issues with special characters in titles
        out_tmpl = os.path.join(settings.UPLOAD_DIR, '%(id)s.%(ext)s')
        
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': out_tmpl,
            'quiet': False,
            'no_warnings': False,
            'restrictfilenames': True,
            # 'verbose': True, # Uncomment for debugging
        }
        
        try:
            print(f"Starting download for: {url}")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
                # Check if file exists and has content
                if not os.path.exists(filename) or os.path.getsize(filename) == 0:
                     # Sometimes prepare_filename returns the .webm version but we merged to .mp4
                     # Let's check for the actual file on disk if the extension differs
                     base, _ = os.path.splitext(filename)
                     potential_files = [f for f in os.listdir(settings.UPLOAD_DIR) if f.startswith(os.path.basename(base))]
                     if not potential_files:
                         raise Exception("Download failed: No file found on disk.")
                     # Update filename to the one that actually exists
                     filename = os.path.join(settings.UPLOAD_DIR, potential_files[0])

                print(f"Video downloaded successfully to: {filename}")
                return filename
                
        except Exception as e:
            print(f"yt-dlp error: {str(e)}")
            raise e

    def create_clip(self, filename: str, start_time: str, end_time: str) -> str:
        """Creates a video clip using ffmpeg via subprocess."""
        
        # Ensure input path is absolute
        if not os.path.isabs(filename):
            input_path = os.path.join(settings.UPLOAD_DIR, filename)
        else:
            input_path = filename
            
        output_filename = f"clip_{os.path.basename(filename)}_{start_time}_{end_time}.mp4".replace(" ", "_").replace(":", "-")
        output_path = os.path.join(settings.CLIPS_DIR, output_filename)

        # Remove existing clip if present to avoid ffmpeg overwrite prompt issues
        if os.path.exists(output_path):
            os.remove(output_path)

        # ffmpeg command: fast seek (-ss before -i), copy codec for speed
        command = [
            "ffmpeg",
            "-ss", start_time,
            "-to", end_time,
            "-i", input_path,
            "-c", "copy",  # Stream copy (very fast, no re-encoding)
            "-y",          # Overwrite output file if it exists
            output_path
        ]

        try:
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            return output_filename
        except subprocess.CalledProcessError as e:
            # If stream copy fails (sometimes happens with keyframes), try re-encoding
            print(f"Stream copy failed, trying re-encoding: {e.stderr.decode()}")
            command[6] = "-c:v" # Remove -c copy
            command[7] = "libx264" # Use h264
            command.insert(8, "-c:a")
            command.insert(9, "aac")
            
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            return output_filename

video_service = VideoService()
