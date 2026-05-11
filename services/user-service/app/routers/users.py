import json, logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, Any

router = APIRouter()
logger = logging.getLogger(__name__)


class UserUpdateRequest(BaseModel):
    value: dict[str, Any]


class PermissionAssignRequest(BaseModel):
    role: str
    screen_name: str
    can_create: bool = False
    can_read: bool = True
    can_update: bool = False
    can_delete: bool = False
    assigned_by: int


class FileRestrictionRequest(BaseModel):
    role: str
    extensions: list[str]
    by_user_id: int


async def get_pool(request: Request):
    return request.app.state.db_pool

async def get_publisher(request: Request):
    return request.app.state.rabbitmq


# ─── User CRUD ────────────────────────────────────────────────

@router.get("/")
async def list_users(role: Optional[str] = None, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        if role:
            rows = await conn.fetch("SELECT id, role, email, is_active, value FROM users WHERE role=$1 ORDER BY id", role)
        else:
            rows = await conn.fetch("SELECT id, role, email, is_active, value FROM users ORDER BY id")
    return [{"id": r["id"], "role": r["role"], "email": r["email"], "is_active": r["is_active"], "value": json.loads(r["value"])} for r in rows]


@router.get("/{user_id}")
async def get_user(user_id: int, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, role, email, is_active, value FROM users WHERE id=$1", user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": row["id"], "role": row["role"], "email": row["email"], "is_active": row["is_active"], "value": json.loads(row["value"])}


@router.patch("/{user_id}")
async def update_user(user_id: int, body: UserUpdateRequest, request: Request, pool=Depends(get_pool), publisher=Depends(get_publisher)):
    async with pool.acquire() as conn:
        old = await conn.fetchrow("SELECT value FROM users WHERE id=$1", user_id)
        if not old:
            raise HTTPException(status_code=404, detail="User not found")
        merged = {**json.loads(old["value"]), **body.value}
        await conn.execute("UPDATE users SET value=$1::jsonb WHERE id=$2", json.dumps(merged), user_id)

    await publisher.publish("user.updated", {
        "event": "user.updated", "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(), "service": "user-service"
    })
    return {"message": "User updated", "user_id": user_id}


@router.delete("/{user_id}")
async def delete_user(user_id: int, pool=Depends(get_pool), publisher=Depends(get_publisher)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT role, email FROM users WHERE id=$1", user_id)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        await conn.execute("UPDATE users SET is_active=FALSE WHERE id=$1", user_id)

    await publisher.publish("user.deleted", {
        "event": "user.deleted", "user_id": user_id,
        "role": row["role"], "email": row["email"],
        "timestamp": datetime.now(timezone.utc).isoformat(), "service": "user-service"
    })
    return {"message": "User deactivated", "user_id": user_id}


# ─── Student-specific ─────────────────────────────────────────

@router.get("/students/search")
async def search_students(
    skills: Optional[str] = None,
    school_id: Optional[int] = None,
    min_gpa: Optional[float] = None,
    limit: int = 20,
    offset: int = 0,
    pool=Depends(get_pool),
):
    async with pool.acquire() as conn:
        skills_arr = skills.split(",") if skills else None
        rows = await conn.fetch(
            "SELECT * FROM fn_search_students($1, $2, $3, $4, $5)",
            skills_arr, school_id, min_gpa, limit, offset
        )
    return [dict(r) for r in rows]


# ─── Permission Management ─────────────────────────────────────

@router.post("/permissions/assign")
async def assign_screen(body: PermissionAssignRequest, pool=Depends(get_pool), publisher=Depends(get_publisher)):
    async with pool.acquire() as conn:
        await conn.execute(
            "CALL sp_assign_screen($1::user_role, $2, $3, $4, $5, $6, $7)",
            body.role, body.screen_name,
            body.can_create, body.can_read, body.can_update, body.can_delete,
            body.assigned_by
        )
    await publisher.publish("permission.changed", {
        "event": "permission.assigned", "role": body.role, "screen": body.screen_name,
        "assigned_by": body.assigned_by, "timestamp": datetime.now(timezone.utc).isoformat()
    }, exchange_name="educonnect.fanout")
    return {"message": f"Screen '{body.screen_name}' assigned to role '{body.role}'"}


@router.delete("/permissions/revoke")
async def revoke_screen(role: str, screen_name: str, by_user_id: int, pool=Depends(get_pool), publisher=Depends(get_publisher)):
    async with pool.acquire() as conn:
        await conn.execute("CALL sp_revoke_screen($1::user_role, $2, $3)", role, screen_name, by_user_id)
    await publisher.publish("permission.changed", {
        "event": "permission.revoked", "role": role, "screen": screen_name,
        "by_user_id": by_user_id, "timestamp": datetime.now(timezone.utc).isoformat()
    }, exchange_name="educonnect.fanout")
    return {"message": f"Screen '{screen_name}' revoked from role '{role}'"}


@router.post("/permissions/file-restrictions")
async def update_file_restrictions(body: FileRestrictionRequest, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        await conn.execute(
            "CALL sp_update_file_restrictions($1::user_role, $2, $3)",
            body.role, body.extensions, body.by_user_id
        )
    return {"message": f"File restrictions updated for role '{body.role}'"}


@router.get("/permissions/screens/{user_id}")
async def get_screens(user_id: int, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        result = await conn.fetchval("SELECT fn_get_user_screens($1)", user_id)
    import json
    return {"user_id": user_id, "screens": json.loads(result) if result else []}


@router.get("/supervisor/stats")
async def get_supervisor_stats(pool=Depends(get_pool)):
    """Supervisor için dinamik veritabanı istatistiklerini getirir"""
    async with pool.acquire() as conn:
        # 1. Stats Counters
        total_students = await conn.fetchval("SELECT COUNT(*) FROM users WHERE role='student' AND is_active=TRUE")
        total_businesses = await conn.fetchval("SELECT COUNT(*) FROM users WHERE role='business' AND is_active=TRUE")
        total_schools = await conn.fetchval("SELECT COUNT(*) FROM users WHERE role='school' AND is_active=TRUE")
        
        try:
            total_files = await conn.fetchval("SELECT COUNT(*) FROM files") or 0
        except Exception:
            total_files = 0

        # 2. Get monthly registration growth data for last 5 months
        try:
            growth_rows = await conn.fetch("""
                SELECT TO_CHAR(created_at, 'Month') AS month_name, 
                       role, 
                       COUNT(*) AS count,
                       EXTRACT(MONTH FROM created_at) as month_num
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '5 months' AND is_active=TRUE
                GROUP BY month_name, role, month_num
                ORDER BY month_num
            """)
        except Exception as e:
            logger.warning(f"Failed to fetch user growth data: {e}")
            growth_rows = []
        
        # Format growth data for chart
        months_dict = {}
        month_tr = {
            "January": "Ocak", "February": "Şubat", "March": "Mart", "April": "Nisan",
            "May": "Mayıs", "June": "Haziran", "July": "Temmuz", "August": "Ağustos",
            "September": "Eylül", "October": "Ekim", "November": "Kasım", "December": "Aralık"
        }
        
        for r in growth_rows:
            m_raw = r["month_name"].strip() if r["month_name"] else ""
            m_name = month_tr.get(m_raw, m_raw)
            if not m_name:
                continue
            if m_name not in months_dict:
                months_dict[m_name] = {"name": m_name, "student": 0, "business": 0, "school": 0}
            
            role = r["role"]
            if role in ["student", "business", "school"]:
                months_dict[m_name][role] = r["count"]
                
        growth_data = list(months_dict.values())
        if not growth_data:
            growth_data = [
                {"name": "Mayıs", "student": total_students or 0, "business": total_businesses or 0, "school": total_schools or 0}
            ]

        # 3. Get Recent System Activities from db users
        try:
            recent_users = await conn.fetch("""
                SELECT email, role, created_at 
                FROM users 
                ORDER BY id DESC 
                LIMIT 10
            """)
        except Exception as e:
            logger.warning(f"Failed to fetch recent users: {e}")
            recent_users = []
        
        activities = []
        for ru in recent_users:
            role_tr = "öğrenci" if ru["role"] == "student" else "işletme" if ru["role"] == "business" else "okul"
            created_dt = ru["created_at"]
            time_str = created_dt.strftime("%H:%M:%S") if created_dt else "Yeni"
            activities.append({
                "text": f"Yeni {role_tr} kaydı: {ru['email']}",
                "time": time_str,
                "type": f"user.{ru['role']}"
            })
            
    return {
        "counters": {
            "students": total_students or 0,
            "businesses": total_businesses or 0,
            "schools": total_schools or 0,
            "files": total_files
        },
        "growth": growth_data,
        "activities": activities
    }
