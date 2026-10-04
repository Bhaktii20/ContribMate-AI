from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_repo_search():
    payload = {
        "skills": ["Python"],
        "interests": ["AI/ML"],
        "experience": "Beginner"
    }
    res = client.post("/api/repositories/search", json=payload)
    assert res.status_code == 200
    repos = res.json()
    assert len(repos) > 0
    assert "match_score" in repos[0]
