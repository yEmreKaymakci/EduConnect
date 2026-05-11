import json, logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
from app.analyzers.txt_analyzer import analyze_txt_prompts
from app.analyzers.word_to_html import convert_word_to_html
from app.rag.rag_service import RAGService

router = APIRouter()
logger = logging.getLogger(__name__)


def get_settings(request: Request):
    return request.app.state.settings


class ChatRequest(BaseModel):
    message: str
    context: str = ""
    user_id: int = 0


class CVAnalyzeRequest(BaseModel):
    cv_text: str


@router.post("/analyze-file")
async def analyze_file(request: Request, file: UploadFile = File(...)):
    settings = get_settings(request)
    content = await file.read()
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail=f"AI analiz için desteklenmeyen dosya tipi: {ext}")

    rag = RAGService(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
    result = await rag.analyze_cv_file(content, ext)
    return result


@router.post("/analyze-file-by-id/{file_id}")
async def analyze_file_by_id(file_id: int, request: Request):
    """Önceden yüklenmiş bir dosyayı dosya ID'siyle analiz eder"""
    import time
    pool = request.app.state.db_pool
    settings = get_settings(request)

    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT user_id, value FROM files WHERE id = $1", file_id)
    if not row:
        raise HTTPException(status_code=404, detail="File not found")

    user_id = row["user_id"]
    value = json.loads(row["value"])
    path = Path(value.get("path", ""))
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    content = path.read_bytes()
    ext = value.get("extension", "").lower()

    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail=f"AI analiz için desteklenmeyen dosya tipi: {ext}")

    rag = RAGService(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
    analysis_res = await rag.analyze_cv_file(content, ext)

    if not analysis_res.get("success"):
        raise HTTPException(status_code=500, detail=f"AI Analiz Hatası: {analysis_res.get('error')}")

    cv_data = analysis_res.get("data", {})

    # Update file record with AI result
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE files SET status='analyzed', value = value || $1::jsonb WHERE id = $2",
            json.dumps({"ai_analyzed": True, "ai_result": cv_data}), file_id
        )

        # Retrieve and auto-populate student record
        student_row = await conn.fetchrow("SELECT id, value FROM students WHERE user_id = $1", user_id)
        if student_row:
            student_id = student_row["id"]
            student_value = json.loads(student_row["value"]) if student_row["value"] else {}

            student_value["cv_url"] = f"/api/v1/files/download/{file_id}"

            # Safely merge skills
            if not student_value.get("skills"):
                student_value["skills"] = cv_data.get("skills", [])
            # Safely merge languages
            if not student_value.get("languages"):
                student_value["languages"] = cv_data.get("languages", [])
            # Safely set bio
            if not student_value.get("bio"):
                student_value["bio"] = cv_data.get("summary", "")

            # Safely map and merge projects
            if not student_value.get("projects"):
                projects_mapped = []
                current_time = int(time.time() * 1000)
                for idx, p in enumerate(cv_data.get("projects", [])):
                    techs = ", ".join(p.get("technologies", [])) if isinstance(p.get("technologies"), list) else ""
                    projects_mapped.append({
                        "id": current_time + idx,
                        "title": p.get("name", "Proje"),
                        "description": p.get("description", ""),
                        "tech": techs
                    })
                student_value["projects"] = projects_mapped

            await conn.execute(
                "UPDATE students SET value = $1::jsonb, updated_at = NOW() WHERE id = $2",
                json.dumps(student_value), student_id
            )

    return cv_data


@router.post("/chat")
async def ai_chat(body: ChatRequest, request: Request):
    settings = get_settings(request)
    rag = RAGService(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
    response = await rag.chat(body.message, body.context)
    return {"response": response, "model": settings.GEMINI_MODEL}


@router.post("/analyze-cv")
async def analyze_cv(body: CVAnalyzeRequest, request: Request):
    settings = get_settings(request)
    rag = RAGService(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
    result = await rag.analyze_cv(body.cv_text)
    return result


@router.post("/search-students")
async def search_students(request: Request, query: str, user_id: int):
    settings = get_settings(request)
    pool = request.app.state.db_pool
    rag = RAGService(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT st.id, u.value as user_val, st.value as student_val FROM students st JOIN users u ON u.id=st.user_id WHERE u.is_active=TRUE LIMIT 50"
        )

    profiles = []
    for row in rows:
        uv = json.loads(row["user_val"])
        sv = json.loads(row["student_val"])
        profiles.append({
            "id": row["id"],
            "name": f"{uv.get('name','')} {uv.get('surname','')}",
            "skills": sv.get("skills", []),
            "gpa": sv.get("gpa"),
            "department": sv.get("department", ""),
        })

    matches = await rag.search_students(query, profiles)
    return {"query": query, "matches": matches, "total": len(matches)}
