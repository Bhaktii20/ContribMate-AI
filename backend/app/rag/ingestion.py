import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

IGNORE_DIRS = {
    ".git", ".github", "node_modules", "dist", "build", "coverage", ".venv", "venv",
    "__pycache__", ".pytest_cache", ".next", "target", "vendor"
}

IGNORE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".pdf", ".zip", ".tar", ".gz",
    ".exe", ".dll", ".so", ".dylib", ".pyc", ".min.js", ".min.css", ".map"
}

class IngestionPipeline:
    @staticmethod
    def filter_tree(tree_items: List[Dict[str, Any]], max_files: int = 150) -> List[Dict[str, Any]]:
        valid_items = []
        for item in tree_items:
            path = item.get("path", "")
            item_type = item.get("type", "blob")
            
            if item_type != "blob":
                continue
                
            parts = path.split("/")
            if any(part in IGNORE_DIRS for part in parts):
                continue
                
            _, ext = os.path.splitext(path)
            if ext.lower() in IGNORE_EXTENSIONS:
                continue
                
            valid_items.append(item)
            if len(valid_items) >= max_files:
                break
                
        return valid_items

    @staticmethod
    def categorize_file(path: str) -> str:
        lower_path = path.lower()
        if "readme" in lower_path or "contributing" in lower_path or "license" in lower_path:
            return "documentation"
        elif "test" in lower_path or "spec" in lower_path:
            return "tests"
        elif lower_path.startswith("docs/") or lower_path.endswith(".md"):
            return "docs"
        elif any(lower_path.endswith(ext) for ext in [".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", ".rs", ".cpp", ".c", ".h"]):
            return "source_code"
        else:
            return "config_or_other"
