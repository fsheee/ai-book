# Data Model: User Personalization & Server Enhancements

**Feature**: 002-personalization
**Date**: 2025-12-01
**Status**: Design Complete

## Overview

This document defines the complete database schema for the user personalization system, including authentication, reading progress tracking, user preferences, recommendations, bookmarks, highlights, and extended chat history.

## Database: Neon Serverless Postgres

**Connection**: Via `DATABASE_URL` environment variable
**Schema**: `public` (default)
**Character Encoding**: UTF-8
**Timezone**: UTC (all timestamps stored in UTC)

---

## Schema Overview

### New Tables (7 total)

1. **users** - User accounts and authentication
2. **user_preferences** - UI preferences and settings
3. **reading_progress** - Chapter reading progress tracking
4. **recommendations** - Personalized chapter recommendations
5. **bookmarks** - Bookmarked sections
6. **highlights** - Text highlights with notes
7. **password_resets** - Password reset tokens (security)

### Extended Tables (1 total)

8. **chats** (existing) - Extended with user_id and is_archived fields

---

## Table Definitions

### 1. users

User accounts and authentication credentials.

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(72) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    token_version INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON COLUMN users.user_id IS 'Primary key, UUID v4';
COMMENT ON COLUMN users.email IS 'User email address, unique identifier for login';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash with 12 rounds, max 72 chars';
COMMENT ON COLUMN users.difficulty_level IS 'Chatbot response complexity: beginner, intermediate, advanced';
COMMENT ON COLUMN users.token_version IS 'Incremented on logout/password change to invalidate all JWTs';
COMMENT ON COLUMN users.is_active IS 'Account active status, FALSE = suspended/deleted';
```

**Field Validations**:
- `email`: Valid email format, max 255 chars, case-insensitive unique
- `password_hash`: bcrypt output, exactly 60 chars (stored with buffer)
- `difficulty_level`: Enum constraint enforced at DB level
- `token_version`: Non-negative integer, default 0

**Migration Notes**:
- Existing `chats.user_id` (VARCHAR) should reference `users.user_id::TEXT` initially for compatibility
- Plan migration to UUID foreign keys in future schema update

---

### 2. user_preferences

User interface preferences and personalization settings.

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
    layout_mode VARCHAR(20) DEFAULT 'normal' CHECK (layout_mode IN ('normal', 'compact', 'comfortable')),
    show_progress_bar BOOLEAN DEFAULT TRUE,
    show_recommendations BOOLEAN DEFAULT TRUE,
    auto_save_progress BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_theme ON user_preferences(theme);

-- Comments
COMMENT ON TABLE user_preferences IS 'User interface preferences and settings';
COMMENT ON COLUMN user_preferences.theme IS 'UI color theme: light, dark, auto (system)';
COMMENT ON COLUMN user_preferences.font_size IS 'Reading font size preference';
COMMENT ON COLUMN user_preferences.layout_mode IS 'Content layout density';
```

**Field Validations**:
- All VARCHAR fields: Enum constraints enforced at DB level
- Boolean fields: NOT NULL, default values provided
- Exactly one preference row per user (UNIQUE constraint on user_id)

**Default Behavior**:
- New users get default preferences automatically (via trigger or application logic)
- Preferences are optional; defaults used if row doesn't exist

---

### 3. reading_progress

Tracks user reading progress per chapter.

```sql
CREATE TABLE IF NOT EXISTS reading_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    section_id VARCHAR(200),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_position VARCHAR(500),
    time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'completed')),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_chapter_id ON reading_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_chapter ON reading_progress(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_status ON reading_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_progress_last_read ON reading_progress(user_id, last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON reading_progress(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;

-- Comments
COMMENT ON TABLE reading_progress IS 'User reading progress per chapter';
COMMENT ON COLUMN reading_progress.chapter_id IS 'Chapter identifier (e.g., "chapter-1-introduction")';
COMMENT ON COLUMN reading_progress.section_id IS 'Section identifier within chapter (optional)';
COMMENT ON COLUMN reading_progress.progress_percentage IS 'Scroll progress: 0-100, 95+ considered complete';
COMMENT ON COLUMN reading_progress.last_position IS 'JSON or scroll offset for resume (e.g., {"scroll": 1234})';
COMMENT ON COLUMN reading_progress.time_spent_seconds IS 'Total time spent reading this chapter';
COMMENT ON COLUMN reading_progress.status IS 'Reading status: unread, in_progress, completed';
COMMENT ON COLUMN reading_progress.completed_at IS 'Timestamp when status changed to completed';
```

