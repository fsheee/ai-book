# Research Document: Personalization Feature

## Overview

This document captures the technical research and architectural decisions for the personalization feature, including authentication, authorization, progress tracking, recommendations, and data persistence strategies.

**Feature:** User Personalization System
**Status:** Research Complete
**Date:** 2025-12-01
**Context:** Adding user accounts, progress tracking, personalized recommendations, and highlight persistence to the AI textbook platform.

---

## 1. JWT Implementation

### Decision

Implement JWT-based authentication with the following configuration:

- **Access Token:**
  - Expiration: 15 minutes
  - Storage: httpOnly cookie
  - Payload: user_id, email, iat, exp

- **Refresh Token:**
  - Expiration: 7 days
  - Storage: httpOnly cookie
  - Payload: user_id, token_version, iat, exp
  - Rotation: Issue new refresh token on each use

### Rationale

**httpOnly Cookies Over localStorage:**
- XSS Protection: httpOnly cookies cannot be accessed by JavaScript, preventing XSS attacks from stealing tokens
- CSRF Mitigation: Combined with SameSite=Strict attribute and CSRF tokens for state-changing operations
- Automatic transmission: Cookies are automatically sent with requests, simplifying client-side code
- Mobile compatibility: Works seamlessly with mobile web browsers

**Short Access Token Expiry (15 minutes):**
- Limits window of exposure if token is compromised
- Reduces risk of token replay attacks
- Balances security with user experience (refresh happens transparently)

**Longer Refresh Token Expiry (7 days):**
- Acceptable UX: Users stay logged in for a week without re-authentication
- Security: Token rotation invalidates old refresh tokens
- Revocation: Token version allows immediate invalidation on logout or security events

### Alternatives Considered

1. **localStorage for Tokens:**
   - Rejected: Vulnerable to XSS attacks
   - Use case: Only if targeting non-browser environments without cookie support

2. **Session-based Authentication:**
   - Rejected: Requires server-side session storage (Redis/DB), adds complexity
   - Stateless JWT allows horizontal scaling without session affinity
   - Use case: Consider if strict revocation requirements emerge

3. **Longer Access Token Expiry (1+ hours):**
   - Rejected: Increases security risk window
   - Short expiry with transparent refresh provides better security posture

4. **OAuth 2.0 / Social Login:**
   - Deferred: Not required for MVP
   - Future: Add Google/GitHub OAuth for convenience

### Implementation Notes

**Backend (FastAPI):**
```python
# Token Configuration
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Cookie Settings
COOKIE_SETTINGS = {
    "httponly": True,
    "secure": True,  # HTTPS only in production
    "samesite": "strict",
    "domain": None,  # Same domain only
}

# JWT Claims
access_token_payload = {
    "user_id": user.id,
    "email": user.email,
    "type": "access",
    "iat": issued_at,
    "exp": expiration,
}

refresh_token_payload = {
    "user_id": user.id,
    "token_version": user.token_version,
    "type": "refresh",
    "iat": issued_at,
    "exp": expiration,
}
```

**Security Headers:**
```python
# Add to all responses
response.set_cookie(
    "access_token",
    value=access_token,
    max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    **COOKIE_SETTINGS
)

response.set_cookie(
    "refresh_token",
    value=refresh_token,
    max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    **COOKIE_SETTINGS
)
```

**Token Rotation:**
- On refresh endpoint hit, issue new refresh token and invalidate old one
- Implement token_version field in users table
- Increment token_version on logout/password change to invalidate all tokens

**Frontend (React):**
```javascript
// Automatic token refresh
let refreshTimer;

function scheduleTokenRefresh(expiresIn) {
  // Refresh 1 minute before expiry
  const refreshTime = (expiresIn - 60) * 1000;
  refreshTimer = setTimeout(async () => {
    await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
  }, refreshTime);
}

// Clear timer on logout
function logout() {
  clearTimeout(refreshTimer);
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
}
```

### Future Enhancements

1. **JWT Blacklist/Whitelist:**
   - Implement Redis-based token blacklist for immediate revocation
   - Store only JTI (JWT ID) to minimize memory usage
   - TTL equal to token expiration

2. **Multi-Device Management:**
   - Track active sessions per user
   - Allow users to view and revoke sessions from dashboard
   - Store device fingerprints and last activity

3. **Adaptive Token Expiry:**
   - Shorter expiry for sensitive operations
   - Longer expiry for trusted devices (remember me)
   - Geo-location based risk assessment

4. **Passwordless Authentication:**
   - Magic links via email
   - WebAuthn/FIDO2 for biometric authentication

---

## 2. Password Hashing

### Decision

Use **bcrypt** with **12 rounds** (cost factor) for password hashing.

```python
import bcrypt

# Hashing
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))

# Verification
is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash)
```

### Rationale

**bcrypt Over Alternatives:**
- Industry-proven: Battle-tested since 1999
- Adaptive: Configurable work factor scales with hardware improvements
- Salt built-in: Automatic random salt generation per password
- Timing-attack resistant: Constant-time comparison
- Python ecosystem: Well-maintained `bcrypt` package with native bindings

**12 Rounds Work Factor:**
- OWASP Recommendation: 12 rounds as of 2023
- Performance: ~250-300ms hash time on modern hardware
- Security: 2^12 = 4,096 iterations makes brute-force infeasible
- User Experience: Acceptable latency for login/registration
- Future-proof: Easy to migrate to 13+ rounds as hardware improves

**Hash Time Analysis:**
- Rounds 10: ~60-80ms (too fast, vulnerable to GPU attacks)
- Rounds 12: ~250-300ms (recommended sweet spot)
- Rounds 14: ~1000-1200ms (too slow, poor UX)

### Alternatives Considered

1. **Argon2id:**
   - Considered: Winner of Password Hashing Competition (2015)
   - Advantages: Memory-hard, resistant to GPU/ASIC attacks, configurable memory/time
   - Rejected for MVP: Less mature Python ecosystem, more complex tuning
   - **Future Migration:** Argon2id is superior for new applications, plan migration post-MVP

2. **PBKDF2:**
   - Rejected: Not memory-hard, vulnerable to GPU acceleration
   - Use case: Only if FIPS compliance required

3. **scrypt:**
   - Rejected: More complex parameter tuning, less adoption than bcrypt/Argon2
   - Memory-hard but Argon2id is superior

4. **SHA-256 + Salt:**
   - Rejected: Single iteration makes brute-force trivial with modern GPUs
   - Never use for passwords

### Implementation Notes

**User Registration:**
```python
from fastapi import HTTPException
import bcrypt
import re

def validate_password_strength(password: str) -> bool:
    """
    Enforce password policy:
    - Minimum 8 characters
    - At least one uppercase, one lowercase, one digit
    - At least one special character
    """
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True

async def register_user(email: str, password: str):
    if not validate_password_strength(password):
        raise HTTPException(400, "Password does not meet requirements")

    # Hash password
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))

    # Store in database
    user = await db.users.create({
        "email": email,
        "password_hash": hashed.decode('utf-8'),  # Store as string
        "created_at": datetime.utcnow(),
    })

    return user
```

