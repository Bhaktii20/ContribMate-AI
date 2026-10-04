import httpx
import base64
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

BINARY_EXTENSIONS = {
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".zip", ".tar", ".gz",
    ".7z", ".rar", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".exe", ".dll", ".so",
    ".dylib", ".pyc", ".wasm"
}

class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self):
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "ContribMate-AI/1.0"
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    async def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Any]:
        url = f"{self.BASE_URL}{endpoint}"
        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=10.0, follow_redirects=True) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 403:
                    logger.warning(f"[GitHub API] Rate limit reached or forbidden for endpoint: {endpoint}")
                    return None
                elif response.status_code == 404:
                    logger.warning(f"[GitHub API] Resource not found: {endpoint}")
                    return None
                else:
                    logger.error(f"[GitHub API] Status {response.status_code} for endpoint {endpoint}")
                    return None
        except Exception as e:
            logger.error(f"[GitHub API Error] Exception during request to {endpoint}: {e}")
            return None

    async def search_repositories(self, query: str, sort: str = "stars", per_page: int = 30, page: int = 1) -> List[Dict[str, Any]]:
        logger.info(f"[GitHub API] Searching repositories with query: '{query}', per_page={per_page}, page={page}")
        data = await self._get("/search/repositories", params={"q": query, "sort": sort, "order": "desc", "per_page": per_page, "page": page})
        if data and "items" in data and isinstance(data["items"], list):
            return data["items"]
        return []

    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        logger.info(f"[GitHub API] Fetching repo metadata for {owner}/{repo}")
        return await self._get(f"/repos/{owner}/{repo}")

    async def get_readme(self, owner: str, repo: str) -> Optional[str]:
        logger.info(f"[GitHub API] Fetching README for {owner}/{repo}")
        data = await self._get(f"/repos/{owner}/{repo}/readme")
        if data and "download_url" in data:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(data["download_url"])
                    if res.status_code == 200:
                        return res.text
            except Exception as e:
                logger.error(f"Failed to download raw README: {e}")
        return None

    async def get_tree_data(self, owner: str, repo: str, branch: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"[GitHub API] Fetching tree data for {owner}/{repo}")
        repo_info = await self.get_repository(owner, repo)
        default_branch = branch or (repo_info.get("default_branch", "main") if repo_info else "main")
        
        data = await self._get(f"/repos/{owner}/{repo}/git/trees/{default_branch}", params={"recursive": "1"})
        raw_tree = data.get("tree", []) if data else []
        
        # Normalize tree items to ensure folder entries exist and paths are safe
        seen_paths = set()
        normalized_tree = []
        
        for item in raw_tree:
            path = item.get("path", "")
            item_type = item.get("type", "blob")
            
            if not path:
                continue
                
            # Add implicit parent directory paths if not present
            parts = path.split("/")
            for i in range(1, len(parts)):
                parent_dir = "/".join(parts[:i])
                if parent_dir not in seen_paths:
                    seen_paths.add(parent_dir)
                    normalized_tree.append({"path": parent_dir, "type": "tree"})
                    
            if path not in seen_paths:
                seen_paths.add(path)
                normalized_tree.append({"path": path, "type": item_type})

        # Sort tree so folders appear before files alphabetically
        normalized_tree.sort(key=lambda x: (x["path"].count("/"), x["type"] != "tree", x["path"]))

        return {
            "tree": normalized_tree,
            "default_branch": default_branch
        }

    async def get_tree(self, owner: str, repo: str, branch: str = "main") -> List[Dict[str, Any]]:
        tree_data = await self.get_tree_data(owner, repo, branch)
        return tree_data.get("tree", [])

    async def get_file_content(self, owner: str, repo: str, path: str, branch: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"[GitHub API] Fetching file content for {owner}/{repo}/{path}")
        repo_info = await self.get_repository(owner, repo)
        default_branch = branch or (repo_info.get("default_branch", "main") if repo_info else "main")
        github_url = f"https://github.com/{owner}/{repo}/blob/{default_branch}/{path}"

        # Check binary file extension
        dot_idx = path.rfind(".")
        if dot_idx != -1:
            ext = path[dot_idx:].lower()
            if ext in BINARY_EXTENSIONS:
                return {
                    "path": path,
                    "is_binary": True,
                    "content": None,
                    "github_url": github_url,
                    "default_branch": default_branch
                }

        data = await self._get(f"/repos/{owner}/{repo}/contents/{path}", params={"ref": default_branch})
        if not data:
            return {
                "path": path,
                "is_binary": False,
                "content": "File content could not be retrieved from GitHub.",
                "github_url": github_url,
                "default_branch": default_branch
            }

        if isinstance(data, dict):
            encoding = data.get("encoding")
            raw_content = data.get("content")
            download_url = data.get("download_url")

            if encoding == "base64" and raw_content:
                try:
                    decoded = base64.b64decode(raw_content).decode("utf-8", errors="replace")
                    return {
                        "path": path,
                        "is_binary": False,
                        "content": decoded,
                        "github_url": github_url,
                        "default_branch": default_branch
                    }
                except Exception as e:
                    logger.error(f"Base64 decode error for {path}: {e}")

            if download_url:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        res = await client.get(download_url)
                        if res.status_code == 200:
                            return {
                                "path": path,
                                "is_binary": False,
                                "content": res.text,
                                "github_url": github_url,
                                "default_branch": default_branch
                            }
                except Exception as e:
                    logger.error(f"Failed to fetch download_url for {path}: {e}")

        return {
            "path": path,
            "is_binary": False,
            "content": "File content empty or unavailable.",
            "github_url": github_url,
            "default_branch": default_branch
        }

    async def get_issues(self, owner: str, repo: str, state: str = "open", per_page: int = 30) -> List[Dict[str, Any]]:
        logger.info(f"[GitHub API] Fetching issues for {owner}/{repo}")
        raw_issues = await self._get(f"/repos/{owner}/{repo}/issues", params={"state": state, "per_page": per_page})
        if not raw_issues or not isinstance(raw_issues, list):
            return []
        
        # Filter out Pull Requests! GitHub issues endpoint returns pull requests as well.
        issues_only = [i for i in raw_issues if "pull_request" not in i]
        return issues_only

    async def get_issue_comments(self, owner: str, repo: str, issue_number: int) -> List[Dict[str, Any]]:
        data = await self._get(f"/repos/{owner}/{repo}/issues/{issue_number}/comments")
        return data if isinstance(data, list) else []

    async def get_contribution_guide(self, owner: str, repo: str) -> Dict[str, Optional[str]]:
        readme = await self.get_readme(owner, repo)
        contributing = None
        
        # Try fetching CONTRIBUTING.md
        for path in ["CONTRIBUTING.md", "contributing.md", ".github/CONTRIBUTING.md", "docs/CONTRIBUTING.md"]:
            data = await self._get(f"/repos/{owner}/{repo}/contents/{path}")
            if data and "download_url" in data:
                try:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        res = await client.get(data["download_url"])
                        if res.status_code == 200:
                            contributing = res.text
                            break
                except Exception:
                    pass
                    
        return {"readme": readme, "contributing": contributing}
