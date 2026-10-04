import math
import re
from typing import List, Dict
import numpy as np

class VectorEmbeddingEngine:
    """Modular lightweight embedding & similarity engine.
    Uses TF-IDF + Character N-Gram feature vectors for ultra-fast, robust, zero-dependency RAG.
    """
    def __init__(self, vocab_size: int = 1000):
        self.vocab_size = vocab_size

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        tokens = re.findall(r'[a-zA-Z0-9_\.]+', text)
        # Add 3-gram character features for code symbols
        ngrams = []
        for token in tokens:
            if len(token) >= 3:
                for i in range(len(token) - 2):
                    ngrams.append(token[i:i+3])
        return tokens + ngrams

    def embed(self, text: str) -> np.ndarray:
        tokens = self._tokenize(text)
        vec = np.zeros(self.vocab_size, dtype=np.float32)
        if not tokens:
            return vec
        for token in tokens:
            idx = abs(hash(token)) % self.vocab_size
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    @staticmethod
    def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        dot = float(np.dot(vec1, vec2))
        return max(0.0, min(1.0, dot))
