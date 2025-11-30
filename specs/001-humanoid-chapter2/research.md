# Research Document: Humanoid Robotics Chapter 2

**Feature**: Humanoid Robotics Chapter 2 - Kinematics & Dynamics
**Date**: 2025-11-30
**Branch**: 001-humanoid-chapter2

## Overview

This document captures research findings for creating Chapter 2 of the Physical AI & Humanoid Robotics textbook. The chapter focuses on kinematics (position, orientation, motion planning) and dynamics (forces, torques, stability) for humanoid robots.

---

## Research Area 1: Docusaurus MDX Best Practices

### Question
How to structure educational content with interactive elements in Docusaurus?

### Findings

**Decision**: Use Docusaurus v3 with MDX for content authoring

**Rationale**:
- **MDX Support**: Allows embedding React components (diagrams, interactive visualizations) directly in Markdown
- **Educational Features**: Built-in admonitions (:::note, :::tip, :::warning), code blocks with syntax highlighting
- **Navigation**: Automatic sidebar generation from folder structure
- **Search**: Built-in Algolia DocSearch integration for full-text search
- **Versioning**: Native support for versioned documentation (future chapters)

**Best Practices**:
1. **Content Structure**: Use `index.md` for chapter overview, separate files per major section
2. **Code Examples**: Use ```` ```python ```` with live code sandboxes where possible
3. **Math Equations**: Use KaTeX plugin for LaTeX math rendering (essential for kinematics equations)
4. **Diagrams**: Use Mermaid.js for flowcharts, D3.js or custom React components for kinematic diagrams
5. **Admonitions**: Use consistently:
   - `:::info` for definitions
   - `:::tip` for practical insights
   - `:::caution` for common pitfalls
   - `:::note` for prerequisites

**Alternatives Considered**:
- **Jupyter Book**: Rejected - requires Python build toolchain, less flexible for web integration
- **GitBook**: Rejected - limited customization, proprietary platform
- **Sphinx**: Rejected - primarily Python-focused, less modern UI

**External Resources**:
- Docusaurus v3 Docs: https://docusaurus.io/docs
- MDX Documentation: https://mdxjs.com/
- KaTeX Plugin: https://docusaurus.io/docs/markdown-features/math-equations

---

## Research Area 2: Kinematics Content Standards

### Question
What are the standard pedagogical approaches for teaching humanoid robot kinematics?

### Findings

**Decision**: Follow DH (Denavit-Hartenberg) parameter convention with incremental complexity

**Rationale**:
- **Industry Standard**: DH parameters are universally used in robotics (ROS, RoboDK, MATLAB Robotics Toolbox)
- **Systematic**: Provides consistent framework for describing robot geometry
- **Forward Kinematics**: Natural progression from joint angles → end-effector position
- **Inverse Kinematics**: Build on FK foundation, introduce analytical vs. numerical methods

**Content Outline**:
1. **Introduction to Kinematics** (500 words)
   - Definition: Study of motion without considering forces
   - Coordinate frames, homogeneous transformations
   - Why it matters for humanoid robots

2. **Forward Kinematics** (1000 words)
   - DH parameter convention (α, a, d, θ)
   - Transformation matrices
   - Example: 2-DOF planar arm (simple)
   - Example: 6-DOF humanoid arm (complex)
   - Code example: Python implementation with NumPy

3. **Inverse Kinematics** (1200 words)
   - Problem statement: Given desired end-effector pose, find joint angles
   - Analytical solutions (closed-form for simple chains)
   - Numerical methods: Jacobian-based, optimization-based
   - Multiple solutions and singularities
   - Example: Reaching task for humanoid arm
   - Code example: IK using numerical optimization (scipy.optimize)

4. **Practical Considerations** (300 words)
   - Joint limits and collision avoidance
   - Workspace analysis
   - ROS MoveIt integration (preview for later chapters)

**Alternatives Considered**:
- **Screw Theory**: Rejected - more advanced, less intuitive for beginners
- **Geometric Approach Only**: Rejected - lacks mathematical rigor needed for implementation

**External Resources**:
- "Introduction to Robotics" by John J. Craig (textbook standard)
- "Modern Robotics" by Kevin Lynch & Frank Park (open-source textbook)
- ROS 2 MoveIt Documentation: https://moveit.picknik.ai/main/index.html
- MATLAB Robotics Toolbox: https://petercorke.com/toolboxes/robotics-toolbox/

---

## Research Area 3: Dynamics Content Standards

### Question
What are essential dynamics concepts for humanoid robotics beginners?

### Findings

**Decision**: Focus on rigid-body dynamics using Newton-Euler and Lagrangian formulations

**Rationale**:
- **Foundation**: Dynamics builds on kinematics (velocities, accelerations)
- **Control-Relevant**: Understanding forces/torques is prerequisite for motion control
- **Humanoid-Specific**: Emphasize balance, Zero Moment Point (ZMP), Center of Mass (CoM)
- **Simulation**: Dynamics needed for Gazebo/Isaac Gym simulations (later chapters)

**Content Outline**:
1. **Introduction to Dynamics** (400 words)
   - Definition: Relationship between motion and forces
   - Newton-Euler vs. Lagrangian formulations
   - Why dynamics matter for humanoid robots (balance, torque limits)

2. **Rigid Body Dynamics** (800 words)
   - Mass, inertia tensors
   - Forces and torques
   - Equations of motion for single rigid body
   - Example: Pendulum (1-DOF system)

3. **Multi-Body Dynamics** (1000 words)
   - Newton-Euler recursive algorithm
   - Forward dynamics (forces → accelerations)
   - Inverse dynamics (accelerations → forces)
   - Example: 2-link planar arm dynamics
   - Code example: Python implementation

4. **Humanoid-Specific Concepts** (800 words)
   - **Balance & Stability**: Static vs. dynamic stability
   - **Zero Moment Point (ZMP)**: Definition, calculation, applications
   - **Center of Mass (CoM)**: Computation for multi-link system
   - **Ground Reaction Forces**: Contact modeling
   - Example: Standing humanoid balance analysis

5. **Practical Considerations** (300 words)
   - Actuator torque limits
   - Energy efficiency
   - Simulation tools (Gazebo, MuJoCo, Isaac Gym)

**Alternatives Considered**:
- **Kane's Method**: Rejected - less common in robotics literature
- **Pure Lagrangian Approach**: Rejected - less intuitive for force control applications
- **Advanced Topics (Compliant Control, Whole-Body Control)**: Deferred to Chapter 4

**External Resources**:
- "Robot Dynamics" lecture notes (ETH Zurich): https://ethz.ch/content/dam/ethz/special-interest/mavt/robotics-n-intelligent-systems/rsl-dam/documents/RobotDynamics2016/RD2016script.pdf
- "Humanoid Robotics" by Kajita et al. (comprehensive reference for ZMP, CoM)
- PyBullet Documentation: https://pybullet.org/wordpress/
- MuJoCo Documentation: https://mujoco.readthedocs.io/

---

## Research Area 4: RAG Integration

### Question
How to embed chapter content into Qdrant and retrieve relevant sections?

### Findings

**Decision**: Use OpenAI text-embedding-3-small model with Qdrant vector store

**Rationale**:
- **Embedding Model**: OpenAI's text-embedding-3-small offers good balance of cost, speed, and quality
  - Dimensions: 1536
  - Cost: $0.02 / 1M tokens (affordable for textbook-scale content)
  - Quality: State-of-the-art semantic similarity
- **Vector Store**: Qdrant Cloud Free Tier (1GB storage, sufficient for textbook)
  - Fast vector search (<50ms for typical queries)
  - Metadata filtering (by chapter, section, difficulty)
  - Python client library well-maintained

**Ingestion Pipeline**:
1. **Chunking Strategy**: Split chapter into semantic chunks
   - Chunk size: 500 tokens (~400 words) with 50-token overlap
   - Preserve section boundaries (don't split mid-paragraph)
   - Metadata: chapter_id, section_title, subsection_title, page_number

2. **Embedding Generation**:
   ```python
   from openai import OpenAI
   client = OpenAI()

   def embed_text(text: str) -> list[float]:
       response = client.embeddings.create(
           model="text-embedding-3-small",
           input=text
       )
       return response.data[0].embedding
   ```

3. **Qdrant Ingestion**:
   ```python
   from qdrant_client import QdrantClient
   from qdrant_client.models import PointStruct, Distance, VectorParams

   client = QdrantClient(url="https://qdrant-cloud-url", api_key="...")

   # Create collection
   client.create_collection(
       collection_name="humanoid_textbook",
       vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
   )

   # Ingest chunks
   points = [
       PointStruct(
           id=i,
           vector=embed_text(chunk.text),
           payload={
               "chapter": chunk.chapter_id,
               "section": chunk.section_title,
               "text": chunk.text
           }
       )
       for i, chunk in enumerate(chunks)
   ]
   client.upsert(collection_name="humanoid_textbook", points=points)
   ```

**Retrieval Strategy**:
1. **Query Processing**: User question + selected context text
2. **Vector Search**: Retrieve top-k (k=5) most similar chunks
3. **Reranking**: Optional - use cross-encoder for better ranking
4. **Response Generation**: Pass retrieved chunks to LLM for answer synthesis

**Alternatives Considered**:
- **Sentence-BERT (SBERT)**: Rejected - lower quality than OpenAI embeddings, self-hosting complexity
- **Pinecone**: Rejected - more expensive than Qdrant free tier
- **ChromaDB**: Rejected - less mature, fewer production deployments

**External Resources**:
- OpenAI Embeddings Guide: https://platform.openai.com/docs/guides/embeddings
- Qdrant Documentation: https://qdrant.tech/documentation/
- RAG Best Practices: https://www.pinecone.io/learn/retrieval-augmented-generation/

---

## Research Area 5: OpenAI Agents SDK

### Question
How to use ChatKit for conversational RAG interactions?

### Findings

**Decision**: Use OpenAI Assistants API with function calling for RAG retrieval

**Rationale**:
- **Stateful Conversations**: Assistants API maintains conversation history automatically
- **Function Calling**: Natural integration point for RAG retrieval
  - Define `retrieve_chapter_content(query: str, chapter: int)` function
  - LLM decides when to call retrieval based on user query
- **Streaming**: Supports streaming responses for better UX
- **File Attachments**: Future support for uploading diagrams, code files

**Implementation Approach**:
```python
from openai import OpenAI

