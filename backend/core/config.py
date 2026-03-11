from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MYSQL_ROOT_PASSWORD: str = "matiic"
    MYSQL_DATABASE: str = "techlib"
    DATABASE_URL: str = "mysql+aiomysql://root:matiic@mysql:3306/techlib"
    REDIS_URL: str = "redis://redis:6379/0"
    QDRANT_URL: str = "http://qdrant:6333"
    JWT_SECRET: str = "supersecretjwtkey_change_me_in_production"
    OLLAMA_URL: str = "http://ollama:11434"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
