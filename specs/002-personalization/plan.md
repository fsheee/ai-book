# Implementation Plan: User Personalization & Server Enhancements

**Branch**: `002-personalization` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)

## Summary

Implement comprehensive user personalization system with authentication, reading progress tracking, personalized recommendations, adaptive chatbot responses, bookmarks/highlights, and server improvements. Uses JWT authentication, Neon Postgres for user data, Qdrant for embeddings, FastAPI backend with modular architecture, and React frontend components integrated with Docusaurus.

## Technical Context

**Language/Version**: Python 3.11+ (backend), Node.js 18+ / React 18 (frontend)
**Primary Dependencies**:
- Backend: FastAPI 0.123+, PyJWT 2.8+, bcrypt 4.1+, asyncpg 0.31+, qdrant-client 1.11+, openai 2.8+, redis-py 5.0+ (optional)
- Frontend: React 18, Docusaurus 3.6, axios 1.6+, react-query 5.0+

**Storage**:
- Neon Postgres: User profiles, progress, preferences, chat history, bookmarks, highlights, recommendations
- Qdrant Cloud: Vector embeddings for content-based recommendations (existing)
- Redis: Query cache and session store (optional, fallback to in-memory)

**Testing**: pytest + pytest-asyncio (backend), Jest + React Testing Library (frontend)

**Target Platform**: Web application (Linux server backend, browser-based frontend)

**Project Type**: Web application (existing backend + frontend)

**Performance Goals**:
- Authentication: JWT generation <50ms, validation <10ms
- Progress save: <30s from user activity, 99.9% reliability
- Dashboard load: <1.5s with 100 conversations + 50 bookmarks
- Chat search: <500ms across 1000 conversations
- Recommendation generation: <2s for 3 suggestions
- Health check: <100ms for all services
- Concurrent users: 500 with <500ms avg response time

**Constraints**:
- JWT tokens: 7-day access, 30-day refresh, secure httpOnly cookies
- Password: bcrypt with 12 rounds, min 8 chars + number + special char
- Rate limiting: 5 login attempts per 15min per IP
- Data retention: 365 days chat history, 90 days guest localStorage
- Highlights limit: 500 per user, Bookmarks: 200 per user
- Cache TTL: 1 hour for RAG queries, 24 hours for recommendations

**Scale/Scope**:
- Initial: 100-500 users (MVP phase)
- Growth: 10,000 users within 6 months
- Data volume: ~1KB profile + ~10KB per 100 conversations per user
- 7 new Postgres tables, 15+ new API endpoints, 10+ new React components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Core Principles**: Aligns with AI Agent Responsibilities (no changes to textbook content generation). Follows Spec-Driven Workflow (spec → plan → tasks). RAG Chatbot Constraints respected (adaptive responses adjust style, not source). Incremental Validation enabled (P1 auth → P2 progress → P3 enhancements). Operational Standards maintained (structured directories, PHR creation).

- ✅ **Project Sections**: Addresses RAG Chatbot Development (authentication, chat history, adaptive responses, server improvements). Does not modify AI-Generated Book content (reading progress tracks existing chapters). Uses mandated stack: FastAPI, Neon Postgres, Qdrant Cloud.

- ✅ **Execution Guidelines**: PHR will be created after plan completion. ADRs required for: JWT implementation strategy, recommendation algorithm, caching layer choice, progress tracking mechanism. Task execution will follow spec → plan → tasks workflow.

- ✅ **Architect Guidelines**:
  - Scope & Dependencies: Depends on existing 001-rag-chatbot-integration. New dependencies: PyJWT, bcrypt, redis-py (optional).
  - Interfaces & APIs: REST APIs for auth, progress, preferences, recommendations, bookmarks. JWT tokens in httpOnly cookies.
  - NFRs: Performance goals specified above. Security: password hashing, rate limiting, CORS.
  - Data Management: 365-day retention, GDPR compliance (account deletion flow).
  - Operational Readiness: Health checks, structured logging, monitoring metrics.
  - Risk Analysis: JWT security (short expiry), cache invalidation (TTL + manual refresh), password reset (email verification).

