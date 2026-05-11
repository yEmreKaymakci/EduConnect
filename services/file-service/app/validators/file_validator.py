ALLOWED_EXTENSIONS = {"txt", "png", "jpg", "jpeg", "pdf", "docx", "xlsx"}
MAX_FILE_SIZE_MB = 50

MIME_MAP = {
    "txt":  "text/plain",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def validate_file(filename: str, content: bytes, allowed: set[str]) -> tuple[bool, str]:
    ext = get_extension(filename)
    if not ext:
        return False, "File has no extension"
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Extension '.{ext}' not supported by the system"
    if ext not in allowed:
        return False, f"Extension '.{ext}' not allowed for your role"
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return False, f"File too large: {size_mb:.1f}MB (max {MAX_FILE_SIZE_MB}MB)"
    return True, "ok"
