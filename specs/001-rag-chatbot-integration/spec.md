# Feature Specification: RAG Chatbot Integration for Physical AI & Humanoid Robotics

**Feature Branch**: `001-rag-chatbot-integration`
**Created**: 2025-11-30
**Status**: Draft
**Input**: User description: "RAG Chatbot Integration for 'Physical AI & Humanoid Robotics' textbook with dual query modes (full-book RAG and user-selected text context) using OpenAI Agents, FastAPI, Qdrant Cloud, and Neon Postgres"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - General Book Query with RAG (Priority: P1)

As a student reading the textbook, I want to ask questions about topics covered in the book and receive accurate answers with source citations, so I can better understand complex concepts and find relevant information quickly.

**Why this priority**: This is the core value proposition of the RAG chatbot. Without this, there is no functional chatbot system. This story represents the minimum viable product (MVP).

**Independent Test**: Can be fully tested by asking "Explain inverse kinematics" and verifying the chatbot retrieves and cites relevant content from Chapter 5. Delivers immediate value by providing contextual answers from the textbook.

**Acceptance Scenarios**:

1. **Given** I am viewing any page of the textbook, **When** I open the chatbot widget and type a question about a topic covered in the book, **Then** the chatbot retrieves relevant context from the book's vector database and provides an accurate answer with source citations
2. **Given** I ask a question that spans multiple chapters, **When** the chatbot searches for relevant context, **Then** it retrieves and synthesizes information from all relevant sections
3. **Given** I ask a question about content that doesn't exist in the book, **When** the chatbot attempts to find relevant context, **Then** it politely informs me that the topic is not covered in the textbook
4. **Given** I receive an answer with source citations, **When** I click on a citation, **Then** I am navigated to the specific chapter and section in the textbook

---

### User Story 2 - Context-Specific Query from Selected Text (Priority: P2)

As a student reading a specific section, I want to select text on the page and ask questions about only that selected content, so I can get focused answers without the chatbot using information from other parts of the book.

**Why this priority**: This adds significant value for deep learning scenarios where students want to focus on specific passages. It's independent of the full-book RAG and can be tested separately. Students can still use the general chatbot (P1) without this feature.

**Independent Test**: Can be fully tested by selecting a paragraph about "sensor fusion", clicking "Ask from Selection", asking "What sensors are mentioned here?", and verifying the answer only references the selected text. Delivers value by enabling focused, context-specific learning.

**Acceptance Scenarios**:

1. **Given** I am reading a chapter, **When** I select text with my cursor, **Then** a context menu or button appears with an "Ask from Selection" option
2. **Given** I have selected text and clicked "Ask from Selection", **When** I ask a question, **Then** the chatbot uses only the selected text as context (no vector search)
3. **Given** I ask a question about content not present in my selection, **When** the chatbot processes my question, **Then** it clearly indicates the answer cannot be found in the selected text
4. **Given** I have selected very little text (< 50 characters), **When** I attempt to use "Ask from Selection", **Then** the system prompts me to select more text for meaningful context

---

### User Story 3 - Chatbot UI Integration (Priority: P1)

As a textbook user, I want a seamless, always-accessible chatbot interface that feels like a natural part of the Docusaurus website, so I can easily access help without disrupting my reading experience.

**Why this priority**: Without proper UI integration, users cannot access the chatbot features. This is tied for P1 priority with Story 1 because both are required for the MVP. However, this focuses on the interface while Story 1 focuses on functionality.

**Independent Test**: Can be fully tested by verifying the floating chat button appears on all pages, clicking it opens a chat panel, typing a message sends a request, and responses stream back in real-time. Delivers value by providing accessible, responsive UI.

**Acceptance Scenarios**:

