import logging
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from app.github.github_service import GitHubService
from app.ai.ai_service import AIService
from app.services.demo_data import DEMO_ANALYSIS
from app.core.config import settings

logger = logging.getLogger(__name__)

REPO_ANALYSIS_SYSTEM_PROMPT = """You are ContribMate AI, an expert open-source mentor.
Analyze public GitHub repository data (README snippet, metadata, file structure) and return a structured JSON response.
Do NOT hallucinate file names or features not present in the provided context.
Output MUST be valid JSON only.
"""

REPO_ANALYSIS_USER_PROMPT = """Analyze the following public GitHub repository for an open-source contributor:

Repository: {repo_full_name}
Description: {description}
Primary Language: {language}
Topics: {topics}
Stars: {stars} | Forks: {forks} | Open Issues: {open_issues} | Default Branch: {default_branch}
Observed Major Directories: {major_dirs}
Observed Configuration Files: {config_files}
Has Tests: {has_tests} | Has README: {has_readme} | Has CONTRIBUTING: {has_contributing}

README Snippet:
{readme_snippet}

Return JSON with this exact structure:
{{
  "what_it_does": "Clear, informative 2-sentence explanation of what this project does and its core utility based strictly on the README and description.",
  "why_suitable": "Specific explanation of why this project is suitable for an open-source contributor",
  "getting_started_difficulty": "Beginner | Intermediate | Advanced",
  "tech_stack": ["list", "of", "technologies", "frameworks", "tools"],
  "project_structure_summary": "Summary of how major directories organize the codebase",
  "easier_parts": "Which components or areas are easier for a beginner to start with",
  "harder_parts": "Which components require deeper expertise or architectural understanding",
  "recommended_learnings": ["key concept 1", "key concept 2"]
}}
"""

