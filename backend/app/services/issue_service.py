import logging
from typing import List, Dict, Any
from app.github.github_service import GitHubService
from app.services.scoring_service import ScoringService
from app.services.demo_data import DEMO_ISSUES
from app.core.config import settings

logger = logging.getLogger(__name__)

class IssueService:
    def __init__(self):
        self.github = GitHubService()

    async def get_issues_for_repo(
        self,
        owner: str,
        repo: str,
        user_skills: List[str] = None,
        user_experience: str = "Beginner"
    ) -> List[Dict[str, Any]]:
        full_name = f"{owner}/{repo}"
        logger.info(f"[IssueDiscovery] Fetching open issues for {full_name}")

        user_skills = user_skills or ["Python"]
        raw_issues = []

        if not settings.DEMO_MODE and settings.GITHUB_TOKEN:
            raw_issues = await self.github.get_issues(owner, repo)

        if not raw_issues:
            logger.info(f"[IssueDiscovery] Using demo issues for {full_name}")
            raw_issues = DEMO_ISSUES.get(full_name, DEMO_ISSUES.get("fastapi/fastapi", []))

        processed_issues = []
        for issue in raw_issues:
            score, difficulty, reasons = ScoringService.score_issue(
                issue=issue,
                user_skills=user_skills,
                user_experience=user_experience
            )
            
            labels_list = [l.get("name") if isinstance(l, dict) else str(l) for l in issue.get("labels", [])]
            
            processed_issues.append({
                "number": issue.get("number"),
                "title": issue.get("title"),
                "body": issue.get("body", ""),
                "labels": labels_list,
                "comments_count": issue.get("comments", issue.get("comments_count", 0)),
                "html_url": issue.get("html_url", f"https://github.com/{full_name}/issues/{issue.get('number')}"),
                "difficulty": difficulty,
                "match_score": score,
                "estimated_time": "1-2 hours" if difficulty == "Beginner" else "2-4 hours",
                "required_skills": user_skills[:2] + ["Git Workflow"],
                "why_suitable": reasons
            })

        processed_issues.sort(key=lambda x: x["match_score"], reverse=True)
        return processed_issues
