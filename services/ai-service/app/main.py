import logging, sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.routers import ai

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    RABBITMQ_USER: str
    RABBITMQ_PASSWORD: str
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-pro"

    @property
    def DB_KWARGS(self) -> dict:
        return {
            "host": "postgres", "port": 5432,
            "database": self.POSTGRES_DB,
            "user": self.POSTGRES_USER,
            "password": self.POSTGRES_PASSWORD,
            "ssl": False,
        }

settings = Settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AI Service starting...")
    app.state.db_pool = await asyncpg.create_pool(**settings.DB_KWARGS, min_size=2, max_size=6)
    app.state.settings = settings
    logger.info("✅ AI Service ready — Gemini model: " + settings.GEMINI_MODEL)
    yield
    await app.state.db_pool.close()

app = FastAPI(title="EduConnect — AI Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])

@app.get("/health")
async def health():
    return {"service": "ai-service", "status": "running", "model": settings.GEMINI_MODEL}

