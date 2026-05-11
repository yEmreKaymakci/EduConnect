from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SERVICE_PORT: int = 8001
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    REDIS_PASSWORD: str

    RABBITMQ_USER: str
    RABBITMQ_PASSWORD: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    @property
    def DATABASE_URL(self) -> str:
        # URL-encode the password to handle special chars like @ safely
        from urllib.parse import quote_plus
        pw = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql://{self.POSTGRES_USER}:{pw}@postgres:5432/{self.POSTGRES_DB}?sslmode=disable"

    # Explicit connection kwargs (for asyncpg which doesn't parse DSN well with special chars)
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
    def REDIS_URL(self) -> str:
        return f"redis://:{self.REDIS_PASSWORD}@redis:6379/0"

    @property
    def RABBITMQ_URL(self) -> str:
        from urllib.parse import quote_plus
        pw = quote_plus(self.RABBITMQ_PASSWORD)
        return f"amqp://{self.RABBITMQ_USER}:{pw}@rabbitmq:5672/"

settings = Settings()
