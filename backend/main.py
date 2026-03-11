from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import users, documents, loans, ai
from backend.services.qdrant_service import qdrant_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Qdrant collection
    await qdrant_service.ensure_collection_exists()
    yield

app = FastAPI(title="TechLib Manager API", lifespan=lifespan)

# Include Routers
app.include_router(users.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(loans.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to TechLib Manager API"}