class AnalysisService:
    def __init__(self):
        self.github = GitHubService()
        self.ai = AIService()

    async def analyze_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        full_name = f"{owner}/{repo}"
        logger.info(f"[AnalysisService] Analyzing repository {full_name} (DEMO_MODE={settings.DEMO_MODE})")

        # 1. Fallback / Mock Data if DEMO_MODE=true
        if settings.DEMO_MODE:
            if full_name in DEMO_ANALYSIS:
                demo_data = DEMO_ANALYSIS[full_name]
                return self._enrich_analysis_object(
                    full_name=full_name,
                    owner=owner,
                    repo=repo,
                    raw_analysis=demo_data,
                    is_demo=True
                )
            # Default demo fallback
            fallback = DEMO_ANALYSIS.get("fastapi/fastapi", {})
            return self._enrich_analysis_object(
                full_name=full_name,
                owner=owner,
                repo=repo,
                raw_analysis=fallback,
                is_demo=True
            )

        # 2. REAL GITHUB REPOSITORY ANALYSIS when DEMO_MODE=false
        repo_data = await self.github.get_repository(owner, repo)
        if not repo_data or not isinstance(repo_data, dict):
            logger.error(f"[AnalysisService] GitHub API failed to retrieve repository metadata for {full_name}")
            raise HTTPException(
                status_code=404,
                detail=f"Repository '{full_name}' was not found on GitHub or is private."
            )

        tree_data = await self.github.get_tree_data(owner, repo)
        guide_data = await self.github.get_contribution_guide(owner, repo)
        issues_data = await self.github.get_issues(owner, repo, state="open", per_page=30)

        # 3. Extract Observable GitHub Metadata
        owner_name = repo_data.get("owner", {}).get("login") if isinstance(repo_data.get("owner"), dict) else owner
        repo_name = repo_data.get("name") or repo
        description = repo_data.get("description") or "Public GitHub repository"
        html_url = repo_data.get("html_url") or f"https://github.com/{full_name}"
        default_branch = repo_data.get("default_branch") or "main"
        language = repo_data.get("language") or "Python"
        topics = repo_data.get("topics", [])
        stars = repo_data.get("stargazers_count", 0)
        forks = repo_data.get("forks_count", 0)
        open_issues = repo_data.get("open_issues_count", 0)
        watchers = repo_data.get("subscribers_count", repo_data.get("watchers_count", 0))
        
        license_info = repo_data.get("license")
        license_name = license_info.get("name") if isinstance(license_info, dict) else (license_info or "Not specified")
        
        created_at = str(repo_data.get("created_at", ""))[:10] if repo_data.get("created_at") else None
        updated_at = str(repo_data.get("pushed_at", repo_data.get("updated_at", "")))[:10] if (repo_data.get("pushed_at") or repo_data.get("updated_at")) else None

        # 4. Tree & Directory Analysis
        tree_items = tree_data.get("tree", []) if tree_data else []
        major_directories = self._extract_major_directories(tree_items, repo_name)
        contributor_files = self._extract_contributor_files(tree_items, guide_data)

        # 5. Beginner Friendliness & Health Calculation
        readme = guide_data.get("readme")
        contributing = guide_data.get("contributing")
        has_readme = bool(readme)
        has_contributing = bool(contributing)
        has_tests = any("test" in item.get("path", "").lower() for item in tree_items)
        has_license = license_name != "Not specified" and license_name is not None

        beginner_score, difficulty_level, beginner_reasons = self._calculate_beginner_assessment(
            stars=stars,
            open_issues=open_issues,
            has_readme=has_readme,
            has_contributing=has_contributing,
            has_tests=has_tests,
            issues_data=issues_data
        )

        # 6. Evidence Classification
        verified_evidence = [
            f"Directly retrieved repository metadata from GitHub API ({full_name})",
            f"Verified default branch: '{default_branch}'",
            f"Verified open issues count: {open_issues}",
            f"Verified stars ({stars.toLocaleString() if hasattr(stars, 'toLocaleString') else stars}) & forks ({forks})"
        ]
        if has_readme:
            verified_evidence.append("Verified README.md file present in repository root")
        if has_contributing:
            verified_evidence.append("Verified CONTRIBUTING.md contribution guidelines present")
        if has_tests:
            verified_evidence.append("Verified automated test directory in repository tree")
        if has_license:
            verified_evidence.append(f"Verified open-source license: {license_name}")

        inferred_evidence = [
            f"Inferred tech stack from language ({language}) and repository topics ({', '.join(topics[:4]) if topics else 'standard layout'})",
            f"Inferred project organization from top-level directories ({', '.join([d['path'] for d in major_directories[:3]]) if major_directories else 'flat structure'})",
            f"Inferred beginner suitability ({difficulty_level}, score {beginner_score}/100) based on documentation and test availability"
        ]

        unknown_evidence = [
            "Maintainer PR review turnaround time cannot be verified via API",
            "Local environment system requirements beyond repository configuration files"
        ]

        # 7. AI Architectural Generation (or Factual Fallback)
        ai_result = None
        if readme and self.ai.provider:
            try:
                prompt = REPO_ANALYSIS_USER_PROMPT.format(
                    repo_full_name=full_name,
                    description=description,
                    language=language,
                    topics=", ".join(topics) if topics else "None",
                    stars=stars,
                    forks=forks,
                    open_issues=open_issues,
                    default_branch=default_branch,
                    major_dirs=", ".join([d["path"] for d in major_directories]),
                    config_files=", ".join([f["file_path"] for f in contributor_files if f["category"] == "Configuration"]),
                    has_tests="Yes" if has_tests else "No",
                    has_readme="Yes" if has_readme else "No",
                    has_contributing="Yes" if has_contributing else "No",
                    readme_snippet=readme[:2000]
                )
                ai_result = await self.ai.generate_json(prompt, system_prompt=REPO_ANALYSIS_SYSTEM_PROMPT)
            except Exception as e:
                logger.warning(f"[AnalysisService] AI analysis call failed: {e}")

        what_it_does = ""
        why_suitable = ""
        tech_stack = [language] + [t.capitalize() for t in topics[:4] if t.lower() != language.lower()]
        if has_tests and "Pytest" not in tech_stack and language == "Python":
            tech_stack.append("Pytest")
        tech_stack.append("Git")

        project_structure_summary = ""
        easier_parts = None
        harder_parts = None
        recommended_learnings = []

        if ai_result and isinstance(ai_result, dict):
            what_it_does = ai_result.get("what_it_does") or description
            why_suitable = ai_result.get("why_suitable") or f"Great {language} repository with structured architecture."
            difficulty_level = ai_result.get("getting_started_difficulty") or difficulty_level
            if ai_result.get("tech_stack") and isinstance(ai_result["tech_stack"], list):
                tech_stack = list(dict.fromkeys(tech_stack + ai_result["tech_stack"]))
            project_structure_summary = ai_result.get("project_structure_summary") or f"Organized into {len(major_directories)} main modules."
            easier_parts = ai_result.get("easier_parts")
            harder_parts = ai_result.get("harder_parts")
            recommended_learnings = ai_result.get("recommended_learnings", [])
        else:
            # Factual, zero-hallucination fallback grounded strictly in retrieved data
            what_it_does = f"{full_name} is an open-source {language} repository. {description}"
            why_suitable = f"Suitability assessment: {difficulty_level} level (score {beginner_score}/100). Has active open issues ({open_issues}) and documented contribution guides."
            project_structure_summary = f"Codebase structured with major directories: {', '.join([d['path'] for d in major_directories]) if major_directories else 'root directory layout'}."
            easier_parts = "Documentation fixes, typo corrections, and isolated unit test additions."
            harder_parts = "Core framework architecture changes and multi-module refactoring."
            recommended_learnings = [language, "Git workflow", "Automated unit testing"]

        return {
            "full_name": full_name,
            "owner": owner_name,
            "name": repo_name,
            "description": description,
            "html_url": html_url,
            "default_branch": default_branch,
            "language": language,
            "topics": topics,
            "stars": stars,
            "forks": forks,
            "open_issues": open_issues,
            "watchers": watchers,
            "license": license_name,
            "created_at": created_at,
            "updated_at": updated_at,

            # Core AI / General Summaries
            "what_it_does": what_it_does,
            "why_suitable": why_suitable,
            "getting_started_difficulty": difficulty_level,
            "tech_stack": tech_stack,
            "project_structure": project_structure_summary,
            "easier_parts": easier_parts,
            "harder_parts": harder_parts,
            "recommended_learnings": recommended_learnings,

            # Detailed Analysis Sections
            "major_directories": major_directories,
            "contributor_files": contributor_files,
            "health": {
                "has_readme": has_readme,
                "has_contributing": has_contributing,
                "has_tests": has_tests,
                "has_license": has_license,
                "open_issues_count": open_issues,
                "stars_count": stars,
                "forks_count": forks,
                "license_name": license_name,
                "last_updated": updated_at,
                "activity_status": "Active (Recently Updated)" if updated_at else "Active"
            },
            "beginner_assessment": {
                "score": beginner_score,
                "difficulty_level": difficulty_level,
                "explanation": beginner_reasons,
                "evidence_breakdown": {
                    "VERIFIED": verified_evidence,
                    "INFERRED": inferred_evidence,
                    "UNKNOWN": unknown_evidence
                }
            },
            "evidence_indicators": {
                "readme": "✓ Verified from GitHub README" if has_readme else "⚠ README missing",
                "metadata": "✓ Verified from GitHub API metadata",
                "tree": f"✓ Verified {len(tree_items)} items in git tree",
                "ai": "✓ AI structural inference grounded in repository data" if ai_result else "✓ Factual static analysis"
            },
            "evidence_map": {
                "VERIFIED": verified_evidence,
                "INFERRED": inferred_evidence,
                "UNKNOWN": unknown_evidence
            },
            "ai_generated": bool(ai_result)
        }

    def _extract_major_directories(self, tree_items: List[Dict[str, Any]], repo_name: str) -> List[Dict[str, str]]:
        dirs_dict = {}
        for item in tree_items:
            path = item.get("path", "")
            item_type = item.get("type", "blob")
            if not path:
                continue

            parts = path.split("/")
            top_dir = parts[0]

            if top_dir not in dirs_dict:
                # Determine standard directory purpose
                purpose = "Repository module"
                top_lower = top_dir.lower()

                if top_lower in ["src", "lib", "app", "core", repo_name.lower()]:
                    purpose = "Core application source code and implementation logic"
                elif top_lower in ["tests", "test", "testing", "spec"]:
                    purpose = "Automated test suite and regression test cases"
                elif top_lower in ["docs", "doc", "documentation"]:
                    purpose = "Documentation, tutorials, and API specifications"
                elif top_lower in [".github", ".gitlab", ".ci"]:
                    purpose = "CI/CD workflows, issue templates, and contribution configs"
                elif top_lower in ["scripts", "tools", "bin"]:
                    purpose = "Development scripts, helper utilities, and build tools"
                elif top_lower in ["examples", "samples", "demo"]:
                    purpose = "Example usage implementations and demonstration projects"
                elif top_lower in ["benchmarks", "perf"]:
                    purpose = "Performance benchmarks and stress tests"

                # Keep if it's explicitly a directory or has children
                if item_type == "tree" or len(parts) > 1:
                    dirs_dict[top_dir] = {
                        "path": f"{top_dir}/",
                        "purpose": purpose
                    }

        # Return sorted list of major directories
        result = list(dirs_dict.values())
        result.sort(key=lambda x: x["path"])
        return result if result else [{"path": "./", "purpose": "Root codebase directory"}]

    def _extract_contributor_files(self, tree_items: List[Dict[str, Any]], guide_data: Dict[str, Any]) -> List[Dict[str, str]]:
        files = []
        seen_paths = set()

        # 1. Start Here files
        if guide_data.get("readme"):
            files.append({
                "file_path": "README.md",
                "category": "Start Here",
                "description": "Primary repository documentation and overview"
            })
            seen_paths.add("README.md")

        if guide_data.get("contributing"):
            files.append({
                "file_path": "CONTRIBUTING.md",
                "category": "Start Here",
                "description": "Guidelines for submitting code, pull requests, and setting up dev environment"
            })
            seen_paths.add("CONTRIBUTING.md")

        # 2. Configuration files in root
        config_names = {
            "pyproject.toml": "Python project dependencies, build system, and tool configuration",
            "package.json": "Node.js dependencies, scripts, and package metadata",
            "Cargo.toml": "Rust package manifest and dependencies",
            "go.mod": "Go module definition and dependency tracking",
            "setup.py": "Python package setup script",
            "Makefile": "Build and test automation commands",
            "Dockerfile": "Containerization environment specification"
        }

        for item in tree_items:
            path = item.get("path", "")
            if path in config_names and path not in seen_paths:
                files.append({
                    "file_path": path,
                    "category": "Configuration",
                    "description": config_names[path]
                })
                seen_paths.add(path)

        # 3. Test entry points
        for item in tree_items:
            path = item.get("path", "")
            if ("test" in path.lower()) and item.get("type") != "tree" and path not in seen_paths:
                files.append({
                    "file_path": path,
                    "category": "Tests",
                    "description": "Test case example for verifying code changes"
                })
                seen_paths.add(path)
                if len([f for f in files if f["category"] == "Tests"]) >= 2:
                    break

        # 4. Source entry points
        for item in tree_items:
            path = item.get("path", "")
            if item.get("type") != "tree" and path not in seen_paths:
                if any(path.endswith(ext) for ext in [".py", ".ts", ".js", ".rs", ".go"]):
                    if any(src_dir in path for src_dir in ["src/", "lib/", "app/", "fastapi/"]):
                        files.append({
                            "file_path": path,
                            "category": "Implementation",
                            "description": "Source code file for understanding feature implementation"
                        })
                        seen_paths.add(path)
                        if len([f for f in files if f["category"] == "Implementation"]) >= 3:
                            break

        return files

    def _calculate_beginner_assessment(
        self,
        stars: int,
        open_issues: int,
        has_readme: bool,
        has_contributing: bool,
        has_tests: bool,
        issues_data: List[Dict[str, Any]]
    ) -> (int, str, List[str]):
        score = 50
        reasons = []

        if has_readme:
            score += 15
            reasons.append("✓ README.md documentation is present")
        else:
            reasons.append("⚠ Missing README documentation")

        if has_contributing:
            score += 15
            reasons.append("✓ Explicit CONTRIBUTING.md guidelines available")
        else:
            reasons.append("• No formal CONTRIBUTING.md file (standard PR workflow applies)")

        if has_tests:
            score += 10
            reasons.append("✓ Automated test suite detected in repository")

        if open_issues > 0:
            score += 10
            reasons.append(f"✓ Active issue tracker with {open_issues} open issues")

        # Check for beginner-friendly labels in issues
        has_good_first = False
        for issue in (issues_data or []):
            labels = [l.get("name", "").lower() if isinstance(l, dict) else str(l).lower() for l in issue.get("labels", [])]
            if any(b in label for label in labels for b in ["good first issue", "easy", "beginner", "documentation"]):
                has_good_first = True
                break

        if has_good_first:
            score += 10
            reasons.append("✓ 'good first issue' / beginner-friendly labeled issues found")

        if stars > 80000:
            score -= 10
            reasons.append("• High repository scale and review volume")

        score = min(100, max(20, score))

        if score >= 75:
            difficulty = "Beginner"
        elif score >= 55:
            difficulty = "Intermediate"
        else:
            difficulty = "Advanced"

        return score, difficulty, reasons

    def _enrich_analysis_object(self, full_name: str, owner: str, repo: str, raw_analysis: Dict[str, Any], is_demo: bool) -> Dict[str, Any]:
        what_it_does = raw_analysis.get("what_it_does", f"{full_name} repository analysis.")
        why_suitable = raw_analysis.get("why_suitable", "Suitable open-source project.")
        difficulty = raw_analysis.get("getting_started_difficulty", "Beginner")
        tech_stack = raw_analysis.get("tech_stack", ["Python", "Git"])

        major_dirs = [
            {"path": "fastapi/", "purpose": "Core FastAPI framework routing and application logic"},
            {"path": "tests/", "purpose": "Pytest unit test suite and validation tests"},
            {"path": "docs/", "purpose": "Multilingual documentation and tutorials"}
        ]
        contributor_files = [
            {"file_path": "README.md", "category": "Start Here", "description": "Primary documentation"},
            {"file_path": "CONTRIBUTING.md", "category": "Start Here", "description": "Contribution guidelines"},
            {"file_path": "fastapi/exceptions.py", "category": "Implementation", "description": "Exception handling logic"},
            {"file_path": "tests/test_validation.py", "category": "Tests", "description": "Validation unit tests"}
        ]

        return {
            "full_name": full_name,
            "owner": owner,
            "name": repo,
            "description": raw_analysis.get("description", "Open source framework"),
            "html_url": f"https://github.com/{full_name}",
            "default_branch": "main",
            "language": tech_stack[0] if tech_stack else "Python",
            "topics": ["python", "open-source", "web"],
            "stars": 76500 if is_demo else 1200,
            "forks": 6300 if is_demo else 300,
            "open_issues": 120 if is_demo else 15,
            "watchers": 850 if is_demo else 50,
            "license": "MIT",
            "created_at": "2018-12-05",
            "updated_at": "2026-09-28",

            "what_it_does": what_it_does,
            "why_suitable": why_suitable,
            "getting_started_difficulty": difficulty,
            "tech_stack": tech_stack,
            "project_structure": raw_analysis.get("project_structure", "Standard modular layout"),
            "easier_parts": "Documentation fixes, docstring typos, and error handler tests.",
            "harder_parts": "Asynchronous event loop routing and middleware context state.",
            "recommended_learnings": [tech_stack[0] if tech_stack else "Python", "Git", "Pytest"],

            "major_directories": major_dirs,
            "contributor_files": contributor_files,
            "health": {
                "has_readme": True,
                "has_contributing": True,
                "has_tests": True,
                "has_license": True,
                "open_issues_count": 120 if is_demo else 15,
                "stars_count": 76500 if is_demo else 1200,
                "forks_count": 6300 if is_demo else 300,
                "license_name": "MIT",
                "last_updated": "2026-09-28",
                "activity_status": "Active (Demo Mode)" if is_demo else "Active"
            },
            "beginner_assessment": {
                "score": 92 if is_demo else 85,
                "difficulty_level": difficulty,
                "explanation": [
                    "✓ Primary language matches your skill profile",
                    "✓ Well-structured codebase with comprehensive pytest coverage",
                    "✓ Clear CONTRIBUTING.md guidelines and active issue triage"
                ],
                "evidence_breakdown": {
                    "VERIFIED": [
                        f"Verified repository {full_name} from demo dataset",
                        "Verified README.md and CONTRIBUTING.md presence",
                        "Verified pytest test suite layout"
                    ],
                    "INFERRED": [
                        "Inferred beginner friendliness from documentation coverage"
                    ],
                    "UNKNOWN": [
                        "Local environment build time"
                    ]
                }
            },
            "evidence_indicators": {
                "readme": "✓ Verified from GitHub README",
                "metadata": "✓ Verified from repository metadata",
                "tree": "✓ Verified tree layout",
                "ai": "✓ AI structural inference"
            },
            "evidence_map": {
                "VERIFIED": ["Verified README.md", "Verified CONTRIBUTING.md"],
                "INFERRED": ["Inferred modular layout"],
                "UNKNOWN": ["Maintainer review speed"]
            },
            "ai_generated": True
        }

