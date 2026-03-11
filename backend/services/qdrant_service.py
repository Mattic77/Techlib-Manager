from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from backend.core.config import settings
import uuid

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = "document_embeddings"

    async def ensure_collection_exists(self):
        """Creates the collection if it doesn't exist."""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            
            if not exists:
                print(f"Creating Qdrant collection: {self.collection_name}")
                self.client.recreate_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
        except Exception as e:
            print(f"Error connecting to Qdrant: {e}. Skipping collection initialization.")

    async def upsert_document(self, doc_id: str, vector: list[float], payload: dict):
        """Upserts a single document vector and its metadata."""
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=doc_id,
                    vector=vector,
                    payload=payload
                )
            ]
        )

    async def search_similar(self, query_vector: list[float], top_k: int = 10):
        """Performs a similarity search in the vector database."""
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=top_k
        )
        return [
            {
                "id": str(hit.id),
                "score": hit.score,
                "payload": hit.payload
            }
            for hit in results
        ]

    async def delete_document(self, doc_id: str):
        """Deletes a document from the vector store."""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=[doc_id]
        )

qdrant_service = QdrantService()
