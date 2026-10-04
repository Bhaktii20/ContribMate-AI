import httpx
import logging
from typing import Optional, List, Dict, Any
from app.ai.providers.base_provider import BaseAIProvider

logger = logging.getLogger(__name__)

class QwenProvider(BaseAIProvider):
    def __init__(self, api_key: str, model: str = "qwen-2.5-coder-32b", base_url: str = "https://api.groq.com/openai/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        json_mode: bool = False
    ) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})

        # Add conversation history / user messages
        full_messages.extend(messages)

        payload = {
            "model": self.model,
            "messages": full_messages,
            "temperature": 0.2,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.error(f"[QwenProvider] API call failed ({res.status_code}): {res.text}")
                    raise Exception(f"AI Provider returned error HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.error(f"[QwenProvider Error] {e}")
            raise e

    async def generate_completion(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        return await self.generate_chat_completion(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=system_prompt,
            json_mode=json_mode
        )

    async def check_connection(self) -> Dict[str, Any]:
        try:
            test_reply = await self.generate_completion(prompt="Hello", system_prompt="Respond with OK only.")
            return {"status": "connected", "model": self.model, "details": "Model inference verified"}
        except Exception as e:
            return {"status": "unavailable", "model": self.model, "error": str(e)}

