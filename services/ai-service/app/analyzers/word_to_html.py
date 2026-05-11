import io
import logging
from docx import Document
import google.generativeai as genai

logger = logging.getLogger(__name__)


def _docx_to_text(file_bytes: bytes) -> str:
    """Word dosyasını düz metin olarak okur"""
    doc = Document(io.BytesIO(file_bytes))
    sections = []
    for para in doc.paragraphs:
        if para.text.strip():
            style = para.style.name
            text = para.text.strip()
            sections.append({"style": style, "text": text})
    return sections


async def convert_word_to_html(file_bytes: bytes, api_key: str) -> dict:
    """
    Word dosyasını GrapesJS ile düzenlenebilir HTML'e dönüştürür.
    Gemini API kullanarak yapısal dönüşüm yapar.
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-pro")

    # Parse Word document
    sections = _docx_to_text(file_bytes)
    content_text = "\n".join([f"[{s['style']}] {s['text']}" for s in sections])

    prompt = f"""Aşağıdaki Word belgesi içeriğini modern, responsive bir HTML sayfasına dönüştür.

İçerik:
{content_text}

Kurallar:
1. Tam bir HTML belgesi oluştur (DOCTYPE, head, body dahil)
2. TailwindCSS CDN kullan (https://cdn.tailwindcss.com)
3. Başlıklar için h1/h2/h3 kullan (Word stillerine göre)
4. Modern, okunabilir bir tasarım yap
5. GrapesJS ile düzenlenebilir olacak şekilde data-gjs-type attribute'ları ekle
6. Sadece HTML kodunu döndür, açıklama yazma

HTML:"""

    try:
        response = model.generate_content(prompt)
        html = response.text.strip()
        # Clean markdown code fences if present
        if html.startswith("```html"):
            html = html[7:]
        if html.startswith("```"):
            html = html[3:]
        if html.endswith("```"):
            html = html[:-3]
        html = html.strip()

        logger.info(f"[Word→HTML] Converted {len(sections)} paragraphs to HTML")
        return {
            "type": "word_to_html",
            "success": True,
            "html": html,
            "paragraph_count": len(sections),
            "message": "HTML dönüşümü başarılı. GrapesJS ile düzenleyebilirsiniz."
        }
    except Exception as e:
        logger.error(f"[Word→HTML] Conversion failed: {e}")
        return {"type": "word_to_html", "success": False, "error": str(e)}