**User Login:**
```python
async def authenticate_user(email: str, password: str):
    user = await db.users.find_one({"email": email})

    if not user:
        # Timing attack mitigation: hash dummy password
        bcrypt.hashpw(b"dummy", bcrypt.gensalt(rounds=12))
        raise HTTPException(401, "Invalid credentials")

    is_valid = bcrypt.checkpw(
        password.encode('utf-8'),
        user.password_hash.encode('utf-8')
    )

    if not is_valid:
        raise HTTPException(401, "Invalid credentials")

    return user
```

**Database Schema:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(72) NOT NULL,  -- bcrypt output is 60 chars, allow buffer
    token_version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Password Change Flow:**
```python
async def change_password(user_id: int, old_password: str, new_password: str):
    user = await db.users.find_by_id(user_id)

    # Verify old password
    if not bcrypt.checkpw(old_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(401, "Invalid current password")

    # Validate new password
    if not validate_password_strength(new_password):
        raise HTTPException(400, "New password does not meet requirements")

    # Hash new password
    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(rounds=12))

    # Update database and invalidate all tokens
    await db.users.update(user_id, {
        "password_hash": new_hash.decode('utf-8'),
        "token_version": user.token_version + 1,  # Invalidate all JWTs
        "updated_at": datetime.utcnow(),
    })
```

### Future Enhancements

1. **Argon2id Migration:**
   - Implement dual-hash system: check bcrypt first, re-hash with Argon2id on successful login
   - Gradual migration without forcing password resets
   - Configuration: `memory_cost=65536, time_cost=3, parallelism=4`

2. **Breach Detection:**
   - Check passwords against Have I Been Pwned API during registration
   - Force password change if user's password appears in breach database

3. **Adaptive Work Factor:**
   - Monitor hash times in production
   - Auto-increment rounds when average hash time drops below 200ms
   - Re-hash passwords on next login with higher rounds

4. **Pepper (Secret Key):**
   - Add application-level secret to hashes: `bcrypt.hashpw(password + PEPPER, salt)`
   - Requires configuration management (rotate pepper periodically)
   - Defense-in-depth if database is compromised

---

## 3. Recommendation Algorithm

### Decision

Implement **rule-based MVP recommendation system** with three strategies:

1. **Sequential Chapter Progression:**
   - Recommend next unread chapter in sequence
   - Primary path for new users

2. **Gap Detection:**
   - Identify skipped chapters in user's reading history
   - Suggest filling knowledge gaps before advancing

3. **Chat-Based Revisit:**
   - Analyze chatbot conversation history
   - Recommend chapters related to frequently asked questions
   - Suggest revisiting chapters where user struggled (multiple clarifying questions)

### Rationale

**Rule-Based Over ML for MVP:**
- Simplicity: No training data required initially
- Interpretability: Users understand why chapters are recommended
- Performance: Instant recommendations without ML inference overhead
- Iteration: Easy to adjust rules based on user feedback
- Cold Start: Works immediately for new users without historical data

**Three-Strategy Approach:**
- Covers different user patterns: linear learners, explorers, strugglers
- Provides variety in recommendations
- Enables A/B testing of different strategies

**Chat-Based Revisit Innovation:**
- Leverages existing RAG chatbot data
- Identifies knowledge gaps through user questions
- Personalized to actual user confusion points

### Alternatives Considered

1. **Collaborative Filtering:**
   - Rejected for MVP: Requires large user base and historical data
   - Future: Implement once user base reaches 1000+ active users
   - "Users who read X also read Y"

2. **Content-Based Filtering:**
   - Rejected: Requires chapter content embeddings and similarity computation
   - More complex than rule-based for MVP
   - Future: Use existing Qdrant embeddings for chapter similarity

3. **Reinforcement Learning:**
   - Rejected: Overkill for MVP, requires extensive experimentation
   - Multi-armed bandit approach could optimize recommendation strategies
   - Future: Test different strategies and learn optimal policy

4. **Random Recommendations:**
   - Rejected: Poor user experience, no personalization value

### Implementation Notes

**Database Schema:**
```sql
-- Progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    section_id VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    last_visited TIMESTAMP DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, chapter_id, section_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_chapter ON user_progress(chapter_id);

-- Chatbot interactions for recommendation insights
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chapter_context VARCHAR(100),  -- Chapter user was viewing
    user_message TEXT,
    bot_response TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_chapter ON chat_messages(chapter_context);
```

**Recommendation Engine:**
```python
from typing import List, Dict
from collections import Counter

class RecommendationEngine:
    def __init__(self, user_id: int, chapter_metadata: List[Dict]):
        self.user_id = user_id
        self.chapters = chapter_metadata  # [{id, title, sequence, prerequisites}]

    async def get_recommendations(self, limit: int = 5) -> List[Dict]:
        """
        Generate personalized recommendations using three strategies.
        Returns list of recommended chapters with reasoning.
        """
        recommendations = []

        # Strategy 1: Sequential progression
        sequential = await self._sequential_recommendation()
        if sequential:
            recommendations.append({
                "chapter": sequential,
                "strategy": "sequential",
                "reason": "Continue your learning journey",
                "priority": 1
            })

        # Strategy 2: Gap detection
        gaps = await self._gap_detection(limit=2)
        for gap in gaps:
            recommendations.append({
                "chapter": gap,
                "strategy": "gap",
                "reason": "Fill knowledge gap from earlier content",
                "priority": 2
            })

        # Strategy 3: Chat-based revisit
        revisits = await self._chat_based_revisit(limit=2)
        for revisit in revisits:
            recommendations.append({
                "chapter": revisit["chapter"],
                "strategy": "chat_revisit",
                "reason": f"Revisit based on {revisit['question_count']} questions asked",
                "priority": 3
            })

        # Deduplicate and sort by priority
        seen = set()
        unique_recs = []
        for rec in recommendations:
            chapter_id = rec["chapter"]["id"]
            if chapter_id not in seen:
                seen.add(chapter_id)
                unique_recs.append(rec)

        return unique_recs[:limit]

    async def _sequential_recommendation(self) -> Dict:
        """Recommend next unread chapter in sequence."""
        progress = await db.user_progress.find({
            "user_id": self.user_id,
            "completed": True
        })
        completed_chapters = {p.chapter_id for p in progress}

        # Find first unread chapter
        for chapter in sorted(self.chapters, key=lambda c: c["sequence"]):
            if chapter["id"] not in completed_chapters:
                return chapter

        return None  # All chapters completed

    async def _gap_detection(self, limit: int = 2) -> List[Dict]:
        """Identify skipped chapters (gaps in reading sequence)."""
        progress = await db.user_progress.find({
            "user_id": self.user_id,
            "completed": True
        })
        completed_chapters = {p.chapter_id for p in progress}

        if not completed_chapters:
            return []

        # Find highest completed chapter
        max_sequence = max(
            c["sequence"] for c in self.chapters
            if c["id"] in completed_chapters
        )

        # Find gaps before max_sequence
        gaps = []
        for chapter in self.chapters:
            if (chapter["sequence"] < max_sequence and
                chapter["id"] not in completed_chapters):
                gaps.append(chapter)

        # Prioritize earlier gaps
        return sorted(gaps, key=lambda c: c["sequence"])[:limit]

    async def _chat_based_revisit(self, limit: int = 2) -> List[Dict]:
        """
        Recommend chapters based on chatbot conversation analysis.
        Chapters with most questions indicate confusion/interest.
        """
        # Get recent chat history (last 30 days)
        since = datetime.utcnow() - timedelta(days=30)
        messages = await db.chat_messages.find({
            "user_id": self.user_id,
            "created_at": {"$gte": since}
        })

        # Count questions per chapter context
        chapter_questions = Counter()
        for msg in messages:
            if msg.chapter_context:
                chapter_questions[msg.chapter_context] += 1

        # Filter to chapters with 3+ questions (indicates struggle or interest)
        candidates = [
            {
                "chapter": next(c for c in self.chapters if c["id"] == ch_id),
                "question_count": count
            }
            for ch_id, count in chapter_questions.items()
            if count >= 3
        ]

        # Sort by question count (most questions = highest priority)
        return sorted(candidates, key=lambda x: x["question_count"], reverse=True)[:limit]
```

