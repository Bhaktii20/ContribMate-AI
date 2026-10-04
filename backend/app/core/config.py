from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ContribMate AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # GitHub credentials
    GITHUB_TOKEN: Optional[str] = None
    
    # AI credentials
    GROQ_API_KEY: Optional[str] = None
    AI_MODEL: str = "qwen-2.5-coder-32b"
    AI_BASE_URL: str = "https://api.groq.com/openai/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./contribmate.db"
    
    # Frontend API URL
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    
    # Embedding Model
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    
    # Demo Mode
    DEMO_MODE: bool = True
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

