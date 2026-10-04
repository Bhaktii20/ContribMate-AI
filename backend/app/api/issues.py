from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.schemas.schemas import IssueResponse, ContributionPlanResponse
from app.services.issue_service import IssueService
from app.services.contribution_service import ContributionService

router = APIRouter()
issue_service = IssueService()
contribution_service = ContributionService()

@router.get("/repositories/{owner}/{repo}/issues", response_model=List[IssueResponse])
async def get_repository_issues(
    owner: str,
    repo: str,
    skills: Optional[str] = Query(None, description="Comma-separated skills")
):
    skills_list = [s.strip() for s in skills.split(",")] if skills else ["Python"]
    issues = await issue_service.get_issues_for_repo(owner, repo, user_skills=skills_list)
    return issues

@router.post("/issues/contribution-plan", response_model=ContributionPlanResponse)
async def generate_contribution_plan(
    owner: str,
    repo: str,
    issue_number: int
):
    plan = await contribution_service.generate_plan(owner, repo, issue_number)
    return plan
