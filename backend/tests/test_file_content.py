import pytest
from app.github.github_service import GitHubService, BINARY_EXTENSIONS

@pytest.mark.asyncio
async def test_binary_file_detection():
    svc = GitHubService()
    
    # Test binary SVG file
    res_svg = await svc.get_file_content("fastapi", "fastapi", "docs/logo.svg")
    assert res_svg["is_binary"] is True
    assert res_svg["content"] is None
    assert "github.com/fastapi/fastapi/blob/" in res_svg["github_url"]
    assert res_svg["github_url"].endswith("docs/logo.svg")

    # Test binary PNG file
    res_png = await svc.get_file_content("fastapi", "fastapi", "assets/image.png")
    assert res_png["is_binary"] is True
    assert res_png["content"] is None

@pytest.mark.asyncio
async def test_source_code_file_fetch(monkeypatch):
    svc = GitHubService()
    
    async def mock_get(endpoint, params=None):
        if "/contents/" in endpoint:
            return {
                "encoding": "base64",
                "content": "ZGVmIG1haW4oKToKICAgIHByaW50KCJoZWxsbyIpCg==", # base64 for 'def main():\n    print("hello")\n'
                "download_url": "https://raw.githubusercontent.com/owner/repo/main/src/main.py"
            }
        elif "/repos/" in endpoint:
            return {"default_branch": "main"}
        return None

    monkeypatch.setattr(svc, "_get", mock_get)

    res = await svc.get_file_content("owner", "repo", "src/main.py")
    assert res["is_binary"] is False
    assert "def main():" in res["content"]
    assert res["github_url"] == "https://github.com/owner/repo/blob/main/src/main.py"

@pytest.mark.asyncio
async def test_tree_normalization(monkeypatch):
    svc = GitHubService()
    
    async def mock_get(endpoint, params=None):
        if "/git/trees/" in endpoint:
            return {
                "tree": [
                    {"path": "src/utils/parser.py", "type": "blob"},
                    {"path": "README.md", "type": "blob"}
                ]
            }
        elif "/repos/" in endpoint:
            return {"default_branch": "main"}
        return None

    monkeypatch.setattr(svc, "_get", mock_get)

    tree_data = await svc.get_tree_data("owner", "repo")
    tree = tree_data["tree"]
    
    # Implicit parent directories "src" and "src/utils" should be added automatically
    paths = [t["path"] for t in tree]
    assert "src" in paths
    assert "src/utils" in paths
    assert "src/utils/parser.py" in paths
