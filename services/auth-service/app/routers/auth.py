import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, status, Depends
from app.schemas.auth_schemas import (
    LoginRequest, RegisterRequest, TokenResponse,
    PermissionCheckRequest, UserScreensResponse
)
from app.utils.security import hash_password, verify_password, create_access_token, decode_token
from app.database import get_pg_pool, get_redis
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_publisher(request: Request):
    return request.app.state.rabbitmq


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request):
    pool = await get_pg_pool()
    publisher = await get_publisher(request)

    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, role, email, is_active FROM users WHERE email = $1", body.email
        )
        if not user or not user["is_active"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        cred = await conn.fetchrow(
            "SELECT value FROM credentials WHERE user_id = $1", user["id"]
        )
        if not cred:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        cred_value = json.loads(cred["value"])
        if not verify_password(body.password, cred_value["password_hash"]):
            # Increment failed attempts
            await conn.execute(
                """UPDATE credentials SET value = jsonb_set(value, '{login_attempts}',
                   ((value->>'login_attempts')::int + 1)::text::jsonb)
                   WHERE user_id = $1""",
                user["id"]
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Reset failed attempts & update last_login
        await conn.execute(
            """UPDATE credentials SET value = value ||
               '{"login_attempts": 0}'::jsonb ||
               jsonb_build_object('last_login', $1::text)
               WHERE user_id = $2""",
            datetime.now(timezone.utc).isoformat(), user["id"]
        )

    token = create_access_token({"sub": str(user["id"]), "role": user["role"], "email": user["email"]})

    # Cache session in Redis
    redis_client = await get_redis()
    await redis_client.setex(
        f"session:{user['id']}",
        settings.JWT_EXPIRE_MINUTES * 60,
        json.dumps({"user_id": user["id"], "role": user["role"], "email": user["email"]})
    )

    # Publish to RabbitMQ (log + notify)
    await publisher.publish(
        routing_key="auth.login",
        payload={
            "event": "user.login",
            "user_id": user["id"],
            "role": user["role"],
            "email": user["email"],
            "ip": request.client.host if request.client else "unknown",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": "auth-service",
        }
    )

    logger.info(f"User {user['email']} logged in successfully")
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        user_id=user["id"],
        role=user["role"],
        email=user["email"],
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request):
    pool = await get_pg_pool()
    publisher = await get_publisher(request)

    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await conn.fetchval("SELECT id FROM users WHERE email = $1", body.email)
            if existing:
                raise HTTPException(status_code=409, detail="Email already registered")

            user_value = json.dumps({"name": body.name, "surname": body.surname, "phone": body.phone or ""})
            user_id = await conn.fetchval(
                "INSERT INTO users(role, email, is_active, value) VALUES($1,$2,TRUE,$3::jsonb) RETURNING id",
                body.role, body.email, user_value
            )
            await conn.execute(
                """INSERT INTO credentials(user_id, value)
                   VALUES($1, jsonb_build_object('password_hash',$2::text,'login_attempts',0))""",
                user_id, hash_password(body.password)
            )

    await publisher.publish(
        routing_key="user.created",
        payload={
            "event": "user.created",
            "user_id": user_id,
            "role": body.role,
            "email": body.email,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": "auth-service",
        }
    )

    logger.info(f"New {body.role} registered: {body.email}")
    return {"message": "Registration successful", "user_id": user_id}


@router.post("/logout")
async def logout(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_token(token)
    if payload:
        redis_client = await get_redis()
        await redis_client.delete(f"session:{payload['sub']}")
    return {"message": "Logged out successfully"}


@router.post("/verify")
async def verify_token(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Check Redis session
    redis_client = await get_redis()
    session = await redis_client.get(f"session:{payload['sub']}")
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")

    return {"valid": True, "user_id": int(payload["sub"]), "role": payload["role"]}


@router.post("/check-permission")
async def check_permission(body: PermissionCheckRequest):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchval(
            "SELECT fn_check_permission($1, $2, $3)",
            body.user_id, body.screen, body.action
        )
    return {"allowed": bool(result)}


@router.get("/screens/{user_id}", response_model=UserScreensResponse)
async def get_user_screens(user_id: int):
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchval("SELECT fn_get_user_screens($1)", user_id)
    screens = json.loads(result) if result else []
    return UserScreensResponse(user_id=user_id, screens=screens)
