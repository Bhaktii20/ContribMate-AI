import logging
from typing import List, Dict, Any
from app.rag.embeddings import VectorEmbeddingEngine

logger = logging.getLogger(__name__)

class VectorStore:
    """Modular Vector Store for indexing repository document chunks."""
    def __init__(self):
        self.engine = VectorEmbeddingEngine()
        # In-memory index: repo_full_name -> List[Dict]
        self._store: Dict[str, List[Dict[str, Any]]] = {}

    def index_chunks(self, repo_full_name: str, chunks: List[Dict[str, Any]]):
        if repo_full_name not in self._store:
            self._store[repo_full_name] = []
            
        indexed_count = 0
        for chunk in chunks:
            text = f"{chunk['file_path']}\n{chunk['content']}"
            vector = self.engine.embed(text)
            chunk["vector"] = vector
            self._store[repo_full_name].append(chunk)
            indexed_count += 1
            
        logger.info(f"[VectorStore] Indexed {indexed_count} chunks for repository {repo_full_name}")

    def search(self, repo_full_name: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        repo_chunks = self._store.get(repo_full_name, [])
        if not repo_chunks:
            return []

        query_vec = self.engine.embed(query)
        scored_chunks = []
        for chunk in repo_chunks:
            sim = self.engine.cosine_similarity(query_vec, chunk["vector"])
            scored_chunks.append((sim, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        results = []
        for sim, chunk in scored_chunks[:top_k]:
            results.append({
                "chunk_id": chunk["chunk_id"],
                "file_path": chunk["file_path"],
                "content": chunk["content"],
                "similarity_score": round(sim, 4)
            })
        return results

vector_store = VectorStore()