**Field Validations**:
- `progress_percentage`: 0-100 inclusive
- `time_spent_seconds`: Non-negative integer
- `status`: Automatically updated to 'in_progress' on first save, 'completed' when progress >= 95%
- `completed_at`: Set automatically when status becomes 'completed'

**Business Logic**:
- UNIQUE constraint on (user_id, chapter_id) → use UPSERT for updates
- Progress saves are idempotent (safe to call repeatedly)
- Status transitions: unread → in_progress → completed (one-way, no rollback)

---

### 4. recommendations

Personalized chapter recommendations.

```sql
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    recommendation_type VARCHAR(20) NOT NULL CHECK (recommendation_type IN ('next_chapter', 'fill_gap', 'revisit', 'popular')),
    reasoning TEXT,
    priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
    score NUMERIC(5, 3) DEFAULT 0.000 CHECK (score >= 0 AND score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_expires ON recommendations(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_priority ON recommendations(user_id, priority, score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires_at ON recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE recommendations IS 'Personalized chapter recommendations';
COMMENT ON COLUMN recommendations.recommendation_type IS 'Strategy: next_chapter (sequential), fill_gap (skipped), revisit (chat-based), popular (trending)';
COMMENT ON COLUMN recommendations.reasoning IS 'Human-readable explanation for this recommendation';
COMMENT ON COLUMN recommendations.priority IS 'Display priority: 1=highest, 3=lowest';
COMMENT ON COLUMN recommendations.score IS 'Recommendation confidence: 0.000-1.000';
COMMENT ON COLUMN recommendations.expires_at IS 'Cache expiration timestamp (typically +24 hours)';
```

**Field Validations**:
- `priority`: 1-3 inclusive (1=highest)
- `score`: 0.000-1.000 inclusive (3 decimal places)
- `recommendation_type`: Enum constraint enforced at DB level

**Cache Strategy**:
- Recommendations expire after 24 hours (expires_at)
- Cleanup job deletes expired recommendations daily
- Manual refresh: DELETE all user recommendations, regenerate

---

### 5. bookmarks

User bookmarks for quick navigation.

```sql
CREATE TABLE IF NOT EXISTS bookmarks (
    bookmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    section_id VARCHAR(200) NOT NULL,
    bookmark_text TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_chapter ON bookmarks(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(user_id, created_at DESC);

-- Constraint: Max 200 bookmarks per user (enforced at application level)
COMMENT ON TABLE bookmarks IS 'User bookmarks for quick navigation';
COMMENT ON COLUMN bookmarks.chapter_id IS 'Chapter identifier';
COMMENT ON COLUMN bookmarks.section_id IS 'Section/heading identifier within chapter';
COMMENT ON COLUMN bookmarks.bookmark_text IS 'Section title or heading text';
COMMENT ON COLUMN bookmarks.notes IS 'Optional user notes about this bookmark';
```

**Field Validations**:
- `bookmark_text`: Optional, max 1000 chars (not enforced at DB level)
- `notes`: Optional, max 5000 chars (not enforced at DB level)

**Application Constraints**:
- Max 200 bookmarks per user (enforced by API before INSERT)
- No duplicate (user_id, chapter_id, section_id) recommended (checked at application level)

---

### 6. highlights

User text highlights with notes.

