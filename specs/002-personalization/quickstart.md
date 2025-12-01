# Quickstart Guide: User Personalization Testing

**Feature**: 002-personalization
**Date**: 2025-12-01
**Purpose**: End-to-end testing scenarios for manual QA and integration testing

## Overview

This document provides 8 comprehensive test scenarios covering all user stories from [spec.md](./spec.md). Each scenario includes:
- Step-by-step instructions
- Expected outcomes
- API call examples (curl commands)
- Success criteria

## Prerequisites

### Environment Setup

```bash
# Backend running at http://localhost:8000
# Frontend running at http://localhost:3000
# Database: Neon Postgres (initialized with schema)
# Qdrant: Vector database (initialized)

# Environment variables
export DATABASE_URL="postgresql://user:pass@host/db"
export QDRANT_URL="https://qdrant.cloud"
export QDRANT_API_KEY="your-api-key"
export JWT_SECRET="your-secret-key-32-chars-min"
```

### Test User Accounts

```bash
# Primary test user
EMAIL=testuser@example.com
PASSWORD=TestP@ssw0rd123

# Secondary test user (for multi-user scenarios)
EMAIL2=testuser2@example.com
PASSWORD2=TestP@ssw0rd456
```

---

## Scenario 1: New User Registration & First Login

**User Story**: P1 - User Authentication
**Goal**: Verify user can create account, log in, and access protected resources

### Step 1: Register New User

**Action**: Create a new user account via registration form or API

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestP@ssw0rd123",
    "difficulty_level": "beginner"
  }'
```

**Expected Response** (201 Created):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "testuser@example.com",
  "difficulty_level": "beginner",
  "created_at": "2025-12-01T10:00:00Z",
  "last_login_at": null
}
```

**Success Criteria**:
- ✅ User account created in database
- ✅ Password hashed with bcrypt (12 rounds)
- ✅ Default preferences created automatically
- ✅ Email uniqueness enforced (duplicate registration fails with 409)

### Step 2: Login

**Action**: Login with newly created credentials

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "testuser@example.com",
    "password": "TestP@ssw0rd123"
  }'
```

**Expected Response** (200 OK):
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "difficulty_level": "beginner",
    "created_at": "2025-12-01T10:00:00Z",
    "last_login_at": "2025-12-01T10:05:00Z"
  },
  "message": "Login successful"
}
```

**Expected Cookies**:
```
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Success Criteria**:
- ✅ JWT tokens set in httpOnly cookies
- ✅ Access token expires in 15 minutes
- ✅ Refresh token expires in 7 days
- ✅ `last_login_at` timestamp updated in database

### Step 3: Access Protected Resource

**Action**: Fetch user profile using JWT token

```bash
curl -X GET http://localhost:8000/api/user/profile \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "testuser@example.com",
  "difficulty_level": "beginner",
  "is_active": true,
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-01T10:00:00Z",
  "last_login_at": "2025-12-01T10:05:00Z"
}
```

**Success Criteria**:
- ✅ Authentication successful with JWT cookie
- ✅ User data returned correctly
- ✅ Unauthorized (401) if no token provided

### Step 4: Logout

**Action**: Logout and invalidate tokens

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Success Criteria**:
- ✅ Cookies cleared
- ✅ `token_version` incremented in database (invalidates all JWTs)
- ✅ Subsequent requests with old token fail with 401

---

## Scenario 2: Reading Chapter with Progress Tracking

**User Story**: P2 - Reading Progress Tracking
**Goal**: Verify progress is tracked automatically and persists across sessions

### Step 1: Navigate to Chapter

**Action**: User navigates to Chapter 1 in browser

```
http://localhost:3000/docs/chapter-1-introduction
```

**Expected Behavior**:
- Chapter content loads
- Progress tracker hook initializes
- Frontend polls for existing progress

### Step 2: Check Existing Progress

**Action**: Fetch progress for Chapter 1

```bash
curl -X GET http://localhost:8000/api/progress/chapter-1-introduction \
  -b cookies.txt