- ✅ **Project Structure**: Follows existing structure (backend/src/, frontend/src/). New routers in backend/src/api/routes/, new components in frontend/src/components/, new models in backend/src/models/.

- ✅ **Versioning and Governance**: Branch 002-personalization follows governance rules. PHR mandatory. ADRs for major decisions. Code review before merge.

**Gate Result**: ✅ PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-personalization/
├── plan.md              # This file
├── research.md          # Phase 0: Technical decisions and rationale
├── data-model.md        # Phase 1: Database schema and relationships
├── quickstart.md        # Phase 1: Testing scenarios
├── contracts/           # Phase 1: API specifications
│   ├── openapi.yaml     # REST API contract (OpenAPI 3.0)
│   └── frontend-api.ts  # TypeScript interface for frontend
├── checklists/          # Quality validation
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2: Implementation tasks (via /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── user.py              # NEW: User, UserPreferences models
│   │   ├── progress.py          # NEW: ReadingProgress model
│   │   ├── chat.py              # EXISTING: ChatHistory model (extend)
│   │   ├── bookmark.py          # NEW: Bookmark, Highlight models
│   │   └── recommendation.py    # NEW: Recommendation model
│   ├── services/
│   │   ├── auth.py              # NEW: Authentication service (JWT, password)
│   │   ├── user.py              # NEW: User management service
│   │   ├── progress.py          # NEW: Progress tracking service
│   │   ├── recommendation.py    # NEW: Recommendation engine
│   │   ├── cache.py             # NEW: Redis/in-memory cache service
│   │   ├── database.py          # EXISTING: Extend with new queries
│   │   └── llm.py               # EXISTING: Extend for adaptive responses
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── auth.py          # EXISTING: Extend with JWT validation
│   │   │   └── rate_limit.py    # EXISTING: Keep as-is
│   │   ├── routes/
│   │   │   ├── auth.py          # NEW: /auth/register, /auth/login, /auth/logout, /auth/refresh
│   │   │   ├── user.py          # NEW: /user/profile, /user/preferences
│   │   │   ├── progress.py      # NEW: /progress/save, /progress/get
│   │   │   ├── recommendations.py # NEW: /recommendations/get, /recommendations/refresh
│   │   │   ├── bookmarks.py     # NEW: /bookmarks/*, /highlights/*
│   │   │   ├── rag.py           # EXISTING: Extend for adaptive responses
│   │   │   └── health.py        # EXISTING: Keep as-is
│   │   └── schemas/
│   │       ├── user.py          # NEW: User request/response schemas
│   │       ├── progress.py      # NEW: Progress request/response schemas
│   │       └── request.py       # EXISTING: Extend with new schemas
│   ├── utils/
│   │   ├── jwt.py               # NEW: JWT token generation/validation
│   │   ├── password.py          # NEW: Password hashing/verification (bcrypt)
│   │   ├── init_db.py           # EXISTING: Extend with new tables
│   │   └── logger.py            # EXISTING: Keep as-is
│   └── main.py                  # EXISTING: Register new routers
├── scripts/
│   ├── init_db.py               # EXISTING: Extend with user tables
│   └── migrate_db.py            # NEW: Database migration script
└── tests/
    ├── unit/
    │   ├── test_auth.py         # NEW: Auth service tests
    │   ├── test_recommendations.py # NEW: Recommendation tests
    │   └── test_jwt.py          # NEW: JWT utility tests
    └── integration/
        ├── test_auth_api.py     # NEW: Auth endpoint tests
        └── test_progress_api.py # NEW: Progress endpoint tests

frontend/
├── src/
│   ├── components/
│   │   ├── Auth/                # NEW: Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   └── AuthModal.jsx
│   │   ├── Dashboard/           # NEW: Personalized dashboard
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProgressCard.jsx
│   │   │   ├── RecommendationsCard.jsx
│   │   │   └── RecentChatsCard.jsx
│   │   ├── ProgressTracker/     # NEW: Reading progress UI
│   │   │   ├── ProgressIndicator.jsx
│   │   │   └── ChapterProgress.jsx
│   │   ├── BookmarksPanel/      # NEW: Bookmarks and highlights
│   │   │   ├── BookmarksPanel.jsx
│   │   │   └── HighlightControls.jsx
│   │   └── RagChatWidget/       # EXISTING: Extend for history/adaptive
│   │       ├── index.jsx        # EXISTING: Keep
│   │       ├── ChatHistory.jsx  # NEW: History panel
│   │       └── DifficultySelector.jsx # NEW: Difficulty level control
│   ├── pages/
│   │   ├── index.js             # EXISTING: Add dashboard for logged-in users
│   │   └── profile/
│   │       └── index.jsx        # NEW: User profile page
│   ├── hooks/
│   │   ├── useAuth.js           # NEW: Authentication hook
│   │   ├── useProgress.js       # NEW: Progress tracking hook
│   │   └── useBookmarks.js      # NEW: Bookmarks management hook
│   ├── utils/
│   │   ├── api.js               # EXISTING: Extend with new endpoints
│   │   ├── auth.js              # NEW: JWT token management
│   │   └── storage.js           # EXISTING: Extend for preferences
│   └── context/
│       └── AuthContext.jsx      # NEW: Global auth state
└── tests/
    └── components/
        ├── Auth.test.jsx        # NEW: Auth component tests
        └── Dashboard.test.jsx   # NEW: Dashboard tests
```

**Structure Decision**: Web application pattern (Option 2) with existing backend/frontend structure. New authentication, progress tracking, and recommendation modules added. Modular routers in backend, component-based architecture in frontend. Follows Docusaurus plugin pattern for integration.

---

## Phase 0: Research & Technical Decisions

### Research Tasks

1. **JWT Implementation Strategy**
   - **Question**: Access token only vs access + refresh token pattern?
   - **Research**: Best practices for web apps, security tradeoffs, token rotation
   - **Decision Point**: Storage (httpOnly cookie vs localStorage), expiration times, refresh mechanism

2. **Password Hashing Strategy**
   - **Question**: bcrypt rounds (10, 12, or 14), salt generation, pepper usage?
   - **Research**: OWASP guidelines, performance impact, future-proofing
   - **Decision Point**: Balance security (higher rounds) vs performance (login latency)

3. **Recommendation Algorithm**
   - **Question**: Rule-based vs ML-based vs hybrid approach?
   - **Research**: Content-based filtering, collaborative filtering, cold start problem
   - **Decision Point**: MVP = simple rules (sequential + gap detection), future = ML

4. **Caching Layer**
   - **Question**: Redis vs in-memory (Python dict) vs no caching?
   - **Research**: Cache invalidation strategies, TTL policies, memory management
   - **Decision Point**: Redis for production, in-memory for development/fallback

5. **Progress Tracking Mechanism**
   - **Question**: Polling (periodic saves) vs WebSocket (real-time) vs hybrid?
   - **Research**: Battery impact on mobile, network overhead, reliability
   - **Decision Point**: Polling every 30s with debounce, future: WebSocket for real-time

6. **Highlight Storage Format**
   - **Question**: DOM offsets vs XPath vs semantic markers?
   - **Research**: Robustness to HTML changes, cross-browser compatibility, performance
   - **Decision Point**: Character offsets (simple, MVP), future: semantic markers

7. **Session Management**
   - **Question**: Stateless JWT-only vs JWT + server-side session tracking?
   - **Research**: Revocation requirements, concurrent device limits, security
   - **Decision Point**: Stateless JWT (scalable), use short expiry + refresh for security

### Output: research.md

Document decisions with:
- **Decision**: What was chosen
- **Rationale**: Why (performance, security, simplicity, cost)
- **Alternatives Considered**: What else was evaluated
- **Implementation Notes**: Key details for developers
- **Future Enhancements**: What to revisit later

---

## Phase 1: Design & Contracts

### Data Model (data-model.md)

**New Tables**:

1. **users**
   - user_id (UUID, PK)
   - email (VARCHAR(255), UNIQUE, NOT NULL)
   - password_hash (VARCHAR(255), NOT NULL)
   - difficulty_level (ENUM: beginner/intermediate/advanced, DEFAULT beginner)
   - is_active (BOOLEAN, DEFAULT true)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - last_login_at (TIMESTAMPTZ)

2. **user_preferences**
   - preference_id (UUID, PK)
   - user_id (UUID, FK → users.user_id, UNIQUE)
   - theme (ENUM: light/dark, DEFAULT light)
   - font_size (ENUM: small/medium/large/extra_large, DEFAULT medium)
   - layout_mode (ENUM: normal/compact, DEFAULT normal)
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

3. **reading_progress**
   - progress_id (UUID, PK)
   - user_id (UUID, FK → users.user_id)
   - chapter_id (VARCHAR(100), NOT NULL)
   - progress_percentage (INTEGER, 0-100)
   - last_position (VARCHAR(500), stores scroll offset or section ID)
   - status (ENUM: unread/in_progress/completed, DEFAULT unread)
   - last_read_at (TIMESTAMPTZ, DEFAULT NOW())
   - UNIQUE(user_id, chapter_id)

4. **recommendations**
   - recommendation_id (UUID, PK)
   - user_id (UUID, FK → users.user_id)
   - chapter_id (VARCHAR(100), NOT NULL)
   - recommendation_type (ENUM: next_chapter/fill_gap/revisit)
   - reasoning (TEXT)
   - priority (INTEGER, 1-3, 1=highest)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())
   - expires_at (TIMESTAMPTZ, for cache invalidation)

5. **bookmarks**
   - bookmark_id (UUID, PK)
   - user_id (UUID, FK → users.user_id)
   - chapter_id (VARCHAR(100), NOT NULL)
   - section_id (VARCHAR(200), NOT NULL)
   - bookmark_text (TEXT, section title)
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

6. **highlights**
   - highlight_id (UUID, PK)
   - user_id (UUID, FK → users.user_id)
   - chapter_id (VARCHAR(100), NOT NULL)
   - highlight_text (TEXT, selected content)
   - start_offset (INTEGER, character position)
   - end_offset (INTEGER, character position)
   - color (VARCHAR(20), DEFAULT 'yellow')
   - created_at (TIMESTAMPTZ, DEFAULT NOW())

7. **chat_history** (extend existing)
   - Add: user_id (UUID, FK → users.user_id, NULL for guests)
   - Add: is_archived (BOOLEAN, DEFAULT false)
   - Keep existing: conversation_id, question_text, answer_text, sources, query_type, created_at

**Indexes**:
- users: email (UNIQUE)
- reading_progress: (user_id, chapter_id), (user_id, status), last_read_at
- recommendations: (user_id, expires_at)
- bookmarks: (user_id, chapter_id)
- highlights: (user_id, chapter_id)
- chat_history: (user_id, created_at), (user_id, is_archived)

### API Contracts (contracts/openapi.yaml)

**Authentication Endpoints**:
- POST /auth/register: Register new user
- POST /auth/login: Login with email/password → returns JWT tokens
- POST /auth/logout: Logout (client-side token deletion)
- POST /auth/refresh: Refresh access token using refresh token
- POST /auth/reset-password: Request password reset email
- POST /auth/reset-password/confirm: Confirm password reset with token

**User Endpoints**:
- GET /user/profile: Get user profile
- PATCH /user/profile: Update profile (difficulty_level)
- GET /user/preferences: Get user preferences
- PATCH /user/preferences: Update preferences (theme, font_size, layout_mode)
- DELETE /user/account: Delete account (GDPR compliance)

**Progress Endpoints**:
- POST /progress/save: Save reading progress
- GET /progress/{chapter_id}: Get progress for specific chapter
- GET /progress/all: Get all progress for user
- GET /progress/stats: Get overall stats (completed count, percentage)

**Recommendation Endpoints**:
- GET /recommendations: Get personalized recommendations (up to 3)
- POST /recommendations/refresh: Manually refresh recommendations

**Bookmark/Highlight Endpoints**:
- POST /bookmarks: Create bookmark
- GET /bookmarks: Get all bookmarks
- DELETE /bookmarks/{bookmark_id}: Delete bookmark
- POST /highlights: Create highlight
- GET /highlights/{chapter_id}: Get highlights for chapter
- DELETE /highlights/{highlight_id}: Delete highlight

**Chat History Endpoints** (extend existing /rag/query):
- GET /chat/history: Get chat history with pagination
- GET /chat/history/search: Search chat history
- DELETE /chat/history/{conversation_id}: Delete conversation
- DELETE /chat/history/all: Clear all history

**Dashboard Endpoint**:
- GET /dashboard: Get personalized dashboard data (progress, recommendations, recent chats, bookmarks)

### Quickstart Scenarios (quickstart.md)

1. **New User Registration & First Login**
2. **Reading Chapter with Progress Tracking**
3. **Viewing Personalized Dashboard**
4. **Using Adaptive Chatbot (Beginner vs Advanced)**
5. **Bookmarking Section and Highlighting Text**
6. **Searching Chat History**
7. **Getting Personalized Recommendations**
8. **Theme Preference Sync Across Devices**

---

## Implementation Strategy

### Phase Priorities

**MVP (P1 + P2)**: 6-8 weeks
1. Authentication & User Management (P1) - Week 1-2
2. Reading Progress Tracking (P2) - Week 3
3. User Preferences Persistence (P2) - Week 3
4. Persistent Chat History (P2) - Week 4
5. Personalized Dashboard (P2) - Week 5
6. Server Improvements (health, logging, caching) - Week 6
7. Testing & Bug Fixes - Week 7-8

**Enhancement (P3)**: 4-6 weeks
1. Personalized Recommendations (P3) - Week 9-10
2. Adaptive Chatbot Responses (P3) - Week 11
3. Bookmarks & Highlights (P3) - Week 12-13
4. Polish & Performance Optimization - Week 14

### Key Milestones

- ✅ Spec Complete (Phase -1)
- ⏳ Plan Complete (Phase 0-1) - Current
- 🔲 Research Complete (Phase 0) - Next: research.md
- 🔲 Design Complete (Phase 1) - Next: data-model.md, contracts/, quickstart.md
- 🔲 Tasks Generated (Phase 2) - Next: /sp.tasks
- 🔲 MVP Implemented (Weeks 1-8)
- 🔲 Enhancement Implemented (Weeks 9-14)
- 🔲 Deployed to Production

### Risk Mitigation

1. **JWT Security**: Use httpOnly cookies, short expiry (7 days), refresh tokens (30 days), HTTPS only
2. **Password Security**: bcrypt with 12 rounds, enforce strong passwords, rate limit login attempts
3. **Cache Invalidation**: Use TTL + manual refresh option, monitor cache hit rate
4. **Database Growth**: Implement archival for old chat history (365 days), monitor storage
5. **Performance Degradation**: Set user limits (500 highlights, 200 bookmarks, 1000 chats), pagination
6. **Recommendation Accuracy**: Start simple (rules), collect feedback, iterate with ML later
7. **GDPR Compliance**: Account deletion flow, data export option (future), 24-hour deletion window

---

**Plan Status**: ✅ Complete (Phases 0-1 documented)
**Next Steps**:
1. Generate research.md with technical decisions
2. Generate data-model.md with full schema
3. Generate contracts/openapi.yaml with API specs
4. Generate quickstart.md with test scenarios
5. Run `/sp.tasks` to create implementation tasks