1. **Given** I am viewing any page of the textbook, **When** the page loads, **Then** I see a floating chat button in the bottom-right corner
2. **Given** I click the floating chat button, **When** the chatbot opens, **Then** it appears as a panel (not covering the entire screen) and I can still see the textbook content
3. **Given** the chatbot panel is open, **When** I type a message and press enter or click send, **Then** my message appears immediately and the chatbot response streams in real-time
4. **Given** I am using the chatbot, **When** I click the minimize button, **Then** the chatbot collapses back to the floating button
5. **Given** I prefer a full-screen experience, **When** I click the expand button, **Then** the chatbot opens in full-page mode with a dedicated route
6. **Given** I am using a mobile device, **When** I open the chatbot, **Then** the interface adapts to mobile screen dimensions and remains fully functional

---

### User Story 4 - Chat History and Context Persistence (Priority: P3)

As a returning student, I want to see my previous conversations with the chatbot and continue discussions where I left off, so I can build on my learning over multiple sessions.

**Why this priority**: This enhances the learning experience but is not critical for initial functionality. Users can still benefit from the chatbot without history. This is a nice-to-have that improves user experience over time.

**Independent Test**: Can be fully tested by asking a question, closing the browser, reopening the textbook, and verifying the previous conversation is still visible in the chat history. Delivers value by enabling continuity in learning.

**Acceptance Scenarios**:

1. **Given** I have had a conversation with the chatbot, **When** I refresh the page, **Then** my chat history persists in the current session
2. **Given** I return to the textbook after closing my browser, **When** I open the chatbot, **Then** I see a history of my previous conversations (limited to last 30 days)
3. **Given** I am viewing my chat history, **When** I click on a previous conversation, **Then** the chat interface loads that conversation thread
4. **Given** I have multiple conversations, **When** I want to start fresh, **Then** I can click "New Conversation" to begin a new thread

---

### User Story 5 - Performance and Responsiveness (Priority: P2)

As a textbook user, I want the chatbot to respond quickly without noticeable delays, so I can maintain my learning flow without frustration.

**Why this priority**: Performance directly impacts user satisfaction. While not blocking the MVP, poor performance would render the chatbot unusable in practice. This is P2 because basic functionality (P1) must exist first, but performance must be addressed before full deployment.

**Independent Test**: Can be fully tested by sending 10 different queries and measuring response latency, verifying 95% complete within 2.5 seconds. Delivers value by ensuring user satisfaction and usability.

**Acceptance Scenarios**:

1. **Given** I ask a standard question (< 100 words), **When** the chatbot processes my query, **Then** I receive the first token of the response within 1 second
2. **Given** I ask a complex question requiring multiple document retrievals, **When** the chatbot processes my query, **Then** the full response completes within 2.5 seconds
3. **Given** the system is under normal load (< 50 concurrent users), **When** I send a query, **Then** response latency does not exceed 2.5 seconds for 95% of queries
4. **Given** I experience a slow response, **When** the query is processing, **Then** I see a loading indicator and streaming text appears as soon as tokens are available

---

### Edge Cases

- **What happens when a user submits an empty message?** System should display a validation message: "Please enter a question."
- **What happens when a user selects text across multiple pages/chapters?** System should either limit selection to single-page context or clearly indicate only the first N characters will be used.
- **What happens when the vector database (Qdrant) is temporarily unavailable?** System should gracefully degrade: display an error message and optionally fall back to a simpler keyword search or suggest trying again later.
- **What happens when the OpenAI API rate limit is exceeded?** System should queue requests and display estimated wait time, or return a friendly error message: "High demand detected. Please try again in a moment."
- **What happens when a user asks a question in a language other than English?** If the book is English-only, system should respond: "This chatbot is designed for English queries about the textbook content."
- **What happens when extremely long text is selected (> 10,000 characters)?** System should truncate to a maximum size (e.g., 8,000 characters) and notify the user: "Selected text is too long. Using the first 8,000 characters."
- **What happens when a user rapidly sends multiple messages (flooding)?** System should implement rate limiting: max 10 messages per minute per user, with a friendly warning after exceeding the limit.
- **What happens when the chatbot is accessed from GitHub Pages vs. local development?** System should work identically in both environments, with environment-specific API endpoint configuration.

## Requirements *(mandatory)*

### Functional Requirements

