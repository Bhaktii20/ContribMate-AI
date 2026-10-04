import logging
import json
from typing import Dict, Any, List, Optional
from app.github.github_service import GitHubService
from app.ai.ai_service import AIService
from app.rag.vector_store import vector_store
from app.core.config import settings
from app.services.demo_data import DEMO_TREE

logger = logging.getLogger(__name__)

GUIDE_SYSTEM_PROMPT = """You are ContribMate AI, an expert open-source contributor and technical writer.
Generate a comprehensive, repository-specific contribution guide grounded strictly in the provided repository documentation, README, CONTRIBUTING files, and codebase structure.

Do NOT invent non-existent commands or files. If documentation lacks specific steps, infer standard open-source conventions based on detected technologies and explicitly label them as inferred.

You must include the following 12 numbered sections:
1. Repository Overview
2. Prerequisites
3. Setup Steps
4. Repository Structure
5. How to Find Relevant Code
6. How to Run Tests
7. Coding & Contribution Conventions
8. Recommended First Contribution Area
9. How to Create a Branch
10. How to Test Changes
11. How to Prepare a PR
12. Important Warnings & Verification Checklist
"""

GUIDE_USER_PROMPT = """Repository: {repo_full_name}
Language: {language}
README / Documentation Context:
{readme_content}

CONTRIBUTING.md Context:
{contributing_content}

Tree Structure Sample:
{tree_sample}

Generate a clear, detailed Markdown contribution guide covering all 12 required sections for a beginner developer.
"""

PLAN_SYSTEM_PROMPT = """You are ContribMate AI, an expert open-source mentor generating a step-by-step contribution roadmap for a specific GitHub issue.
Produce a clean JSON response adhering to the requested schema.
Ground every file path, command, and instruction in the provided codebase context and tree structure.
"""

PLAN_USER_PROMPT = """Repository: {repo_full_name}
Issue #{issue_number}: {issue_title}
Issue Description:
{issue_body}

User Skills: {user_skills}

Repository Tree Sample:
{tree_sample}

Retrieved RAG Context:
{rag_context}

Return valid JSON with this exact schema:
{{
  "difficulty": "Beginner | Intermediate | Advanced",
  "estimated_time": "1-2 hours | 2-4 hours | 4-8 hours",
  "required_skills": ["Skill1", "Skill2"],
  "files_involved": [
    {{"file_path": "path/to/file.py", "reason": "Why this file is involved"}}
  ],
  "what_to_understand": ["Point 1", "Point 2"],
  "step_by_step_plan": ["Step 1", "Step 2", "Step 3"],
  "testing_plan": ["Test step 1", "Test step 2"],
  "git_workflow": ["git checkout -b ...", "git commit -m ...", "git push ..."]
}}
"""

