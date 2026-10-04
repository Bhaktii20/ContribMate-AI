import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.github.github_service import GitHubService
from app.services.scoring_service import ScoringService
from app.services.demo_data import DEMO_REPOSITORIES
from app.core.config import settings

logger = logging.getLogger(__name__)

class RepositoryService:
    def __init__(self):
        self.github = GitHubService()

    async def search_and_recommend(
        self,
        skills: List[str],
        interests: List[str],
        experience: str = "Beginner",
        available_time: str = "2-4 hours",
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"[RepositoryDiscovery] Searching for skills={skills}, interests={interests}, experience={experience}, query={query}")

        raw_repos_dict: Dict[str, Dict[str, Any]] = {}

        # 1. Real GitHub Discovery when DEMO_MODE=false
        if not settings.DEMO_MODE:
            try:
                queries_to_run = []
                primary_skill = skills[0] if skills else "Python"
                primary_interest = interests[0] if interests else "AI/ML"

                if query and query.strip():
                    clean_q = query.strip()
                    queries_to_run.append(clean_q)
                    queries_to_run.append(f"{clean_q} stars:>10")
                    queries_to_run.append(f"{clean_q} good first issue")
                    if skills:
                        queries_to_run.append(f"{clean_q} language:{skills[0]}")
                else:
                    # Multi-query discovery strategies based on user profile
                    queries_to_run.append(f"language:{primary_skill} {primary_interest}")
                    queries_to_run.append(f"language:{primary_skill} good-first-issues:>0")
                    queries_to_run.append(f"language:{primary_skill} help-wanted-issues:>0")
                    queries_to_run.append(f"language:{primary_skill} topic:{primary_interest.lower().replace('/', '-')}")
                    queries_to_run.append(f"language:{primary_skill} stars:100..50000")
                    queries_to_run.append(f"topic:{primary_interest.lower().replace('/', '-')} stars:>100")
                    
                    if len(skills) > 1:
                        queries_to_run.append(f"language:{skills[1]} stars:>100")
                    if len(interests) > 1:
                        queries_to_run.append(f"{interests[1]} open source")

                # Execute multi-query search sequentially or in batches to avoid rate limit spikes
                for q in queries_to_run:
                    items = await self.github.search_repositories(q, sort="stars", per_page=30)
                    logger.info(f"[Discovery] Query: '{q}' -> Retrieved {len(items)} repositories")

                    for item in items:
                        if isinstance(item, dict):
                            full_name = item.get("full_name")
                            if full_name and full_name not in raw_repos_dict:
                                raw_repos_dict[full_name] = item

                # If candidate count is still low (< 10), run a broad fallback GitHub search
                if len(raw_repos_dict) < 10:
                    broad_query = f"language:{primary_skill} stars:>50"
                    logger.info(f"[Discovery] Candidate count < 10 ({len(raw_repos_dict)}). Running broad query: '{broad_query}'")
                    broad_items = await self.github.search_repositories(broad_query, sort="stars", per_page=30)
                    for item in broad_items:
                        if isinstance(item, dict):
                            full_name = item.get("full_name")
                            if full_name and full_name not in raw_repos_dict:
                                raw_repos_dict[full_name] = item

                logger.info(f"[Discovery] Unique repositories after merge: {len(raw_repos_dict)}")
            except Exception as e:
                logger.error(f"[RepositoryDiscovery Error] Live GitHub search failed: {e}")

        # 2. Fallback to rich demo repository dataset if DEMO_MODE or live GitHub API returned 0 results
        if not raw_repos_dict:
            logger.info("[RepositoryDiscovery] Using rich demo repository dataset")
            for item in DEMO_REPOSITORIES:
                full_name = item.get("full_name")
                if full_name:
                    raw_repos_dict[full_name] = item
            logger.info(f"[Discovery] Unique repositories after demo merge: {len(raw_repos_dict)}")

        raw_repos = list(raw_repos_dict.values())
        recommended = []

        # 3. Deterministic Scoring & Mapping
        for item in raw_repos:
            score, reasons = ScoringService.score_repository(
                repo=item,
                user_skills=skills,
                user_interests=interests,
                user_experience=experience,
                available_time=available_time
            )

            owner_val = "unknown"
            if isinstance(item.get("owner"), dict):
                owner_val = item.get("owner", {}).get("login") or "unknown"
            elif item.get("owner"):
                owner_val = str(item.get("owner"))

            full_name = item.get("full_name") or f"{owner_val}/{item.get('name', 'repo')}"
            name_val = item.get("name") or (full_name.split("/")[1] if "/" in full_name else full_name)

            rec = {
                "full_name": full_name,
                "owner": owner_val,
                "name": name_val,
                "description": item.get("description") or "",
                "language": item.get("language") or "Python",
                "stars": item.get("stargazers_count", item.get("stars", 0)),
                "forks": item.get("forks_count", item.get("forks", 0)),
                "open_issues": item.get("open_issues_count", item.get("open_issues", 0)),
                "license": item.get("license", {}).get("name") if isinstance(item.get("license"), dict) else (item.get("license") or "MIT"),
                "html_url": item.get("html_url") or f"https://github.com/{full_name}",
                "default_branch": item.get("default_branch") or "main",
                "last_updated": str(item.get("updated_at", item.get("last_updated", "2026-09-28")))[:10],
                "match_score": score,
                "beginner_issue_count": item.get("beginner_issue_count") or (max(1, item.get("open_issues_count", item.get("open_issues", 0)) // 5)),
                "why_matched": reasons
            }
            recommended.append(rec)

        # 4. Sort descending by match score
        recommended.sort(key=lambda x: x["match_score"], reverse=True)
        logger.info(f"[Discovery] Final recommendations returned: {len(recommended)}")

        return recommended

