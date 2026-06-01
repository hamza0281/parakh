from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str
    gemini_api_key: str
    hf_api_key: str
    redis_url: str = "redis://localhost:6379"
    cors_origins: str = "http://localhost:3000"
    rate_limit_per_min: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