client = OpenAI()

# Create assistant with RAG function
assistant = client.beta.assistants.create(
    name="Humanoid Robotics Tutor",
    instructions="You are a tutor for a humanoid robotics course. Answer questions using the textbook content retrieved via the retrieve_chapter_content function. Always cite specific sections.",
    model="gpt-4-turbo-preview",
    tools=[{
        "type": "function",
        "function": {
            "name": "retrieve_chapter_content",
            "description": "Retrieve relevant sections from the textbook",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "User's question"},
                    "chapter": {"type": "integer", "description": "Chapter number (optional filter)"}
                },
                "required": ["query"]
            }
        }
    }]
)

# Handle user query
thread = client.beta.threads.create()
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="Explain forward kinematics for a 2-DOF arm"
)

run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# Poll for completion, handle function calls
# When function called, retrieve from Qdrant and submit results
```

**Alternatives Considered**:
- **LangChain**: Rejected - unnecessary abstraction layer, slower development
- **LlamaIndex**: Rejected - more complex than needed for simple RAG
- **Custom Implementation**: Rejected - Assistants API provides better UX out-of-the-box

**External Resources**:
- OpenAI Assistants API: https://platform.openai.com/docs/assistants/overview
- Function Calling Guide: https://platform.openai.com/docs/guides/function-calling

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Content Platform | Docusaurus v3 with MDX | Best-in-class for technical documentation, React integration |
| Kinematics Approach | DH parameters with incremental complexity | Industry standard, systematic framework |
| Dynamics Approach | Newton-Euler + Lagrangian with humanoid focus | Control-relevant, emphasizes balance/ZMP |
| Embedding Model | OpenAI text-embedding-3-small | Cost-effective, high quality |
| Vector Store | Qdrant Cloud Free Tier | Fast, free tier sufficient, good Python SDK |
| Conversational AI | OpenAI Assistants API with function calling | Stateful, native RAG integration |

---

## Next Steps

1. Create `data-model.md` with detailed entity schemas (Phase 1)
2. Design API contracts in `contracts/` directory (Phase 1)
3. Write `quickstart.md` for local development setup (Phase 1)
4. Begin content authoring for Chapter 2 sections (Phase 2 implementation)

---

**Research Completed**: 2025-11-30
**Reviewed By**: AI Agent (Claude)