```

**Expected Response** (200 OK - First visit):
```json
{
  "scroll_percentage": 0,
  "time_spent": 0,
  "completed": false
}
```

**Success Criteria**:
- ✅ Returns empty progress for first visit
- ✅ No error if progress doesn't exist

### Step 3: Simulate Reading (Auto-Save)

**Action**: Simulate user scrolling and reading for 2 minutes

Frontend auto-saves progress every 30 seconds:

```bash
# After 30 seconds at 25% scroll
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-1-introduction",
    "section_id": "overview",
    "progress_percentage": 25,
    "time_spent_seconds": 30,
    "last_position": "{\"scroll\": 500}"
  }'

# After 60 seconds at 50% scroll
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-1-introduction",
    "section_id": "key-concepts",
    "progress_percentage": 50,
    "time_spent_seconds": 60,
    "last_position": "{\"scroll\": 1200}"
  }'

# After 120 seconds at 95% scroll (completion)
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-1-introduction",
    "progress_percentage": 95,
    "time_spent_seconds": 120,
    "last_position": "{\"scroll\": 2400}"
  }'
```

**Expected Response** (200 OK):
```json
{
  "status": "saved"
}
```

**Success Criteria**:
- ✅ Progress saved within 1 second
- ✅ Status auto-updated: `unread` → `in_progress` → `completed`
- ✅ Time spent accumulated (additive, not replaced)
- ✅ `completed_at` timestamp set when progress >= 95%

### Step 4: Verify Progress Persistence

**Action**: Close browser, reopen, navigate back to Chapter 1

```bash
curl -X GET http://localhost:8000/api/progress/chapter-1-introduction \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "scroll_percentage": 95,
  "time_spent": 120,
  "completed": true,
  "last_visited": "2025-12-01T10:10:00Z"
}
```

**Expected Frontend Behavior**:
- Show "Resume from where you left off? (95%)" banner
- Auto-scroll to saved position on user confirmation

**Success Criteria**:
- ✅ Progress persisted across sessions
- ✅ Resume banner displayed
- ✅ Auto-scroll to saved position works

---

## Scenario 3: Viewing Personalized Dashboard

**User Story**: P2 - Personalized Dashboard
**Goal**: Verify dashboard aggregates user data correctly

### Step 1: Generate Test Data

**Action**: Create test data for comprehensive dashboard

```bash
# Complete Chapter 1
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"chapter_id": "chapter-1", "progress_percentage": 100, "time_spent_seconds": 300}'

# In-progress Chapter 2
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"chapter_id": "chapter-2", "progress_percentage": 45, "time_spent_seconds": 120}'

# Unread Chapter 3
# (no progress entry)

# Create bookmarks
curl -X POST http://localhost:8000/api/bookmarks \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-1",
    "section_id": "section-1-2",
    "bookmark_text": "Robot Kinematics Overview",
    "notes": "Important for exam"
  }'

# Create highlights
curl -X POST http://localhost:8000/api/highlights \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-1",
    "highlighted_text": "Forward kinematics transforms joint parameters into Cartesian coordinates",
    "start_offset": 1234,
    "end_offset": 1320,
    "color": "yellow"
  }'
