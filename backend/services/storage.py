import chromadb
import logging
import uuid
import json
import os
import time
from datetime import datetime
from config import DB_PATH

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=DB_PATH)
        self.metadata_file = os.path.join(DB_PATH, 'projects.json')
        self._ensure_metadata_file()

    def _ensure_metadata_file(self):
        if not os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'w') as f:
                json.dump({}, f)

    def _load_projects(self):
        with open(self.metadata_file, 'r') as f:
            return json.load(f)

    def _save_projects(self, projects):
        with open(self.metadata_file, 'w') as f:
            json.dump(projects, f, indent=4)

    def create_project(self, name, video_filename=""):
        """Creates a new project entry."""
        project_id = str(uuid.uuid4())
        projects = self._load_projects()

        projects[project_id] = {
            "id": project_id,
            "name": name,
            "status": "processing",
            "created_at": datetime.now().isoformat(),
            "video_filename": video_filename
        }
        self._save_projects(projects)
        return project_id

    def update_project_media(self, project_id, name=None, video_filename=None):
        projects = self._load_projects()
        if project_id not in projects:
            return

        if name is not None:
            projects[project_id]["name"] = name
        if video_filename is not None:
            projects[project_id]["video_filename"] = video_filename

        self._save_projects(projects)

    def update_project_status(self, project_id, status):
        projects = self._load_projects()
        if project_id in projects:
            projects[project_id]["status"] = status
            self._save_projects(projects)

    def list_projects(self):
        projects = self._load_projects()
        # Return list sorted by date desc
        return sorted(projects.values(), key=lambda x: x['created_at'], reverse=True)

    def get_project(self, project_id):
        projects = self._load_projects()
        return projects.get(project_id)

    def delete_project(self, project_id):
        projects = self._load_projects()
        if project_id in projects:
            del projects[project_id]
            self._save_projects(projects)
            try:
                self.client.delete_collection(f"video_{project_id}")
            except ValueError:
                pass # Collection might not exist

    def _get_collection(self, project_id):
        return self.client.get_or_create_collection(
            name=f"video_{project_id}",
            metadata={"hnsw:space": "cosine"}
        )

    def add_segments(self, project_id, segments, embeddings):
        """
        Adds video segments and their embeddings to the project's collection.
        """
        if not segments:
            return

        collection = self._get_collection(project_id)

        ids = [str(uuid.uuid4()) for _ in segments]
        documents = [seg.description for seg in segments]
        metadatas = [
            {
                "start_time": seg.start_time,
                "end_time": seg.end_time,
                "key_elements": ", ".join(seg.key_elements),
                "thumbnail": seg.thumbnail
            }
            for seg in segments
        ]

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Added {len(segments)} segments to project {project_id}.")
        self.update_project_status(project_id, "ready")

    def query(self, project_id, query_embedding, n_results=5):
        """
        Queries the project's collection.
        """
        try:
            collection = self.client.get_collection(f"video_{project_id}")
        except ValueError:
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        formatted_results = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                meta = results['metadatas'][0][i]
                formatted_results.append({
                    'id': results['ids'][0][i],
                    'description': results['documents'][0][i],
                    'start_time': meta['start_time'],
                    'end_time': meta['end_time'],
                    'keywords': meta.get('key_elements', '').split(', '),
                    'thumbnail': meta.get('thumbnail', ''),
                    'score': 1 - results['distances'][0][i] if 'distances' in results else 0
                })

        return formatted_results
