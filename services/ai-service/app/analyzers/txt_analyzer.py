import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)


def get_gemini_model(api_key: str, model_name: str = "gemini-1.5-pro"):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


async def analyze_txt_prompts(content: str, api_key: str) -> dict:
    """
    TXT dosyasındaki YZ komutlarını işler.
    Format: Her satır bir prompt komutudur.
    Özel komutlar: #SYSTEM: , #USER: , veya düz metin
    """
    model = get_gemini_model(api_key)
    lines = [l.strip() for l in content.splitlines() if l.strip()]

    results = []
    for i, line in enumerate(lines):
        if line.startswith("#SKIP") or line.startswith("//"):
            continue
        try:
            response = model.generate_content(line)
            results.append({
                "line": i + 1,
                "prompt": line[:200],
                "response": response.text,
                "status": "success"
            })
            logger.info(f"[TXT Analyzer] Line {i+1} processed")
        except Exception as e:
            results.append({
                "line": i + 1,
                "prompt": line[:200],
                "response": None,
                "error": str(e),
                "status": "error"
            })

    return {
        "type": "txt_prompt_analysis",
        "total_prompts": len(lines),
        "processed": len(results),
        "results": results
    }
