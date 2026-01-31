import os
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Import Config
from config import UPLOAD_FOLDER, CLIP_FOLDER, ALLOWED_EXTENSIONS

# Load env variables
load_dotenv()

# Import Services
from services.video_processor import VideoProcessor
from services.ai_engine import AIEngine
from services.storage import StorageService

# Configure logging
logging.basicConfig(level=logging.INFO)
logging.getLogger('httpx').setLevel(logging.WARNING) # Suppress noisy HTTP logs
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CLIP_FOLDER'] = CLIP_FOLDER

# Initialize Services
video_processor = VideoProcessor()
try:
    ai_engine = AIEngine()
    storage_service = StorageService()
except Exception as e:
    logger.error(f"Failed to initialize services: {e}")
    ai_engine = None
    storage_service = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/process', methods=['POST'])
def process_video():
    if not ai_engine:
        return jsonify({'error': 'Server misconfiguration: AI Engine not loaded'}), 500

    # 0. Garbage Collect old files and DB
    video_processor.clear_temp_folders()
    storage_service.clear_index()

    data = request.json
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400

    url = data['url']
    try:
        # 1. Download full-res
        filename = video_processor.download_video(url)
        
        # 2. Create low-res proxy for AI
        proxy_path = video_processor.get_ai_proxy(filename)
        
        # 3. Analyze using proxy (much faster upload)
        segments = ai_engine.analyze_video(proxy_path)
        if not segments:
             return jsonify({'error': 'AI analysis yielded no segments'}), 500

        # 4. Extract Thumbnails for each segment
        for seg in segments:
            # Extract at the start of the segment
            seg.thumbnail = video_processor.extract_thumbnail(filename, seg.start_time)

        # 5. Batch generate embeddings
        descriptions = [seg.description for seg in segments]
        embeddings = ai_engine.get_embeddings(descriptions)

        # 5. Index using the original high-res filename for clipping
        storage_service.add_segments(segments, embeddings, filename)

        # Cleanup proxy
        if proxy_path != filename and os.path.exists(proxy_path):
            os.remove(proxy_path)

        return jsonify({'message': 'Video processed and indexed successfully', 'filename': filename}), 200

    except Exception as e:
        logger.error(f"Process failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_video():
    if not ai_engine:
        return jsonify({'error': 'Server misconfiguration: AI Engine not loaded'}), 500

    # 0. Garbage Collect old files and DB
    video_processor.clear_temp_folders()
    storage_service.clear_index()

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Create proxy for uploaded file
            proxy_path = video_processor.get_ai_proxy(file_path)
            
            segments = ai_engine.analyze_video(proxy_path)
            
            # Extract Thumbnails
            for seg in segments:
                seg.thumbnail = video_processor.extract_thumbnail(file_path, seg.start_time)

            descriptions = [seg.description for seg in segments]
            embeddings = ai_engine.get_embeddings(descriptions)
            
            storage_service.add_segments(segments, embeddings, file_path)

            # Cleanup proxy
            if proxy_path != file_path and os.path.exists(proxy_path):
                os.remove(proxy_path)
            
            return jsonify({'message': 'Video uploaded and processed successfully', 'filename': file_path}), 200
        except Exception as e:
            logger.error(f"Upload process failed: {e}")
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/query', methods=['POST'])
def query_video():
    if not ai_engine:
         return jsonify({'error': 'Server misconfiguration: AI Engine not loaded'}), 500

    data = request.json
    if 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400

    try:
        query_text = data['query']
        query_embedding = ai_engine.get_embedding(query_text)
        results = storage_service.query(query_embedding, n_results=5)
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Query failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/clip', methods=['POST'])
def clip_video():
    data = request.json
    required = ['filename', 'start_time', 'end_time']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing parameters'}), 400

    try:
        filename = data['filename']
        if not os.path.exists(filename):
            filename = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(filename))
            if not os.path.exists(filename):
                 return jsonify({'error': 'Video file not found'}), 404

        output_filename = video_processor.create_clip(
            filename, 
            data['start_time'], 
            data['end_time']
        )
        return jsonify({'clip_url': f'/clips/{output_filename}'}), 200
    except Exception as e:
        logger.error(f"Clip failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/clips/<filename>')
def serve_clip(filename):
    path = os.path.join(app.config['CLIP_FOLDER'], filename)
    if not os.path.exists(path):
        return jsonify({'error': 'Clip not found'}), 404
    return send_file(path, mimetype='video/mp4', conditional=True)

@app.route('/delete-index', methods=['POST'])
def delete_index():
    try:
        storage_service.clear_index()
        return jsonify({'message': 'Index deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
