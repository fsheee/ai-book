---
id: 005
title: landing-page-personalization-tasks
stage: tasks
date: 2025-12-01T00:00:00Z
surface: claude-code-cli
model: claude-sonnet-4-5
feature: 002-personalization
branch: 002-personalization
user: User
command: /sp.tasks personalization integration not show on landing page
labels: [tasks, personalization, authentication, dashboard, landing-page]
links:
  spec: specs/002-personalization/spec.md
  plan: specs/002-personalization/plan.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/002-personalization/tasks-landing-page-personalization.md
    action: create
    description: Generated comprehensive task breakdown for integrating personalization features into landing page
tests: []
---

## Prompt

User request: "personalization integration not show on landing page"

Context: Landing page currently only displays generic content (About section, Features cards). Need to integrate personalization features so authenticated users see personalized dashboard, and unauthenticated users see login/signup options.

## Response snapshot

**Analysis**:
- Reviewed spec.md: User Stories US1 (Authentication) and US2 (Personalized Dashboard)
- Reviewed plan.md: React components, JWT auth, dashboard with progress/recommendations/chats
- Reviewed current landing page (frontend/src/pages/index.js): Only generic content, no auth integration

**Problem Identified**:
Landing page has no:
1. Authentication state management (no AuthContext)
2. Login/Signup UI components
3. Conditional rendering based on auth status
4. Dashboard components for authenticated users
5. API integration for auth and dashboard data

**Tasks Generated**:
Created `specs/002-personalization/tasks-landing-page-personalization.md` with **46 tasks across 9 phases**:

### Phase 1: Setup & Dependencies (T001-T004)
- Create AuthContext provider for global auth state
- Create useAuth custom hook
- Create auth utility functions for JWT token management
- Wrap app with AuthContext

### Phase 2: Authentication UI Components (T005-T008)
- Create LoginForm component
- Create SignupForm component
- Create AuthModal component
- Add Auth CSS styles

### Phase 3: Dashboard Components (T009-T013)
- Create Dashboard container
- Create ProgressCard (reading progress)
- Create RecommendationsCard (personalized suggestions)
- Create RecentChatsCard (chat history)
- Add Dashboard CSS styles

### Phase 4: Landing Page Integration (T014-T018)
- Add authentication state check
- Add Login/Signup buttons for unauthenticated users
- Replace generic content with Dashboard for authenticated users
- Add user menu/avatar in navbar
- Implement logout functionality

### Phase 5: API Integration (T019-T024)
- Implement login API call (POST /auth/login)
- Implement signup API call (POST /auth/register)
- Implement logout API call (POST /auth/logout)
- Implement dashboard data fetch (GET /dashboard)
- Add axios interceptor for JWT token refresh
- Add error handling for 401 responses

### Phase 6: State Management & Persistence (T025-T029)
- Implement token persistence (localStorage/cookies)
- Add authentication state restoration on page load
- Implement automatic token refresh
- Add loading states for dashboard fetching
- Add error boundaries

### Phase 7: UI Polish & Responsiveness (T030-T035)
- Add responsive styles for mobile (Auth components)
- Add responsive styles for mobile (Dashboard)
- Add loading skeletons
- Add transition animations
- Add error message styling
- Test on mobile devices

### Phase 8: Testing & Validation (T036-T042)
- Test unauthenticated user flow
- Test signup flow
- Test login flow
- Test logout flow
- Test token refresh
- Test API error handling
- Test dashboard data display

### Phase 9: Documentation & Deployment (T043-T046)
- Add inline code comments
- Update IMPLEMENTATION_COMPLETE_SUMMARY.md
- Create git commit
- Push and deploy

**Implementation Details Provided**:
- Full AuthContext provider example with login/signup/logout methods
- useAuth custom hook implementation
- Landing page integration pattern (before/after code)
- Hero section with auth buttons
- Dashboard component structure
- API endpoints specification (backend requirements)
- Testing checklist with 18 test cases

**User Story Mapping**:
- US1 (Authentication): T005-T008, T014-T018, T019-T021, T023-T027
- US2 (Personalized Dashboard): T009-T013, T022, T028-T029, T030-T042

**Dependencies Identified**:
- Backend APIs required: /auth/register, /auth/login, /auth/logout, /auth/refresh, /dashboard
- React context API for state management
- JWT token handling utilities
- Axios interceptors for automatic token refresh

## Outcome

- ✅ Impact: Comprehensive 46-task breakdown for integrating personalization into landing page. Covers authentication UI, dashboard components, API integration, state management, and responsive design.
- 🧪 Tests: 7 testing tasks (T036-T042) covering all auth flows and dashboard display
- 📁 Files: Created 1 file (tasks-landing-page-personalization.md with 9 phases, 46 tasks)
- 🔁 Next prompts: Implement backend APIs first (if not done), then execute frontend tasks starting with Phase 1 (Setup & Dependencies)
- 🧠 Reflection: This is a significant feature requiring both backend and frontend work. Recommended incremental approach: Phase 1-4 with mock data first, then Phase 5 API integration once backend ready.

## Evaluation notes (flywheel)

- Failure modes observed: None - comprehensive task breakdown generated
- Graders run and results (PASS/FAIL): N/A (task generation phase)
- Prompt variant (if applicable): Standard /sp.tasks with natural language issue description
- Next experiment (smallest change to try): Could break down Phase 5 (API Integration) into separate tasks.md if backend APIs not ready, allowing frontend development with mock data

---

## Key Decisions

**Architecture**:
- React Context API for global auth state (simpler than Redux for this scope)
- JWT tokens in httpOnly cookies (more secure than localStorage)
- Conditional rendering at page level (clean separation of auth/unauth states)

**Component Structure**:
- AuthContext: Global state provider
- AuthModal: Login/Signup in modal (better UX than dedicated pages)
- Dashboard: Container for all personalized cards
- Three card types: Progress, Recommendations, Recent Chats

**Implementation Order**:
1. Setup auth infrastructure (Context, hooks, utils)
2. Build UI components (Auth forms, Dashboard cards)
3. Integrate into landing page (conditional rendering)
4. Wire up APIs (backend communication)
5. Add persistence (token storage, refresh)
6. Polish UI (responsive, animations, loading states)
7. Test all flows
8. Deploy

**Success Criteria**:
- Unauthenticated: Generic landing page + Login button
- Authenticated: Personalized dashboard with progress, recommendations, chats
- Smooth auth state transitions
- Mobile-responsive
- Token persistence across reloads

**Estimated Time**: 3-5 days for full implementation (assuming backend APIs exist)
