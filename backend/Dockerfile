FROM python:3.10-slim

# Install uv for extremely fast package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies using uv (CPU-only optimized)
# Use unsafe-best-match to allow picking newer versions from PyPI when the torch index has older ones
RUN uv pip install --no-cache --system \
    --index-strategy unsafe-best-match \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# Copy the rest of the code
COPY . /app/backend/

ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
