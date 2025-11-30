# Quickstart Guide: Humanoid Robotics Chapter 2

**Feature**: Humanoid Robotics Chapter 2 - Kinematics & Dynamics
**Date**: 2025-11-30
**Branch**: 001-humanoid-chapter2

## Overview

This quickstart guide provides step-by-step instructions for:
1. Setting up the local Docusaurus development environment
2. Viewing Chapter 2 content locally
3. Testing the RAG chatbot with sample queries
4. Regenerating embeddings after content updates

---

## Prerequisites

### Required Software
- **Node.js**: v18.0+ ([download](https://nodejs.org/))
- **Python**: 3.11+ ([download](https://www.python.org/downloads/))
- **npm** or **yarn**: (comes with Node.js)
- **Git**: For version control

### Optional (for RAG backend development)
- **Docker**: For local Postgres/Qdrant instances
- **VS Code**: Recommended IDE with Docusaurus/Python extensions

### API Keys (for RAG functionality)
- **OpenAI API Key**: For embeddings and chat completions ([get key](https://platform.openai.com/api-keys))
- **Qdrant Cloud API Key**: For vector storage ([sign up](https://qdrant.tech/))
- **Neon Postgres Connection String**: For metadata storage ([sign up](https://neon.tech/))

---

## Part 1: Local Docusaurus Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/ai-book.git
cd ai-book
```

### Step 2: Checkout Feature Branch

```bash
git checkout 001-humanoid-chapter2
```

### Step 3: Install Dependencies

Navigate to the frontend directory and install packages:

```bash
cd frontend
npm install
# or
yarn install
```

**Expected output**:
```
✓ Dependencies installed successfully
✓ Docusaurus v3.x detected
```

### Step 4: Start Development Server

```bash
npm run start
# or
yarn start
```

**Expected output**:
```
[INFO] Starting the development server...
[SUCCESS] Docusaurus website is running at http://localhost:3000/
```

### Step 5: Navigate to Chapter 2

Open your browser and go to:
```
http://localhost:3000/docs/chapter2
```

You should see:
- Chapter 2 index page with overview
- Sidebar navigation showing sections (Kinematics, Dynamics, Examples)
- Interactive code examples (if implemented)

---

## Part 2: Verify Chapter 2 Content

### File Structure

Chapter 2 files are located in:
```
frontend/docs/chapter2/
├── index.md              # Chapter overview
├── kinematics.md         # Forward/inverse kinematics
├── dynamics.md           # Forces, torques, stability
└── examples.md           # Practical examples
```

### View a Specific Section

Navigate to:
```
http://localhost:3000/docs/chapter2/kinematics
```

You should see:
- **Frontmatter metadata** (title, description, tags)
- **Section headings** (## Forward Kinematics, ### DH Parameters)
- **Math equations** (rendered with KaTeX)
- **Code blocks** (syntax-highlighted Python/C++)
- **Diagrams** (images, Mermaid, or React components)

### Test Build (Production)

To verify the site builds without errors:

```bash
npm run build
```

**Expected output**:
```
[SUCCESS] Generated static files in "build"
```

If the build fails, check:
- Invalid frontmatter in .md files
- Broken internal links
- Missing images/assets

---

## Part 3: RAG Chatbot Setup (Optional)

**Note**: This section is required only if you're testing the RAG chatbot functionality.

### Step 1: Install Backend Dependencies

Navigate to the backend directory:

```bash
cd ../backend
pip install -r requirements.txt
```

**Requirements include**:
- fastapi
- uvicorn
- openai
- qdrant-client
- psycopg2-binary (for Neon Postgres)
- python-dotenv

### Step 2: Configure Environment Variables

Create a `.env` file in `backend/`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Qdrant Configuration
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
QDRANT_COLLECTION=humanoid_textbook

# Neon Postgres Configuration
DATABASE_URL=postgresql://user:password@your-neon-instance.neon.tech/dbname

# Server Configuration
API_KEY=your-admin-api-key-for-content-ingestion
DEBUG=true
```

### Step 3: Initialize Database

Run the database migration script:

```bash
python src/scripts/init_db.py
```

**Expected output**:
```
✓ Connected to Neon Postgres
✓ Created table: content_chunks
✓ Created table: chat_queries
✓ Created table: chat_responses
✓ Database initialized successfully
```

### Step 4: Create Qdrant Collection

```bash
python src/scripts/init_qdrant.py
```

**Expected output**:
```
✓ Connected to Qdrant Cloud
✓ Created collection: humanoid_textbook
  - Vector size: 1536
  - Distance metric: Cosine
✓ Qdrant initialized successfully
```

### Step 5: Ingest Chapter 2 Content

Run the content ingestion script to chunk and embed Chapter 2:

```bash
python src/scripts/ingest_content.py --chapter 2
```

**Expected output**:
```
[INFO] Reading Chapter 2 files...
[INFO] Chunking content (500 tokens, 50-token overlap)...
[INFO] Generated 87 chunks
[INFO] Generating embeddings (OpenAI text-embedding-3-small)...
[INFO] Progress: 87/87 chunks embedded
[INFO] Storing in Qdrant...
[INFO] Storing metadata in Neon Postgres...
✓ Ingestion complete: 87 chunks, 3.2s
```

**Cost estimate**: ~$0.01 for embedding ~50,000 tokens

### Step 6: Start Backend Server

```bash
uvicorn src.main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### Step 7: Test RAG API

Open a new terminal and test the `/chat/query` endpoint:

```bash
curl -X POST http://localhost:8000/v1/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "user_text": "What is forward kinematics?",
    "session_id": "test_session_123"
  }'
```

**Expected response**:
```json
{
  "query_id": "q_12345678-1234-1234-1234-123456789abc",
  "response_text": "Forward kinematics is the process of calculating the position and orientation of a robot's end-effector given the joint angles. In humanoid robotics, it involves using Denavit-Hartenberg (DH) parameters to systematically describe the robot's geometry...",
  "sources": [
    {
      "chapter_id": 2,
      "section_id": "ch2-forward-kinematics",
      "section_title": "Forward Kinematics",
      "chunk_id": "chunk_abc123",
      "relevance_score": 0.95,
      "excerpt": "Forward kinematics uses the DH parameters..."
    }
  ],
  "confidence_score": 0.92,
  "generation_time_ms": 1250,
  "timestamp": "2025-11-30T10:30:45Z"
}
```

---

## Part 4: Common Development Tasks

### Task 1: Add New Section to Chapter 2

1. Create a new file in `frontend/docs/chapter2/`:
   ```bash
   touch frontend/docs/chapter2/new-section.md
   ```

2. Add frontmatter and content:
   ```markdown
   ---
   title: "New Section Title"
   sidebar_position: 4
   ---

   # New Section

   Content goes here...
   ```

3. Verify in browser (auto-reload):
   ```
   http://localhost:3000/docs/chapter2/new-section
   ```

### Task 2: Update Existing Content

1. Edit the file (e.g., `frontend/docs/chapter2/kinematics.md`)
2. Save changes (Docusaurus auto-reloads)
3. Verify updates in browser

### Task 3: Regenerate Embeddings (After Content Update)

After modifying chapter content, re-run ingestion:

```bash
cd backend
python src/scripts/ingest_content.py --chapter 2 --force
```

**Note**: `--force` flag overwrites existing embeddings. Without it, only new/modified chunks are embedded.

### Task 4: Test Math Rendering

Add a LaTeX equation to any `.md` file:

```markdown
The transformation matrix is:

$$
T = \begin{bmatrix}
\cos\theta & -\sin\theta & 0 & x \\
\sin\theta & \cos\theta & 0 & y \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$
```

Verify it renders correctly in the browser.

### Task 5: Add Mermaid Diagram

```markdown
```mermaid
graph TD
    A[Joint Angles] --> B[Forward Kinematics]
    B --> C[End-Effector Position]
```
```

---

## Part 5: Troubleshooting

### Issue: Docusaurus build fails with "Invalid frontmatter"

**Solution**: Check that all `.md` files have valid YAML frontmatter:
```yaml
---
title: "Section Title"
sidebar_position: 1
---
```

### Issue: Math equations not rendering

**Solution**: Ensure KaTeX plugin is installed:
```bash
npm install remark-math rehype-katex
```

And configured in `docusaurus.config.js`:
```javascript
remarkPlugins: [require('remark-math')],
rehypePlugins: [require('rehype-katex')],
```

### Issue: Backend returns "OpenAI API error"

**Solution**: Verify API key in `.env`:
```bash
cat backend/.env | grep OPENAI_API_KEY
```

Test API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: Qdrant connection fails

**Solution**: Check Qdrant URL and API key:
```python
from qdrant_client import QdrantClient

client = QdrantClient(url="YOUR_URL", api_key="YOUR_KEY")
print(client.get_collections())
```

### Issue: Slow embedding generation

**Solution**: Batch embed chunks instead of one-by-one:
```python
# In src/services/embedder.py
def batch_embed(texts: list[str], batch_size=100):
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        embeddings = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )
        yield [e.embedding for e in embeddings.data]
```

---

## Part 6: Testing Checklist

Before committing changes, verify:

- [ ] `npm run build` passes without errors
- [ ] All sections accessible in browser (no 404s)
- [ ] Math equations render correctly
- [ ] Code blocks have syntax highlighting
- [ ] Images/diagrams display properly
- [ ] Sidebar navigation is correct
- [ ] (If RAG) Backend server starts without errors
- [ ] (If RAG) Sample query returns relevant sources
- [ ] (If RAG) All embeddings generated successfully

---

## Next Steps

1. **Content Creation**: Begin writing Chapter 2 sections (kinematics, dynamics)
2. **RAG Integration**: Test chatbot with various queries, tune retrieval parameters
3. **Deployment**: Prepare GitHub Actions workflow for CI/CD
4. **Review**: Submit for peer review and user testing

---

## Additional Resources

- **Docusaurus Docs**: https://docusaurus.io/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **OpenAI API Reference**: https://platform.openai.com/docs/api-reference
- **Qdrant Documentation**: https://qdrant.tech/documentation/
- **Neon Postgres Docs**: https://neon.tech/docs/introduction

---

**Quickstart Version**: 1.0.0
**Last Updated**: 2025-11-30
