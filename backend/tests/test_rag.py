from app.rag.chunking import DocumentChunker
from app.rag.embeddings import VectorEmbeddingEngine
from app.rag.vector_store import vector_store

def test_document_chunker():
    text = "Line 1\nLine 2\nLine 3\n" * 50
    chunks = DocumentChunker.chunk_text(text, "test.py", "owner/repo", chunk_size=100)
    assert len(chunks) > 0
    assert chunks[0]["file_path"] == "test.py"

def test_vector_store():
    repo = "test/repo"
    chunks = [
        {"chunk_id": "c1", "repo_full_name": repo, "file_path": "main.py", "content": "def parse_input(data): pass"},
        {"chunk_id": "c2", "repo_full_name": repo, "file_path": "test.py", "content": "def test_parser(): assert True"}
    ]
    vector_store.index_chunks(repo, chunks)
    results = vector_store.search(repo, "parser input validation")
    assert len(results) > 0
    assert results[0]["file_path"] in ["main.py", "test.py"]
