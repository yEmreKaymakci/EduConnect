import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, health
from app.database import get_pg_pool, close_pg_pool, get_redis, close_redis
from app.rabbitmq.publisher import RabbitMQPublisher
from app.config import settings

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Auth Service starting up...")
    await get_pg_pool()
    await get_redis()
    app.state.rabbitmq = await RabbitMQPublisher.create()
    logger.info("✅ Auth Service ready — PostgreSQL, Redis, RabbitMQ connected")
    yield
    logger.info("🛑 Auth Service shutting down...")
    await close_pg_pool()
    await close_redis()
    await app.state.rabbitmq.close()


app = FastAPI(
    title="EduConnect — Auth Service",
    description="Kimlik doğrulama, yetkilendirme ve izin yönetimi",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,   prefix="/api/v1/auth",   tags=["Authentication"])
app.include_router(health.router, prefix="/health",         tags=["Health"])
