<!--
Sync Impact Report:
- Version change: 1.0.0 -> 2.0.0
- List of modified principles: All principles have been redefined and reorganized.
- Added sections: Execution Guidelines, Architect Guidelines
- Removed sections: None (all content has been restructured)
- Templates requiring updates:
    - .specify/templates/plan-template.md: ⚠ pending
    - .specify/templates/spec-template.md: ⚠ pending
    - .specify/templates/tasks-template.md: ⚠ pending
- Follow-up TODOs: None
-->
# Claude C# Physical AI & Humanoid Robotics Project Constitution

## Core Principles

### I. AI Agent Responsibilities
- The agent (claude.md) is responsible for generating all textbook content.
- No static course outlines or external content files are required.
- Chapters, exercises, and examples are dynamically created based on AI-driven modules.

### II. Spec-Driven Workflow Rules
- All content creation, planning, and task execution uses Spec-Kit Plus.
- Utilize `/sp.spec`, `/sp.plan`, `/sp.tasks` commands to define features and writing tasks.
- Maintain Prompt History Records (PHRs) for all agent interactions.

### III. RAG Chatbot Constraints
- Chatbot retrieves answers strictly from the dynamically generated book content.
- Responses must respect user-selected text for context limitation.
- Database (Neon Postgres) and vector store (Qdrant) must always reflect the latest book content.

### IV. Incremental Validation
- Book content is generated in small, testable increments.
- Each generated module and chapter must be validated before continuing.
- Review checkpoints occur automatically through PHRs and Spec-Kit Plus plans.

### V. Operational Standards
- Maintain structured project directories:
  - `claude.md` — Agent execution rules
  - `specs/` — Dynamic feature specifications, plans, tasks
  - `history/` — PHRs and ADRs
- Follow established code style, versioning, and file naming conventions.

## Project Sections

### AI-Generated Book
- Chapters, exerokcises, and examples are generated automatically by the agent.
- Content includes Physical AI, Humanoid Robotics, ROS 2, Gazebo, Unity, NVIDIA Isaac, and GPT-based robotics where relevant.

### RAG Chatbot Development
- Integration of FastAPI + ChatKit SDK.
- Use Neon Serverless Postgres as the database.
- Qdrant Cloud Free Tier for vector storage.

### Governance Rules
- All generated content and features must comply with this Constitution.
- Major design or content decisions require an Architectural Decision Record (ADR).
- Continuous PHR creation for all agent outputs.
- Versioning: MAJOR.MINOR.BUILD (e.g., 1.0.0)

## Execution Guidelines

- How the agent executes tasks.
- How PHRs are created.
- ADR suggestion policies.
- Minimum acceptance criteria.

## Architect Guidelines

- Scope & dependencies.
- Interfaces & APIs.
- NFRs and budgets.
- Data management.
- Operational readiness.
- Risk analysis & mitigation.

## Project Structure

- File and folder layout (claude.md, specs/, history/, .specify/).
- Templates to use for Spec-Kit Plus.

## Versioning and Governance

- Version number, ratified date.
- Constitution supersedes all informal guidelines.

**Version**: 2.0.0 | **Ratified**: 2025-11-29 | **Last Amended**: 2025-11-29
