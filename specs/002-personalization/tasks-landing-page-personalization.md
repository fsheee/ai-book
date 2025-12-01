# Tasks: Landing Page Personalization Integration

**Feature**: Display personalized user dashboard and auth UI on landing page
**Branch**: `002-personalization`
**Date**: 2025-12-01

## Issue

Landing page currently shows generic content only. Need to integrate personalization features:
- Login/Signup buttons for unauthenticated users
- Personalized dashboard for authenticated users (reading progress, recommendations, recent chats)
- Smooth authentication state management

## Solution

Integrate auth components and personalized dashboard into `frontend/src/pages/index.js`, conditionally rendering based on authentication status.

---

## Constitution Compliance Checklist *(mandatory)*

- ✅ **Core Principles**: Implements user personalization following Spec-Driven Workflow
- ✅ **Project Sections**: Enhances RAG Chatbot Development with user authentication UI
- ✅ **Execution Guidelines**: Incremental approach, P1 auth first
- ✅ **Architect Guidelines**: REST API integration, JWT auth, React state management
- ✅ **Project Structure**: Follows frontend/src/ component structure
- ✅ **Versioning and Governance**: Branch 002-personalization, PHR creation

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story reference (US1 = Authentication)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Dependencies

**Purpose**: Set up authentication context and utilities

- [ ] T001 [P] Create AuthContext provider in frontend/src/context/AuthContext.jsx
- [ ] T002 [P] Create useAuth custom hook in frontend/src/hooks/useAuth.js
- [ ] T003 [P] Create auth utility functions in frontend/src/utils/auth.js (JWT token management)
- [ ] T004 Wrap app with AuthContext in frontend/src/pages/index.js or App-level

**Checkpoint**: Auth infrastructure ready for component integration

---

## Phase 2: Authentication UI Components

**Purpose**: Create login/signup UI components

- [ ] T005 [P] [US1] Create LoginForm component in frontend/src/components/Auth/LoginForm.jsx
- [ ] T006 [P] [US1] Create SignupForm component in frontend/src/components/Auth/SignupForm.jsx
- [ ] T007 [P] [US1] Create AuthModal component in frontend/src/components/Auth/AuthModal.jsx
- [ ] T008 [US1] Add Auth components CSS styles in frontend/src/components/Auth/Auth.module.css

**Checkpoint**: Authentication UI components ready

---

## Phase 3: Dashboard Components

**Purpose**: Create personalized dashboard for authenticated users

- [ ] T009 [P] [US2] Create Dashboard container in frontend/src/components/Dashboard/Dashboard.jsx
- [ ] T010 [P] [US2] Create ProgressCard component in frontend/src/components/Dashboard/ProgressCard.jsx
- [ ] T011 [P] [US2] Create RecommendationsCard component in frontend/src/components/Dashboard/RecommendationsCard.jsx
- [ ] T012 [P] [US2] Create RecentChatsCard component in frontend/src/components/Dashboard/RecentChatsCard.jsx
- [ ] T013 [US2] Add Dashboard CSS styles in frontend/src/components/Dashboard/Dashboard.module.css

**Checkpoint**: Dashboard components ready

---

## Phase 4: Landing Page Integration

**Purpose**: Integrate auth and dashboard into landing page

- [ ] T014 [US1] Add authentication state check in frontend/src/pages/index.js
- [ ] T015 [US1] Add Login/Signup buttons to hero section for unauthenticated users
- [ ] T016 [US2] Replace generic content with Dashboard for authenticated users
- [ ] T017 [US1] Add user menu/avatar in navbar for authenticated users
- [ ] T018 [US1] Implement logout functionality

**Checkpoint**: Landing page shows personalized content based on auth status

---

## Phase 5: API Integration

**Purpose**: Connect frontend to backend auth and dashboard APIs

- [ ] T019 [US1] Implement login API call in frontend/src/utils/api.js (POST /auth/login)
- [ ] T020 [US1] Implement signup API call in frontend/src/utils/api.js (POST /auth/register)
- [ ] T021 [US1] Implement logout API call in frontend/src/utils/api.js (POST /auth/logout)
- [ ] T022 [US2] Implement dashboard data fetch in frontend/src/utils/api.js (GET /dashboard)
- [ ] T023 [US1] Add axios interceptor for JWT token refresh
- [ ] T024 [US1] Add error handling for 401 Unauthorized responses

**Checkpoint**: All API integrations functional

---