```

### Step 2: Fetch Dashboard

**Action**: Request personalized dashboard data

```bash
curl -X GET http://localhost:8000/api/dashboard \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "difficulty_level": "beginner",
    "created_at": "2025-12-01T10:00:00Z",
    "last_login_at": "2025-12-01T10:05:00Z"
  },
  "progress_stats": {
    "completed_chapters": 1,
    "in_progress_chapters": 1,
    "total_chapters": 2,
    "total_time_spent_seconds": 420,
    "completion_percentage": 50.0
  },
  "recent_progress": [
    {
      "chapter_id": "chapter-2",
      "progress_percentage": 45,
      "status": "in_progress",
      "last_read_at": "2025-12-01T10:15:00Z"
    },
    {
      "chapter_id": "chapter-1",
      "progress_percentage": 100,
      "status": "completed",
      "last_read_at": "2025-12-01T10:10:00Z"
    }
  ],
  "recommendations": [
    {
      "chapter_id": "chapter-3",
      "chapter_title": "Chapter 3: Robot Dynamics",
      "recommendation_type": "next_chapter",
      "reasoning": "Continue your learning journey with the next chapter",
      "priority": 1,
      "score": 0.95
    }
  ],
  "recent_bookmarks": [
    {
      "bookmark_id": "...",
      "chapter_id": "chapter-1",
      "section_id": "section-1-2",
      "bookmark_text": "Robot Kinematics Overview",
      "notes": "Important for exam",
      "created_at": "2025-12-01T10:20:00Z"
    }
  ],
  "recent_chats": [
    {
      "chat_id": "...",
      "created_at": "2025-12-01T10:00:00Z",
      "message_count": 5,
      "preview": "What is forward kinematics?"
    }
  ]
}
```

**Success Criteria**:
- ✅ All sections populated with correct data
- ✅ Progress statistics accurate
- ✅ Recent items sorted by date (newest first)
- ✅ Recommendations generated based on progress
- ✅ Dashboard loads in < 1.5 seconds

---

## Scenario 4: Using Adaptive Chatbot (Beginner vs Advanced)

**User Story**: P3 - Adaptive Chatbot Responses
**Goal**: Verify chatbot adjusts complexity based on user difficulty level

### Step 1: Ask Question as Beginner

**Action**: User (difficulty: beginner) asks technical question

```bash
curl -X POST http://localhost:8000/api/rag/query \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the Jacobian matrix?",
    "selected_text": ""
  }'
```

**Expected Response** (200 OK):
```json
{
  "answer": "The Jacobian matrix is a mathematical tool that helps robots move smoothly. Think of it like a translator between two languages: it converts the speed of robot joints (like elbow or shoulder) into the speed of the robot's hand. For example, if you want the robot's hand to move 5 cm/second to the right, the Jacobian tells you how fast each joint should rotate to make that happen. It's essential for controlling robot movements precisely.",
  "sources": [...],
  "difficulty_level": "beginner"
}
```

**Success Criteria**:
- ✅ Response uses simple language
- ✅ Includes analogies and examples
- ✅ Avoids complex mathematical notation
- ✅ Response length: 100-150 words

### Step 2: Change Difficulty to Advanced

**Action**: Update user profile to advanced difficulty

```bash
curl -X PATCH http://localhost:8000/api/user/profile \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "difficulty_level": "advanced"
  }'
```

**Expected Response** (200 OK):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "difficulty_level": "advanced",
  ...
}
```

### Step 3: Ask Same Question as Advanced

**Action**: Ask same question with advanced difficulty

```bash
curl -X POST http://localhost:8000/api/rag/query \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the Jacobian matrix?",
    "selected_text": ""
  }'
```

**Expected Response** (200 OK):
```json
{
  "answer": "The Jacobian matrix J(q) ∈ ℝ^(m×n) is a linear mapping between the joint velocity space and the operational space velocity. Mathematically, it relates joint velocities q̇ to end-effector velocity v through v = J(q)q̇. For a 6-DOF manipulator, J is a 6×6 matrix where each column represents the contribution of a single joint to the end-effector velocity. The Jacobian is computed by differentiating the forward kinematics: J = ∂f(q)/∂q. Singular configurations occur when det(J) = 0, resulting in loss of controllability in certain directions.",
  "sources": [...],
  "difficulty_level": "advanced"
}
```

**Success Criteria**:
- ✅ Response uses technical terminology
- ✅ Includes mathematical notation
- ✅ Assumes prior knowledge
- ✅ Response length: 150-200 words
- ✅ Citations included for advanced concepts

---

## Scenario 5: Bookmarking Section and Highlighting Text

**User Story**: P3 - Bookmarks & Highlights
**Goal**: Verify user can bookmark sections and highlight text

### Step 1: Create Bookmark

**Action**: Bookmark a section for later reference

```bash
curl -X POST http://localhost:8000/api/bookmarks \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-2-kinematics",
    "section_id": "section-2-3-denavit-hartenberg",
    "bookmark_text": "Denavit-Hartenberg Parameters",
    "notes": "Review before midterm exam"
  }'
```

**Expected Response** (201 Created):
```json
{
  "bookmark_id": "660e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter_id": "chapter-2-kinematics",
  "section_id": "section-2-3-denavit-hartenberg",
  "bookmark_text": "Denavit-Hartenberg Parameters",
  "notes": "Review before midterm exam",
  "created_at": "2025-12-01T10:30:00Z",
  "updated_at": "2025-12-01T10:30:00Z"
}
```

