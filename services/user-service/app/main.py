import logging, sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.rabbitmq.publisher import RabbitMQPublisher
from app.routers import users

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    RABBITMQ_USER: str
    RABBITMQ_PASSWORD: str

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
    def RABBITMQ_URL(self):
        from urllib.parse import quote_plus
        pw = quote_plus(self.RABBITMQ_PASSWORD)
        return f"amqp://{self.RABBITMQ_USER}:{pw}@rabbitmq:5672/"

settings = Settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 User Service starting up...")
    app.state.db_pool = await asyncpg.create_pool(**settings.DB_KWARGS, min_size=2, max_size=10)
    app.state.rabbitmq = await RabbitMQPublisher.create()
    logger.info("✅ User Service ready")
    yield
    await app.state.db_pool.close()
    await app.state.rabbitmq.close()

app = FastAPI(title="EduConnect — User Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

@app.get("/health")
async def health():
    return {"service": "user-service", "status": "running"}