**API Endpoint:**
```python
from fastapi import APIRouter, Depends

router = APIRouter()

@router.get("/api/recommendations")
async def get_recommendations(
    limit: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get personalized chapter recommendations."""
    chapters = await load_chapter_metadata()
    engine = RecommendationEngine(current_user.id, chapters)
    recommendations = await engine.get_recommendations(limit)

    return {
        "recommendations": recommendations,
        "user_id": current_user.id,
        "generated_at": datetime.utcnow()
    }
```

**Frontend Display:**
```javascript
// Recommendation card component
function RecommendationCard({ recommendation }) {
  const { chapter, strategy, reason } = recommendation;

  const strategyIcons = {
    sequential: "→",
    gap: "⚠",
    chat_revisit: "💬"
  };

  return (
    <div className="recommendation-card">
      <span className="strategy-badge">
        {strategyIcons[strategy]}
      </span>
      <h3>{chapter.title}</h3>
      <p className="reason">{reason}</p>
      <button onClick={() => navigate(chapter.path)}>
        Start Reading
      </button>
    </div>
  );
}
```

### Future Enhancements

1. **Machine Learning Recommendations:**
   - Train collaborative filtering model on user reading patterns
   - Use chapter content embeddings for semantic similarity
   - Implement neural network for complex pattern recognition

2. **A/B Testing Framework:**
   - Test different recommendation strategies
   - Measure click-through rate, completion rate per strategy
   - Optimize strategy weights based on performance

3. **Prerequisite Enforcement:**
   - Warn users if jumping to advanced chapters without prerequisites
   - Recommend prerequisite chapters first
   - Adaptive difficulty based on quiz/assessment scores

4. **Social Recommendations:**
   - "Popular this week" trending chapters
   - Recommendations from users with similar learning patterns
   - Study group recommendations

5. **Temporal Patterns:**
   - Recommend spaced repetition (revisit chapters after 1 week, 1 month)
   - Time-of-day personalization (heavy theory in morning, practice in evening)

6. **Multi-Armed Bandit:**
   - Explore-exploit balance for recommendation strategies
   - Thompson Sampling to optimize strategy selection
   - Per-user strategy learning

---

## 4. Caching Layer

### Decision

Implement **two-tier caching strategy**:

1. **Production: Redis**
   - Deployment: Railway Redis add-on or Redis Cloud free tier
   - TTL: 1 hour (3600 seconds) for most data
   - Use cases: User sessions, recommendation results, chapter metadata

2. **Development: In-Memory (Python dict)**
   - Fallback when Redis unavailable
   - No persistence across restarts
   - Sufficient for local development

**Cache Keys Strategy:**
```
user:{user_id}:profile          TTL: 1 hour
user:{user_id}:progress         TTL: 5 minutes
user:{user_id}:recommendations  TTL: 1 hour
chapter:{chapter_id}:metadata   TTL: 24 hours
chat:history:{user_id}          TTL: 1 hour
```

### Rationale

**Redis for Production:**
- Performance: Sub-millisecond read/write operations
- Scalability: Handles high throughput (100k+ ops/sec)
- Persistence: Optional RDB/AOF for disaster recovery
- Data Structures: Native support for strings, lists, sets, hashes, sorted sets
- TTL Management: Automatic expiration of keys
- Atomic Operations: INCR, DECR, SET NX for race condition handling
- Railway Integration: One-click Redis add-on with automatic connection string

**In-Memory Fallback for Dev:**
- Zero configuration: No external dependencies
- Fast iteration: No Redis installation needed
- Simplicity: Python dict with manual TTL tracking
- Cost: Free for development

**1-Hour TTL Rationale:**
- User profiles: Low change frequency, acceptable staleness
- Recommendations: Balance freshness with computation cost
- Chapter metadata: Rarely changes, can be longer (24h)
- Progress: Shorter TTL (5 min) for near-real-time accuracy

**Why Not Other TTLs:**
- Too short (<5 min): Excessive cache misses, negates performance benefit
- Too long (>6 hours): Stale data issues, users see outdated progress/recommendations

### Alternatives Considered

1. **Memcached:**
   - Rejected: Less feature-rich than Redis, no persistence
   - Use case: Pure caching without data structures
   - Redis provides more flexibility for future needs

2. **Database-Level Caching:**
   - Rejected: Not granular enough, still hits database
   - PostgreSQL query cache helps but insufficient for high-traffic

3. **CDN Caching:**
   - Deferred: Useful for static assets (chapter HTML), not user-specific data
   - Future: Cloudflare for chapter content caching

4. **Application-Level (in-process) Cache:**
   - Rejected for production: Not shared across multiple server instances
   - Each instance has separate cache, inefficient use of memory

5. **Longer TTL (24+ hours):**
   - Rejected: Stale progress data frustrates users
   - Recommendations become less relevant over time

### Implementation Notes

**Redis Configuration (production):**
```python
import redis
from redis.exceptions import RedisError
import json
import os

# Redis client with connection pooling
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD", None),
    db=0,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry_on_timeout=True,
    max_connections=50,
)

# Test connection
try:
    redis_client.ping()
    print("Redis connected successfully")
except RedisError as e:
    print(f"Redis connection failed: {e}")
    redis_client = None
```

**In-Memory Fallback (development):**
```python
from datetime import datetime, timedelta
from typing import Any, Optional

class InMemoryCache:
    """Simple in-memory cache with TTL support."""

    def __init__(self):
        self._cache = {}
        self._expiry = {}

    def set(self, key: str, value: Any, ttl: int):
        """Set key with TTL in seconds."""
        self._cache[key] = value
        self._expiry[key] = datetime.utcnow() + timedelta(seconds=ttl)

    def get(self, key: str) -> Optional[Any]:
        """Get key if not expired."""
        if key not in self._cache:
            return None

        if datetime.utcnow() > self._expiry[key]:
            # Expired, delete
            del self._cache[key]
            del self._expiry[key]
            return None

        return self._cache[key]

    def delete(self, key: str):
        """Delete key."""
        self._cache.pop(key, None)
        self._expiry.pop(key, None)

    def clear(self):
        """Clear all cache."""
        self._cache.clear()
        self._expiry.clear()

# Global fallback cache
memory_cache = InMemoryCache()
```

