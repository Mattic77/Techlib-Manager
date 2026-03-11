# TechLib Manager — MVP Build Prompt for Gemini CLI

> **How to use this file:** Feed this document to Gemini CLI as your master prompt.
> Start each session with: `gemini -p @techlib-manager-mvp-prompt.md`
> Or paste it directly as the system context before giving task-level instructions.

---

## 🎯 Project Overview

You are building **TechLib Manager**, a full-stack technical library management application with an integrated AI assistant. The project must be delivered as a working MVP in **3 sprints (6 sessions × 2h = 12h total)**.

**Stack:**
- **Frontend:** React + TypeScript (Vite)
- **Backend API:** FastAPI (Python 3.10+)
- **Relational DB:** MySQL 8.0
- **Vector DB:** Qdrant 1.7+
- **Cache:** Redis 7
- **LLM:** Mistral 7B (via Ollama, quantized — GGUF Q4)
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2`
- **Infra:** Docker + Docker Compose (single command deployment)
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing

**Two user roles:**
- `librarian` — full CRUD + admin controls
- `reader` — search, borrow, consult AI assistant

---

## 📁 Target Project Structure

```
techlib-manager/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── core/
│   │   ├── config.py          # env vars, settings
│   │   ├── security.py        # JWT, bcrypt
│   │   └── database.py        # SQLAlchemy engine + session
│   ├── models/
│   │   ├── document.py
│   │   ├── user.py
│   │   ├── loan.py
│   │   └── reservation.py
│   ├── schemas/
│   │   ├── document.py
│   │   ├── user.py
│   │   └── loan.py
│   ├── routers/
│   │   ├── documents.py       # /api/documents CRUD
│   │   ├── users.py           # /api/users
│   │   ├── loans.py           # /api/loans
│   │   ├── search.py          # /api/search (SQL)
│   │   └── ai.py              # /api/ai/query + /api/ai/recommendations
│   ├── services/
│   │   ├── document_service.py
│   │   ├── loan_service.py
│   │   ├── embedding_service.py   # SentenceTransformer wrapper
│   │   ├── qdrant_service.py      # vector upsert + similarity search
│   │   └── llm_service.py         # Ollama client + RAG orchestration
│   └── seed/
│       └── seed_documents.py      # 50+ sample technical documents
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/               # axios clients per resource
│       ├── components/
│       │   ├── Dashboard/
│       │   ├── DocumentDetail/
│       │   ├── ChatInterface/
│       │   ├── SearchBar/
│       │   └── LoanManager/
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── CatalogPage.tsx
│       │   ├── DocumentPage.tsx
│       │   ├── ChatPage.tsx
│       │   └── LoginPage.tsx
│       ├── store/             # Zustand or React Context
│       └── types/             # TypeScript interfaces
└── nginx/
    └── nginx.conf
