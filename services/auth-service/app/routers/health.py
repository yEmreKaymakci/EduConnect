from fastapi import APIRouter
import asyncpg
from app.database import get_pg_pool

router = APIRouter()


@router.get("/")
async def health_check():
    try:
        pool = await get_pg_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "service": "auth-service",
        "status": "running",
        "database": db_status,
        "version": "1.0.0"
    }
