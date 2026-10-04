from app.services.scoring_service import ScoringService

def test_score_repository():
    repo = {
        "full_name": "fastapi/fastapi",
        "language": "Python",
        "description": "FastAPI framework python web",
        "open_issues_count": 50,
        "stargazers_count": 5000,
        "topics": ["python", "web"]
    }
    score, reasons = ScoringService.score_repository(
        repo=repo,
        user_skills=["Python"],
        user_interests=["Web"],
        user_experience="Beginner"
    )
    assert score > 70
    assert any("Python" in r for r in reasons)

def test_score_issue():
    issue = {
        "title": "Fix typo in documentation",
        "body": "Typo in line 12",
        "labels": [{"name": "good first issue"}, {"name": "documentation"}]
    }
    score, difficulty, reasons = ScoringService.score_issue(
        issue=issue,
        user_skills=["Python"],
        user_experience="Beginner"
    )
    assert difficulty == "Beginner"
    assert score >= 90