```sql
CREATE TABLE IF NOT EXISTS highlights (
    highlight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    highlighted_text TEXT NOT NULL,
    start_offset INTEGER NOT NULL CHECK (start_offset >= 0),
    end_offset INTEGER NOT NULL CHECK (end_offset > start_offset),
    color VARCHAR(20) DEFAULT 'yellow' CHECK (color IN ('yellow', 'green', 'pink', 'blue', 'purple')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_chapter ON highlights(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_color ON highlights(user_id, color);

-- Constraint: Max 500 highlights per user (enforced at application level)
COMMENT ON TABLE highlights IS 'User text highlights with character offsets';
COMMENT ON COLUMN highlights.highlighted_text IS 'Selected text content (stored for verification and display)';
COMMENT ON COLUMN highlights.start_offset IS 'Character offset from start of chapter content';
COMMENT ON COLUMN highlights.end_offset IS 'Character offset (exclusive) end of highlight';
COMMENT ON COLUMN highlights.color IS 'Highlight color for categorization';
COMMENT ON COLUMN highlights.notes IS 'Optional user notes about this highlight';
```

**Field Validations**:
- `start_offset`: Non-negative integer
- `end_offset`: Must be greater than start_offset
- `color`: Enum constraint enforced at DB level
- `highlighted_text`: NOT NULL, max 10,000 chars recommended (not enforced)

**Application Constraints**:
- Max 500 highlights per user (enforced by API before INSERT)
- Text verification: Compare `highlighted_text` with actual chapter text on render

---

### 7. password_resets

Password reset tokens (security).

```sql
CREATE TABLE IF NOT EXISTS password_resets (
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reset_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at) WHERE used_at IS NULL;

-- Comments
COMMENT ON TABLE password_resets IS 'Password reset tokens for account recovery';
COMMENT ON COLUMN password_resets.reset_token IS 'Secure random token (64 hex chars, 32 bytes entropy)';
COMMENT ON COLUMN password_resets.expires_at IS 'Token expiration (typically +1 hour from creation)';
COMMENT ON COLUMN password_resets.used_at IS 'Timestamp when token was used (NULL = unused)';
```

**Field Validations**:
- `reset_token`: 64-character hex string (256-bit entropy)
- `expires_at`: Must be in future at creation time
- `used_at`: NULL until token is used (one-time use)

**Security**:
- Tokens expire after 1 hour
- Cleanup job deletes expired tokens after 24 hours
- One-time use: `used_at` set on password change, token becomes invalid

---

## Extended Tables

### 8. chats (extended)

Existing chat session table extended with user authentication.

```sql
-- Add new columns to existing chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS user_id_auth UUID REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_chats_user_id_auth ON chats(user_id_auth);
CREATE INDEX IF NOT EXISTS idx_chats_user_archived ON chats(user_id_auth, is_archived) WHERE is_archived = FALSE;

-- Comments
COMMENT ON COLUMN chats.user_id_auth IS 'Authenticated user UUID (NULL for guest chats)';
COMMENT ON COLUMN chats.is_archived IS 'TRUE = archived/hidden from history, FALSE = active';
```

**Migration Notes**:
- `user_id` (existing VARCHAR) remains for backward compatibility with guest users
- `user_id_auth` (new UUID) links to authenticated users
- Null `user_id_auth` = guest chat session
- Future: Deprecate `user_id` VARCHAR field in favor of `user_id_auth`

**Data Retention**:
- Chats older than 365 days with `is_archived = TRUE` are deleted
- Guest chats (NULL user_id_auth) older than 90 days are deleted

---

## Entity Relationships Diagram (Text-Based)

