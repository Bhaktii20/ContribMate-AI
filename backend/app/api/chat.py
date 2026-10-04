from fastapi import APIRouter
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/repositories/{owner}/{repo}/chat", response_model=ChatResponse)
async def repo_chat(owner: str, repo: str, req: ChatRequest):
    response = await chat_service.chat(
        owner=owner,
        repo=repo,
        user_message=req.message,
        selected_issue_number=req.selected_issue_number,
        history=req.history
    )
    return response