**Success Criteria**:
- ✅ Bookmark created in database
- ✅ Bookmark visible in sidebar
- ✅ Clicking bookmark navigates to section
- ✅ Limit enforced: 200 bookmarks per user (201st fails with 409)

### Step 2: Create Text Highlight

**Action**: Select text and create highlight

**Frontend Workflow**:
1. User selects text: "The transformation matrix T represents the pose of the end-effector"
2. Highlight popup appears with color options
3. User clicks yellow highlight

```bash
curl -X POST http://localhost:8000/api/highlights \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "chapter-2-kinematics",
    "highlighted_text": "The transformation matrix T represents the pose of the end-effector",
    "start_offset": 2456,
    "end_offset": 2524,
    "color": "yellow",
    "notes": "Key concept for exam"
  }'
```

**Expected Response** (201 Created):
```json
{
  "highlight_id": "770e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter_id": "chapter-2-kinematics",
  "highlighted_text": "The transformation matrix T represents the pose of the end-effector",
  "start_offset": 2456,
  "end_offset": 2524,
  "color": "yellow",
  "notes": "Key concept for exam",
  "created_at": "2025-12-01T10:35:00Z",
  "updated_at": "2025-12-01T10:35:00Z"
}
```

**Success Criteria**:
- ✅ Highlight created in database
- ✅ Text visually highlighted in browser
- ✅ Highlight persists on page reload
- ✅ Text verification: stored text matches actual content
- ✅ Limit enforced: 500 highlights per user

### Step 3: View All Bookmarks and Highlights

**Action**: Fetch all bookmarks and highlights

```bash
# Get all bookmarks
curl -X GET http://localhost:8000/api/bookmarks \
  -b cookies.txt

# Get highlights for specific chapter
curl -X GET http://localhost:8000/api/highlights/chapter-2-kinematics \
  -b cookies.txt
```

**Expected Response**:
```json
{
  "bookmarks": [
    {
      "bookmark_id": "660e8400-e29b-41d4-a716-446655440000",
      "chapter_id": "chapter-2-kinematics",
      "section_id": "section-2-3-denavit-hartenberg",
      "bookmark_text": "Denavit-Hartenberg Parameters",
      "notes": "Review before midterm exam",
      "created_at": "2025-12-01T10:30:00Z"
    }
  ]
}
```

**Success Criteria**:
- ✅ All bookmarks returned
- ✅ Highlights grouped by chapter
- ✅ Sorted by creation date (newest first)

---

## Scenario 6: Searching Chat History

**User Story**: P2 - Persistent Chat History
**Goal**: Verify chat history is saved and searchable

### Step 1: Create Multiple Chat Sessions

**Action**: Simulate multiple conversations over time

```bash
# Chat 1: Kinematics questions (3 messages)
curl -X POST http://localhost:8000/api/rag/query \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"question": "What is forward kinematics?", "selected_text": ""}'

curl -X POST http://localhost:8000/api/rag/query \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"question": "Explain Denavit-Hartenberg parameters", "selected_text": ""}'

# Chat 2: Dynamics questions (2 messages)
curl -X POST http://localhost:8000/api/rag/query \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"question": "What is the equation of motion for robots?", "selected_text": ""}'
```

**Success Criteria**:
- ✅ Chat sessions created in database
- ✅ Messages linked to authenticated user (user_id_auth)
- ✅ Timestamps recorded accurately

### Step 2: View Chat History

**Action**: Fetch paginated chat history