```
┌─────────────────┐
│     users       │
│─────────────────│
│ user_id (PK)    │──┐
│ email (UNIQUE)  │  │
│ password_hash   │  │
│ difficulty_level│  │
│ token_version   │  │
│ is_active       │  │
└─────────────────┘  │
                     │
         ┌───────────┴──────────┬─────────────┬──────────────┬──────────────┬──────────────┐
         │                      │             │              │              │              │
         ▼                      ▼             ▼              ▼              ▼              ▼
┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌────────────────┐
│user_preferences  │  │reading_progress  │  │bookmarks  │  │highlights │  │chats     │  │password_resets │
│──────────────────│  │──────────────────│  │───────────│  │───────────│  │──────────│  │────────────────│
│preference_id(PK) │  │progress_id (PK)  │  │bookmark_id│  │highlight_ │  │chat_id   │  │reset_id (PK)   │
│user_id (FK,U)    │  │user_id (FK)      │  │  (PK)     │  │  id (PK)  │  │  (PK)    │  │user_id (FK)    │
│theme             │  │chapter_id        │  │user_id(FK)│  │user_id(FK)│  │user_id   │  │reset_token (U) │
│font_size         │  │section_id        │  │chapter_id │  │chapter_id │  │user_id_  │  │expires_at      │
│layout_mode       │  │progress_%        │  │section_id │  │start_     │  │  auth(FK)│  │used_at         │
│...               │  │time_spent_s      │  │bookmark_  │  │  offset   │  │is_       │  └────────────────┘
└──────────────────┘  │status            │  │  text     │  │end_offset │  │ archived │
                      │last_read_at      │  │notes      │  │highlighted│  └──────────┘
                      │U(user,chapter)   │  └───────────┘  │  _text    │
                      └──────────────────┘                 │color      │       ┌──────────────────┐
                                                           │notes      │       │recommendations   │
                                                           └───────────┘       │──────────────────│
                                                                               │recommendation_id │
                                                                               │  (PK)            │
                                                                               │user_id (FK)      │
                                                                               │chapter_id        │
                                                                               │recommendation_   │
                                                                               │  type            │
                                                                               │reasoning         │
                                                                               │priority          │
                                                                               │score             │
                                                                               │expires_at        │
                                                                               └──────────────────┘
```

**Legend**:
- PK = Primary Key
- FK = Foreign Key
- U = Unique Constraint
- Arrows (─, │, ┐, ┘, ┴, ┬) show relationships

**Relationships**:
- `users` ─[1:1]→ `user_preferences` (one-to-one)
- `users` ─[1:N]→ `reading_progress` (one-to-many)
- `users` ─[1:N]→ `recommendations` (one-to-many)
- `users` ─[1:N]→ `bookmarks` (one-to-many)
- `users` ─[1:N]→ `highlights` (one-to-many)
- `users` ─[1:N]→ `chats` (one-to-many, via user_id_auth)
- `users` ─[1:N]→ `password_resets` (one-to-many)

---

## Performance Indexes

### Critical Indexes (Query Performance)

```sql
-- User lookup by email (login)
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Progress queries (dashboard, resume reading)
CREATE INDEX idx_progress_user_chapter ON reading_progress(user_id, chapter_id);
CREATE INDEX idx_progress_last_read ON reading_progress(user_id, last_read_at DESC);

-- Recommendations (dashboard, personalized suggestions)
CREATE INDEX idx_recommendations_user_priority ON recommendations(user_id, priority, score DESC);

-- Bookmarks/Highlights (chapter view, sidebar)
CREATE INDEX idx_bookmarks_user_chapter ON bookmarks(user_id, chapter_id);
CREATE INDEX idx_highlights_user_chapter ON highlights(user_id, chapter_id);

-- Chat history (authenticated users)
CREATE INDEX idx_chats_user_archived ON chats(user_id_auth, is_archived) WHERE is_archived = FALSE;
```

### Maintenance Indexes (Cleanup Jobs)

```sql
-- Expired recommendations cleanup
CREATE INDEX idx_recommendations_expires_at ON recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- Expired password reset cleanup
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at) WHERE used_at IS NULL;
```

---

## Data Validation Rules

### Application-Level Validation

These constraints are enforced by the API, not the database:

| Table | Constraint | Reason |
|-------|-----------|--------|
| `users` | Email format validation (RFC 5322) | Complex regex, better at application level |
| `users` | Password strength (min 8 chars, complexity) | Business logic, may change |
| `bookmarks` | Max 200 per user | Performance limit, configurable |
| `highlights` | Max 500 per user | Performance limit, configurable |
| `reading_progress` | Valid chapter_id (exists in book) | Dynamic data, external reference |
| `recommendations` | Valid chapter_id (exists in book) | Dynamic data, external reference |

### Database-Level Validation

These constraints are enforced by Postgres CHECK constraints:

