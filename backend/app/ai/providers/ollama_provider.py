import httpx
import logging
from typing import Optional
from app.ai.providers.base_provider import BaseAIProvider

logger = logging.getLogger(__name__)

class OllamaProvider(BaseAIProvider):
    def __init__(self, model: str = "qwen2.5-coder:7b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")

    async def generate_completion(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        url = f"{self.base_url}/api/chat"
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.2}
        }
        if json_mode:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("message", {}).get("content", "")
                else:
                    logger.error(f"[OllamaProvider] Error {res.status_code}: {res.text}")
                    raise Exception(f"Ollama error {res.status_code}")
        except Exception as e:
            logger.error(f"[OllamaProvider Error] {e}")
            raise e
