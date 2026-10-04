import pytest
from app.services.repository_service import RepositoryService
from app.services.demo_data import DEMO_REPOSITORIES
from app.core.config import settings

@pytest.mark.asyncio
async def test_demo_mode_returns_at_least_10_repos(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    assert len(DEMO_REPOSITORIES) >= 10
    
    svc = RepositoryService()
    results = await svc.search_and_recommend(
        skills=["Python", "AI/ML"],
        interests=["AI/ML"],
        experience="Beginner"
    )
    
    assert len(results) >= 10
    assert all("match_score" in r for r in results)
    assert all("full_name" in r for r in results)
    assert all("default_branch" in r for r in results)
    
    # Verify uniqueness
    full_names = [r["full_name"] for r in results]
    assert len(full_names) == len(set(full_names))
    
    # Verify sorted descending by match_score
    scores = [r["match_score"] for r in results]
    assert scores == sorted(scores, reverse=True)

@pytest.mark.asyncio
async def test_multi_query_deduplication(monkeypatch):
    svc = RepositoryService()
    
    async def mock_search(query: str, sort: str = "stars", per_page: int = 30, page: int = 1):
        if "good-first-issues" in query:
            return [
                {"full_name": "repo/one", "name": "one", "language": "Python", "stargazers_count": 100},
                {"full_name": "repo/two", "name": "two", "language": "Python", "stargazers_count": 200}
            ]
        else:
            return [
                {"full_name": "repo/two", "name": "two", "language": "Python", "stargazers_count": 200},
                {"full_name": "repo/three", "name": "three", "language": "Python", "stargazers_count": 300}
            ]

    monkeypatch.setattr(svc.github, "search_repositories", mock_search)
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    results = await svc.search_and_recommend(
        skills=["Python"],
        interests=["AI/ML"]
    )

    # 3 unique repos (repo/one, repo/two, repo/three) after deduplication
    assert len(results) >= 3
    full_names = [r["full_name"] for r in results]
    assert len(full_names) == len(set(full_names))
    # Scores sorted descending
    scores = [r["match_score"] for r in results]
    assert scores == sorted(scores, reverse=True)

@pytest.mark.asyncio
async def test_api_failure_or_rate_limit_fallback(monkeypatch):
    svc = RepositoryService()
    
    async def mock_search_fail(query: str, sort: str = "stars", per_page: int = 30, page: int = 1):
        raise Exception("GitHub API rate limit exceeded (403)")

    monkeypatch.setattr(svc.github, "search_repositories", mock_search_fail)
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    results = await svc.search_and_recommend(
        skills=["Python"],
        interests=["AI/ML"]
    )

    # Should fall back to demo dataset cleanly without crashing
    assert len(results) >= 10
    assert all("full_name" in r for r in results)