| Table | Constraint | Validation |
|-------|-----------|-----------|
| `users` | difficulty_level | IN ('beginner', 'intermediate', 'advanced') |
| `user_preferences` | theme, font_size, layout_mode | Enum constraints |
| `reading_progress` | progress_percentage | 0 <= value <= 100 |
| `reading_progress` | time_spent_seconds | value >= 0 |
| `reading_progress` | status | IN ('unread', 'in_progress', 'completed') |
| `recommendations` | priority | 1 <= value <= 3 |
| `recommendations` | score | 0 <= value <= 1 |
| `highlights` | start_offset, end_offset | start >= 0, end > start |
| `highlights` | color | IN ('yellow', 'green', 'pink', 'blue', 'purple') |

---

## Migration Strategy

### Step 1: Create New Tables (Safe)

```sql
-- Run all CREATE TABLE statements above
-- No impact on existing data
```

### Step 2: Extend chats Table (Backward Compatible)

```sql
-- Add nullable columns (no data loss)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS user_id_auth UUID REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_chats_user_id_auth ON chats(user_id_auth);
CREATE INDEX IF NOT EXISTS idx_chats_user_archived ON chats(user_id_auth, is_archived);
```

### Step 3: Backfill Data (Optional)

```sql
-- Migrate guest user_id (VARCHAR) to user_id_auth (UUID) if matching email exists
-- Run as background job, not critical for MVP
UPDATE chats
SET user_id_auth = users.user_id
FROM users
WHERE chats.user_id = users.email
  AND chats.user_id_auth IS NULL;
```

### Step 4: Cleanup (Future)

```sql
-- After migration complete (6+ months), deprecate old user_id VARCHAR column
-- ALTER TABLE chats DROP COLUMN user_id;
-- Not planned for MVP
```

---

## Database Triggers (Optional Enhancements)

### Auto-Update Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-Create Default Preferences

```sql
-- Function to create default preferences on user registration
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user creation
CREATE TRIGGER create_user_preferences AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_preferences();
```

### Auto-Update Progress Status

```sql
-- Function to update progress status based on percentage
CREATE OR REPLACE FUNCTION update_progress_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.progress_percentage >= 95 AND OLD.status != 'completed' THEN
        NEW.status = 'completed';
        NEW.completed_at = NOW();
    ELSIF NEW.progress_percentage > 0 AND NEW.progress_percentage < 95 AND OLD.status = 'unread' THEN
        NEW.status = 'in_progress';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on progress update
CREATE TRIGGER auto_update_progress_status BEFORE UPDATE ON reading_progress
    FOR EACH ROW EXECUTE FUNCTION update_progress_status();
```

---

## Cleanup Jobs (Scheduled Tasks)

### Daily Cleanup Script

```sql
-- Delete expired recommendations (older than expires_at)
DELETE FROM recommendations WHERE expires_at < NOW();

-- Delete expired password reset tokens (older than 24 hours)
DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL '24 hours';

-- Archive old guest chats (older than 90 days, no authenticated user)
UPDATE chats
SET is_archived = TRUE
WHERE user_id_auth IS NULL
  AND last_message_at < NOW() - INTERVAL '90 days'
  AND is_archived = FALSE;

-- Delete very old archived chats (older than 365 days)
DELETE FROM chats
WHERE is_archived = TRUE
  AND last_message_at < NOW() - INTERVAL '365 days';
```

**Execution**: Run daily via cron job or Railway scheduled task.

---

## Sample Queries

### User Registration

```sql
-- Create user
INSERT INTO users (email, password_hash, difficulty_level)
VALUES ('user@example.com', '$2b$12$...', 'beginner')
RETURNING user_id, email, created_at;

-- Default preferences auto-created via trigger
```

### User Login

```sql
-- Fetch user by email
SELECT user_id, email, password_hash, token_version, is_active, last_login_at
FROM users
WHERE email = 'user@example.com' AND is_active = TRUE;

-- Update last login
UPDATE users SET last_login_at = NOW() WHERE user_id = '...';
```

### Save Reading Progress

```sql
-- Upsert progress
INSERT INTO reading_progress (user_id, chapter_id, progress_percentage, time_spent_seconds, last_position)
VALUES ('user-uuid', 'chapter-1', 45, 120, '{"scroll": 1234}')
ON CONFLICT (user_id, chapter_id)
DO UPDATE SET
    progress_percentage = EXCLUDED.progress_percentage,
    time_spent_seconds = reading_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
    last_position = EXCLUDED.last_position,
    last_read_at = NOW();
```

