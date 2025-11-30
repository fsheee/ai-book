# RAG Chatbot Backend

FastAPI backend for the "Physical AI & Humanoid Robotics" textbook RAG chatbot.

## Quick Start

For detailed setup instructions, see [Quickstart Guide](../specs/001-rag-chatbot-integration/quickstart.md).

### Prerequisites

- Python 3.11+
- OpenAI API key
- Qdrant Cloud account (free tier)
- Neon Postgres account (free tier)

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize databases
python scripts/init_db.py
python scripts/init_qdrant.py

# Ingest textbook content
python scripts/ingest_docs.py --content-dir ../docs

# Run development server
uvicorn src.main:app --reload --port 8000
```

### API Endpoints

- `POST /rag/query` - Full-book RAG query
- `POST /rag/from-selection` - Selection-based query
- `POST /embed-book` - Ingest textbook content
- `GET /health` - Health check

See [OpenAPI specification](../specs/001-rag-chatbot-integration/contracts/openapi.yaml) for full API documentation.

### Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Deployment

See [Quickstart Guide - Deployment section](../specs/001-rag-chatbot-integration/quickstart.md#deployment) for Railway deployment instructions.