## Phase 6: State Management & Persistence

**Purpose**: Manage authentication state across page reloads

- [ ] T025 [US1] Implement token persistence in localStorage or cookies
- [ ] T026 [US1] Add authentication state restoration on page load
- [ ] T027 [US1] Implement automatic token refresh before expiry
- [ ] T028 [US2] Add loading states for dashboard data fetching
- [ ] T029 [US2] Add error boundaries for component failures

**Checkpoint**: Auth state persists across sessions

---

## Phase 7: UI Polish & Responsiveness

**Purpose**: Ensure mobile-friendly and polished UI

- [ ] T030 [P] Add responsive styles for mobile (<768px) in Auth components
- [ ] T031 [P] Add responsive styles for mobile in Dashboard components
- [ ] T032 [P] Add loading skeletons for dashboard cards
- [ ] T033 [P] Add transition animations for auth modal
- [ ] T034 [P] Add error message styling and user feedback
- [ ] T035 Test landing page on mobile devices

**Checkpoint**: UI polished and mobile-responsive

---

## Phase 8: Testing & Validation

**Purpose**: Verify all functionality works end-to-end

- [ ] T036 Test unauthenticated user flow (see generic landing page)
- [ ] T037 Test signup flow (create account, auto-login, see dashboard)
- [ ] T038 Test login flow (existing user, see dashboard)
- [ ] T039 Test logout flow (return to generic landing page)
- [ ] T040 Test token refresh (stay logged in across sessions)
- [ ] T041 Test API error handling (network failures, 401, 500)
- [ ] T042 Test dashboard data display (progress, recommendations, chats)

**Checkpoint**: All user flows tested and working

---

## Phase 9: Documentation & Deployment

**Purpose**: Document changes and deploy

- [ ] T043 [P] Add inline code comments for auth logic
- [ ] T044 [P] Update IMPLEMENTATION_COMPLETE_SUMMARY.md
- [ ] T045 Create git commit with personalization integration
- [ ] T046 Push to GitHub and deploy to GitHub Pages

**Checkpoint**: Feature deployed and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Auth UI)**: Depends on Phase 1 (AuthContext ready)
- **Phase 3 (Dashboard)**: Can start in parallel with Phase 2
- **Phase 4 (Integration)**: Depends on Phases 2 & 3 completion
- **Phase 5 (API)**: Depends on Phase 4 (components integrated)
- **Phase 6 (State)**: Depends on Phase 5 (API calls working)
- **Phase 7 (Polish)**: Can start after Phase 4, parallel with 5 & 6
- **Phase 8 (Testing)**: Depends on all previous phases
- **Phase 9 (Deploy)**: Depends on Phase 8 (tests passing)

### Task Dependencies

**Phase 1**: T001, T002, T003 [P] → T004 (sequential, needs context first)

**Phase 2**: T005, T006, T007 [P] → T008 (parallel components, then styles)

**Phase 3**: T009, T010, T011, T012 [P] → T013 (parallel components, then styles)

**Phase 4**: T014 → T015, T016, T017, T018 (auth check first, then conditional rendering)

**Phase 5**: T019, T020, T021, T022 [P] → T023 → T024 (API functions parallel, interceptor next, error handling last)

**Phase 6**: T025 → T026 → T027 → T028, T029 (sequential state management)

**Phase 7**: All tasks [P] (independent styling)

**Phase 8**: Sequential testing workflow (T036 → T037 → T038 → T039 → T040 → T041 → T042)

**Phase 9**: T043, T044 [P] → T045 → T046

---

## Implementation Details

### T001: AuthContext Provider

**File**: `frontend/src/context/AuthContext.jsx`

```jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // Implement: Check localStorage/cookies for token, validate with backend
    setLoading(false);
  };

  const login = async (email, password) => {
    // Implement: POST /auth/login
  };

  const signup = async (email, password) => {
    // Implement: POST /auth/register
  };

  const logout = async () => {
    // Implement: POST /auth/logout, clear state
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### T002: useAuth Hook

**File**: `frontend/src/hooks/useAuth.js`

```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### T014-T016: Landing Page Integration

**File**: `frontend/src/pages/index.js`

**Before** (current):
```jsx
export default function Home() {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        {/* Generic About & Features sections */}
      </main>
    </Layout>
  );
}
```

