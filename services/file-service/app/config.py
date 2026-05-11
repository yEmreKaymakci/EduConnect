"""
Shared settings for file-service — reads from environment / .env
"""
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    RABBITMQ_USER: str
    RABBITMQ_PASSWORD: str
    UPLOAD_DIR: str = "/uploads"

    @property
    def DB_KWARGS(self) -> dict:
        return {
            "host": "postgres",
            "port": 5432,
            "database": self.POSTGRES_DB,
            "user": self.POSTGRES_USER,
            "password": self.POSTGRES_PASSWORD,
            "ssl": False,
        }

    @property
    def RABBITMQ_URL(self) -> str:
        pw = quote_plus(self.RABBITMQ_PASSWORD)
        return f"amqp://{self.RABBITMQ_USER}:{pw}@rabbitmq:5672/"


settings = Settings()