```bash
curl -X GET "http://localhost:8000/api/chat/history?limit=10&offset=0" \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "chats": [
    {
      "chat_id": "880e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-12-01T10:40:00Z",
      "last_message_at": "2025-12-01T10:41:00Z",
      "message_count": 2,
      "is_archived": false,
      "preview": "What is the equation of motion for robots?"
    },
    {
      "chat_id": "990e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-12-01T10:35:00Z",
      "last_message_at": "2025-12-01T10:37:00Z",
      "message_count": 3,
      "is_archived": false,
      "preview": "What is forward kinematics?"
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

**Success Criteria**:
- ✅ Chats sorted by last_message_at (newest first)
- ✅ Pagination works correctly
- ✅ Archived chats excluded by default

### Step 3: Search Chat History

**Action**: Full-text search across messages

```bash
curl -X GET "http://localhost:8000/api/chat/history/search?q=kinematics&limit=5" \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "results": [
    {
      "message_id": "...",
      "chat_id": "990e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "What is forward kinematics?",
      "created_at": "2025-12-01T10:35:00Z"
    },
    {
      "message_id": "...",
      "chat_id": "990e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "Explain Denavit-Hartenberg parameters",
      "created_at": "2025-12-01T10:36:00Z"
    }
  ],
  "total": 2
}
```

**Success Criteria**:
- ✅ Full-text search works (case-insensitive)
- ✅ Search spans all user messages
- ✅ Results include context (chat_id, timestamp)
- ✅ Search completes in < 500ms for 1000 conversations

### Step 4: Archive Chat Session

**Action**: Archive old chat to hide from history

```bash
curl -X PATCH http://localhost:8000/api/chat/history/990e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"is_archived": true}'
```

**Expected Response** (200 OK):
```json
{
  "status": "updated"
}
```

**Success Criteria**:
- ✅ Chat archived in database
- ✅ Archived chat not visible in default history view
- ✅ Can unarchive by setting `is_archived: false`

---

## Scenario 7: Getting Personalized Recommendations

**User Story**: P3 - Personalized Recommendations
**Goal**: Verify recommendation engine suggests relevant chapters

### Step 1: Create Baseline Progress

**Action**: Simulate reading pattern with gaps

```bash
# Complete Chapter 1
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"chapter_id": "chapter-1", "progress_percentage": 100, "time_spent_seconds": 300}'

# Skip Chapter 2 (gap)

# In-progress Chapter 3
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"chapter_id": "chapter-3", "progress_percentage": 40, "time_spent_seconds": 120}'

# Complete Chapter 4
curl -X POST http://localhost:8000/api/progress/save \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"chapter_id": "chapter-4", "progress_percentage": 100, "time_spent_seconds": 250}'
```

### Step 2: Ask Questions About Skipped Chapter

**Action**: Simulate confusion by asking questions about Chapter 2 concepts

```bash
# Ask 5 questions related to Chapter 2 (kinematics)
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/rag/query \
    -b cookies.txt -H "Content-Type: application/json" \
    -d '{"question": "What are Denavit-Hartenberg parameters?", "selected_text": ""}'
done
```

**Success Criteria**:
- ✅ Chat messages associated with Chapter 2 context
- ✅ Question count tracked for recommendation engine

### Step 3: Get Recommendations

**Action**: Fetch personalized recommendations

```bash
curl -X GET "http://localhost:8000/api/recommendations?limit=5" \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "recommendations": [
    {
      "recommendation_id": "...",
      "chapter_id": "chapter-5",
      "chapter_title": "Chapter 5: Control Systems",
      "recommendation_type": "next_chapter",
      "reasoning": "Continue your learning journey with the next chapter",
      "priority": 1,
      "score": 0.95,
      "created_at": "2025-12-01T11:00:00Z"
    },
    {
      "recommendation_id": "...",
      "chapter_id": "chapter-2",
      "chapter_title": "Chapter 2: Robot Kinematics",
      "recommendation_type": "fill_gap",
      "reasoning": "Fill knowledge gap from earlier content",
      "priority": 2,
      "score": 0.85,
      "created_at": "2025-12-01T11:00:00Z"
    },
    {
      "recommendation_id": "...",
      "chapter_id": "chapter-2",
      "chapter_title": "Chapter 2: Robot Kinematics",
      "recommendation_type": "revisit",
      "reasoning": "Revisit based on 5 questions asked",
      "priority": 3,
      "score": 0.75,
      "created_at": "2025-12-01T11:00:00Z"
    }
  ]
}
```

**Success Criteria**:
- ✅ Up to 5 recommendations returned
- ✅ Strategies used: next_chapter, fill_gap, revisit
- ✅ Chapter 2 recommended due to gap + questions
- ✅ Recommendations deduplicated (no duplicates)
- ✅ Sorted by priority (1=highest)

### Step 4: Manually Refresh Recommendations

**Action**: Clear cache and regenerate recommendations

```bash
curl -X POST http://localhost:8000/api/recommendations/refresh \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "recommendations": [...]
}
```

**Success Criteria**:
- ✅ Old recommendations deleted
- ✅ New recommendations generated
- ✅ Recommendations updated based on latest progress

---

## Scenario 8: Theme Preference Sync Across Devices

**User Story**: P2 - User Preferences Persistence
**Goal**: Verify preferences sync across devices/browsers

### Step 1: Set Preferences (Device 1)

**Action**: Update user preferences on first device

```bash
curl -X PATCH http://localhost:8000/api/user/preferences \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "font_size": "large",
    "layout_mode": "compact",
    "show_progress_bar": true,
    "show_recommendations": true
  }'