#### Core Chatbot Functionality
- **FR-001**: System MUST provide a chatbot UI embedded directly inside the Docusaurus website with both a floating widget and full-page mode
- **FR-002**: System MUST answer general questions using RAG (Retrieval-Augmented Generation) from the full textbook content stored in Qdrant Cloud
- **FR-003**: System MUST answer questions based solely on user-selected text without performing vector search (direct context mode)
- **FR-004**: System MUST provide streaming responses from the chatbot UI to display tokens as they are generated

#### Data Pipelines
- **FR-005**: System MUST implement Pipeline A (Full Book RAG): ingest all MDX files from the Docusaurus content directory, chunk them, and store in Qdrant Cloud with metadata (chapter, section, file path)
- **FR-006**: System MUST implement Pipeline B (User Selected Context): accept selected text directly from the frontend and pass it to the language model without vector search
- **FR-007**: System MUST use a chunking strategy with maximum 1200 characters per chunk, 200-character overlap, and metadata including chapter, section, and file_path

#### Backend Services
- **FR-008**: System MUST implement a secure FastAPI backend with the following routes:
  - POST /rag/query (for full-book RAG queries)
  - POST /rag/from-selection (for selected-text queries)
  - POST /embed-book (for ingesting and embedding book content)
  - GET /health (for health checks)
- **FR-009**: System MUST use OpenAI ChatCompletions API via OpenAI Agents SDK or ChatKit SDKs
- **FR-010**: System MUST support OpenAI GPT-4.1 or GPT-4.1-mini as the language model
- **FR-011**: System MUST provide authentication token support using basic API key validation
- **FR-012**: System MUST use text-embedding-3-large for generating vector embeddings

#### Data Storage
- **FR-013**: System MUST store vector embeddings in Qdrant Cloud Free Tier using a collection named "ai_book"
- **FR-014**: System MUST store metadata, chat history, and usage logs in Neon Serverless Postgres database
- **FR-015**: System MUST persist chat interactions in a "chats" table with fields: id, user_id, question, answer, timestamp
- **FR-016**: System MUST persist usage metrics in a "usage_logs" table with fields: id, tokens, model, latency

#### Frontend Integration
- **FR-017**: System MUST implement a Docusaurus plugin that injects the chatbot widget into all pages
- **FR-018**: System MUST provide a "Select Text → Ask Chatbot" context menu when users select text on the page
- **FR-019**: System MUST implement the following frontend components:
  - /src/components/RagChatWidget.jsx (chat widget component)
  - /src/utils/api.js (API client for backend communication)
  - /static/css/chatbot.css (chatbot styling)
- **FR-020**: System MUST work on both mobile and desktop devices with responsive design

#### Deployment and Operations
- **FR-021**: System MUST work correctly on GitHub Pages deployment
- **FR-022**: System MUST work correctly in local development mode (npm start)
- **FR-023**: System MUST be deployable to serverless platforms (Railway, Render, or equivalent)
- **FR-024**: System MUST handle CORS (Cross-Origin Resource Sharing) correctly for GitHub Pages and local development

### Key Entities *(include if feature involves data)*

