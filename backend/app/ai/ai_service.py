import json
import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.ai.providers.qwen_provider import QwenProvider
from app.ai.providers.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

import json
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.ai.providers.qwen_provider import QwenProvider
from app.ai.providers.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.provider = None
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
            self.provider = QwenProvider(
                api_key=settings.GROQ_API_KEY.strip(),
                model=settings.AI_MODEL,
                base_url=settings.AI_BASE_URL
            )
            logger.info(f"[AIService] Initialized Hosted Qwen provider with model {settings.AI_MODEL}")
        else:
            logger.info("[AIService] GROQ_API_KEY not set. AI provider is unconfigured.")

    async def generate_chat_messages(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        json_mode: bool = False
    ) -> Optional[str]:
        if not self.provider:
            return None
        try:
            if hasattr(self.provider, "generate_chat_completion"):
                return await self.provider.generate_chat_completion(
                    messages=messages,
                    system_prompt=system_prompt,
                    json_mode=json_mode
                )
            else:
                last_msg = messages[-1]["content"] if messages else ""
                return await self.provider.generate_completion(
                    prompt=last_msg,
                    system_prompt=system_prompt,
                    json_mode=json_mode
                )
        except Exception as e:
            logger.error(f"[AIService Error] Failed generate_chat_messages: {e}")
            raise e

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self.provider:
            return None
        try:
            raw_text = await self.provider.generate_completion(prompt, system_prompt=system_prompt, json_mode=True)
            return json.loads(raw_text)
        except Exception as e:
            logger.warning(f"[AIService] Failed to generate JSON from provider: {e}")
            raise e

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        if not self.provider:
            return None
        try:
            return await self.provider.generate_completion(prompt, system_prompt=system_prompt, json_mode=False)
        except Exception as e:
            logger.warning(f"[AIService] Failed to generate text from provider: {e}")
            raise e

    async def get_ai_status(self) -> Dict[str, Any]:
        if not self.provider:
            return {
                "status": "unavailable",
                "model": settings.AI_MODEL,
                "error": "GROQ_API_KEY is not configured in .env"
            }

        if hasattr(self.provider, "check_connection"):
            return await self.provider.check_connection()

        return {
            "status": "configured",
            "model": settings.AI_MODEL,
            "provider": "Qwen"
        }