**Unified Cache Interface:**
```python
from typing import Any, Optional
import json

class CacheManager:
    """Unified cache interface with Redis primary, in-memory fallback."""

    def __init__(self):
        self.redis = redis_client
        self.memory = memory_cache
        self.use_redis = redis_client is not None

    def set(self, key: str, value: Any, ttl: int = 3600):
        """Set cache value with TTL (default 1 hour)."""
        serialized = json.dumps(value)

        if self.use_redis:
            try:
                self.redis.setex(key, ttl, serialized)
                return
            except RedisError as e:
                print(f"Redis set error: {e}")
                # Fall through to memory cache

        self.memory.set(key, serialized, ttl)

    def get(self, key: str) -> Optional[Any]:
        """Get cache value."""
        if self.use_redis:
            try:
                value = self.redis.get(key)
                if value:
                    return json.loads(value)
            except RedisError as e:
                print(f"Redis get error: {e}")
                # Fall through to memory cache

        value = self.memory.get(key)
        if value:
            return json.loads(value)

        return None

    def delete(self, key: str):
        """Delete cache key."""
        if self.use_redis:
            try:
                self.redis.delete(key)
            except RedisError:
                pass

        self.memory.delete(key)

    def clear_pattern(self, pattern: str):
        """Clear all keys matching pattern (Redis only)."""
        if self.use_redis:
            try:
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)
            except RedisError:
                pass

# Global cache manager
cache = CacheManager()
```

**Usage Examples:**
```python
# Cache user profile
async def get_user_profile(user_id: int):
    cache_key = f"user:{user_id}:profile"

    # Try cache first
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Cache miss, fetch from database
    user = await db.users.find_by_id(user_id)
    profile = {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
    }

    # Cache for 1 hour
    cache.set(cache_key, profile, ttl=3600)
    return profile

# Cache recommendations
async def get_cached_recommendations(user_id: int):
    cache_key = f"user:{user_id}:recommendations"

    cached = cache.get(cache_key)
    if cached:
        return cached

    # Generate recommendations (expensive)
    recommendations = await generate_recommendations(user_id)

    # Cache for 1 hour
    cache.set(cache_key, recommendations, ttl=3600)
    return recommendations

# Cache progress with shorter TTL
async def get_user_progress(user_id: int):
    cache_key = f"user:{user_id}:progress"

    cached = cache.get(cache_key)
    if cached:
        return cached

    progress = await db.user_progress.find({"user_id": user_id})
    progress_data = [p.dict() for p in progress]

    # Cache for 5 minutes (more frequent updates)
    cache.set(cache_key, progress_data, ttl=300)
    return progress_data

# Invalidate cache on update
async def update_user_progress(user_id: int, chapter_id: str, data: dict):
    await db.user_progress.update(user_id, chapter_id, data)

    # Invalidate relevant caches
    cache.delete(f"user:{user_id}:progress")
    cache.delete(f"user:{user_id}:recommendations")  # Recommendations depend on progress
```

**Cache Invalidation Strategy:**
```python
# Invalidate on user updates
async def update_user_profile(user_id: int, updates: dict):
    await db.users.update(user_id, updates)
    cache.delete(f"user:{user_id}:profile")

# Invalidate on logout
async def logout_user(user_id: int):
    # Clear all user-specific caches
    cache.clear_pattern(f"user:{user_id}:*")

# Invalidate on chapter metadata update (admin operation)
async def update_chapter_metadata(chapter_id: str, updates: dict):
    await db.chapters.update(chapter_id, updates)
    cache.delete(f"chapter:{chapter_id}:metadata")
```

**Railway Redis Setup:**
```bash
# Add Redis to Railway project
railway add redis

# Environment variable automatically set
# REDIS_URL=redis://default:password@hostname:port

# Update backend configuration
REDIS_HOST=hostname
REDIS_PORT=port
REDIS_PASSWORD=password
```

**Docker Compose (local development):**
```yaml
services:
  backend:
    build: ./backend
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Future Enhancements

1. **Cache Warming:**
   - Pre-populate cache with popular chapters on deployment
   - Background job to refresh frequently accessed keys before expiry
   - Prevents thundering herd problem

2. **Multi-Level Caching:**
   - L1: In-process cache (LRU, 100 items) for ultra-fast access
   - L2: Redis for shared cache across instances
   - L3: Database as source of truth

3. **Cache Analytics:**
   - Track hit/miss ratios per key pattern
   - Identify optimal TTLs based on data staleness tolerance
   - Monitor cache memory usage

4. **Distributed Caching:**
   - Redis Cluster for horizontal scaling
   - Consistent hashing for key distribution
   - Replication for high availability

5. **Intelligent Invalidation:**
   - Pub/Sub for cache invalidation across instances
   - Event-driven invalidation (webhook on data change)
   - Dependency tracking (invalidate dependent keys)

6. **Cache Compression:**
   - Compress large values (chat history, recommendations) before storing
   - Trade CPU for memory efficiency
   - Use msgpack or gzip for JSON data

---

## 5. Progress Tracking

### Decision

Implement **hybrid progress tracking** with:

1. **Periodic Polling:**
   - Interval: Every 30 seconds while user on page
   - Debounce: Wait 5 seconds after last scroll/interaction before sending
   - Payload: chapter_id, section_id, scroll_percentage, time_spent

2. **Save on Page Unload:**
   - Browser event: `beforeunload` / `visibilitychange`
   - API call: `POST /api/progress/save` with `keepalive: true`
   - Ensures progress saved even if user closes tab

3. **Resume on Page Load:**
   - API call: `GET /api/progress/{chapter_id}`
   - Auto-scroll to last position (with user notification)

### Rationale

**30-Second Polling Interval:**
- Balance: Frequent enough to capture progress, infrequent enough to minimize server load
- Network efficiency: ~120 requests per hour per active user
- User expectation: Progress within 30 seconds is acceptable
- Battery impact: Minimal for desktop, acceptable for mobile

**5-Second Debounce:**
- Reduces unnecessary API calls during active reading
- Waits for user to settle before recording progress
- Avoids recording fleeting positions (scroll past quickly)

**Page Unload Hook:**
- Critical: Captures progress when user closes tab/browser
- `navigator.sendBeacon` or `fetch` with `keepalive: true`
- Fires on: tab close, browser close, navigation away
- Fallback: `visibilitychange` event for mobile/background tabs

**Why Not Real-Time (every 1-5s):**
- Server load: 10-60x more requests, expensive for high traffic
- Diminishing returns: No significant UX improvement over 30s
- Battery drain: Excessive polling on mobile devices

**Why Not Only on Unload:**
- Unreliable: `beforeunload` may not fire (crash, kill process)
- Long sessions: Progress lost if browser/system crashes
- No resilience: All progress since last load lost

### Alternatives Considered

1. **WebSocket Real-Time Tracking:**
   - Rejected: Overkill for progress tracking, maintains persistent connections
   - Use case: If adding real-time collaboration features
   - Higher infrastructure cost (connection management)

2. **IndexedDB + Sync on Load:**
   - Rejected: Complex client-side storage, sync conflicts
   - Use case: Offline-first PWA (future consideration)

3. **Scroll Event Throttling (immediate):**
   - Rejected: Too many requests, poor network efficiency
   - Throttle to 5-10s still generates excessive traffic

4. **Session Recording (FullStory, Hotjar):**
   - Rejected: Privacy concerns, expensive, overkill for progress tracking
   - Use case: User behavior analytics (separate product decision)

5. **Local Storage Only:**
   - Rejected: Progress lost when user switches devices
   - No server-side persistence

### Implementation Notes

**Frontend Progress Tracker (React hook):**
```javascript
import { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

function useProgressTracking(chapterId, sectionId) {
  const [progress, setProgress] = useState({
    scrollPercentage: 0,
    timeSpent: 0,
  });
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const lastSaveRef = useRef(Date.now());

  // Calculate scroll percentage
  const calculateScrollPercentage = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const percentage = Math.round(
      (scrollTop / (documentHeight - windowHeight)) * 100
    );
    return Math.min(100, Math.max(0, percentage));
  };

  // Debounced save function (wait 5s after last activity)
  const debouncedSave = useRef(
    debounce(async (data) => {
      await fetch('/api/progress/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      lastSaveRef.current = Date.now();
    }, 5000)
  ).current;

  // Update progress on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = calculateScrollPercentage();
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const newProgress = {
        chapter_id: chapterId,
        section_id: sectionId,
        scroll_percentage: scrollPercentage,
        time_spent: timeSpent,
      };

      setProgress(newProgress);
      debouncedSave(newProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterId, sectionId]);

  // Periodic save every 30 seconds (even if no scroll)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const scrollPercentage = calculateScrollPercentage();

      const progressData = {
        chapter_id: chapterId,
        section_id: sectionId,
        scroll_percentage: scrollPercentage,
        time_spent: timeSpent,
      };

      // Only save if more than 30s since last save
      if (Date.now() - lastSaveRef.current > 30000) {
        fetch('/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(progressData),
        });
        lastSaveRef.current = Date.now();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalRef.current);
  }, [chapterId, sectionId]);

  // Save on page unload
  useEffect(() => {
    const handleUnload = (e) => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const scrollPercentage = calculateScrollPercentage();

      const progressData = JSON.stringify({
        chapter_id: chapterId,
        section_id: sectionId,
        scroll_percentage: scrollPercentage,
        time_spent: timeSpent,
      });

      // Use sendBeacon for reliable unload
      if (navigator.sendBeacon) {
        const blob = new Blob([progressData], { type: 'application/json' });
        navigator.sendBeacon('/api/progress/save', blob);
      } else {
        // Fallback: synchronous fetch with keepalive
        fetch('/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: progressData,
          keepalive: true,
        });
      }
    };

    // Handle visibility change (mobile background)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleUnload();
      } else {
        // Page visible again, reset start time
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chapterId, sectionId]);

  return progress;
}

