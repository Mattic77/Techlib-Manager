from sentence_transformers import SentenceTransformer
import torch

class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            # Use CPU as requested for this hardware tier
            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Loading Embedding Model (all-MiniLM-L6-v2) on {device}...")
            cls._instance.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device=device)
        return cls._instance

    def encode(self, text: str) -> list[float]:
        """Generate a 384-dimensional vector for a single text."""
        return self.model.encode(text).tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate vectors for a list of texts."""
        return self.model.encode(texts).tolist()

embedding_service = EmbeddingService()