```

**Expected Response** (200 OK):
```json
{
  "preference_id": "...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "theme": "dark",
  "font_size": "large",
  "layout_mode": "compact",
  "show_progress_bar": true,
  "show_recommendations": true,
  "auto_save_progress": true,
  "updated_at": "2025-12-01T11:10:00Z"
}
```

**Success Criteria**:
- ✅ Preferences saved in database
- ✅ Frontend UI updates immediately (dark theme applied)
- ✅ Font size and layout changed

### Step 2: Login on Different Device (Device 2)

**Action**: Login with same credentials on different browser/device

```bash
# Simulate different device with new cookie jar
curl -X POST http://localhost:8000/api/auth/login \
  -c cookies_device2.txt \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestP@ssw0rd123"
  }'
```

### Step 3: Fetch Preferences (Device 2)

**Action**: Fetch preferences on second device

```bash
curl -X GET http://localhost:8000/api/user/preferences \
  -b cookies_device2.txt
```

**Expected Response** (200 OK):
```json
{
  "preference_id": "...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "theme": "dark",
  "font_size": "large",
  "layout_mode": "compact",
  "show_progress_bar": true,
  "show_recommendations": true,
  "auto_save_progress": true,
  "updated_at": "2025-12-01T11:10:00Z"
}
```

**Success Criteria**:
- ✅ Preferences synced from Device 1
- ✅ Theme applied immediately on page load
- ✅ Font size and layout match Device 1
- ✅ Changes on Device 2 also sync back to Device 1

### Step 4: Change Preference (Device 2)

**Action**: Update preference on second device

```bash
curl -X PATCH http://localhost:8000/api/user/preferences \
  -b cookies_device2.txt \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "light"
  }'
```

### Step 5: Verify Sync (Device 1)

**Action**: Refresh page on Device 1

```bash
curl -X GET http://localhost:8000/api/user/preferences \
  -b cookies.txt
```

**Expected Response** (200 OK):
```json
{
  "theme": "light",
  ...
}
```

**Success Criteria**:
- ✅ Theme updated to "light" on Device 1
- ✅ Sync happens automatically on page refresh
- ✅ No conflicts or data loss

---

## Performance Benchmarks

### API Response Times (Target)

| Endpoint | Expected Latency | Load | Success Rate |
|----------|------------------|------|--------------|
| POST /auth/login | < 300ms | 10 req/s | 99.9% |
| GET /dashboard | < 1.5s | 50 req/s | 99.5% |
| POST /progress/save | < 100ms | 100 req/s | 99.9% |
| GET /recommendations | < 2s | 20 req/s | 95% |
| GET /chat/history/search | < 500ms | 10 req/s | 98% |
| POST /highlights | < 200ms | 50 req/s | 99% |

### Concurrent Users

**Test**: 500 concurrent users, 1000 total requests
- Average response time: < 500ms
- 99th percentile: < 2s
- Error rate: < 1%

### Database Queries

- Dashboard aggregation: < 100ms for 10,000 progress records
- Chat history search: < 500ms for 1,000 conversations
- Highlight rendering: < 50ms for 500 highlights per chapter

---

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized Errors

**Symptoms**: Protected endpoints return 401 even with valid token

**Diagnosis**:
```bash
# Check JWT token in cookie
curl -X GET http://localhost:8000/api/auth/me -b cookies.txt -v