export default useProgressTracking;
```

**Resume on Page Load:**
```javascript
import { useEffect, useState } from 'react';

function useResumeProgress(chapterId) {
  const [shouldResume, setShouldResume] = useState(false);
  const [resumePosition, setResumePosition] = useState(0);

  useEffect(() => {
    async function loadProgress() {
      const response = await fetch(`/api/progress/${chapterId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.scroll_percentage > 10) {
          // Only resume if user was past 10%
          setResumePosition(data.scroll_percentage);
          setShouldResume(true);
        }
      }
    }

    loadProgress();
  }, [chapterId]);

  const handleResume = () => {
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = (resumePosition / 100) * (documentHeight - windowHeight);

    window.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });

    setShouldResume(false);
  };

  const handleDismiss = () => {
    setShouldResume(false);
  };

  return { shouldResume, resumePosition, handleResume, handleDismiss };
}

// Usage in component
function ChapterPage({ chapterId }) {
  const { shouldResume, resumePosition, handleResume, handleDismiss } =
    useResumeProgress(chapterId);

  return (
    <>
      {shouldResume && (
        <div className="resume-banner">
          <p>Resume from where you left off? ({resumePosition}%)</p>
          <button onClick={handleResume}>Resume</button>
          <button onClick={handleDismiss}>Start from beginning</button>
        </div>
      )}

      <ChapterContent chapterId={chapterId} />
    </>
  );
}
```

**Backend API Endpoint:**
```python
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ProgressUpdate(BaseModel):
    chapter_id: str
    section_id: str | None = None
    scroll_percentage: int
    time_spent: int  # seconds

@router.post("/api/progress/save")
async def save_progress(
    progress: ProgressUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Save user progress. Process asynchronously for performance.
    """
    background_tasks.add_task(
        _save_progress_task,
        current_user.id,
        progress
    )

    return {"status": "queued"}

async def _save_progress_task(user_id: int, progress: ProgressUpdate):
    """Background task to save progress."""
    # Upsert progress
    await db.user_progress.upsert(
        {
            "user_id": user_id,
            "chapter_id": progress.chapter_id,
            "section_id": progress.section_id,
        },
        {
            "progress_percentage": progress.scroll_percentage,
            "time_spent_seconds": progress.time_spent,
            "last_visited": datetime.utcnow(),
            "completed": progress.scroll_percentage >= 95,  # Mark complete at 95%
        }
    )

    # Invalidate cache
    cache.delete(f"user:{user_id}:progress")
    cache.delete(f"user:{user_id}:recommendations")

@router.get("/api/progress/{chapter_id}")
async def get_progress(
    chapter_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user's progress for a specific chapter."""
    progress = await db.user_progress.find_one({
        "user_id": current_user.id,
        "chapter_id": chapter_id,
    })

    if not progress:
        return {
            "scroll_percentage": 0,
            "time_spent": 0,
            "completed": False,
        }

    return {
        "scroll_percentage": progress.progress_percentage,
        "time_spent": progress.time_spent_seconds,
        "completed": progress.completed,
        "last_visited": progress.last_visited.isoformat(),
    }

@router.get("/api/progress")
async def get_all_progress(
    current_user: User = Depends(get_current_user)
):
    """Get user's progress across all chapters."""
    cache_key = f"user:{current_user.id}:progress"

    # Try cache
    cached = cache.get(cache_key)
    if cached:
        return {"progress": cached}

    # Query database
    progress = await db.user_progress.find({
        "user_id": current_user.id,
    })

    progress_data = [
        {
            "chapter_id": p.chapter_id,
            "section_id": p.section_id,
            "progress_percentage": p.progress_percentage,
            "time_spent": p.time_spent_seconds,
            "completed": p.completed,
            "last_visited": p.last_visited.isoformat(),
        }
        for p in progress
    ]

    # Cache for 5 minutes
    cache.set(cache_key, progress_data, ttl=300)

    return {"progress": progress_data}
```

**Database Optimizations:**
```sql
-- Composite index for fast lookups
CREATE INDEX idx_user_progress_user_chapter
ON user_progress(user_id, chapter_id);

-- Index for recently viewed chapters
CREATE INDEX idx_user_progress_last_visited
ON user_progress(user_id, last_visited DESC);

-- Partial index for completed chapters
CREATE INDEX idx_user_progress_completed
ON user_progress(user_id)
WHERE completed = TRUE;
```

### Future Enhancements

1. **Offline Support (PWA):**
   - IndexedDB for progress storage when offline
   - Background sync API to push progress when back online
   - Conflict resolution if user reads on multiple devices while offline

2. **Reading Speed Analytics:**
   - Calculate words per minute based on time spent and content length
   - Estimate time remaining for chapter
   - Personalized reading time recommendations

3. **Activity Heatmap:**
   - Visualize which sections user spent most time on
   - Identify difficult sections (high time, low progress)
   - Admin dashboard for content optimization

4. **Cross-Device Sync:**
   - Real-time progress sync using WebSocket
   - "Continue reading" on different device
   - Conflict resolution (last-write-wins with timestamp)

5. **Smart Resume:**
   - Resume from last paragraph (not just scroll percentage)
   - Skip to next unread section
   - Context preview of where user left off

6. **Progress Gamification:**
   - Achievements for milestones (25%, 50%, 75%, 100%)
   - Reading streaks (consecutive days)
   - Leaderboards (optional, privacy-respecting)

---

## 6. Highlight Storage

### Decision

Use **character offsets** for highlight storage in MVP:

**Data Model:**
```sql
CREATE TABLE user_highlights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    highlighted_text TEXT NOT NULL,
    note TEXT,
    color VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_highlights_user_chapter
ON user_highlights(user_id, chapter_id);
```

**Character Offset Definition:**
- `start_offset`: Character position from start of chapter HTML where highlight begins
- `end_offset`: Character position where highlight ends
- `highlighted_text`: Stored for verification and display in highlight list

### Rationale

**Character Offsets for MVP:**
- Simplicity: Easy to calculate and store from JavaScript `Selection` API
- Performance: Fast database queries and client-side rendering
- Robustness: Works across all browsers without complex DOM traversal
- Lightweight: Small storage footprint (two integers per highlight)

**Why Store `highlighted_text`:**
- Verification: Detect if content changed (offset mismatch)
- Display: Show highlights in sidebar/list without re-parsing document
- Search: Find highlights by text content

**Color Support:**
- Multiple highlight colors for categorization (yellow, green, pink, blue)
- Default yellow for simplicity
- Future: User-customizable color palettes

**Why Not Other Approaches (for MVP):**
- XPath/CSS Selectors: Brittle, breaks if HTML structure changes
- DOM Range serialization: Complex, browser compatibility issues
- Text-based matching: Unreliable for duplicate text, performance issues
- Annotation standards (Web Annotation): Overkill for MVP, complex implementation

### Alternatives Considered

1. **XPath + Text Offset:**
   - More robust for content changes
   - Rejected for MVP: Complex implementation, browser compatibility
   - **Future Migration Path:** Implement for v2.0 after MVP validation

2. **Web Annotation Data Model:**
   - W3C standard, interoperable
   - Rejected: Over-engineered for MVP, adds complexity
   - Use case: If building annotation platform or need interoperability

3. **Text-Position Anchoring:**
   - Search for text snippet + context
   - Rejected: Fails with duplicate text, slow for long documents
   - Hypothesis.is uses this with XPath fallback

4. **DOM Range Serialization:**
   - Serialize `window.getSelection().getRangeAt(0)`
   - Rejected: Not human-readable, fragile across page loads

5. **Markdown Offsets:**
   - Store offsets relative to Markdown source
   - Rejected: Requires Markdown source access, complex rendering mapping

### Implementation Notes

**Frontend Highlight Creation:**
```javascript
function createHighlight(color = 'yellow') {
  const selection = window.getSelection();

  if (selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const chapterContent = document.getElementById('chapter-content');

  // Calculate character offsets relative to chapter content
  const startOffset = getCharacterOffset(chapterContent, range.startContainer, range.startOffset);
  const endOffset = getCharacterOffset(chapterContent, range.endContainer, range.endOffset);

  const highlightData = {
    chapter_id: getCurrentChapterId(),
    start_offset: startOffset,
    end_offset: endOffset,
    highlighted_text: selection.toString(),
    color: color,
  };

  // Save to backend
  saveHighlight(highlightData);

  // Apply visual highlight
  applyHighlightToDOM(range, color);

  // Clear selection
  selection.removeAllRanges();
}

function getCharacterOffset(root, node, offset) {
  /**
   * Calculate character offset from root to node+offset.
   * Traverses DOM tree counting text node characters.
   */
  let charOffset = 0;
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) {
      return charOffset + offset;
    }
    charOffset += currentNode.textContent.length;
  }

  return charOffset;
}

function applyHighlightToDOM(range, color) {
  /**
   * Wrap selected text in <mark> element with color class.
   */
  const mark = document.createElement('mark');
  mark.className = `highlight highlight-${color}`;
  mark.setAttribute('data-highlight-id', Date.now()); // Temporary ID

  try {
    range.surroundContents(mark);
  } catch (e) {
    // Fallback for complex selections spanning multiple elements
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
  }
}

async function saveHighlight(highlightData) {
  const response = await fetch('/api/highlights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(highlightData),
  });

  if (response.ok) {
    const { id } = await response.json();
    // Update DOM mark with real highlight ID
    const tempMarks = document.querySelectorAll('[data-highlight-id]');
    if (tempMarks.length > 0) {
      tempMarks[tempMarks.length - 1].setAttribute('data-highlight-id', id);
    }
  }
}
```

**Frontend Highlight Restoration:**
```javascript
async function restoreHighlights(chapterId) {
  /**
   * Load and render highlights when chapter loads.
   */
  const response = await fetch(`/api/highlights/${chapterId}`, {
    credentials: 'include',
  });

  if (!response.ok) return;

  const { highlights } = await response.json();
  const chapterContent = document.getElementById('chapter-content');

  highlights.forEach(highlight => {
    try {
      const range = createRangeFromOffsets(
        chapterContent,
        highlight.start_offset,
        highlight.end_offset
      );

      // Verify text matches (content unchanged)
      if (range.toString() === highlight.highlighted_text) {
        applyHighlightToDOM(range, highlight.color);

        // Update mark with highlight ID
        const marks = chapterContent.querySelectorAll('mark');
        if (marks.length > 0) {
          marks[marks.length - 1].setAttribute('data-highlight-id', highlight.id);
        }
      } else {
        console.warn(`Highlight ${highlight.id} text mismatch, skipping`);
      }
    } catch (e) {
      console.error(`Failed to restore highlight ${highlight.id}:`, e);
    }
  });
}

function createRangeFromOffsets(root, startOffset, endOffset) {
  /**
   * Create DOM Range from character offsets.
   * Inverse of getCharacterOffset().
   */
  const range = document.createRange();
  let charCount = 0;
  let startNode, startNodeOffset, endNode, endNodeOffset;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    const nodeLength = currentNode.textContent.length;

    // Find start position
    if (!startNode && charCount + nodeLength >= startOffset) {
      startNode = currentNode;
      startNodeOffset = startOffset - charCount;
    }

    // Find end position
    if (!endNode && charCount + nodeLength >= endOffset) {
      endNode = currentNode;
      endNodeOffset = endOffset - charCount;
      break;
    }

    charCount += nodeLength;
  }

  if (!startNode || !endNode) {
    throw new Error('Could not find nodes for offsets');
  }

  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);

  return range;
}
```

**CSS for Highlights:**
```css
mark.highlight {
  padding: 0;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.2s;
}

mark.highlight-yellow {
  background-color: #ffeb3b80; /* 50% opacity yellow */
}

mark.highlight-green {
  background-color: #8bc34a80;
}

mark.highlight-pink {
  background-color: #f4433680;
}

mark.highlight-blue {
  background-color: #2196f380;
}

mark.highlight:hover {
  opacity: 0.7;
}

/* Selected highlight (for editing/deleting) */
mark.highlight.selected {
  outline: 2px solid #000;
  outline-offset: 2px;
}
```

**Backend API:**
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class HighlightCreate(BaseModel):
    chapter_id: str
    start_offset: int
    end_offset: int
    highlighted_text: str
    note: str | None = None
    color: str = "yellow"

class HighlightResponse(BaseModel):
    id: int
    chapter_id: str
    start_offset: int
    end_offset: int
    highlighted_text: str
    note: str | None
    color: str
    created_at: str

@router.post("/api/highlights")
async def create_highlight(
    highlight: HighlightCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new highlight."""
    # Validate offsets
    if highlight.start_offset >= highlight.end_offset:
        raise HTTPException(400, "Invalid offsets")

    if not highlight.highlighted_text.strip():
        raise HTTPException(400, "Empty highlight text")

    # Save to database
    result = await db.user_highlights.create({
        "user_id": current_user.id,
        "chapter_id": highlight.chapter_id,
        "start_offset": highlight.start_offset,
        "end_offset": highlight.end_offset,
        "highlighted_text": highlight.highlighted_text,
        "note": highlight.note,
        "color": highlight.color,
        "created_at": datetime.utcnow(),
    })

    return {"id": result.id, "status": "created"}

@router.get("/api/highlights/{chapter_id}")
async def get_highlights(
    chapter_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Get all highlights for a chapter."""
    highlights = await db.user_highlights.find({
        "user_id": current_user.id,
        "chapter_id": chapter_id,
    })

    return {
        "highlights": [
            {
                "id": h.id,
                "chapter_id": h.chapter_id,
                "start_offset": h.start_offset,
                "end_offset": h.end_offset,
                "highlighted_text": h.highlighted_text,
                "note": h.note,
                "color": h.color,
                "created_at": h.created_at.isoformat(),
            }
            for h in highlights
        ]
    }

@router.delete("/api/highlights/{highlight_id}")
async def delete_highlight(
    highlight_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete highlight."""
    highlight = await db.user_highlights.find_by_id(highlight_id)

    if not highlight or highlight.user_id != current_user.id:
        raise HTTPException(404, "Highlight not found")

    await db.user_highlights.delete(highlight_id)

    return {"status": "deleted"}

@router.patch("/api/highlights/{highlight_id}")
async def update_highlight(
    highlight_id: int,
    updates: dict,
    current_user: User = Depends(get_current_user)
):
    """Update highlight (note or color)."""
    highlight = await db.user_highlights.find_by_id(highlight_id)

    if not highlight or highlight.user_id != current_user.id:
        raise HTTPException(404, "Highlight not found")

    # Only allow updating note and color
    allowed_fields = {"note", "color"}
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    filtered_updates["updated_at"] = datetime.utcnow()

    await db.user_highlights.update(highlight_id, filtered_updates)

    return {"status": "updated"}

@router.get("/api/highlights")
async def get_all_highlights(
    current_user: User = Depends(get_current_user)
):
    """Get all user highlights across all chapters."""
    highlights = await db.user_highlights.find({
        "user_id": current_user.id,
    })

    # Group by chapter
    by_chapter = {}
    for h in highlights:
        if h.chapter_id not in by_chapter:
            by_chapter[h.chapter_id] = []
        by_chapter[h.chapter_id].append({
            "id": h.id,
            "start_offset": h.start_offset,
            "end_offset": h.end_offset,
            "highlighted_text": h.highlighted_text,
            "note": h.note,
            "color": h.color,
            "created_at": h.created_at.isoformat(),
        })

    return {"highlights_by_chapter": by_chapter}
```

### Future Enhancements

1. **XPath + Text Position Anchoring:**
   - Migrate to robust anchoring for content updates
   - W3C Web Annotation Model compliance
   - Fallback to text search if XPath fails

2. **Collaborative Highlights:**
   - Share highlights with other users
   - Public vs. private highlights
   - Discussion threads on highlights

3. **Smart Highlight Export:**
   - Export to Notion, Obsidian, Roam Research
   - PDF annotation format (XFDF)
   - Markdown export with chapter references

4. **Highlight Analytics:**
   - Most highlighted passages (popular insights)
   - Personal highlight heatmap
   - Suggest important passages to highlight

5. **Highlight Search:**
   - Full-text search across all highlights
   - Filter by chapter, color, date
   - Tag system for organization

6. **Multi-Page Highlights:**
   - Support highlighting across chapter boundaries
   - Complex selection handling

7. **Voice Notes:**
   - Attach audio notes to highlights
   - Speech-to-text for searchability

---

## 7. Session Management

### Decision

Implement **stateless JWT-based session management** with:

- **No server-side session storage:** Tokens contain all necessary information
- **Short access token expiry (15 min):** Limits exposure window
- **Refresh token rotation:** New refresh token issued on each use
- **Token versioning:** User-level token_version for immediate revocation
- **httpOnly cookies:** Prevents XSS token theft

**Session Properties:**
```python
# Access Token Payload
{
    "user_id": 123,
    "email": "user@example.com",
    "type": "access",
    "iat": 1701388800,  # Issued at
    "exp": 1701389700,  # Expires in 15 min
}

# Refresh Token Payload
{
    "user_id": 123,
    "token_version": 5,  # Incremented on logout/password change
    "type": "refresh",
    "iat": 1701388800,
    "exp": 1701993600,  # Expires in 7 days
}
```

### Rationale

**Stateless Over Stateful:**
- Scalability: No session affinity, any server can validate tokens
- Performance: No database/Redis lookup per request
- Simplicity: No session cleanup jobs, automatic expiration
- Cost: Lower infrastructure cost (no session storage)

**Short Access Token Expiry:**
- Security: Limits damage if token leaked (only 15 min window)
- Revocation: Worst case 15 min before revocation takes effect
- User Experience: Transparent refresh, user never logs in again

**Refresh Token Rotation:**
- Security: One-time use refresh tokens
- Prevents: Replay attacks, stolen refresh token persistence
- Detection: Refresh token reuse indicates potential compromise

**Token Versioning:**
- Immediate Revocation: Logout/password change invalidates all tokens
- Simple Implementation: Single integer field in users table
- No Blacklist Needed: Avoids Redis/DB blacklist complexity

**Why Not Session Storage:**
- Redis Dependency: Another service to maintain, cost overhead
- Scalability: Requires sticky sessions or shared Redis
- Complexity: Session cleanup, expiration management
- Use Case: Only if need server-side state (permissions cache, etc.)

### Alternatives Considered

1. **Redis Session Storage:**
   - Rejected: Unnecessary for MVP, adds complexity
   - Use case: If need server-side session state (shopping cart, wizards)
   - Future: Consider for admin panel with complex permissions

2. **Long-Lived Single Token:**
   - Rejected: Security risk, no revocation without blacklist
   - Use case: Never recommended for web applications

3. **Sliding Window Sessions:**
   - Token expiry extends on each request
   - Rejected: Can't implement with stateless JWT
   - Requires session storage to track last activity

4. **OAuth 2.0 Implicit Flow:**
   - Rejected: Deprecated, security issues (tokens in URL)
   - Modern standard: Authorization Code Flow with PKCE

5. **JWT Blacklist:**
   - Redis-based blacklist of revoked tokens
   - Rejected for MVP: Adds complexity, same as session storage
   - Future: Add if immediate revocation critical (admin actions)

### Implementation Notes

**Token Generation:**
```python
import jwt
from datetime import datetime, timedelta
from typing import Dict
import os

# Secret keys (store in environment variables)
JWT_SECRET = os.getenv("JWT_SECRET")  # Generate with: openssl rand -hex 32
JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(user: User) -> str:
    """Generate access token."""
    payload = {
        "user_id": user.id,
        "email": user.email,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user: User) -> str:
    """Generate refresh token."""
    payload = {
        "user_id": user.id,
        "token_version": user.token_version,
        "type": "refresh",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_access_token(token: str) -> Dict:
    """Verify and decode access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

def verify_refresh_token(token: str, user: User) -> Dict:
    """Verify refresh token and check version."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")

        # Check token version
        if payload.get("token_version") != user.token_version:
            raise HTTPException(401, "Token revoked")

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired, please login")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")
```

**Authentication Endpoints:**
```python
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"

@router.post("/api/auth/login")
async def login(credentials: LoginRequest, response: Response):
    """Login and set tokens in httpOnly cookies."""
    # Authenticate user
    user = await authenticate_user(credentials.email, credentials.password)

    if not user:
        raise HTTPException(401, "Invalid credentials")

    # Generate tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    # Set httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="strict",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="strict",
    )

    # Update last login
    await db.users.update(user.id, {"last_login": datetime.utcnow()})

    return {
        "user": {
            "id": user.id,
            "email": user.email,
        },
        "message": "Login successful"
    }

@router.post("/api/auth/refresh")
async def refresh_tokens(
    response: Response,
    refresh_token: str = Cookie(None)
):
    """Refresh access token using refresh token."""
    if not refresh_token:
        raise HTTPException(401, "No refresh token")

    # Decode refresh token
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

    # Get user
    user = await db.users.find_by_id(payload["user_id"])
    if not user:
        raise HTTPException(401, "User not found")

    # Verify token version
    if payload.get("token_version") != user.token_version:
        raise HTTPException(401, "Token revoked")

    # Generate new tokens (rotation)
    new_access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user)

    # Update cookies
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=True,
        samesite="strict",
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="strict",
    )

    return {"message": "Tokens refreshed"}

@router.post("/api/auth/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """Logout and invalidate all tokens."""
    # Increment token version (invalidates all existing tokens)
    await db.users.update(
        current_user.id,
        {"token_version": current_user.token_version + 1}
    )

    # Clear cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"message": "Logged out successfully"}

@router.get("/api/auth/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user info (protected route example)."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat(),
    }
```

**Authentication Dependency:**
```python
from fastapi import Cookie, HTTPException

async def get_current_user(
    access_token: str = Cookie(None)
) -> User:
    """Dependency to extract and validate current user from access token."""
    if not access_token:
        raise HTTPException(401, "Not authenticated")

    # Verify token
    payload = verify_access_token(access_token)

    # Get user from database
    user = await db.users.find_by_id(payload["user_id"])
    if not user:
        raise HTTPException(401, "User not found")

    return user

# Usage in protected routes
@router.get("/api/protected-resource")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.email}"}
```

**Frontend Token Refresh:**
```javascript
// Setup axios interceptor for automatic token refresh
import axios from 'axios';

let isRefreshing = false;
let refreshSubscribers = [];

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise(resolve => {
          refreshSubscribers.push(() => {
            resolve(axios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh
        await axios.post('/api/auth/refresh', {}, {
          withCredentials: true,
        });

        // Retry all queued requests
        refreshSubscribers.forEach(callback => callback());
        refreshSubscribers = [];

        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

**Security Considerations:**
```python
# Environment variables
JWT_SECRET = "your-secret-key-here"  # MUST be strong (32+ chars)
COOKIE_SECURE = True  # HTTPS only in production
CORS_ORIGINS = ["https://yourdomain.com"]  # Whitelist frontend

# CORS configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,  # Required for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

# CSRF protection for state-changing operations (POST, PUT, DELETE)
# Not needed if using SameSite=strict cookies + CORS whitelist
```

### Future Enhancements

1. **JWT Blacklist (Redis):**
   - Store revoked tokens in Redis for immediate invalidation
   - Use case: High-security actions (delete account, admin revoke)
   - TTL equal to token expiration

2. **Multi-Factor Authentication (MFA):**
   - TOTP (Time-based One-Time Password) via authenticator apps
   - SMS/Email verification codes
   - Backup codes for account recovery

3. **Device Fingerprinting:**
   - Track active sessions per device
   - Alert on login from new device/location
   - Allow users to revoke specific device sessions

4. **Adaptive Security:**
   - Shorter token expiry for sensitive actions (payment, settings)
   - Longer expiry for trusted devices (remember me)
   - Risk scoring based on IP, device, behavior

5. **OAuth 2.0 / OIDC:**
   - Integrate social login (Google, GitHub, Microsoft)
   - SSO for enterprise customers
   - PKCE for mobile apps

6. **Session Analytics:**
   - Track concurrent sessions per user
   - Unusual activity detection (impossible travel)
   - Security event log for auditing

---

## Summary

This research document establishes the technical foundation for the personalization feature with pragmatic, security-conscious decisions optimized for MVP delivery:

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Authentication** | JWT (access 15min, refresh 7d, httpOnly cookies) | Security (XSS protection), scalability (stateless) |
| **Password Hashing** | bcrypt, 12 rounds | OWASP recommended, proven security, acceptable performance |
| **Recommendations** | Rule-based (sequential, gaps, chat-revisit) | Simplicity, interpretability, no training data needed |
| **Caching** | Redis (prod, 1h TTL), in-memory (dev) | Performance, cost-effective, Railway integration |
| **Progress Tracking** | Polling (30s, 5s debounce), unload save | Balance: accuracy vs. server load |
| **Highlights** | Character offsets | MVP simplicity, future migration path to XPath |
| **Session Management** | Stateless JWT, token versioning | Scalability, security, no server-side storage |

### Implementation Priority

**Phase 1 (MVP):**
1. JWT authentication + password hashing
2. Progress tracking (polling + unload)
3. Character offset highlights
4. Basic caching (in-memory dev, Redis prod)

**Phase 2 (Post-MVP):**
5. Recommendation engine (rule-based)
6. Highlight colors and notes
7. Cache optimization

**Phase 3 (Future):**
8. XPath highlight migration
9. ML recommendations
10. Advanced session management (MFA, device tracking)

### Next Steps

1. Create database migration scripts for new tables (users, user_progress, user_highlights, chat_messages)
2. Implement JWT authentication endpoints (login, refresh, logout)
3. Build progress tracking React hook and backend API
4. Implement highlight creation/restoration frontend logic
5. Set up Redis on Railway for production caching
6. Write integration tests for authentication flow
7. Security audit (OWASP checklist, penetration testing)

---

**Document Status:** Complete
**Review Date:** 2025-12-01
**Next Review:** After MVP deployment
**Owner:** Development Team
