from fastapi import APIRouter
from app.core.config import settings
from app.ai.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.get("/health")
async def health_check():
    ai_status = await ai_service.get_ai_status()
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "ai_model": settings.AI_MODEL,
        "ai_configured": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "ai_status": ai_status.get("status", "unavailable")
    }

@router.get("/health/ai-status")
async def ai_status_check():
    return await ai_service.get_ai_status()

