import httpx
import json
from typing import AsyncGenerator, List
from backend.core.config import settings

SYSTEM_PROMPT = """You are TechLib Assistant, an AI librarian for a technical library management system.

Your ONLY purpose is to help users with:
- Finding and recommending technical books from the library catalog
- Answering questions about books, authors, and technical topics available in the library
- Providing insights about documents in the library collection

STRICT RULES:
- You MUST ONLY answer questions related to the library, its books, and technical topics covered by the library catalog.
- If the user asks anything unrelated to the library or its documents (greetings, general chat, personal questions, politics, cooking, etc.), respond ONLY with: "I'm TechLib Assistant, I can only help you with questions about our technical library catalog. Please ask me about our books or technical topics."
- Never reveal your underlying model name or who created you. You are TechLib Assistant, nothing else.
- Always base your answers on the provided context documents.
- If the answer is not in the provided context, say: "I don't have information about that in our technical library catalog."
- Respond in the same language as the user's question."""


class LLMService:
    def __init__(self):
        self.ollama_chat_url = f"{settings.OLLAMA_URL}/api/chat"
        self.ollama_generate_url = f"{settings.OLLAMA_URL}/api/generate"
        self.model = "qwen2.5:0.5b"

    async def generate_rag_response(self, user_question: str, context_docs: List[dict]) -> AsyncGenerator[str, None]:
        """Generates a streaming RAG response using Ollama chat API."""

        formatted_context = "\n\n".join([
            f"Title: {doc['title']}\nSummary: {doc['summary']}"
            for doc in context_docs
        ])

        user_message = f"""CONTEXT DOCUMENTS FROM THE LIBRARY:
{formatted_context}

USER QUESTION:
{user_question}"""

        payload = {
            "model": self.model,
            "stream": True,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", self.ollama_chat_url, json=payload) as response:
                if response.status_code != 200:
                    yield f"Error: LLM service returned status {response.status_code}"
                    return

                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        token = data.get("message", {}).get("content", "")
                        yield token
                        if data.get("done"):
                            break

    async def generate_summary(self, document_summary: str) -> str:
        """Generates a 2-paragraph AI insight for a document."""

        payload = {
            "model": self.model,
            "stream": False,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Provide a brief 2-paragraph technical analysis and insight for this library book summary: {document_summary}"}
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.ollama_chat_url, json=payload)
            if response.status_code == 200:
                return response.json().get("message", {}).get("content", "")
            return "Unable to generate summary at this time."


llm_service = LLMService()
