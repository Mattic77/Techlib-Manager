import httpx
import json
from typing import AsyncGenerator, List
from backend.core.config import settings

class LLMService:
    def __init__(self):
        self.ollama_url = f"{settings.OLLAMA_URL}/api/generate"
        self.model = "qwen2.5:0.5b" # Lightweight for 8GB RAM

    async def generate_rag_response(self, user_question: str, context_docs: List[dict]) -> AsyncGenerator[str, None]:
        """Generates a streaming RAG response using Ollama."""
        
        formatted_context = "\n\n".join([
            f"Title: {doc['title']}\nSummary: {doc['summary']}"
            for doc in context_docs
        ])

        prompt = f"""
SYSTEM: You are TechLib Assistant, an AI librarian. Answer ONLY using the provided library documents context. 
If the answer is not in the context, say "I'm sorry, I don't have information about that in our technical library." 
Be concise and helpful. Respond in the same language as the user's question.

CONTEXT DOCUMENTS:
{formatted_context}

USER QUESTION:
{user_question}

ASSISTANT:
"""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", self.ollama_url, json=payload) as response:
                if response.status_code != 200:
                    yield f"Error: LLM service returned status {response.status_code}"
                    return

                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        token = data.get("response", "")
                        yield token
                        if data.get("done"):
                            break

    async def generate_summary(self, document_summary: str) -> str:
        """Generates a 2-paragraph AI insight for a document."""
        prompt = f"Provide a brief 2-paragraph AI insight and technical analysis for the following book summary: {document_summary}"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.ollama_url, json=payload)
            if response.status_code == 200:
                return response.json().get("response", "")
            return "Unable to generate summary at this time."

llm_service = LLMService()
