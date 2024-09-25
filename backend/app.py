import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import yt_dlp
from moviepy.editor import VideoFileClip
import time

index_name = "docs-quickstart-notebook"
# Import your existing functions
from main import process_and_index_video, query_video_segments, pc, spec

app = Flask(__name__)
CORS(app)  # This allows all origins

UPLOAD_FOLDER = 'uploads'
CLIP_FOLDER = 'clips'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CLIP_FOLDER'] = CLIP_FOLDER

# Ensure upload and clip folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLIP_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def download_video(url):
    ydl_opts = {
        'outtmpl': os.path.join(app.config['UPLOAD_FOLDER'], '%(title)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
    return filename

@app.route('/process', methods=['POST'])
def process_video():
    data = request.json
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400

    url = data['url']

    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=1536,
            metric="cosine",
            spec=spec
        )
        while not pc.describe_index(index_name).status["ready"]:
            time.sleep(1)

    # Download the video
    try:
        filename = download_video(url)
    except Exception as e:
        return jsonify({'error': f'Failed to download the video: {str(e)}'})

    success = process_and_index_video(filename)

    if success:
        return jsonify({'message': 'Video processed and indexed successfully', 'filename': filename}), 200
    else:
        return jsonify({'error': 'Failed to process and index the video'}), 500

# *** New Endpoint for Uploading Local Video Files ***
@app.route('/upload', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        try:
            file.save(file_path)
            app.logger.debug(f"File saved to {file_path}")

            # Ensure index exists
            if index_name not in pc.list_indexes().names():
                pc.create_index(
                    name=index_name,
                    dimension=1536,
                    metric="cosine",
                    spec=spec
                )
                while not pc.describe_index(index_name).status["ready"]:
                    time.sleep(1)

            # Process and index the uploaded video
            success = process_and_index_video(file_path)

            if success:
                return jsonify({'message': 'Video uploaded, processed, and indexed successfully', 'filename': file_path}), 200
            else:
                return jsonify({'error': 'Failed to process and index the video'}), 500
        except Exception as e:
            app.logger.error(f"Error uploading file: {str(e)}")
            return jsonify({'error': f'Failed to upload and process the video: {str(e)}'}), 500
    else:
        return jsonify({'error': 'File type not allowed'}), 400
# *** End of New Endpoint ***

@app.route('/query', methods=['POST'])
def query_video():
    data = request.json
    if 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400

    results = query_video_segments(data['query'])
    return jsonify(results), 200

@app.route('/clip', methods=['POST'])
def clip_video():
    app.logger.debug(f"Received clip request data: {request.json}")
    data = request.json
    if 'filename' not in data or 'start_time' not in data or 'end_time' not in data:
        missing_params = [param for param in ['filename', 'start_time', 'end_time'] if param not in data]
        app.logger.error(f"Missing parameters: {', '.join(missing_params)}")
        return jsonify({'error': f"Missing required parameters: {', '.join(missing_params)}"}), 400

    try:
        filename = data['filename']
        start_time = data['start_time']
        end_time = data['end_time']

        app.logger.debug(f"Attempting to create clip from {filename} from {start_time} to {end_time}")

        # Create the clip
        video = VideoFileClip(filename)
        clip = video.subclip(start_time, end_time)
        output_filename = f"clip_{start_time}_{end_time}.mp4"
        output_path = os.path.join(app.config['CLIP_FOLDER'], output_filename)
        clip.write_videofile(output_path)

        app.logger.debug(f"Clip created successfully: {output_path}")
        return jsonify({'clip_url': f'/clips/{output_filename}'}), 200
    except Exception as e:
        app.logger.error(f"Error creating clip: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/clips/<filename>')
def serve_clip(filename):
    return send_file(os.path.join(app.config['CLIP_FOLDER'], filename))

@app.route('/delete-index', methods=['POST'])
def delete_index():
    try:
        if index_name not in pc.list_indexes().names():
            return jsonify({'message': 'Index does not exist'}), 404

        pc.delete_index(index_name)
        return jsonify({'message': 'Index deleted successfully'}), 200
    except Exception as e:
        app.logger.error(f'Error deleting index: {str(e)}')
        return jsonify({'error': f'Failed to delete index: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