- **Chat Message**: Represents a single user query or chatbot response. Attributes include message text, timestamp, user identifier, message type (user/assistant), and associated metadata (tokens used, model, latency).
- **Document Chunk**: Represents a segment of the textbook content. Attributes include chunk text (max 1200 characters), vector embedding (from text-embedding-3-large), metadata (chapter name, section title, file path), and chunk overlap (200 characters with adjacent chunks).
- **Vector Collection**: Represents the Qdrant collection storing all document chunks. Named "ai_book", contains embeddings with associated metadata for retrieval.
- **User Session**: Represents a user's interaction session. Attributes include session ID, user identifier (can be anonymous), active conversation thread, and timestamp.
- **Usage Log Entry**: Represents a single API call's performance metrics. Attributes include request ID, timestamp, tokens consumed, model used, latency (in milliseconds), and query type (full-RAG or selection-based).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Chatbot answers correctly using book-based RAG with ≥ 85% accuracy (measured by evaluating answers against ground truth for 50 test questions)
- **SC-002**: Chatbot correctly answers questions using only selected text (verified by 20 test cases where answers must not include information outside the selected context)
- **SC-003**: Chatbot fully integrated into Docusaurus navigation and accessible from all pages (verified by loading 10 random pages and confirming chat widget presence)
- **SC-004**: Backend deploys successfully to Railway or Render without errors (verified by successful deployment and health check endpoint returning 200 OK)
- **SC-005**: No CORS or deployment errors when accessing chatbot from GitHub Pages (verified by opening deployed site and successfully sending 5 test queries)
- **SC-006**: 95% of chatbot queries complete within 2.5 seconds under normal load (measured across 100 test queries)
- **SC-007**: System successfully ingests and embeds all textbook MDX files (verified by checking Qdrant collection has expected number of chunks with metadata)
- **SC-008**: Mobile users can successfully use the chatbot (verified by testing on 3 different mobile screen sizes)

## Constitution Compliance *(mandatory)*

- **Core Principles**: This specification adheres to Spec-Driven Workflow Rules by focusing on WHAT and WHY without specifying HOW. It follows RAG Chatbot Constraints by ensuring the chatbot answers only from textbook content (no external data). Incremental Validation is achieved through prioritized user stories (P1, P2, P3) that can be independently tested and validated.

- **Project Sections**: This specification directly addresses the RAG Chatbot Development section by defining the full integration of a RAG chatbot into the Docusaurus textbook. It complements the AI-Generated Book section by enhancing the reading experience with intelligent question-answering capabilities.

- **Execution Guidelines**:
  - Task execution will follow the SDD workflow: spec → plan → tasks → implementation with PHR creation at each stage
  - ADRs will be suggested for architecturally significant decisions such as: choice of vector database (Qdrant), embedding model selection (text-embedding-3-large), chunking strategy parameters, and authentication mechanism
  - Minimum acceptance criteria defined in Success Criteria section ensures measurable validation before deployment

- **Architect Guidelines**:
  - **Scope & Dependencies**: Chatbot depends on existing Docusaurus infrastructure, OpenAI API, Qdrant Cloud, and Neon Postgres. No dependencies on other internal features.
  - **Interfaces & APIs**: FastAPI backend exposes RESTful endpoints. Frontend communicates via fetch API. Qdrant uses gRPC/HTTP client SDK.
  - **NFRs and Budgets**: Latency < 2.5s (NFR-001), RAG accuracy ≥ 85% (NFR-002), works on GitHub Pages and local dev (NFR-003), deployable to any platform (NFR-004), responsive on mobile and desktop (NFR-005)
  - **Data Management**: Chat history stored in Postgres with 30-day retention policy (implied by User Story 4). Vector embeddings persisted in Qdrant Cloud Free Tier with no automatic expiration.
  - **Operational Readiness**: Health check endpoint (/health) enables monitoring. Usage logs enable performance analysis and cost tracking.
  - **Risk Analysis & Mitigation**:
    - Risk: OpenAI API rate limits → Mitigation: Rate limiting + queue management (Edge Case)
    - Risk: Qdrant unavailability → Mitigation: Graceful degradation with error messaging (Edge Case)
    - Risk: High latency under load → Mitigation: Performance testing before deployment (SC-006)

- **Project Structure**: This specification will result in the following structure:
  - Backend: `backend/` folder with FastAPI app, ingestion scripts, and database models
  - Frontend: Docusaurus `src/components/`, `src/utils/`, and `static/css/` for chatbot UI
  - Documentation: Setup guides and deployment instructions in `specs/001-rag-chatbot-integration/`
  - Templates: Follows `.specify/templates/spec-template.md` structure

- **Versioning and Governance**: This feature is tracked on branch `001-rag-chatbot-integration`. All changes will be committed with descriptive messages following conventional commit format. PHRs will be created at each major stage (spec, plan, implementation). The specification will be reviewed and approved before proceeding to planning phase.
