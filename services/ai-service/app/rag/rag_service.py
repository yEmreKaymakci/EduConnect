import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class RAGService:
    """
    Basit RAG implementasyonu - Gemini ile CV/Proje analizi ve arama.
    REST API üzerinden doğrudan iletişim kurar, böylece bağımlılık ve gRPC problemleri önlenir.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def _call_gemini_api(self, prompt: str, pdf_bytes: bytes = None) -> str:
        """Gemini REST API'sini doğrudan çağırır"""
        import urllib.request
        import json
        import base64

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        
        parts = []
        if pdf_bytes:
            parts.append({
                "inlineData": {
                    "mimeType": "application/pdf",
                    "data": base64.b64encode(pdf_bytes).decode("utf-8")
                }
            })
        parts.append({"text": prompt})
        
        payload = {
            "contents": [{
                "parts": parts
            }]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return text
        except Exception as e:
            if hasattr(e, "read"):
                try:
                    err_body = e.read().decode("utf-8")
                    logger.error(f"Gemini REST API Error details: {err_body}")
                except:
                    pass
            raise e

    async def analyze_cv(self, cv_text: str) -> dict:
        """CV metnini analiz eder, beceri ve bilgileri çıkarır"""
        import asyncio
        prompt = f"""Aşağıdaki CV metnini analiz et ve JSON formatında çıkar:

CV:
{cv_text[:4000]}

Şu alanları JSON olarak döndür:
{{
  "name": "...",
  "skills": ["..."],
  "languages": ["..."],
  "education": [{{"degree": "...", "school": "...", "year": "..."}}],
  "experience": [{{"title": "...", "company": "...", "duration": "..."}}],
  "projects": [{{"name": "...", "description": "...", "technologies": ["..."]}}],
  "summary": "Kısa profesyonel özet",
  "improvements": ["Global standartlar, ATS uyumluluğu, biçimlendirme ve içerik için Türkçe somut iyileştirme önerisi 1", "iyileştirme önerisi 2..."]
}}

Sadece JSON döndür."""

        try:
            text = await asyncio.to_thread(self._call_gemini_api, prompt)
            import json, re
            text = text.strip()
            # Extract JSON
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return {"success": True, "data": json.loads(match.group())}
            return {"success": False, "error": "JSON parse failed", "raw": text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def analyze_cv_file(self, content: bytes, ext: str) -> dict:
        """CV dosyasını analiz eder, formatına göre (pdf, docx, txt) işler"""
        import json, re
        import asyncio

        prompt = """Aşağıdaki CV içeriğini analiz et ve verilen JSON formatında çıkar. 
Tüm bilgileri Türkçe'ye çevirerek veya Türkçe olarak çıkar:

Şu alanları tam olarak bu JSON şemasında döndür:
{
  "name": "Ad Soyad",
  "skills": ["Yetenek 1", "Yetenek 2"],
  "languages": ["Dil 1", "Dil 2"],
  "education": [{"degree": "Derece/Bölüm", "school": "Okul Adı", "year": "Mezuniyet Yılı/Aralığı"}],
  "experience": [{"title": "Pozisyon", "company": "Şirket Adı", "duration": "Çalışma Süresi"}],
  "projects": [{"name": "Proje Adı", "description": "Açıklama", "technologies": ["Teknoloji 1"]}],
  "summary": "Kısa profesyonel özet",
  "improvements": ["Global standartlar, ATS uyumluluğu, biçimlendirme ve içerik kalitesi için Türkçe somut iyileştirme önerisi 1", "iyileştirme önerisi 2..."]
}

Yalnızca geçerli bir JSON objesi döndür, markdown kod blokları (```json ... ```) veya ek açıklama içermesin."""

        try:
            if ext == "pdf":
                try:
                    from pypdf import PdfReader
                    import io
                    reader = PdfReader(io.BytesIO(content))
                    text = ""
                    for page in reader.pages:
                        text += page.extract_text() or ""
                    text_resp = await asyncio.to_thread(self._call_gemini_api, f"{prompt}\n\nCV İçeriği:\n{text[:8000]}")
                except Exception as pdf_err:
                    logger.warning(f"pypdf extraction failed, falling back to raw payload: {pdf_err}")
                    text_resp = await asyncio.to_thread(self._call_gemini_api, prompt, content)
            elif ext == "docx":
                from docx import Document
                import io
                doc = Document(io.BytesIO(content))
                text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
                text_resp = await asyncio.to_thread(self._call_gemini_api, f"{prompt}\n\nCV İçeriği:\n{text[:6000]}")
            else: # txt or fallback
                text = content.decode("utf-8", errors="ignore")
                text_resp = await asyncio.to_thread(self._call_gemini_api, f"{prompt}\n\nCV İçeriği:\n{text[:6000]}")

            text_resp = text_resp.strip()
            # Clean markdown code fences if present
            if text_resp.startswith("```json"):
                text_resp = text_resp[7:]
            elif text_resp.startswith("```"):
                text_resp = text_resp[3:]
            if text_resp.endswith("```"):
                text_resp = text_resp[:-3]
            text_resp = text_resp.strip()

            # Find JSON block if there are extra characters
            match = re.search(r'\{.*\}', text_resp, re.DOTALL)
            if match:
                return {"success": True, "data": json.loads(match.group())}
            return {"success": True, "data": json.loads(text_resp)}
        except Exception as e:
            logger.error(f"[RAG] CV Analysis failed: {e}")
            return {"success": False, "error": str(e)}

    async def search_students(self, query: str, student_profiles: list[dict]) -> list[dict]:
        """Doğal dil sorgusu ile öğrenci profili eşleştirme"""
        import asyncio
        profiles_text = "\n".join([
            f"ID:{p.get('id')} | {p.get('name','')} | Skills: {p.get('skills',[])} | GPA: {p.get('gpa','')}"
            for p in student_profiles[:50]
        ])

        prompt = f"""Arama sorgusu: "{query}"

Öğrenci profilleri:
{profiles_text}

Sorguyla en uyumlu 10 öğrenciyi ID'leriyle listele. Format: {{"matches": [ID1, ID2, ...]}}"""

        try:
            text = await asyncio.to_thread(self._call_gemini_api, prompt)
            import json, re
            text = text.strip()
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                result = json.loads(match.group())
                matched_ids = set(result.get("matches", []))
                return [p for p in student_profiles if p.get("id") in matched_ids]
            return []
        except Exception as e:
            logger.error(f"[RAG] Search failed: {e}")
            return []

    async def chat(self, message: str, context: str = "") -> str:
        """MCP tarzı kontekst-aware sohbet"""
        import asyncio
        prompt = f"""{f'Bağlam: {context}\n\n' if context else ''}Kullanıcı: {message}

Sen EduConnect platformunun AI asistanısın. Öğrencilere CV hazırlamada, staj başvurularında,
işletmelere stajyer bulmada yardımcı olursun. Türkçe yanıt ver."""

        text = await asyncio.to_thread(self._call_gemini_api, prompt)
        return text