# Verify JWT secret matches between frontend/backend
echo $JWT_SECRET
```

**Solution**:
- Verify `JWT_SECRET` environment variable
- Check token expiration (access token: 15 min)
- Ensure cookies have `HttpOnly`, `Secure`, `SameSite=Strict`
- Refresh token if expired

#### 2. Progress Not Saving

**Symptoms**: Progress saves fail or don't persist

**Diagnosis**:
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT * FROM reading_progress WHERE user_id='...'"

# Check API logs for errors
docker logs backend-container
```

**Solution**:
- Verify DATABASE_URL is correct
- Check user_id foreign key constraint
- Ensure chapter_id is valid (exists in book)
- Check unique constraint on (user_id, chapter_id)

#### 3. Recommendations Empty

**Symptoms**: `/recommendations` returns empty array

**Diagnosis**:
```bash
# Check user progress
curl -X GET http://localhost:8000/api/progress/all -b cookies.txt

# Check chat history
curl -X GET http://localhost:8000/api/chat/history -b cookies.txt
```

**Solution**:
- User needs at least 1 completed chapter for recommendations
- Ensure chapter metadata is loaded (chapter IDs, titles, sequence)
- Check recommendation expiration (`expires_at` not in past)

#### 4. Highlights Not Rendering

**Symptoms**: Highlights saved but not visible in browser

**Diagnosis**:
```javascript
// Check highlight data
const highlights = await apiClient.highlights.getChapter('chapter-1');
console.log(highlights);

// Verify text matches
const chapterText = document.getElementById('chapter-content').textContent;
highlights.forEach(h => {
  const actualText = chapterText.substring(h.start_offset, h.end_offset);
  console.log('Match:', actualText === h.highlighted_text);
});
```

**Solution**:
- Text mismatch: Chapter content changed, offsets invalid
- Use text verification before rendering
- Future: Migrate to XPath anchoring for robustness

---

## Automated Testing Script

### Bash Script for Full E2E Test

```bash
#!/bin/bash
# e2e-test.sh - Automated end-to-end testing script

BASE_URL="http://localhost:8000/api"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="TestP@ssw0rd123"

echo "=== Starting E2E Test ==="

# 1. Register
echo "1. Registering user: $EMAIL"
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -o /dev/null -w "Status: %{http_code}\n"

# 2. Login
echo "2. Logging in"
curl -X POST $BASE_URL/auth/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -o /dev/null -w "Status: %{http_code}\n"

# 3. Save progress
echo "3. Saving progress"
curl -X POST $BASE_URL/progress/save \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"chapter_id":"chapter-1","progress_percentage":50,"time_spent_seconds":120}' \
  -o /dev/null -w "Status: %{http_code}\n"

# 4. Create bookmark
echo "4. Creating bookmark"
curl -X POST $BASE_URL/bookmarks \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"chapter_id":"chapter-1","section_id":"intro","bookmark_text":"Test"}' \
  -o /dev/null -w "Status: %{http_code}\n"

# 5. Create highlight
echo "5. Creating highlight"
curl -X POST $BASE_URL/highlights \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"chapter_id":"chapter-1","highlighted_text":"test text","start_offset":0,"end_offset":9}' \
  -o /dev/null -w "Status: %{http_code}\n"

# 6. Get dashboard
echo "6. Fetching dashboard"
curl -X GET $BASE_URL/dashboard \
  -b cookies.txt \
  -o /dev/null -w "Status: %{http_code}\n"

# 7. Logout
echo "7. Logging out"
curl -X POST $BASE_URL/auth/logout \
  -b cookies.txt \
  -o /dev/null -w "Status: %{http_code}\n"

echo "=== E2E Test Complete ==="
rm cookies.txt
```

**Run**:
```bash
chmod +x e2e-test.sh
./e2e-test.sh
```

---

## Next Steps

1. **Manual Testing**: Follow all 8 scenarios above
2. **Automated Testing**: Run e2e-test.sh script
3. **Load Testing**: Use `locust` or `k6` for performance benchmarks
4. **Security Audit**: Run OWASP checklist, penetration testing
5. **User Acceptance Testing**: Beta users test real-world workflows

**Documentation Status**: Complete
**Last Updated**: 2025-12-01
**Maintained By**: QA Team