```

---

## 🗄️ Database Schema (MySQL)

Generate migrations with Alembic. Here is the exact schema to implement:

```sql
-- documents
CREATE TABLE documents (
  id          CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  author      VARCHAR(255),
  isbn        VARCHAR(20)  UNIQUE,
  publication_year INT,
  category    VARCHAR(100),
  summary     TEXT,
  keywords    JSON,                      -- array of strings
  physical_location VARCHAR(50),         -- e.g. "Shelf 4B / Row 12"
  digital_format    VARCHAR(10),         -- "PDF", "EPUB", etc.
  availability      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- users
CREATE TABLE users (
  id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('reader','librarian','admin') DEFAULT 'reader',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- loans
CREATE TABLE loans (
  id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  document_id  CHAR(36) NOT NULL REFERENCES documents(id),
  user_id      CHAR(36) NOT NULL REFERENCES users(id),
  loan_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date     TIMESTAMP NOT NULL,
  return_date  TIMESTAMP,
  status       ENUM('active','returned','overdue') DEFAULT 'active'
);

-- reservations
CREATE TABLE reservations (
  id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  document_id      CHAR(36) NOT NULL REFERENCES documents(id),
  user_id          CHAR(36) NOT NULL REFERENCES users(id),
  reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status           ENUM('pending','fulfilled','cancelled') DEFAULT 'pending'
);
```

---

## 🔵 Qdrant Vector Schema

Collection name: `document_embeddings`

```python
# Create collection
client.recreate_collection(
    collection_name="document_embeddings",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)

# Each point payload:
{
  "id": "<uuid matching documents.id>",
  "vector": [...],   # float[384] from all-MiniLM-L6-v2
  "payload": {
    "title": "...",
    "summary_excerpt": "...",   # first 300 chars of summary
    "category": "...",
    "keywords": [...]
  }
}
```

---

## 🚀 Sprint Plan

### Sprint 1 — Technical Foundation (Sessions 1–2)
**Goal:** Docker stack running, CRUD working, DB seeded.

#### Tasks (give these to Gemini one by one):

**Task 1.1 — docker-compose.yml**
```
Generate a docker-compose.yml that starts:
- mysql:8.0 (port 3306, volume for persistence, env: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE=techlib)
- redis:7-alpine (port 6379)
- qdrant/qdrant:v1.7.4 (port 6333 + 6334, volume for persistence)
- backend (build from ./backend, port 8000, depends_on mysql + redis + qdrant)
- frontend (build from ./frontend, port 3000)
- nginx (port 80, reverse proxy to frontend:3000 and backend:8000/api)
Include a healthcheck for mysql. Use a shared .env file for secrets.
```

**Task 1.2 — FastAPI Backend Skeleton**
```
Generate the FastAPI backend with:
- main.py: app factory, CORS (allow localhost:3000), include all routers, lifespan for DB init
- core/config.py: pydantic BaseSettings reading from .env (DATABASE_URL, REDIS_URL, QDRANT_URL, JWT_SECRET, OLLAMA_URL)
- core/database.py: SQLAlchemy async engine + get_db dependency
- core/security.py: create_access_token, verify_token, get_current_user dependency, hash_password, verify_password
- All SQLAlchemy models matching the schema above
- Alembic setup with initial migration
```

**Task 1.3 — CRUD Routers**
```
Generate FastAPI routers for:
- /api/documents: GET (list with filters: category, year, availability, keyword search), GET /{id}, POST, PUT /{id}, DELETE /{id} (soft delete → set archived=true)
- /api/users: POST /register, POST /login (returns JWT), GET /me
- /api/loans: POST (create loan, sets availability=false), PUT /{id}/return (sets return_date, status=returned, availability=true), GET /my-loans
Include Pydantic schemas (request + response) for all endpoints.
```

**Task 1.4 — Seed Script**
```
Generate backend/seed/seed_documents.py that inserts 50 technical documents into MySQL covering these categories: Cloud Computing, Distributed Systems, Frontend, Backend, DevOps, Databases, AI/ML, Security, Architecture, Leadership.
Each document must have: title, author, isbn, publication_year (2018-2024), category, summary (3-5 sentences), keywords (4-6 items), physical_location.
Real-sounding technical book titles (e.g. "Designing Data-Intensive Applications", "Clean Architecture", etc.).
After insertion, generate embeddings for each document's summary and upsert them into Qdrant.
```

---

### Sprint 2 — AI Core (Sessions 3–4)
**Goal:** Semantic search and RAG-based chat working end-to-end.

**Task 2.1 — Embedding Service**
```
Generate services/embedding_service.py:
- Load sentence-transformers/all-MiniLM-L6-v2 once at startup (singleton pattern)
- Method: encode(text: str) -> list[float]  # returns 384-dim vector
- Method: encode_batch(texts: list[str]) -> list[list[float]]
Use torch with CPU fallback if no GPU detected.
```

**Task 2.2 — Qdrant Service**
```
Generate services/qdrant_service.py:
- upsert_document(doc_id, vector, payload) → upserts one point
- search_similar(query_vector, top_k=10) → returns list of {id, score, payload}
- delete_document(doc_id)
- ensure_collection_exists() → called on startup, creates collection if missing
Use qdrant-client async.
```

**Task 2.3 — LLM Service (RAG)**
```
Generate services/llm_service.py:
- Uses httpx to call Ollama API at OLLAMA_URL (default: http://ollama:11434)
- Model: mistral (or llama2 as fallback)
- Method: generate_rag_response(user_question, context_docs) -> AsyncGenerator[str, None]
  * Builds this prompt:
    SYSTEM: "You are TechLib Assistant, an AI librarian. Answer ONLY using the provided library documents context. If the answer is not in the context, say so. Be concise and helpful. Respond in the same language as the user's question."
    USER: "Question: {user_question}\n\nContext documents:\n{formatted_context}"
  * Streams the response token by token using Ollama's streaming API
- Method: generate_summary(document_summary: str) -> str
  * Generates a 2-paragraph AI insight for the document detail page
```

**Task 2.4 — AI Router**
```
Generate routers/ai.py:
- POST /api/ai/query:
  Body: { "question": str, "top_k": int = 10 }
  1. Embed the question
  2. Search Qdrant for top_k similar docs
  3. Fetch full metadata from MySQL for those doc IDs
  4. Call llm_service.generate_rag_response (stream via StreamingResponse)
  5. Return: streaming text + matched document IDs in header X-Matched-Docs
  
- GET /api/ai/recommendations/{user_id}:
  1. Get last 5 documents the user borrowed (from loans table)
  2. Average their vectors (fetch from Qdrant)
  3. Search for top 5 similar docs (excluding already-read ones)
  4. Return enriched document list

- POST /api/ai/summary/{doc_id}:
  Generates and returns AI summary for a specific document
```

---

### Sprint 3 — Frontend & Validation (Sessions 5–6)
**Goal:** React UI complete, all P1 tests passing.

**Task 3.1 — React App Setup**
```
Generate the Vite + React + TypeScript project setup with:
- Dependencies: axios, react-router-dom v6, zustand, tailwindcss, lucide-react, react-query (@tanstack/react-query)
- src/api/: axios instances for documents, auth, loans, ai (with JWT interceptor that reads token from zustand store)
- src/types/: TypeScript interfaces matching all backend response schemas
- src/store/authStore.ts: zustand store for user + token + login/logout actions
- Tailwind config with a dark blue + white color theme
```

**Task 3.2 — Dashboard Page**
```
Generate src/pages/DashboardPage.tsx with:
- Top search bar with "AI Assistant" toggle switch
  * OFF: calls GET /api/search?q=... (SQL search)  
  * ON: calls POST /api/ai/query (semantic search + AI answer)
- Quick filter chips: Available Now, Backend Engineering, Recent Releases, PDF Format
- Librarian Overview widgets (only visible to librarian role):
  * Total Documents count
  * Currently Borrowed count  
  * Simple bar chart of Monthly Engagement (mock data ok)
- "Recommended for You" grid: 5 book cards fetched from GET /api/ai/recommendations/{userId}
  Each card shows: cover placeholder, title, author, category tag, availability badge
- Recent Loan Activity list (last 5 loans)
```

**Task 3.3 — Document Detail Page**
```
Generate src/pages/DocumentPage.tsx (route: /document/:id) with:
- Book metadata header: title, author, publisher, year, category, language, tags
- Tab navigation: Summary | Technical Details | History | AI Insights
- AI Insights tab:
  * "AI-Generated Summary" section: calls POST /api/ai/summary/{id} on tab open, streams result
  * "Extracted Technical Concepts" grid: parsed from summary (show as concept cards)
  * "Similar Documents" section: calls GET /api/ai/recommendations with doc vector, shows 3 cards with % match score
- Actions sidebar:
  * "Borrow Physical Copy" button → POST /api/loans
  * "Reserve" button (if unavailable)
  * "Preview Digital Version" link
- Librarian Controls section (role-gated):
  * Edit Metadata button
  * Inventory ID, Internal Location, Total Copies display
  * Archive Document button
```

**Task 3.4 — Chat Interface Page**
```
Generate src/pages/ChatPage.tsx (route: /chat) with:
- Left sidebar: navigation icons (home, catalog, loans, chat)
- Main chat area:
  * Message bubbles (user right, AI left with TechLib logo)
  * AI responses render as markdown (use react-markdown)
  * After each AI response, show "Suggested Documents" cards (3 books) extracted from X-Matched-Docs header
  * Thinking indicator (animated dots) while waiting
- Bottom input bar:
  * Quick-action chips: "Search Python books", "Summarize my last loan", "Compare React vs Vue", "Find API docs"
  * Text input: placeholder "Ask TechLib Assistant anything..."
  * Send button (also responds to Ctrl+Enter)
- Right sidebar "Mentioned Documents":
  * Accumulates all documents referenced in the conversation
  * Each entry: icon + title + size
  * "Export Conversation" button at bottom (downloads chat as .txt)
- Streaming: connect to POST /api/ai/query with fetch + ReadableStream, append tokens as they arrive
```

**Task 3.5 — Login Page + Route Guards**
```
Generate:
- src/pages/LoginPage.tsx: clean login form (email + password), calls POST /api/users/login, stores JWT in zustand
- src/components/ProtectedRoute.tsx: redirects to /login if no token
- src/App.tsx: react-router-dom routes:
  / → DashboardPage (protected)
  /catalog → CatalogPage (protected)  
  /document/:id → DocumentPage (protected)
  /chat → ChatPage (protected)
  /login → LoginPage (public)
```

---

## ⚡ Performance Requirements

| Operation | Target | How to achieve |
|---|---|---|
| SQL search | < 500ms | Index on title, author, category columns |
| Vector search | < 2s | Qdrant HNSW index (default) |
| LLM first token | < 5s | Streaming + Mistral 7B Q4 quantized |
| CRUD operations | < 300ms | Async SQLAlchemy + connection pooling |
| Page load | < 1s | Vite build + nginx gzip |

---

## 🔒 Security Checklist

- [ ] Passwords hashed with `bcrypt` (cost factor 12)
- [ ] JWT access tokens expire in 30min, refresh tokens in 7 days
- [ ] Role-based access: librarian-only endpoints decorated with `require_role("librarian")`
- [ ] SQL queries via SQLAlchemy ORM only (no raw string interpolation)
- [ ] CORS restricted to frontend origin
- [ ] Sensitive env vars never hardcoded (always from `.env`)
- [ ] LLM runs locally via Ollama — zero external data leakage

---

## ✅ MVP Acceptance Criteria (P1 Tests)

These are the tests that must pass for delivery:

| ID | Test | Expected Result |
|---|---|---|
| T01 | `docker-compose up` | All services healthy in < 2min |
| T02 | Qdrant collection init | 384-dim collection created, 50+ docs indexed |
| T03 | LLM inference | Response generated with RAM < 8GB |
| T04 | Vector search latency | Top-10 results returned in < 2s |
| T05 | MySQL persistence | Data survives container restart |
| F01 | Auth + roles | Librarian sees admin controls, reader does not |
| F02 | CRUD cycle | Create → Edit → Delete a document works |
| F03 | Semantic search | AI returns relevant books for a natural language question |
| F06 | Loan workflow | Borrow sets availability=false, return sets it back to true |
| F07 | Multi-criteria search | Filter by category + year + availability works |

---

## 🔧 Ollama Setup (inside Docker)

Add this service to docker-compose.yml:

```yaml
ollama:
  image: ollama/ollama:latest
  ports:
    - "11434:11434"
  volumes:
    - ollama_data:/root/.ollama
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
  # CPU fallback: remove the deploy section above if no GPU
```

After first `docker-compose up`, run:
```bash
docker exec -it ollama ollama pull mistral
```

---

## 📋 Gemini CLI — Session-by-Session Instructions

### Session 1
```
Read techlib-manager-mvp-prompt.md fully. 
Execute Task 1.1: generate docker-compose.yml and .env.example.
Execute Task 1.2: generate the complete FastAPI backend skeleton with all models and Alembic migration.
Do not start Task 1.3 until I confirm the docker-compose and models are correct.
```

### Session 2
```
Execute Task 1.3: all CRUD routers with Pydantic schemas.
Execute Task 1.4: seed script for 50 documents with embeddings.
Run: docker-compose up --build and verify all services are healthy.
Run: python seed/seed_documents.py and confirm 50 documents in MySQL and Qdrant.
```

### Session 3
```
Execute Task 2.1 (embedding service) and Task 2.2 (qdrant service).
Execute Task 2.3 (LLM service with RAG).
Test: POST /api/ai/query with question "What books do you have on microservices?" and confirm streaming response.
```

### Session 4
```
Execute Task 2.4: AI router with all endpoints.
Integration test: full RAG pipeline from HTTP request to streamed LLM response.
Fix any latency issues (target < 5s first token).
```

### Session 5
```
Execute Tasks 3.1, 3.2, 3.3: React setup, Dashboard, Document Detail.
Connect frontend to backend API. Verify JWT auth flow works end to end.
```

### Session 6
```
Execute Tasks 3.4, 3.5: Chat Interface, Login page, Route guards.
Run all P1 acceptance tests from the MVP checklist.
Fix any failing tests. Prepare final docker-compose for delivery.
```

---

## 🧠 Important Constraints for Gemini

- Always generate **complete, runnable files** — no placeholders or `# TODO` comments
- Use **async/await** throughout the FastAPI backend (async SQLAlchemy, async httpx)
- Every API endpoint must have **error handling** (try/except with HTTPException)
- React components must use **TypeScript strictly** — no `any` types
- When generating the seed data, use **realistic technical book titles and summaries** so semantic search produces meaningful results
- The LLM prompt must **strictly constrain the model to the RAG context** — no hallucinations beyond the library catalog
- All Docker services must have **restart: unless-stopped** for stability

---

*Document generated for TechLib Manager v1.0 — Master Informatique et mobilité, UHA 2025-2026*
*Based on cahier des charges by MAMOU Rania & HOUSSEIN HARED Zakaria*
