import os
import logging
import shutil
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

def get_project_upload_dir(project_id):
    project_dir = os.path.join(app.config['UPLOAD_FOLDER'], project_id)
    os.makedirs(project_dir, exist_ok=True)
    return project_dir

def remove_file_if_exists(path):
    try:
        if os.path.isfile(path):
            os.remove(path)
            return True
    except OSError as e:
        logger.warning(f"Failed to delete file {path}: {e}")
    return False

def cleanup_project_media(project_id, project):
    video_filename = (project or {}).get('video_filename') or ''
    candidate_video_paths = []

    if video_filename:
        if os.path.isabs(video_filename):
            candidate_video_paths.append(video_filename)
        else:
            base_name = os.path.basename(video_filename)
            candidate_video_paths.append(os.path.join(app.config['UPLOAD_FOLDER'], project_id, base_name))
            candidate_video_paths.append(os.path.join(app.config['UPLOAD_FOLDER'], base_name))

    removed_video_paths = []
    for path in candidate_video_paths:
        abs_path = os.path.abspath(path)
        if remove_file_if_exists(abs_path):
            removed_video_paths.append(abs_path)

    # Ensure all project-local uploads/proxies are removed.
    project_dir = os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], project_id))
    if os.path.isdir(project_dir):
        shutil.rmtree(project_dir, ignore_errors=True)

    # Remove generated clips for this project.
    safe_basenames = set()
    for path in removed_video_paths + candidate_video_paths:
        base_name = os.path.basename(path)
        if base_name:
            safe_basenames.add(base_name.replace(' ', '_'))

    project_name = os.path.basename(project.get('name') or '')
    if project_name:
        safe_basenames.add(project_name.replace(' ', '_'))

    if os.path.isdir(app.config['CLIP_FOLDER']):
        for clip_name in os.listdir(app.config['CLIP_FOLDER']):
            clip_path = os.path.join(app.config['CLIP_FOLDER'], clip_name)
            if not os.path.isfile(clip_path):
                continue

            scoped_clip = clip_name.startswith(f"clip_{project_id}_")
            legacy_clip = any(clip_name.endswith(f"_{base_name}") for base_name in safe_basenames)

            if scoped_clip or legacy_clip:
                remove_file_if_exists(clip_path)

@app.route('/projects', methods=['GET'])
def list_projects():
    return jsonify(storage_service.list_projects()), 200

@app.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    project = storage_service.get_project(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    return jsonify(project), 200

@app.route('/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    project = storage_service.get_project(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    cleanup_project_media(project_id, project)
    storage_service.delete_project(project_id)
    return jsonify({'message': 'Project deleted'}), 200

@app.route('/process', methods=['POST'])
def process_video():
    if not ai_engine:
        return jsonify({'error': 'Server misconfiguration: AI Engine not loaded'}), 500

    data = request.json
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400

    url = data['url']
    project_id = None
    filename = None
    proxy_path = None

    try:
        # 1. Create project + dedicated media directory
        project_id = storage_service.create_project("Processing video")
        project_dir = get_project_upload_dir(project_id)

        # 2. Download full-res into project directory
        filename = os.path.abspath(video_processor.download_video(url, output_dir=project_dir))
        storage_service.update_project_media(
            project_id,
            name=os.path.basename(filename),
            video_filename=filename
        )

        # 3. Create low-res proxy for AI
        proxy_path = video_processor.get_ai_proxy(filename)

        # 4. Analyze using proxy (much faster upload)
        segments = ai_engine.analyze_video(proxy_path)
        if not segments:
            storage_service.update_project_status(project_id, "failed")
            return jsonify({'error': 'AI analysis yielded no segments'}), 500

        # 5. Extract thumbnails for each segment
        for seg in segments:
            # Extract at the start of the segment
            seg.thumbnail = video_processor.extract_thumbnail(filename, seg.start_time)

        # 6. Batch generate embeddings
        descriptions = [seg.description for seg in segments]
        embeddings = ai_engine.get_embeddings(descriptions)

        # 7. Index using the project ID
        storage_service.add_segments(project_id, segments, embeddings)

        return jsonify({'message': 'Video processed and indexed successfully', 'project_id': project_id, 'filename': filename}), 200

    except Exception as e:
        logger.error(f"Process failed: {e}")
        if project_id:
            storage_service.update_project_status(project_id, "failed")
        return jsonify({'error': str(e)}), 500
    finally:
        if proxy_path and filename and proxy_path != filename and os.path.exists(proxy_path):
            os.remove(proxy_path)

@app.route('/upload', methods=['POST'])
def upload_video():
    if not ai_engine:
        return jsonify({'error': 'Server misconfiguration: AI Engine not loaded'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        project_id = None
        file_path = None
        proxy_path = None

        try:
            filename = secure_filename(file.filename)

            # Create project + dedicated media directory
            project_id = storage_service.create_project(filename)
            project_dir = get_project_upload_dir(project_id)

            file_path = os.path.abspath(os.path.join(project_dir, filename))
            file.save(file_path)
            storage_service.update_project_media(project_id, name=filename, video_filename=file_path)

            # Create proxy for uploaded file
            proxy_path = video_processor.get_ai_proxy(file_path)

            segments = ai_engine.analyze_video(proxy_path)
            if not segments:
                storage_service.update_project_status(project_id, "failed")
                return jsonify({'error': 'AI analysis yielded no segments'}), 500

            # Extract Thumbnails
            for seg in segments:
                seg.thumbnail = video_processor.extract_thumbnail(file_path, seg.start_time)

            descriptions = [seg.description for seg in segments]
            embeddings = ai_engine.get_embeddings(descriptions)

            storage_service.add_segments(project_id, segments, embeddings)
            return jsonify({'message': 'Video uploaded and processed successfully', 'project_id': project_id, 'filename': file_path}), 200
        except Exception as e:
            logger.error(f"Upload process failed: {e}")
            if project_id:
                storage_service.update_project_status(project_id, "failed")
            return jsonify({'error': str(e)}), 500
        finally:
            if proxy_path and file_path and proxy_path != file_path and os.path.exists(proxy_path):
                os.remove(proxy_path)

    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/query', methods=['POST'])
def query_video():
    if not ai_engine:
         return jsonify({'error': 'Server misconfiguration: AI Engine not loaded'}), 500

    data = request.json or {}
    if 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400

    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400

    if not storage_service.get_project(project_id):
        return jsonify({'error': 'Project not found'}), 404

    try:
        query_text = data['query']
        query_embedding = ai_engine.get_embedding(query_text)
        results = storage_service.query(project_id, query_embedding, n_results=5)
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Query failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/clip', methods=['POST'])
def clip_video():
    data = request.json or {}
    required = ['project_id', 'start_time', 'end_time']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing parameters'}), 400

    try:
        project = storage_service.get_project(data['project_id'])
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        video_filename = project.get('video_filename')
        if not video_filename:
            return jsonify({'error': 'Project has no source video'}), 400

        candidate_paths = []
        if os.path.isabs(video_filename):
            candidate_paths.append(video_filename)
        else:
            base_name = os.path.basename(video_filename)
            candidate_paths.append(os.path.join(app.config['UPLOAD_FOLDER'], data['project_id'], base_name))
            candidate_paths.append(os.path.join(app.config['UPLOAD_FOLDER'], base_name))

        filename = next((os.path.abspath(path) for path in candidate_paths if os.path.exists(path)), None)
        if not filename:
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

if __name__ == '__main__':
    app.run(debug=True, port=5001)
