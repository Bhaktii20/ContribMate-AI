from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_completion(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        pass
