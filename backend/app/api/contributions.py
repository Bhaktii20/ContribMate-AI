from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

@router.get("/contributions")
def get_user_contributions():
    # Returns recent workspace & analyzed repos for saved state
    return {
        "analyzed_repositories": [
            {
                "full_name": "fastapi/fastapi",
                "owner": "fastapi",
                "name": "fastapi",
                "last_analyzed": "2026-10-03",
                "open_issues": 120,
                "saved_issues_count": 2
            },
            {
                "full_name": "scikit-learn/scikit-learn",
                "owner": "scikit-learn",
                "name": "scikit-learn",
                "last_analyzed": "2026-10-02",
                "open_issues": 850,
                "saved_issues_count": 1
            }
        ],
        "saved_issues": [
            {
                "repo_full_name": "fastapi/fastapi",
                "issue_number": 142,
                "title": "Improve error message clarity in request body validation",
                "difficulty": "Beginner",
                "match_score": 94
            }
        ]
    }