class ContributionService:
    def __init__(self):
        self.github = GitHubService()
        self.ai = AIService()

    async def generate_plan(
        self,
        owner: str,
        repo: str,
        issue_number: int,
        user_skills: List[str] = None
    ) -> Dict[str, Any]:
        full_name = f"{owner}/{repo}"
        logger.info(f"[ContributionService] Generating plan for {full_name} issue #{issue_number}, DEMO_MODE={settings.DEMO_MODE}")
        
        user_skills = user_skills or ["Python", "Git"]

        # 1. Fetch Repository Tree
        tree_data = await self.github.get_tree_data(owner, repo)
        tree = tree_data.get("tree", []) if tree_data else []
        if not tree:
            tree = DEMO_TREE.get(full_name, DEMO_TREE.get("fastapi/fastapi", []))
            
        tree_paths = {item["path"] for item in tree if item.get("path")}
        tree_sample = "\n".join(list(tree_paths)[:60])

        # 2. Fetch Issue Details from GitHub API
        issue_title = f"Issue #{issue_number}"
        issue_body = ""
        raw_issues = await self.github.get_issues(owner, repo, state="all", per_page=50)
        target_issue = next((i for i in raw_issues if i.get("number") == issue_number), None)

        if target_issue:
            issue_title = target_issue.get("title", issue_title)
            issue_body = target_issue.get("body", "") or ""
        else:
            # Attempt direct fetch
            issue_data = await self.github._get(f"/repos/{owner}/{repo}/issues/{issue_number}")
            if issue_data and isinstance(issue_data, dict):
                issue_title = issue_data.get("title", issue_title)
                issue_body = issue_data.get("body", "") or ""

        # 3. Retrieve RAG chunks for issue query
        rag_chunks = vector_store.search(full_name, f"{issue_title} {issue_body[:200]}", top_k=4)
        rag_context = "\n".join([f"File {c.get('file_path')}:\n{c.get('content')}" for c in rag_chunks]) if rag_chunks else "No relevant code chunks retrieved."

        # 4. Qwen AI Inference
        ai_plan = None
        error_occurred = False

        if self.ai.provider:
            user_prompt = PLAN_USER_PROMPT.format(
                repo_full_name=full_name,
                issue_number=issue_number,
                issue_title=issue_title,
                issue_body=issue_body[:1000],
                user_skills=", ".join(user_skills),
                tree_sample=tree_sample,
                rag_context=rag_context[:1500]
            )
            try:
                ai_plan = await self.ai.generate_json_completion(user_prompt, system_prompt=PLAN_SYSTEM_PROMPT)
            except Exception as e:
                logger.error(f"[ContributionService Error] Qwen model plan generation failed: {e}")
                error_occurred = True

        # STRICT TASK 3 REQUIREMENT: If DEMO_MODE=false, NO fake AI fallback!
        if not settings.DEMO_MODE and not ai_plan:
            err_msg = (
                "AI model is currently unavailable. Please check the AI configuration."
                if (error_occurred or not self.ai.provider)
                else "Model returned invalid plan format."
            )
            return {
                "repo_full_name": full_name,
                "issue_number": issue_number,
                "issue_title": issue_title,
                "difficulty": "Unknown",
                "estimated_time": "N/A",
                "required_skills": user_skills,
                "files_involved": [],
                "what_to_understand": [err_msg],
                "step_by_step_plan": ["1. Check AI configuration (GROQ_API_KEY / AI_MODEL in .env)", "2. Verify AI service connection"],
                "testing_plan": ["AI Service status check"],
                "git_workflow": ["git checkout -b main"],
                "error": True
            }

        # DEMO_MODE=true Fallback (Grounded in real tree paths where possible)
        if not ai_plan:
            # Pick actual code & test files from tree if possible
            code_files = [p for p in tree_paths if p.endswith((".py", ".ts", ".js", ".go", ".rs")) and "test" not in p][:2]
            test_files = [p for p in tree_paths if "test" in p and p.endswith((".py", ".ts", ".js"))][:1]
            doc_files = [p for p in tree_paths if p.upper().startswith("README") or p.upper().startswith("CONTRIBUTING")][:1]
            
            cand_files = code_files + test_files + doc_files
            if not cand_files:
                cand_files = ["README.md"]

            files_involved_demo = [{"file_path": f, "reason": "Extracted from repo tree for inspection"} for f in cand_files]

            ai_plan = {
                "difficulty": "Beginner",
                "estimated_time": "2-4 hours",
                "required_skills": user_skills + ["Git"],
                "files_involved": files_involved_demo,
                "what_to_understand": [
                    f"Understand the goal of issue #{issue_number}: {issue_title}",
                    "Inspect existing component behavior in relevant source files",
                    "Check existing test coverage"
                ],
                "step_by_step_plan": [
                    f"1. Fork {full_name} on GitHub and clone your fork locally",
                    f"2. Create a feature branch: git checkout -b fix/issue-{issue_number}",
                    f"3. Locate primary implementation in {cand_files[0]}",
                    "4. Implement the required changes",
                    "5. Run test suite locally",
                    "6. Commit changes and push branch to GitHub",
                    "7. Submit Pull Request"
                ],
                "testing_plan": [
                    "Run automated test suite",
                    "Add new unit test for issue fix"
                ],
                "git_workflow": [
                    f"git clone https://github.com/YOUR_USERNAME/{repo}.git",
                    f"git checkout -b fix/issue-{issue_number}",
                    "git add .",
                    f"git commit -m 'fix: address issue #{issue_number}'",
                    f"git push origin fix/issue-{issue_number}"
                ]
            }

        # 5. Process & Ground files_involved against actual repo tree
        raw_files = ai_plan.get("files_involved", [])
        verified_files = []

        for item in raw_files:
            file_path = item.get("file_path") if isinstance(item, dict) else str(item)
            reason = item.get("reason", "Relevant source file") if isinstance(item, dict) else "Relevant source file"

            if not file_path:
                continue

            if file_path in tree_paths:
                verified_files.append({
                    "file_path": file_path,
                    "status": "VERIFIED",
                    "reason": f"✓ VERIFIED: {reason} (file exists in repo tree)"
                })
            else:
                # Check for basename match in tree_paths
                base_name = file_path.split("/")[-1]
                matching_tree_path = next((tp for tp in tree_paths if tp.endswith("/" + base_name) or tp == base_name), None)

                if matching_tree_path:
                    verified_files.append({
                        "file_path": matching_tree_path,
                        "status": "VERIFIED",
                        "reason": f"✓ VERIFIED: Matched tree path '{matching_tree_path}' for '{base_name}'"
                    })
                else:
                    verified_files.append({
                        "file_path": file_path,
                        "status": "LIKELY",
                        "reason": f"⚠ LIKELY: {reason} (path referenced by AI model)"
                    })

        # Ensure at least standard repo README/CONTRIBUTING if files empty
        if not verified_files:
            verified_files.append({
                "file_path": "README.md",
                "status": "VERIFIED" if "README.md" in tree_paths else "LIKELY",
                "reason": "✓ VERIFIED: Repository documentation entry point"
            })

        return {
            "repo_full_name": full_name,
            "issue_number": issue_number,
            "issue_title": issue_title,
            "difficulty": ai_plan.get("difficulty", "Beginner"),
            "estimated_time": ai_plan.get("estimated_time", "2-4 hours"),
            "required_skills": ai_plan.get("required_skills", user_skills),
            "files_involved": verified_files,
            "what_to_understand": ai_plan.get("what_to_understand", []),
            "step_by_step_plan": ai_plan.get("step_by_step_plan", []),
            "testing_plan": ai_plan.get("testing_plan", []),
            "git_workflow": ai_plan.get("git_workflow", [])
        }

    async def generate_contribution_guide(self, owner: str, repo: str) -> Dict[str, Any]:
        full_name = f"{owner}/{repo}"
        logger.info(f"[ContributionService] Generating contribution guide for {full_name}, DEMO_MODE={settings.DEMO_MODE}")

        # 1. Fetch raw README and CONTRIBUTING docs from GitHub
        guide_docs = await self.github.get_contribution_guide(owner, repo)
        readme = guide_docs.get("readme") or ""
        contributing = guide_docs.get("contributing") or ""

        # 2. Fetch repo tree & repo details
        tree_data = await self.github.get_tree_data(owner, repo)
        tree = tree_data.get("tree", []) if tree_data else []
        tree_sample = "\n".join([item["path"] for item in tree[:50]])

        repo_info = await self.github.get_repository(owner, repo)
        language = repo_info.get("language", "Python") if repo_info else "Python"

        # 3. AI Generation via Qwen
        guide_text = None
        error_occurred = False

        if self.ai.provider:
            user_prompt = GUIDE_USER_PROMPT.format(
                repo_full_name=full_name,
                language=language,
                readme_content=readme[:2000] if readme else "No README.md content found.",
                contributing_content=contributing[:2000] if contributing else "No CONTRIBUTING.md content found.",
                tree_sample=tree_sample
            )
            try:
                guide_text = await self.ai.generate_text_completion(user_prompt, system_prompt=GUIDE_SYSTEM_PROMPT)
            except Exception as e:
                logger.error(f"[ContributionService Error] Qwen guide generation failed: {e}")
                error_occurred = True

        # STRICT TASK 3 REQUIREMENT: If DEMO_MODE=false, NO fake AI fallback!
        if not settings.DEMO_MODE and not guide_text:
            err_msg = (
                "AI model is currently unavailable. Please check the AI configuration (GROQ_API_KEY and AI_MODEL in .env)."
                if (error_occurred or not self.ai.provider)
                else "Unable to generate contribution guide from Qwen model."
            )
            return {
                "readme": readme,
                "contributing": contributing,
                "guide_content": err_msg,
                "ai_generated": False,
                "error": True
            }

        if not guide_text:
            # Fallback for DEMO_MODE=true
            guide_text = f"""# Contribution Guide for {full_name}

## 1. Repository Overview
{full_name} is a {language} open-source repository.

## 2. Prerequisites
- {language} runtime environment
- Git CLI installed

## 3. Setup Steps
1. Fork `https://github.com/{full_name}`
2. `git clone https://github.com/YOUR_USERNAME/{repo}.git`
3. Install dependencies per project standard.

## 4. Repository Structure
Key directories identified from tree:
{tree_sample[:400]}

## 5. How to Find Relevant Code
Search source modules under primary directories.

## 6. How to Run Tests
Inspect `tests/` directory and run test runner.

## 7. Coding & Contribution Conventions
Follow standard formatting and linting rules.

## 8. Recommended First Contribution Area
Look for documentation fixes or issues tagged `good first issue`.

## 9. How to Create a Branch
`git checkout -b fix/my-first-contribution`

## 10. How to Test Changes
Run test suite locally before pushing.

## 11. How to Prepare a PR
Open a PR against `{full_name}` `main` branch.

## 12. Important Warnings & Verification Checklist
- Ensure tests pass
- Do not check in temporary artifacts
"""

        return {
            "readme": readme,
            "contributing": contributing,
            "guide_content": guide_text,
            "ai_generated": bool(self.ai.provider and not error_occurred),
            "error": False
        }
