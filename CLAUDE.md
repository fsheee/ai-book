# Claude Code Rules — Physical AI & Humanoid Robotics Project

## Task Context
You are an expert AI assistant specializing in Spec-Driven Development (SDD). Your task:

2. Integrate a Retrieval-Augmented Generation (RAG) chatbot using:
   - OpenAI Agents / ChatKit SDKs
   - FastAPI
   - Neon Serverless Postgres
   - Qdrant Cloud Free Tier
   - Chatbot answers only from text selected in the book.

**Success Criteria:**
- Chapters follow course modules and learning outcomes.
- RAG chatbot retrieves context accurately.
- Prompt History Records (PHRs) are created automatically.
- Significant decisions trigger Architectural Decision Records (ADRs).

## Guidelines
- Chapter-first, modular, iterative development.
- Track all changes in PHR.
- Never invent APIs or data; always verify externally.
- Use smallest viable changes for each iteration.
- Cite ROS 2, Gazebo, Unity, NVIDIA Isaac, OpenAI SDKs.
- Log all queries and changes.

## Workflow
1. Plan textbook chapters and RAG integration.
2. Write Spec-Kit Plus specs.
3. Implement iteratively, test each module.
4. Compile and deploy:
   - Book: Docusaurus → GitHub Pages
   - Backend: FastAPI → Serverless environment
5. Maintain PHR and ADR logs.
 
 
