import json, uuid, aiofiles, logging
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from fastapi.responses import FileResponse
from app.validators.file_validator import validate_file, get_extension

router = APIRouter()
logger = logging.getLogger(__name__)
UPLOAD_DIR = Path("/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def get_pool(request: Request):
    return request.app.state.db_pool

async def get_publisher(request: Request):
    return request.app.state.rabbitmq


@router.post("/upload")
async def upload_file(
    request: Request,
    user_id: int,
    file: UploadFile = File(...),
    pool=Depends(get_pool),
    publisher=Depends(get_publisher),
):
    content = await file.read()

    # Get allowed types from DB function
    async with pool.acquire() as conn:
        allowed_json = await conn.fetchval("SELECT fn_get_allowed_file_types($1)", user_id)
        allowed = set(json.loads(allowed_json)) if allowed_json else set()

    ok, msg = validate_file(file.filename or "", content, allowed)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    ext = get_extension(file.filename or "")
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / stored_name

    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    async with pool.acquire() as conn:
        file_value = json.dumps({
            "original_name": file.filename,
            "stored_name": stored_name,
            "path": str(dest),
            "extension": ext,
            "size_bytes": len(content),
            "mime_type": file.content_type,
            "ai_analyzed": False,
        })
        file_id = await conn.fetchval(
            "INSERT INTO files(user_id, status, value) VALUES($1,'uploaded',$2::jsonb) RETURNING id",
            user_id, file_value
        )

    await publisher.publish(
        routing_key="file.uploaded",
        payload={
            "event": "file.uploaded",
            "file_id": file_id,
            "user_id": user_id,
            "extension": ext,
            "stored_name": stored_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": "file-service",
        }
    )

    logger.info(f"File uploaded: {stored_name} by user {user_id}")
    return {"file_id": file_id, "stored_name": stored_name, "extension": ext, "size_bytes": len(content)}


@router.get("/{file_id}")
async def get_file_info(file_id: int, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, status, value FROM files WHERE id = $1", file_id)
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    return {"file_id": row["id"], "status": row["status"], "info": json.loads(row["value"])}


@router.delete("/{file_id}")
async def delete_file(file_id: int, user_id: int, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT user_id, value FROM files WHERE id = $1", file_id
        )
    if not row or row["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    value = json.loads(row["value"])
    path = Path(value.get("path", ""))
    if path.exists():
        path.unlink()

    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM files WHERE id = $1", file_id)

    return {"message": "File deleted"}