### Get User Dashboard Data

```sql
-- User profile
SELECT user_id, email, difficulty_level, created_at, last_login_at
FROM users WHERE user_id = 'user-uuid';

-- Progress stats
SELECT
    COUNT(*) FILTER (WHERE status = 'completed') as completed_chapters,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_chapters,
    COUNT(*) as total_chapters,
    SUM(time_spent_seconds) as total_time_spent
FROM reading_progress WHERE user_id = 'user-uuid';

-- Recent progress (last 5 chapters)
SELECT chapter_id, progress_percentage, status, last_read_at
FROM reading_progress
WHERE user_id = 'user-uuid'
ORDER BY last_read_at DESC
LIMIT 5;

-- Recommendations (top 3)
SELECT chapter_id, recommendation_type, reasoning, priority
FROM recommendations
WHERE user_id = 'user-uuid' AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY priority, score DESC
LIMIT 3;

-- Recent bookmarks (last 10)
SELECT bookmark_id, chapter_id, section_id, bookmark_text, created_at
FROM bookmarks
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### Get Chapter Highlights

```sql
-- Fetch all highlights for a chapter
SELECT highlight_id, highlighted_text, start_offset, end_offset, color, notes, created_at
FROM highlights
WHERE user_id = 'user-uuid' AND chapter_id = 'chapter-1'
ORDER BY start_offset;
```

---

## Storage Estimates

### Per User (Average)

| Data Type | Size Estimate |
|-----------|--------------|
| User profile | 500 bytes |
| Preferences | 300 bytes |
| Progress (50 chapters) | 50 * 400 bytes = 20 KB |
| Recommendations (3 active) | 3 * 500 bytes = 1.5 KB |
| Bookmarks (20 avg) | 20 * 600 bytes = 12 KB |
| Highlights (50 avg) | 50 * 1 KB = 50 KB |
| Chat history (100 messages) | 100 * 500 bytes = 50 KB |
| **Total per user** | **~134 KB** |

### Scale Projections

| Users | Total Storage (Data Only) | With Indexes (1.5x) |
|-------|--------------------------|---------------------|
| 100 | 13.4 MB | 20 MB |
| 1,000 | 134 MB | 200 MB |
| 10,000 | 1.34 GB | 2 GB |
| 100,000 | 13.4 GB | 20 GB |

**Neon Free Tier**: 3 GB storage → supports ~15,000 users
**Neon Pro Tier**: 50 GB storage → supports ~250,000 users

---

## Security Considerations

### Sensitive Data

- **Passwords**: Never stored plaintext, always bcrypt hashed
- **JWT Tokens**: Stored in httpOnly cookies, never in database
- **Password Reset Tokens**: Single-use, expire in 1 hour, cryptographically random

### Data Isolation

- All user data isolated by `user_id` foreign key
- Queries always include `WHERE user_id = ?` to prevent data leakage
- Row-Level Security (RLS) can be added for additional protection (future)

### GDPR Compliance

- Account deletion: `ON DELETE CASCADE` removes all user data
- Data export: Queries provided for all user data (future feature)
- Right to be forgotten: 24-hour grace period before permanent deletion

---

## Future Enhancements

### Planned Schema Additions

1. **user_sessions** - Track active sessions per device (multi-device management)
2. **user_achievements** - Gamification (badges, milestones)
3. **user_notifications** - In-app notifications and alerts
4. **chat_feedback** - User feedback on chatbot responses (thumbs up/down)
5. **study_groups** - Collaborative learning groups (social feature)

### Performance Optimizations

1. **Partitioning**: Partition `reading_progress` by user_id for large scale (1M+ users)
2. **Materialized Views**: Cache dashboard aggregates for faster queries
3. **Read Replicas**: Separate read/write databases for high traffic
4. **Time-Series Data**: Move old progress/highlights to time-series database (TimescaleDB)

---

## Appendix: Full Schema Script

See `backend/scripts/init_db.py` for executable migration script.

**Documentation Status**: Complete
**Last Updated**: 2025-12-01
**Next Review**: After MVP deployment
