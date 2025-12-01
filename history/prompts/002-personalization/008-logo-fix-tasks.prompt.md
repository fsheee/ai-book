---
id: 008
title: logo-fix-tasks
stage: tasks
date: 2025-12-01T00:00:00Z
surface: claude-code-cli
model: claude-sonnet-4-5
feature: 002-personalization
branch: 002-personalization
user: User
command: /sp.tasks check landingpage logo not show
labels: [tasks, bug-fix, logo, navbar, docusaurus-config]
links:
  spec: N/A
  plan: N/A
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/002-personalization/tasks-logo-fix.md
    action: create
    description: Generated comprehensive task breakdown for fixing navbar logo display issue
tests: []
---

## Prompt

User request: "check landingpage logo not show"

Context: Logo configured in navbar but not displaying on landing page (both local and GitHub Pages).

## Response snapshot

**Investigation**:
- Reviewed `frontend/docusaurus.config.js` lines 89-94
- Found logo configuration at line 93:
  ```javascript
  logo: {
    alt: 'Physical AI Logo',
    src: 'frontend/static/img/phycial_ai_logo.jpg',  // ❌ INCORRECT
  }
  ```

**Root Cause Identified**:
1. **Incorrect Path Prefix**: Logo src includes `frontend/static/` prefix
   - Current: `'frontend/static/img/phycial_ai_logo.jpg'`
   - Should be: `'img/phycial_ai_logo.jpg'`
   - Reason: Docusaurus automatically resolves paths relative to `static/` directory

2. **Additional Issue - Filename Typo**: "phycial" should be "physical"
   - File exists at: `frontend/static/img/phycial_ai_logo.jpg`
   - Correct spelling: `frontend/static/img/physical_ai_logo.jpg`

**Why This Causes the Problem**:
- Docusaurus serves files from `static/` at root level during build
- Including `frontend/static/` in path creates incorrect URL: `/ai-book/frontend/static/img/...`
- Correct URL should be: `/ai-book/img/phycial_ai_logo.jpg`
- Browser tries to fetch non-existent path → 404 error → no logo

**Tasks Generated**:
Created `specs/002-personalization/tasks-logo-fix.md` with **15 tasks across 5 phases**:

### Phase 1: Diagnosis & Verification (T001-T004)
- Check current logo path in config
- Verify logo file exists
- Check logo display in local development
- Check logo display on GitHub Pages

### Phase 2: Fix Logo Path (T005)
- **Main Fix**: Update logo src from `'frontend/static/img/phycial_ai_logo.jpg'` to `'img/phycial_ai_logo.jpg'`
- Single line change in docusaurus.config.js line 93

### Phase 3: Optional - Fix Filename Typo (T006-T007)
- Rename file from `phycial_ai_logo.jpg` to `physical_ai_logo.jpg`
- Update config to match new filename
- Optional enhancement for cleanliness

### Phase 4: Testing & Deployment (T008-T013)
- Build production bundle
- Test logo in local production build
- Create git commit
- Push to GitHub
- Deploy to GitHub Pages
- Verify logo on live site

### Phase 5: Documentation (T014-T015)
- Add inline comment explaining path convention
- Update IMPLEMENTATION_COMPLETE_SUMMARY.md

**Implementation Details Provided**:
- Before/after code comparison
- Explanation of Docusaurus path conventions
- Build and deployment commands
- Testing checklist (12 verification points)
- Success criteria

**Docusaurus Path Convention Explained**:
```
✅ CORRECT:
- File: static/img/logo.png
- Config: 'img/logo.png'
- URL: /baseUrl/img/logo.png

❌ INCORRECT:
- Config: 'static/img/logo.png'
- Config: 'frontend/static/img/logo.png'
- Results in: /baseUrl/static/img/logo.png (404)
```

## Outcome

- ✅ Impact: Identified logo display issue - incorrect path prefix in Docusaurus config. Simple one-line fix will restore logo in navbar.
- 🧪 Tests: Testing checklist covers local dev, production build, and GitHub Pages verification
- 📁 Files: Created 1 file (tasks-logo-fix.md with 15 tasks across 5 phases)
- 🔁 Next prompts: Execute fix implementation - update docusaurus.config.js line 93, rebuild, and redeploy
- 🧠 Reflection: Common Docusaurus mistake - including full path instead of path relative to static/. Quick fix with high visibility impact.

## Evaluation notes (flywheel)

- Failure modes observed: None - root cause clearly identified
- Graders run and results (PASS/FAIL): N/A (task generation, not implementation)
- Prompt variant (if applicable): Standard /sp.tasks with natural language bug description
- Next experiment (smallest change to try): Single line change in config file - minimal risk, immediate visibility

---

## Technical Details

**File Structure**:
```
frontend/
├── docusaurus.config.js     (config file - needs fix on line 93)
└── static/
    └── img/
        └── phycial_ai_logo.jpg  (logo file exists ✅, but typo in filename)
```

**Current Configuration** (Line 89-94):
```javascript
navbar: {
  title: 'Physical AI & Humanoid Robotics',
  logo: {
    alt: 'Physical AI Logo',
    src: 'frontend/static/img/phycial_ai_logo.jpg',  // ❌ WRONG
  },
```

**Fixed Configuration**:
```javascript
navbar: {
  title: 'Physical AI & Humanoid Robotics',
  logo: {
    alt: 'Physical AI Logo',
    src: 'img/phycial_ai_logo.jpg',  // ✅ CORRECT (relative to static/)
  },
```

**Optional Enhancement** (fix filename typo):
```javascript
src: 'img/physical_ai_logo.jpg',  // ✅ CORRECT + typo fixed
```

**Impact of Fix**:
- Logo will appear in navbar on all pages
- Branding restored
- Professional appearance
- No broken image icon

**Priority**: High (visual branding issue)
**Complexity**: Very Low (1-2 line change)
**Risk**: Very Low (simple path correction)
**Time Estimate**: 10-15 minutes total

---

## Key Decisions

**Two-Step Approach**:
1. **Required**: Fix path prefix (Phase 2) - restores logo functionality
2. **Optional**: Fix filename typo (Phase 3) - improves code quality

**Why Optional Typo Fix**:
- Logo will work with current filename
- Renaming requires git file operation (rm + add)
- Can be done later if needed
- Priority is restoring logo display

**Deployment Strategy**:
- Fix path → Build → Test locally → Deploy to verify
- If filename renamed, rebuild and redeploy
- Minimal downtime, immediate visibility of fix
