from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.schemas.schemas import RepoSearchRequest, RepoRecommendation, RepoAnalysis
from app.services.repository_service import RepositoryService
from app.services.analysis_service import AnalysisService
from app.github.github_service import GitHubService
from app.db.session import get_db

router = APIRouter()
repo_service = RepositoryService()
analysis_service = AnalysisService()
github_service = GitHubService()

@router.post("/repositories/search", response_model=List[RepoRecommendation])
async def search_repositories(req: RepoSearchRequest):
    skills = req.skills or ["Python", "AI/ML"]
    interests = req.interests or ["AI/ML"]
    experience = req.experience or "Beginner"
    available_time = req.available_time or "2-4 hours"
    
    results = await repo_service.search_and_recommend(
        skills=skills,
        interests=interests,
        experience=experience,
        available_time=available_time,
        query=req.query
    )
    return results

@router.get("/repositories/{owner}/{repo}", response_model=RepoRecommendation)
async def get_repository_details(owner: str, repo: str):
    full_name = f"{owner}/{repo}"
    results = await repo_service.search_and_recommend(
        skills=["Python"],
        interests=["AI/ML"],
        query=full_name
    )
    if results:
        return results[0]
    
    return RepoRecommendation(
        full_name=full_name,
        owner=owner,
        name=repo,
        description=f"{full_name} open-source repository",
        language="Python",
        stars=1250,
        forks=320,
        open_issues=15,
        license="MIT",
        html_url=f"https://github.com/{full_name}",
        last_updated="2026-09-28",
        match_score=90,
        beginner_issue_count=5,
        why_matched=["✓ Active Python repository", "✓ Beginner friendly community"]
    )

@router.get("/repositories/{owner}/{repo}/tree")
async def get_repository_tree(owner: str, repo: str, branch: Optional[str] = None):
    tree_data = await github_service.get_tree_data(owner, repo, branch)
    if not tree_data.get("tree"):
        from app.services.demo_data import DEMO_TREE
        tree_items = DEMO_TREE.get(f"{owner}/{repo}", DEMO_TREE.get("fastapi/fastapi", []))
        tree_data = {
            "tree": tree_items,
            "default_branch": branch or "main"
        }
    return tree_data

@router.get("/repositories/{owner}/{repo}/file")
async def get_repository_file(
    owner: str,
    repo: str,
    path: str = Query(..., description="File path in repository"),
    branch: Optional[str] = Query(None, description="Branch ref")
):
    file_data = await github_service.get_file_content(owner, repo, path, branch)
    return file_data

from app.services.contribution_service import ContributionService
contribution_service = ContributionService()

@router.get("/repositories/{owner}/{repo}/guide")
async def get_repository_guide(owner: str, repo: str):
    guide = await contribution_service.generate_contribution_guide(owner, repo)
    return guide

@router.post("/repositories/{owner}/{repo}/analyze", response_model=RepoAnalysis)
async def analyze_repository(owner: str, repo: str):
    analysis = await analysis_service.analyze_repository(owner, repo)
    return analysis
