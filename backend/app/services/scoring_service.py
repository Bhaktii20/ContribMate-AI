from typing import List, Dict, Any, Tuple

class ScoringService:
    """Deterministic recommendation scoring engine for repositories and issues."""

    @staticmethod
    def score_repository(
        repo: Dict[str, Any],
        user_skills: List[str],
        user_interests: List[str],
        user_experience: str = "Beginner",
        available_time: str = "2-4 hours"
    ) -> Tuple[int, List[str]]:
        reasons = []
        
        # 1. Skill match (30%)
        repo_lang = (repo.get("language") or "").lower()
        skills_lower = [s.lower() for s in user_skills]
        topics = [t.lower() for t in repo.get("topics", [])]
        
        skill_score = 0
        if repo_lang in skills_lower:
            skill_score = 30
            reasons.append(f"✓ Primary language ({repo.get('language')}) matches your skills")
        elif any(s in repo.get("description", "").lower() for s in skills_lower):
            skill_score = 20
            reasons.append("✓ Technology stack matches your skill keywords")
        else:
            skill_score = 10
            reasons.append("• Standard programming concepts apply")

        # 2. Interest match (20%)
        interests_lower = [i.lower() for i in user_interests]
        desc_lower = (repo.get("description") or "").lower()
        
        interest_score = 0
        matched_interests = [i for i in user_interests if i.lower() in desc_lower or any(i.lower() in t for t in topics)]
        if matched_interests:
            interest_score = 20
            reasons.append(f"✓ Domain matches your interest in {', '.join(matched_interests)}")
        else:
            interest_score = 10

        # 3. Experience compatibility (20%)
        exp_score = 0
        open_issues = repo.get("open_issues_count", repo.get("open_issues", 0))
        stars = repo.get("stargazers_count", repo.get("stars", 0))
        
        if user_experience.lower() == "beginner":
            if 50 <= stars <= 20000 and open_issues > 5:
                exp_score = 20
                reasons.append("✓ Repository scale and open issues are ideal for beginners")
            else:
                exp_score = 15
                reasons.append("✓ Beginner-friendly project structure")
        else:
            exp_score = 20
            reasons.append(f"✓ Project complexity suitable for {user_experience} level")

        # 4. Issue availability (15%)
        issue_score = 0
        if open_issues > 20:
            issue_score = 15
            reasons.append(f"✓ High issue availability ({open_issues} open issues)")
        elif open_issues > 5:
            issue_score = 10
            reasons.append(f"✓ Active open issues ({open_issues} open)")
        else:
            issue_score = 5

        # 5. Repository activity (10%)
        activity_score = 10
        reasons.append("✓ Active open-source repository")

        # 6. Contribution complexity (5%)
        complexity_score = 5
        if available_time:
            reasons.append(f"✓ Good fit for your available time ({available_time})")

        total_score = min(100, skill_score + interest_score + exp_score + issue_score + activity_score + complexity_score)
        return total_score, reasons

    @staticmethod
    def score_issue(
        issue: Dict[str, Any],
        user_skills: List[str],
        user_experience: str = "Beginner"
    ) -> Tuple[int, str, List[str]]:
        title = issue.get("title", "").lower()
        body = (issue.get("body") or "").lower()
        labels = [l.get("name", "").lower() if isinstance(l, dict) else str(l).lower() for l in issue.get("labels", [])]
        
        reasons = []
        
        # Difficulty assessment
        is_good_first = any(g in l for l in labels for g in ["good first issue", "beginner", "easy", "starter", "help wanted"])
        is_doc = any(d in title or d in labels for d in ["doc", "readme", "typo", "comment", "documentation"])
        
        if is_doc or (is_good_first and user_experience.lower() == "beginner"):
            difficulty = "Beginner"
            score = 92
            reasons.append("✓ Labeled as beginner-friendly or documentation task")
            reasons.append("✓ Low architectural complexity")
        elif "bug" in labels or "fix" in title:
            difficulty = "Intermediate"
            score = 82
            reasons.append("✓ Isolated bug fix task")
            reasons.append("✓ Scope requires tracing existing code")
        else:
            difficulty = "Intermediate" if user_experience.lower() != "advanced" else "Advanced"
            score = 75
            reasons.append("✓ Feature request or refactoring task")

        if any(s.lower() in title or s.lower() in body for s in user_skills):
            reasons.append(f"✓ Issue description references your tech stack")
            score = min(98, score + 6)
            
        return score, difficulty, reasons