**After** (with personalization):
```jsx
import { useAuth } from '../hooks/useAuth';
import Dashboard from '../components/Dashboard/Dashboard';
import AuthModal from '../components/Auth/AuthModal';

export default function Home() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      {user ? (
        // Authenticated: Show personalized dashboard
        <Dashboard user={user} />
      ) : (
        // Unauthenticated: Show generic landing page
        <>
          <HomepageHeader onLoginClick={() => setShowAuthModal(true)} />
          <main>
            {/* About & Features sections */}
          </main>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        </>
      )}
    </Layout>
  );
}
```

### T015: Hero Section with Auth Buttons

Update `HomepageHeader` component:

```jsx
function HomepageHeader({ onLoginClick }) {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/Chapter1">
            Start Learning
          </Link>
          <button
            className="button button--outline button--lg"
            onClick={onLoginClick}
            style={{marginLeft: '1rem'}}>
            Login / Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
```

### T009: Dashboard Component

**File**: `frontend/src/components/Dashboard/Dashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import ProgressCard from './ProgressCard';
import RecommendationsCard from './RecommendationsCard';
import RecentChatsCard from './RecentChatsCard';
import styles from './Dashboard.module.css';

export default function Dashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Implement: GET /dashboard
    setLoading(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <h1 className={styles.welcomeMessage}>
          Welcome back, {user.email}!
        </h1>

        <div className={styles.dashboardGrid}>
          <ProgressCard progress={dashboardData.progress} />
          <RecommendationsCard recommendations={dashboardData.recommendations} />
          <RecentChatsCard chats={dashboardData.recentChats} />
        </div>
      </div>
    </div>
  );
}
```

---

## API Endpoints Required (Backend)

These endpoints need to be implemented in backend for full functionality:

### Authentication
- **POST /auth/register** - Create new user account
- **POST /auth/login** - Authenticate user, return JWT tokens
- **POST /auth/logout** - Invalidate refresh token
- **POST /auth/refresh** - Refresh access token

### Dashboard
- **GET /dashboard** - Get personalized dashboard data
  - Response: `{ progress: [], recommendations: [], recentChats: [] }`

### User
- **GET /user/profile** - Get user profile details
- **PATCH /user/profile** - Update user profile

---

## Testing Checklist

### Authentication Flow
- [ ] Unauthenticated user sees generic landing page
- [ ] Click "Login / Sign Up" opens auth modal
- [ ] Signup creates account and auto-logs in
- [ ] Login with existing credentials shows dashboard
- [ ] Logout returns to generic landing page
- [ ] Page refresh preserves auth state

### Dashboard Display
- [ ] Dashboard shows user's email/name
- [ ] Progress card displays reading progress
- [ ] Recommendations card shows 3 suggestions
- [ ] Recent chats card shows last 5 conversations
- [ ] All cards are clickable/interactive

### Error Handling
- [ ] Invalid login credentials show error message
- [ ] Network errors display user-friendly message
- [ ] 401 Unauthorized triggers re-login
- [ ] Token refresh happens automatically

### Responsiveness
- [ ] Dashboard looks good on desktop (>996px)
- [ ] Dashboard looks good on tablet (768-996px)
- [ ] Dashboard looks good on mobile (<768px)
- [ ] Auth modal is mobile-friendly

---

## Success Criteria

After completion:

✅ Unauthenticated users see generic landing page with "Login / Sign Up" button
✅ Authenticated users see personalized dashboard with progress, recommendations, recent chats
✅ Authentication state persists across page reloads
✅ Smooth transitions between auth states
✅ Mobile-responsive on all screen sizes
✅ All API integrations working
✅ Error handling covers all edge cases

**Estimated Time**: 3-5 days for full implementation

---

## Notes

- **Backend Prerequisite**: This assumes backend auth and dashboard APIs are implemented. If not, backend tasks should be generated first.
- **Incremental Approach**: Can implement Phase 1-4 (UI only) first with mock data, then integrate APIs in Phase 5.
- **User Story Mapping**: Tasks map to US1 (Authentication) and US2 (Personalized Dashboard) from spec.md.
- **Future Enhancements**: Once basic integration works, add US3 (Progress tracking), US4 (Recommendations), US5 (Bookmarks/Highlights).

---

## References

- **Spec**: specs/002-personalization/spec.md
- **Plan**: specs/002-personalization/plan.md
- **Data Model**: specs/002-personalization/data-model.md
- **API Contracts**: specs/002-personalization/contracts/openapi.yaml
- **Current Landing Page**: frontend/src/pages/index.js
