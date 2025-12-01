# Tasks: User Personalization & Server Enhancements

**Feature Branch**: `002-personalization`
**Input**: Design documents from `/specs/002-personalization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Constitution Compliance Checklist *(mandatory)*

*GATE: All tasks MUST ensure compliance with the following constitutional principles:*

- ✅ **Core Principles**: Tasks reflect AI Agent Responsibilities, Spec-Driven Workflow Rules, RAG Chatbot Constraints, Incremental Validation, and Operational Standards.
- ✅ **Project Sections**: Tasks contribute to RAG Chatbot Development (authentication, personalization, server improvements).
- ✅ **Execution Guidelines**: Tasks follow spec → plan → tasks workflow. PHR will be created. ADRs required for: JWT implementation, recommendation algorithm, caching strategy, progress tracking.
- ✅ **Architect Guidelines**: Tasks consider scope & dependencies (builds on 001-rag-chatbot-integration), interfaces & APIs (REST + TypeScript), NFRs (performance goals specified), data management (7 new tables, 365-day retention), operational readiness (health checks, logging), risk analysis (JWT security, cache invalidation).
- ✅ **Project Structure**: Tasks respect existing backend/src/ and frontend/src/ structure.
- ✅ **Versioning and Governance**: Branch 002-personalization follows governance. PHR mandatory. ADRs for major decisions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and configuration

- [ ] T001 Install backend dependencies: PyJWT 2.8+, bcrypt 4.1+, redis-py 5.0+ in backend/requirements.txt
- [ ] T002 [P] Install frontend dependencies: @tanstack/react-query 5.0+, axios 1.6+ in frontend/package.json
- [ ] T003 [P] Configure environment variables in .env.example: JWT_SECRET, REDIS_HOST, REDIS_PORT, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
- [ ] T004 [P] Update backend/.gitignore to exclude .env, cookies.txt, *.pyc
- [ ] T005 Create backend/scripts/migrate_db.py for database migration management
- [ ] T006 [P] Create Railway configuration file railway.toml for Redis add-on

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [ ] T007 Create database migration script in backend/scripts/migrations/001_create_users_table.sql
- [ ] T008 [P] Create migration script for user_preferences table in backend/scripts/migrations/002_create_user_preferences.sql
- [ ] T009 [P] Create migration script for reading_progress table in backend/scripts/migrations/003_create_reading_progress.sql
- [ ] T010 [P] Create migration script for recommendations table in backend/scripts/migrations/004_create_recommendations.sql
- [ ] T011 [P] Create migration script for bookmarks table in backend/scripts/migrations/005_create_bookmarks.sql
- [ ] T012 [P] Create migration script for highlights table in backend/scripts/migrations/006_create_highlights.sql
- [ ] T013 [P] Create migration script for password_resets table in backend/scripts/migrations/007_create_password_resets.sql
- [ ] T014 Create migration script to extend chats table in backend/scripts/migrations/008_extend_chats_table.sql
- [ ] T015 Create database indexes script in backend/scripts/migrations/009_create_indexes.sql
- [ ] T016 Create database triggers script in backend/scripts/migrations/010_create_triggers.sql
- [ ] T017 Run all database migrations against Neon Postgres: python backend/scripts/migrate_db.py

### JWT & Authentication Utilities

- [ ] T018 Implement JWT token generation in backend/src/utils/jwt.py (create_access_token, create_refresh_token)
- [ ] T019 Implement JWT token verification in backend/src/utils/jwt.py (verify_access_token, verify_refresh_token)
- [ ] T020 [P] Implement password hashing utilities in backend/src/utils/password.py (hash_password, verify_password, validate_password_strength)
- [ ] T021 Implement authentication dependency in backend/src/api/middleware/auth.py (get_current_user)
- [ ] T022 Add JWT middleware to FastAPI app in backend/src/main.py

### Base Models

- [ ] T023 Create User model in backend/src/models/user.py (user_id, email, password_hash, difficulty_level, token_version, is_active, timestamps)
- [ ] T024 [P] Create UserPreferences model in backend/src/models/user.py (preference_id, user_id, theme, font_size, layout_mode, booleans, timestamps)
- [ ] T025 [P] Create database connection utilities in backend/src/services/database.py (execute_query, execute_many, fetch_one, fetch_all)

### Caching Infrastructure

- [ ] T026 Implement Redis cache manager in backend/src/services/cache.py (CacheManager class with set, get, delete, clear_pattern)
- [ ] T027 Implement in-memory cache fallback in backend/src/services/cache.py (InMemoryCache class with TTL support)
- [ ] T028 Initialize global cache instance in backend/src/services/cache.py (cache = CacheManager())
- [ ] T029 [P] Add cache health check to backend/src/api/routes/health.py

### API Schemas

- [ ] T030 Create authentication request/response schemas in backend/src/api/schemas/user.py (RegisterRequest, LoginRequest, LoginResponse, UserResponse)
- [ ] T031 [P] Create user profile schemas in backend/src/api/schemas/user.py (UserProfile, UserProfileUpdate, UserPreferences, UserPreferencesUpdate)
- [ ] T032 [P] Create error response schema in backend/src/api/schemas/request.py (ErrorResponse)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: US1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to register, log in, log out, and access protected resources with JWT authentication

**Independent Test**: User can register, log in, access profile endpoint, and log out

### Backend Implementation

- [ ] T033 Create authentication service in backend/src/services/auth.py (register_user, authenticate_user, logout_user)
- [ ] T034 Implement password validation logic in backend/src/services/auth.py (check password strength rules)
- [ ] T035 Implement user service in backend/src/services/user.py (get_user_by_id, get_user_by_email, create_user, update_user)
- [ ] T036 Create authentication router in backend/src/api/routes/auth.py with /register endpoint (POST)
- [ ] T037 Add /login endpoint to backend/src/api/routes/auth.py (POST, sets httpOnly cookies)
- [ ] T038 Add /logout endpoint to backend/src/api/routes/auth.py (POST, increments token_version)
- [ ] T039 Add /refresh endpoint to backend/src/api/routes/auth.py (POST, token rotation)
- [ ] T040 Add /me endpoint to backend/src/api/routes/auth.py (GET, returns current user)
- [ ] T041 Add /reset-password endpoint to backend/src/api/routes/auth.py (POST, sends reset email)
- [ ] T042 Add /reset-password/confirm endpoint to backend/src/api/routes/auth.py (POST, resets password with token)
- [ ] T043 Implement rate limiting for login endpoint in backend/src/api/middleware/rate_limit.py (5 attempts per 15 min)
- [ ] T044 Add CORS configuration in backend/src/main.py (allow credentials, whitelist origins)
- [ ] T045 Register auth router in backend/src/main.py
- [ ] T046 Add authentication logging in backend/src/services/auth.py (login attempts, failures, logouts)

### Frontend Implementation

- [ ] T047 Create AuthContext provider in frontend/src/context/AuthContext.jsx (user state, login, logout, refresh)
- [ ] T048 [P] Create useAuth hook in frontend/src/hooks/useAuth.js (access auth context)
- [ ] T049 [P] Create API client utilities in frontend/src/utils/auth.js (token management, automatic refresh)
- [ ] T050 Create LoginForm component in frontend/src/components/Auth/LoginForm.jsx (email, password, submit)
- [ ] T051 [P] Create SignupForm component in frontend/src/components/Auth/SignupForm.jsx (email, password, difficulty_level, submit)
- [ ] T052 [P] Create AuthModal component in frontend/src/components/Auth/AuthModal.jsx (tabs for login/signup)
- [ ] T053 Create ProtectedRoute component in frontend/src/components/Auth/ProtectedRoute.jsx (redirect if not authenticated)
- [ ] T054 Add authentication API methods to frontend/src/utils/api.js (register, login, logout, refresh, me)
- [ ] T055 Implement axios interceptor for automatic token refresh in frontend/src/utils/api.js
- [ ] T056 Add authentication state persistence in frontend/src/context/AuthContext.jsx (check token on app load)
- [ ] T057 Create password strength validator in frontend/src/utils/validation.js (min 8 chars, complexity rules)
- [ ] T058 Add login/logout buttons to site navigation in frontend/src/components/Navigation/index.jsx
- [ ] T059 Wrap app with AuthContext provider in frontend/src/pages/_app.js

### Testing (Optional)

- [ ] T060 [P] Write unit tests for JWT utilities in backend/tests/unit/test_jwt.py (token generation, verification, expiration)
- [ ] T061 [P] Write unit tests for password utilities in backend/tests/unit/test_password.py (hashing, verification, strength validation)
- [ ] T062 Write integration tests for authentication endpoints in backend/tests/integration/test_auth_api.py (register, login, logout, refresh)
- [ ] T063 [P] Write React component tests for Auth forms in frontend/tests/components/Auth.test.jsx (login, signup, validation)

**Checkpoint**: User authentication is fully functional - users can register, log in, and access protected routes

---

## Phase 4: US2 - Reading Progress Tracking (Priority: P2)

**Goal**: Automatically track user reading progress per chapter with resume functionality

**Independent Test**: User reads chapter, progress auto-saves, persists across sessions, resume banner shown

### Backend Implementation

- [ ] T064 Create Progress model in backend/src/models/progress.py (progress_id, user_id, chapter_id, section_id, progress_percentage, time_spent_seconds, status, last_position, timestamps)
- [ ] T065 Create progress service in backend/src/services/progress.py (save_progress, get_progress, get_all_progress, get_stats)
- [ ] T066 Implement progress UPSERT logic in backend/src/services/progress.py (update existing or insert new)
- [ ] T067 Implement status auto-update logic in backend/src/services/progress.py (unread → in_progress → completed at 95%)
- [ ] T068 Create progress request/response schemas in backend/src/api/schemas/progress.py (ProgressUpdate, Progress, ProgressStats)
- [ ] T069 Create progress router in backend/src/api/routes/progress.py with /save endpoint (POST)
- [ ] T070 Add GET /progress/{chapter_id} endpoint to backend/src/api/routes/progress.py
- [ ] T071 Add GET /progress/all endpoint to backend/src/api/routes/progress.py
- [ ] T072 Add GET /progress/stats endpoint to backend/src/api/routes/progress.py (aggregated statistics)
- [ ] T073 Implement background task for async progress save in backend/src/api/routes/progress.py
- [ ] T074 Add progress caching with 5-minute TTL in backend/src/services/progress.py
- [ ] T075 Add cache invalidation on progress update in backend/src/services/progress.py
- [ ] T076 Register progress router in backend/src/main.py
- [ ] T077 Add progress logging in backend/src/services/progress.py

### Frontend Implementation

- [ ] T078 Create useProgressTracking hook in frontend/src/hooks/useProgress.js (auto-save every 30s, debounce 5s, scroll tracking)
- [ ] T079 Implement scroll percentage calculation in frontend/src/hooks/useProgress.js
- [ ] T080 Implement time spent tracking in frontend/src/hooks/useProgress.js
- [ ] T081 Add page unload handler with sendBeacon in frontend/src/hooks/useProgress.js
- [ ] T082 Add visibility change handler for mobile in frontend/src/hooks/useProgress.js
- [ ] T083 Create useResumeProgress hook in frontend/src/hooks/useProgress.js (fetch progress, show banner, auto-scroll)
- [ ] T084 Create ProgressIndicator component in frontend/src/components/ProgressTracker/ProgressIndicator.jsx (circular progress bar)
- [ ] T085 [P] Create ChapterProgress component in frontend/src/components/ProgressTracker/ChapterProgress.jsx (progress list per chapter)
- [ ] T086 Create resume banner component in frontend/src/components/ProgressTracker/ResumeBanner.jsx (resume/dismiss buttons)
- [ ] T087 Add progress API methods to frontend/src/utils/api.js (saveProgress, getProgress, getAllProgress, getStats)
- [ ] T088 Integrate useProgressTracking hook into chapter pages in frontend/src/pages/docs/[...slug].jsx
- [ ] T089 Integrate useResumeProgress hook into chapter pages in frontend/src/pages/docs/[...slug].jsx
- [ ] T090 Add progress indicator to chapter sidebar in frontend/src/components/Sidebar/index.jsx
- [ ] T091 Add progress persistence to localStorage for guest users in frontend/src/utils/storage.js

### Testing (Optional)

- [ ] T092 [P] Write unit tests for progress service in backend/tests/unit/test_progress.py (UPSERT, status transitions, aggregation)
- [ ] T093 Write integration tests for progress endpoints in backend/tests/integration/test_progress_api.py (save, get, stats)
- [ ] T094 [P] Write React hook tests for useProgressTracking in frontend/tests/hooks/useProgress.test.js (auto-save, debounce, unload)

**Checkpoint**: Progress tracking is fully functional - users can track reading, resume where left off

---

## Phase 5: US4 - User Preferences Persistence (Priority: P2)

**Goal**: Enable users to customize theme, font size, layout and persist across devices

**Independent Test**: User changes preferences, logs out, logs in on different device, preferences synced

### Backend Implementation

- [ ] T095 Create user preferences service in backend/src/services/user.py (get_preferences, update_preferences, create_default_preferences)
- [ ] T096 Create user router in backend/src/api/routes/user.py with GET /user/profile endpoint
- [ ] T097 Add PATCH /user/profile endpoint to backend/src/api/routes/user.py (update difficulty_level, email)
- [ ] T098 Add GET /user/preferences endpoint to backend/src/api/routes/user.py
- [ ] T099 Add PATCH /user/preferences endpoint to backend/src/api/routes/user.py (update theme, font_size, layout_mode, booleans)
- [ ] T100 Add DELETE /user/account endpoint to backend/src/api/routes/user.py (GDPR compliance, password confirmation)
- [ ] T101 Implement preferences caching with 1-hour TTL in backend/src/services/user.py
- [ ] T102 Add cache invalidation on preferences update in backend/src/services/user.py
- [ ] T103 Register user router in backend/src/main.py
- [ ] T104 Add preferences logging in backend/src/services/user.py

### Frontend Implementation

- [ ] T105 Create useUserPreferences hook in frontend/src/hooks/usePreferences.js (fetch, update, sync)
- [ ] T106 Create PreferencesPanel component in frontend/src/components/Settings/PreferencesPanel.jsx (theme toggle, font size slider, layout radio)
- [ ] T107 [P] Create ThemeToggle component in frontend/src/components/Settings/ThemeToggle.jsx (light/dark/auto)
- [ ] T108 [P] Create FontSizeControl component in frontend/src/components/Settings/FontSizeControl.jsx (small/medium/large/extra_large)
- [ ] T109 [P] Create LayoutModeControl component in frontend/src/components/Settings/LayoutModeControl.jsx (normal/compact/comfortable)
- [ ] T110 Implement theme application in frontend/src/utils/theme.js (CSS variables, localStorage sync)
- [ ] T111 Add preferences API methods to frontend/src/utils/api.js (getPreferences, updatePreferences)
- [ ] T112 Create user profile page in frontend/src/pages/profile/index.jsx (profile info, preferences panel, account actions)
- [ ] T113 Add preferences persistence to localStorage for guest users in frontend/src/utils/storage.js
- [ ] T114 Apply theme on app initialization in frontend/src/pages/_app.js
- [ ] T115 Add font size CSS variables to frontend/src/styles/globals.css
- [ ] T116 Add layout mode CSS classes to frontend/src/styles/globals.css

### Testing (Optional)

- [ ] T117 [P] Write unit tests for preferences service in backend/tests/unit/test_user.py (get, update, defaults)
- [ ] T118 Write integration tests for preferences endpoints in backend/tests/integration/test_user_api.py (get, update, sync)
- [ ] T119 [P] Write React component tests for PreferencesPanel in frontend/tests/components/Settings.test.jsx (toggle, update, sync)

**Checkpoint**: User preferences are fully functional - users can customize UI, preferences sync across devices

---

## Phase 6: US5 - Persistent Chat History (Priority: P2)

**Goal**: Save chat history for authenticated users with search and pagination

**Independent Test**: User asks questions, history saved, searchable, paginated, can delete/archive

### Backend Implementation

- [ ] T120 Extend chat service to save user_id_auth in backend/src/services/chat.py (link chats to authenticated users)
- [ ] T121 Create chat history service in backend/src/services/chat.py (get_history, search_history, delete_chat, archive_chat, clear_all)
- [ ] T122 Implement full-text search for chat history in backend/src/services/chat.py (PostgreSQL text search)
- [ ] T123 Implement pagination for chat history in backend/src/services/chat.py (limit, offset)
- [ ] T124 Create chat request/response schemas in backend/src/api/schemas/chat.py (ChatSession, ChatMessage, ChatHistoryResponse, ChatSearchResponse)
- [ ] T125 Create chat router in backend/src/api/routes/chat.py with GET /chat/history endpoint (pagination, include_archived)
- [ ] T126 Add GET /chat/history/search endpoint to backend/src/api/routes/chat.py (full-text search)
- [ ] T127 Add DELETE /chat/history/{chat_id} endpoint to backend/src/api/routes/chat.py
- [ ] T128 Add PATCH /chat/history/{chat_id} endpoint to backend/src/api/routes/chat.py (archive/unarchive)
- [ ] T129 Add DELETE /chat/history/all endpoint to backend/src/api/routes/chat.py (confirmation required)
- [ ] T130 Implement chat history caching with 1-hour TTL in backend/src/services/chat.py
- [ ] T131 Add cache invalidation on chat operations in backend/src/services/chat.py
- [ ] T132 Register chat router in backend/src/main.py
- [ ] T133 Extend existing RAG endpoint to save chat history for authenticated users in backend/src/api/routes/rag.py
- [ ] T134 Add cleanup job for old chat history in backend/scripts/cleanup_chats.py (delete archived chats > 365 days, guest chats > 90 days)

### Frontend Implementation

- [ ] T135 Create useChatHistory hook in frontend/src/hooks/useChatHistory.js (fetch, search, delete, archive)
- [ ] T136 Create ChatHistory component in frontend/src/components/RagChatWidget/ChatHistory.jsx (list of chat sessions, pagination)
- [ ] T137 [P] Create ChatSessionCard component in frontend/src/components/RagChatWidget/ChatSessionCard.jsx (preview, date, message count, delete/archive buttons)
- [ ] T138 [P] Create ChatSearchBar component in frontend/src/components/RagChatWidget/ChatSearchBar.jsx (search input, results list)
- [ ] T139 Add chat history panel to RagChatWidget in frontend/src/components/RagChatWidget/index.jsx (collapsible sidebar)
- [ ] T140 Add chat history API methods to frontend/src/utils/api.js (getHistory, searchHistory, deleteChat, updateChat, clearAll)
- [ ] T141 Implement chat history pagination in frontend/src/components/RagChatWidget/ChatHistory.jsx (load more button)
- [ ] T142 Add confirmation dialog for chat deletion in frontend/src/components/RagChatWidget/ChatHistory.jsx
- [ ] T143 Add chat history persistence to localStorage for guest users in frontend/src/utils/storage.js (90-day retention)

### Testing (Optional)

- [ ] T144 [P] Write unit tests for chat history service in backend/tests/unit/test_chat.py (search, pagination, archive)
- [ ] T145 Write integration tests for chat history endpoints in backend/tests/integration/test_chat_api.py (history, search, delete, archive)
- [ ] T146 [P] Write React component tests for ChatHistory in frontend/tests/components/ChatHistory.test.jsx (list, search, delete)

**Checkpoint**: Chat history is fully functional - users can view, search, and manage conversation history

---

## Phase 7: US8 - Personalized Dashboard (Priority: P2)

**Goal**: Provide aggregated dashboard with progress stats, recommendations, recent bookmarks, recent chats

**Independent Test**: User views dashboard, sees progress stats, recommendations, recent activity

### Backend Implementation

- [ ] T147 Create dashboard service in backend/src/services/dashboard.py (aggregate_dashboard_data)
- [ ] T148 Implement dashboard data aggregation in backend/src/services/dashboard.py (user profile, progress stats, recent progress, recommendations, bookmarks, chats)
- [ ] T149 Create dashboard schema in backend/src/api/schemas/dashboard.py (Dashboard with nested objects)
- [ ] T150 Create dashboard router in backend/src/api/routes/dashboard.py with GET /dashboard endpoint
- [ ] T151 Implement dashboard caching with 5-minute TTL in backend/src/services/dashboard.py
- [ ] T152 Optimize dashboard queries with database joins in backend/src/services/dashboard.py
- [ ] T153 Add dashboard performance logging in backend/src/services/dashboard.py (query times)
- [ ] T154 Register dashboard router in backend/src/main.py

### Frontend Implementation

- [ ] T155 Create useDashboard hook in frontend/src/hooks/useDashboard.js (fetch dashboard data)
- [ ] T156 Create Dashboard page component in frontend/src/pages/dashboard/index.jsx (main dashboard layout)
- [ ] T157 [P] Create ProgressCard component in frontend/src/components/Dashboard/ProgressCard.jsx (completion percentage, time spent, chart)
- [ ] T158 [P] Create RecommendationsCard component in frontend/src/components/Dashboard/RecommendationsCard.jsx (top 3 recommendations, reasoning)
- [ ] T159 [P] Create RecentChatsCard component in frontend/src/components/Dashboard/RecentChatsCard.jsx (last 5 chats, previews)
- [ ] T160 [P] Create RecentBookmarksCard component in frontend/src/components/Dashboard/RecentBookmarksCard.jsx (last 10 bookmarks)
- [ ] T161 [P] Create WelcomeBanner component in frontend/src/components/Dashboard/WelcomeBanner.jsx (user greeting, streak info)
- [ ] T162 Create dashboard grid layout in frontend/src/components/Dashboard/DashboardGrid.jsx (responsive grid)
- [ ] T163 Add dashboard API method to frontend/src/utils/api.js (getDashboard)
- [ ] T164 Add dashboard link to site navigation in frontend/src/components/Navigation/index.jsx
- [ ] T165 Add dashboard loading skeleton in frontend/src/components/Dashboard/DashboardSkeleton.jsx
- [ ] T166 Implement dashboard auto-refresh on user activity in frontend/src/pages/dashboard/index.jsx

### Testing (Optional)

- [ ] T167 [P] Write unit tests for dashboard service in backend/tests/unit/test_dashboard.py (aggregation, performance)
- [ ] T168 Write integration tests for dashboard endpoint in backend/tests/integration/test_dashboard_api.py (complete data, performance)
- [ ] T169 [P] Write React component tests for Dashboard in frontend/tests/components/Dashboard.test.jsx (cards, grid, loading)

**Checkpoint**: Dashboard is fully functional - users see personalized homepage with all activity

---

## Phase 8: US3 - Personalized Recommendations (Priority: P3)

**Goal**: Generate personalized chapter recommendations using rule-based algorithm (sequential, gap, revisit)

**Independent Test**: User with progress gets recommendations, different strategies shown, manual refresh works

### Backend Implementation

- [ ] T170 Create Recommendation model in backend/src/models/recommendation.py (recommendation_id, user_id, chapter_id, recommendation_type, reasoning, priority, score, created_at, expires_at)
- [ ] T171 Create recommendation service in backend/src/services/recommendation.py (RecommendationEngine class)
- [ ] T172 Implement sequential recommendation strategy in backend/src/services/recommendation.py (next unread chapter)
- [ ] T173 Implement gap detection strategy in backend/src/services/recommendation.py (skipped chapters)
- [ ] T174 Implement chat-based revisit strategy in backend/src/services/recommendation.py (chapters with 3+ questions)
- [ ] T175 Implement recommendation deduplication in backend/src/services/recommendation.py (unique chapters)
- [ ] T176 Implement recommendation sorting by priority in backend/src/services/recommendation.py (1=highest)
- [ ] T177 Create recommendation schemas in backend/src/api/schemas/recommendation.py (Recommendation, RecommendationsResponse)
- [ ] T178 Create recommendations router in backend/src/api/routes/recommendations.py with GET /recommendations endpoint (limit parameter)
- [ ] T179 Add POST /recommendations/refresh endpoint to backend/src/api/routes/recommendations.py (clear cache, regenerate)
- [ ] T180 Implement recommendations caching with 24-hour TTL in backend/src/services/recommendation.py
- [ ] T181 Add cache invalidation on progress update in backend/src/services/recommendation.py
- [ ] T182 Register recommendations router in backend/src/main.py
- [ ] T183 Add recommendations logging in backend/src/services/recommendation.py (strategies used, scores)
- [ ] T184 Create cleanup job for expired recommendations in backend/scripts/cleanup_recommendations.py (delete where expires_at < NOW)

### Frontend Implementation

- [ ] T185 Create useRecommendations hook in frontend/src/hooks/useRecommendations.js (fetch, refresh)
- [ ] T186 Create RecommendationCard component in frontend/src/components/Recommendations/RecommendationCard.jsx (chapter title, reasoning, strategy badge, start button)
- [ ] T187 [P] Create RecommendationsList component in frontend/src/components/Recommendations/RecommendationsList.jsx (grid of cards, empty state)
- [ ] T188 [P] Create RecommendationsPanel component in frontend/src/components/Recommendations/RecommendationsPanel.jsx (recommendations list, refresh button)
- [ ] T189 Add recommendations API methods to frontend/src/utils/api.js (getRecommendations, refreshRecommendations)
- [ ] T190 Add recommendations section to dashboard in frontend/src/pages/dashboard/index.jsx
- [ ] T191 Add strategy icons/badges to recommendation cards in frontend/src/components/Recommendations/RecommendationCard.jsx (→ sequential, ⚠ gap, 💬 revisit)
- [ ] T192 Add refresh recommendations button with loading state in frontend/src/components/Recommendations/RecommendationsPanel.jsx

### Testing (Optional)

- [ ] T193 [P] Write unit tests for recommendation engine in backend/tests/unit/test_recommendation.py (sequential, gap, revisit, deduplication)
- [ ] T194 Write integration tests for recommendations endpoints in backend/tests/integration/test_recommendations_api.py (get, refresh, caching)
- [ ] T195 [P] Write React component tests for Recommendations in frontend/tests/components/Recommendations.test.jsx (cards, list, refresh)

**Checkpoint**: Recommendations are fully functional - users get personalized chapter suggestions

---

## Phase 9: US6 - Adaptive Chatbot Responses (Priority: P3)

**Goal**: Adjust chatbot response complexity based on user difficulty level

**Independent Test**: User with beginner level gets simple responses, advanced level gets technical responses

### Backend Implementation

- [ ] T196 Extend RAG service to include difficulty level in backend/src/services/llm.py (pass user.difficulty_level to prompt)
- [ ] T197 Create adaptive prompt templates in backend/src/services/llm.py (beginner: simple analogies, advanced: technical notation)
- [ ] T198 Implement prompt selection logic in backend/src/services/llm.py (select template based on difficulty_level)
- [ ] T199 Add difficulty level to chat history in backend/src/services/chat.py (store response complexity)
- [ ] T200 Extend RAG query endpoint to include difficulty level in response in backend/src/api/routes/rag.py

### Frontend Implementation

- [ ] T201 Add difficulty level selector to RagChatWidget in frontend/src/components/RagChatWidget/DifficultySelector.jsx (beginner/intermediate/advanced toggle)
- [ ] T202 Update RAG query to include user difficulty level in frontend/src/components/RagChatWidget/index.jsx
- [ ] T203 Add visual indicator for response complexity in frontend/src/components/RagChatWidget/ChatMessage.jsx (difficulty badge)
- [ ] T204 Add difficulty level explanation tooltip in frontend/src/components/RagChatWidget/DifficultySelector.jsx

### Testing (Optional)

- [ ] T205 [P] Write unit tests for adaptive prompts in backend/tests/unit/test_llm.py (beginner, intermediate, advanced)
- [ ] T206 Write integration tests for adaptive RAG in backend/tests/integration/test_rag_api.py (difficulty levels, response complexity)

**Checkpoint**: Adaptive chatbot is fully functional - responses match user skill level

---

## Phase 10: US7 - Bookmarks & Highlights (Priority: P3)

**Goal**: Enable users to bookmark sections and highlight text with notes

**Independent Test**: User bookmarks section, highlights text with color, persists across sessions, viewable in sidebar

### Backend Implementation

- [ ] T207 Create Bookmark model in backend/src/models/bookmark.py (bookmark_id, user_id, chapter_id, section_id, bookmark_text, notes, timestamps)
- [ ] T208 Create Highlight model in backend/src/models/highlight.py (highlight_id, user_id, chapter_id, highlighted_text, start_offset, end_offset, color, notes, timestamps)
- [ ] T209 Create bookmark service in backend/src/services/bookmark.py (create_bookmark, get_bookmarks, get_bookmark_by_id, update_bookmark, delete_bookmark)
- [ ] T210 Create highlight service in backend/src/services/highlight.py (create_highlight, get_highlights, get_highlight_by_id, update_highlight, delete_highlight)
- [ ] T211 Implement bookmark limit enforcement in backend/src/services/bookmark.py (max 200 per user)
- [ ] T212 Implement highlight limit enforcement in backend/src/services/highlight.py (max 500 per user)
- [ ] T213 Create bookmark schemas in backend/src/api/schemas/bookmark.py (BookmarkCreate, Bookmark, BookmarkUpdate, BookmarksResponse)
- [ ] T214 Create highlight schemas in backend/src/api/schemas/highlight.py (HighlightCreate, Highlight, HighlightUpdate, HighlightsResponse)
- [ ] T215 Create bookmarks router in backend/src/api/routes/bookmarks.py with GET /bookmarks endpoint (chapter_id filter)
- [ ] T216 Add POST /bookmarks endpoint to backend/src/api/routes/bookmarks.py (create bookmark)
- [ ] T217 Add PATCH /bookmarks/{bookmark_id} endpoint to backend/src/api/routes/bookmarks.py (update notes)
- [ ] T218 Add DELETE /bookmarks/{bookmark_id} endpoint to backend/src/api/routes/bookmarks.py
- [ ] T219 Create highlights router in backend/src/api/routes/highlights.py with GET /highlights endpoint (chapter_id filter)
- [ ] T220 Add GET /highlights/{chapter_id} endpoint to backend/src/api/routes/highlights.py (chapter-specific)
- [ ] T221 Add POST /highlights endpoint to backend/src/api/routes/highlights.py (create highlight)
- [ ] T222 Add PATCH /highlights/{highlight_id} endpoint to backend/src/api/routes/highlights.py (update color/notes)
- [ ] T223 Add DELETE /highlights/{highlight_id} endpoint to backend/src/api/routes/highlights.py
- [ ] T224 Register bookmarks router in backend/src/main.py
- [ ] T225 Register highlights router in backend/src/main.py
- [ ] T226 Add bookmarks/highlights logging in backend/src/services/bookmark.py and backend/src/services/highlight.py

### Frontend Implementation

- [ ] T227 Create useBookmarks hook in frontend/src/hooks/useBookmarks.js (fetch, create, update, delete)
- [ ] T228 Create useHighlights hook in frontend/src/hooks/useHighlights.js (fetch, create, update, delete)
- [ ] T229 Create BookmarksPanel component in frontend/src/components/BookmarksPanel/index.jsx (list of bookmarks, grouped by chapter)
- [ ] T230 [P] Create BookmarkCard component in frontend/src/components/BookmarksPanel/BookmarkCard.jsx (section title, notes, navigation, delete button)
- [ ] T231 [P] Create HighlightControls component in frontend/src/components/BookmarksPanel/HighlightControls.jsx (color picker, notes textarea)
- [ ] T232 Implement text selection handling in frontend/src/utils/highlights.js (getCharacterOffset, createRangeFromOffsets)
- [ ] T233 Implement highlight creation on text selection in frontend/src/components/BookmarksPanel/HighlightPopup.jsx (color picker popup)
- [ ] T234 Implement highlight rendering on page load in frontend/src/utils/highlights.js (apply <mark> tags, text verification)
- [ ] T235 Add highlight deletion on right-click in frontend/src/components/BookmarksPanel/HighlightContextMenu.jsx
- [ ] T236 Add bookmarks API methods to frontend/src/utils/api.js (getBookmarks, createBookmark, updateBookmark, deleteBookmark)
- [ ] T237 Add highlights API methods to frontend/src/utils/api.js (getHighlights, getChapterHighlights, createHighlight, updateHighlight, deleteHighlight)
- [ ] T238 Add highlight CSS styles to frontend/src/styles/highlights.css (colors: yellow, green, pink, blue, purple)
- [ ] T239 Add bookmarks/highlights panel toggle to chapter sidebar in frontend/src/components/Sidebar/index.jsx
- [ ] T240 Integrate bookmarks/highlights into chapter pages in frontend/src/pages/docs/[...slug].jsx
- [ ] T241 Add bookmark button to chapter sections in frontend/src/components/ChapterContent/SectionHeader.jsx

### Testing (Optional)

- [ ] T242 [P] Write unit tests for bookmark service in backend/tests/unit/test_bookmark.py (create, get, update, delete, limit)
- [ ] T243 [P] Write unit tests for highlight service in backend/tests/unit/test_highlight.py (create, get, update, delete, limit, offsets)
- [ ] T244 Write integration tests for bookmarks endpoints in backend/tests/integration/test_bookmarks_api.py (CRUD, limit enforcement)
- [ ] T245 Write integration tests for highlights endpoints in backend/tests/integration/test_highlights_api.py (CRUD, limit enforcement, text verification)
- [ ] T246 [P] Write React component tests for BookmarksPanel in frontend/tests/components/BookmarksPanel.test.jsx (list, create, delete)
- [ ] T247 [P] Write unit tests for highlight utilities in frontend/tests/utils/highlights.test.js (offset calculation, range creation, text verification)

**Checkpoint**: Bookmarks and highlights are fully functional - users can mark sections and highlight text

---

## Phase 11: Server Improvements (Monitoring, Health, Logging)

**Purpose**: Enhance server reliability, performance, and observability

- [ ] T248 Extend health check endpoint in backend/src/api/routes/health.py (check database, Redis, Qdrant)
- [ ] T249 Add database health check in backend/src/api/routes/health.py (query test, connection pool status)
- [ ] T250 Add Redis health check in backend/src/api/routes/health.py (ping, cache stats)
- [ ] T251 Add Qdrant health check in backend/src/api/routes/health.py (collection exists, count vectors)
- [ ] T252 Implement structured logging in backend/src/utils/logger.py (JSON logs, log levels, request IDs)
- [ ] T253 Add request logging middleware in backend/src/api/middleware/logging.py (log all requests, response times)
- [ ] T254 Add error logging middleware in backend/src/api/middleware/error_handler.py (log exceptions, stack traces)
- [ ] T255 Implement monitoring metrics endpoint in backend/src/api/routes/metrics.py (request count, error rate, response times)
- [ ] T256 Add performance monitoring for slow queries in backend/src/services/database.py (log queries > 100ms)
- [ ] T257 Add cache hit/miss rate monitoring in backend/src/services/cache.py (log cache performance)
- [ ] T258 Implement graceful shutdown in backend/src/main.py (close connections, flush logs)
- [ ] T259 Add CORS security headers in backend/src/main.py (Content-Security-Policy, X-Frame-Options)
- [ ] T260 Add rate limiting for all endpoints in backend/src/api/middleware/rate_limit.py (100 req/min per IP)
- [ ] T261 Create monitoring dashboard page in frontend/src/pages/admin/monitoring.jsx (health status, metrics charts)

---

## Phase 12: Polish & Testing

**Purpose**: Final improvements, documentation, and comprehensive testing

### Documentation

- [ ] T262 [P] Update API documentation in docs/api/README.md (all endpoints, schemas, authentication)
- [ ] T263 [P] Create user guide in docs/user-guide.md (authentication, progress tracking, preferences, bookmarks, highlights, recommendations)
- [ ] T264 [P] Update deployment guide in docs/deployment.md (Railway setup, Redis configuration, environment variables)
- [ ] T265 Create troubleshooting guide in docs/troubleshooting.md (common issues, solutions)

### Code Quality

- [ ] T266 [P] Add type hints to all Python functions in backend/src/ (use mypy for validation)
- [ ] T267 [P] Add JSDoc comments to all JavaScript functions in frontend/src/
- [ ] T268 Run linting and formatting on backend code: black, flake8, isort in backend/
- [ ] T269 Run linting and formatting on frontend code: eslint, prettier in frontend/
- [ ] T270 Remove unused imports and dead code in backend/src/ and frontend/src/

### Performance Optimization

- [ ] T271 [P] Optimize database queries with EXPLAIN ANALYZE in backend/src/services/
- [ ] T272 [P] Add database connection pooling in backend/src/services/database.py (max 20 connections)
- [ ] T273 Implement query result caching for expensive queries in backend/src/services/
- [ ] T274 Add database indexes for frequently queried columns in backend/scripts/migrations/
- [ ] T275 Optimize frontend bundle size with code splitting in frontend/next.config.js
- [ ] T276 Add lazy loading for heavy components in frontend/src/pages/
- [ ] T277 Implement image optimization in frontend/next.config.js

### End-to-End Testing

- [ ] T278 Write E2E test for complete user journey in backend/tests/e2e/test_user_journey.py (register → login → read → bookmark → logout)
- [ ] T279 [P] Write E2E test for progress tracking in backend/tests/e2e/test_progress_flow.py (read chapter → progress saved → resume)
- [ ] T280 [P] Write E2E test for recommendations in backend/tests/e2e/test_recommendations_flow.py (read chapters → skip chapter → get gap recommendation)
- [ ] T281 [P] Write E2E test for bookmarks/highlights in backend/tests/e2e/test_bookmarks_flow.py (bookmark section → highlight text → persist)
- [ ] T282 [P] Write E2E test for adaptive chatbot in backend/tests/e2e/test_adaptive_chatbot.py (beginner response → change to advanced → advanced response)
- [ ] T283 Run quickstart.md validation scenarios in backend/tests/e2e/test_quickstart_scenarios.py (all 8 scenarios)

### Performance Testing

- [ ] T284 Run load test with 500 concurrent users using locust in backend/tests/load/locustfile.py
- [ ] T285 [P] Measure dashboard load time in backend/tests/performance/test_dashboard_performance.py (target: < 1.5s)
- [ ] T286 [P] Measure progress save latency in backend/tests/performance/test_progress_performance.py (target: < 100ms)
- [ ] T287 [P] Measure chat history search performance in backend/tests/performance/test_chat_search_performance.py (target: < 500ms for 1000 chats)
- [ ] T288 [P] Measure recommendations generation time in backend/tests/performance/test_recommendations_performance.py (target: < 2s)

### Security Audit

- [ ] T289 [P] Run OWASP security checklist in docs/security/owasp-checklist.md (authentication, authorization, input validation)
- [ ] T290 [P] Test JWT security in backend/tests/security/test_jwt_security.py (token expiration, token rotation, revocation)
- [ ] T291 [P] Test password security in backend/tests/security/test_password_security.py (hashing strength, brute-force protection)
- [ ] T292 [P] Test CORS configuration in backend/tests/security/test_cors.py (allowed origins, credentials)
- [ ] T293 [P] Test rate limiting in backend/tests/security/test_rate_limiting.py (login attempts, API requests)
- [ ] T294 Test SQL injection protection in backend/tests/security/test_sql_injection.py (parameterized queries)
- [ ] T295 [P] Test XSS protection in frontend/tests/security/test_xss_protection.test.jsx (input sanitization, content escaping)

### Deployment Preparation

- [ ] T296 Create Docker Compose configuration in docker-compose.yml (backend, frontend, Redis, Postgres)
- [ ] T297 Create Dockerfile for backend in backend/Dockerfile
- [ ] T298 [P] Create Dockerfile for frontend in frontend/Dockerfile
- [ ] T299 Create Railway configuration for production in railway.toml (services, environment variables)
- [ ] T300 Create CI/CD pipeline in .github/workflows/deploy.yml (test → build → deploy)
- [ ] T301 Create database backup script in backend/scripts/backup_db.sh
- [ ] T302 Create rollback procedure in docs/deployment/rollback.md
- [ ] T303 Setup environment variables in Railway dashboard (JWT_SECRET, DATABASE_URL, REDIS_URL, QDRANT_URL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - Can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Server Improvements (Phase 11)**: Can proceed in parallel with user stories
- **Polish & Testing (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 - Authentication (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 - Progress (P2)**: Can start after Foundational - No dependencies on other stories
- **US4 - Preferences (P2)**: Can start after Foundational - No dependencies on other stories
- **US5 - Chat History (P2)**: Can start after Foundational - No dependencies on other stories
- **US8 - Dashboard (P2)**: Depends on US1, US2, US5 (aggregates their data)
- **US3 - Recommendations (P3)**: Depends on US2 (needs progress data), US5 (needs chat data)
- **US6 - Adaptive Chatbot (P3)**: Depends on US1 (needs difficulty_level)
- **US7 - Bookmarks/Highlights (P3)**: Can start after Foundational - No dependencies on other stories

### Critical Path

1. **Phase 1: Setup** (T001-T006) → 6 tasks
2. **Phase 2: Foundational** (T007-T032) → 26 tasks (CRITICAL - blocks all)
3. **Phase 3: US1 Authentication** (T033-T063) → 31 tasks (P1, MVP)
4. **Phase 4: US2 Progress** (T064-T094) → 31 tasks (P2, MVP)
5. **Phase 5: US4 Preferences** (T095-T119) → 25 tasks (P2, MVP)
6. **Phase 6: US5 Chat History** (T120-T146) → 27 tasks (P2, MVP)
7. **Phase 7: US8 Dashboard** (T147-T169) → 23 tasks (P2, MVP) - requires US1, US2, US5
8. **Phase 8: US3 Recommendations** (T170-T195) → 26 tasks (P3) - requires US2, US5
9. **Phase 9: US6 Adaptive Chatbot** (T196-T206) → 11 tasks (P3) - requires US1
10. **Phase 10: US7 Bookmarks/Highlights** (T207-T247) → 41 tasks (P3)
11. **Phase 11: Server Improvements** (T248-T261) → 14 tasks (parallel with user stories)
12. **Phase 12: Polish & Testing** (T262-T303) → 42 tasks (final phase)

**Total Tasks**: 303

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T004, T005)
- All Foundational tasks marked [P] can run in parallel within Phase 2 (T008-T013, T020, T024, T029, T031-T032)
- Once Foundational completes:
  - US1, US2, US4, US5, US7 can all start in parallel (independent)
  - US8 must wait for US1, US2, US5
  - US3 must wait for US2, US5
  - US6 must wait for US1
- Phase 11 (Server Improvements) can run in parallel with user stories
- All testing tasks marked [P] can run in parallel within Phase 12

---

## Implementation Strategy

### MVP First (P1 + P2 User Stories)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T032) - CRITICAL
3. Complete Phase 3: US1 Authentication (T033-T063)
4. Complete Phase 4: US2 Progress (T064-T094)
5. Complete Phase 5: US4 Preferences (T095-T119)
6. Complete Phase 6: US5 Chat History (T120-T146)
7. Complete Phase 7: US8 Dashboard (T147-T169)
8. **STOP and VALIDATE**: Test all MVP features independently
9. Deploy MVP to production

**MVP Task Count**: T001-T169 = 169 tasks

### Enhancement Phase (P3 User Stories)

10. Complete Phase 8: US3 Recommendations (T170-T195)
11. Complete Phase 9: US6 Adaptive Chatbot (T196-T206)
12. Complete Phase 10: US7 Bookmarks/Highlights (T207-T247)
13. **STOP and VALIDATE**: Test all enhanced features independently
14. Deploy enhanced version to production

**Enhancement Task Count**: T170-T247 = 78 tasks

### Final Polish

15. Complete Phase 11: Server Improvements (T248-T261)
16. Complete Phase 12: Polish & Testing (T262-T303)
17. **FINAL VALIDATION**: Run all E2E tests, performance tests, security audits
18. Deploy production-ready version

**Polish Task Count**: T248-T303 = 56 tasks

### Parallel Team Strategy

With 4 developers after Foundational phase (T032) completes:

- **Developer A**: US1 Authentication (T033-T063)
- **Developer B**: US2 Progress (T064-T094)
- **Developer C**: US4 Preferences (T095-T119)
- **Developer D**: US5 Chat History (T120-T146)
- **Everyone**: US8 Dashboard (T147-T169) - integrates all

Then:

- **Developer A**: US3 Recommendations (T170-T195)
- **Developer B**: US6 Adaptive Chatbot (T196-T206) + Server Improvements (T248-T261)
- **Developer C**: US7 Bookmarks (T207-T226)
- **Developer D**: US7 Highlights (T227-T247)

Finally:

- **Everyone**: Polish & Testing (T262-T303)

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[US#]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Tests are OPTIONAL**: Only included if explicitly requested in specification
- Total tasks (T001-T303): **303 tasks** ensures comprehensive coverage beyond T200
- Tasks T150-T200 fall in **Phase 7-9** (Dashboard, Recommendations, Adaptive Chatbot)

---

**Tasks Status**: Complete (303 tasks generated)
**Last Updated**: 2025-12-01
**Next Step**: Begin implementation starting with Phase 1 (Setup)
