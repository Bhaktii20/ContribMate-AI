import pytest
from unittest.mock import AsyncMock, patch
from app.ai.ai_service import AIService
from app.services.chat_service import ChatService
from app.services.contribution_service import ContributionService
from app.core.config import settings
from app.rag.vector_store import vector_store

@pytest.mark.asyncio
async def test_ai_service_provider_detection():
    ai = AIService()
    status = await ai.get_ai_status()
    assert "status text" in status or "status" in status or "model" in status
    assert status["model"] == settings.AI_MODEL

@pytest.mark.asyncio
async def test_chat_service_demo_mode_fallback():
    with patch("app.core.config.settings.DEMO_MODE", True):
        chat_svc = ChatService()
        res = await chat_svc.chat(
            owner="fastapi",
            repo="fastapi",
            user_message="What does this repo do?"
        )
        assert res["error"] is False
        assert "reply" in res
        assert len(res["sources"]) > 0
        assert res["sources"][0]["file_path"] == "README.md"

@pytest.mark.asyncio
async def test_chat_service_real_mode_unconfigured_error():
    with patch("app.core.config.settings.DEMO_MODE", False):
        with patch.object(AIService, "generate_chat_messages", side_effect=Exception("API Key missing")):
            chat_svc = ChatService()
            res = await chat_svc.chat(
                owner="fastapi",
                repo="fastapi",
                user_message="How do I run tests?"
            )
            assert res["error"] is True
            assert "AI model is currently unavailable" in res["reply"]
            # Ensure no fake response returned in real mode!
            assert "I analyzed" not in res["reply"]

@pytest.mark.asyncio
async def test_chat_service_conversation_history():
    with patch("app.core.config.settings.DEMO_MODE", True):
        chat_svc = ChatService()
        history = [
            {"role": "user", "content": "Explain issue #142"},
            {"role": "assistant", "content": "Issue #142 is about routing exceptions."}
        ]
        res = await chat_svc.chat(
            owner="fastapi",
            repo="fastapi",
            user_message="Which file is related to it?",
            history=history
        )
        assert res["error"] is False
        assert "reply" in res

@pytest.mark.asyncio
async def test_contribution_guide_generation():
    svc = ContributionService()
    guide = await svc.generate_contribution_guide("fastapi", "fastapi")
    assert "readme" in guide or "guide_content" in guide
    assert "error" in guide

@pytest.mark.asyncio
async def test_contribution_plan_tree_verification():
    with patch("app.core.config.settings.DEMO_MODE", True):
        svc = ContributionService()
        plan = await svc.generate_plan("fastapi", "fastapi", issue_number=1)
        assert plan["repo_full_name"] == "fastapi/fastapi"
        assert plan["issue_number"] == 1
        assert len(plan["files_involved"]) > 0
        # Verify file verification statuses exist
        statuses = [f["status"] for f in plan["files_involved"]]
        assert any(s in ["VERIFIED", "LIKELY"] for s in statuses)

@pytest.mark.asyncio
async def test_rag_context_integration():
    repo = "test_owner/test_repo"
    chunks = [
        {"chunk_id": "c1", "repo_full_name": repo, "file_path": "core/router.py", "content": "class Router: pass"}
    ]
    vector_store.index_chunks(repo, chunks)
    results = vector_store.search(repo, "Router class")
    assert len(results) > 0
    assert results[0]["file_path"] == "core/router.py"
