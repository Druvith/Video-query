import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "data", "uploads")
    CLIPS_DIR: str = os.path.join(BASE_DIR, "data", "clips")
    DB_DIR: str = os.path.join(BASE_DIR, "data", "db")
    
    # AI Config
    GEMINI_MODEL: str = "gemini-3-flash-preview"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CLIPS_DIR, exist_ok=True)
os.makedirs(settings.DB_DIR, exist_ok=True)
