# Tasks: Landing Page Logo Display Fix

**Issue**: Logo not displaying in navbar on landing page (both local and GitHub Pages)

**Root Cause**: Incorrect logo path in `frontend/docusaurus.config.js` line 93. Path is set to `'frontend/static/img/phycial_ai_logo.jpg'` but should be `'img/phycial_ai_logo.jpg'` because Docusaurus automatically resolves paths relative to the `static/` directory.

**Additional Issue**: Typo in filename - "phycial" should be "physical"

**Solution**:
1. Fix the logo path in docusaurus.config.js (remove `frontend/static/` prefix)
2. Optionally: Rename the logo file to fix the typo

---

## Constitution Compliance Checklist *(mandatory)*

- ✅ **Core Principles**: Fixes deployment issue following minimal change approach
- ✅ **Project Sections**: Improves AI-Generated Book frontend user interface
- ✅ **Execution Guidelines**: Targeted fix, no over-engineering
- ✅ **Architect Guidelines**: Follows Docusaurus path conventions
- ✅ **Project Structure**: Respects existing frontend structure
- ✅ **Versioning and Governance**: Will create commit after fix

---

## Phase 1: Diagnosis & Verification

**Purpose**: Confirm the issue and verify file existence

- [ ] T001 Check current logo path in frontend/docusaurus.config.js (line 93)
- [ ] T002 Verify logo file exists at frontend/static/img/phycial_ai_logo.jpg
- [ ] T003 Check if logo displays in local development
- [ ] T004 Check if logo displays on GitHub Pages

**Checkpoint**: Issue confirmed - incorrect path prefix

---

## Phase 2: Fix Logo Path

**Purpose**: Correct the logo path in configuration

- [ ] T005 Update logo src in frontend/docusaurus.config.js from 'frontend/static/img/phycial_ai_logo.jpg' to 'img/phycial_ai_logo.jpg'

**Checkpoint**: Logo path corrected

---

## Phase 3: Optional - Fix Filename Typo

**Purpose**: Rename file to fix "phycial" → "physical" typo (OPTIONAL)

- [ ] T006 [OPTIONAL] Rename frontend/static/img/phycial_ai_logo.jpg to physical_ai_logo.jpg
- [ ] T007 [OPTIONAL] Update logo src in frontend/docusaurus.config.js to 'img/physical_ai_logo.jpg'

**Checkpoint**: Filename typo fixed (if executed)

---

## Phase 4: Testing & Deployment

**Purpose**: Verify fix works locally and on GitHub Pages

- [ ] T008 Build production bundle (npm run build)
- [ ] T009 Test logo display in local production build (npm run serve)
- [ ] T010 Create git commit with fix
- [ ] T011 Push to GitHub
- [ ] T012 Deploy to GitHub Pages
- [ ] T013 Verify logo displays correctly on live site

**Checkpoint**: Logo displays correctly on all environments

---

## Phase 5: Documentation

**Purpose**: Document the fix

- [ ] T014 Add inline comment in docusaurus.config.js explaining path convention
- [ ] T015 Update IMPLEMENTATION_COMPLETE_SUMMARY.md with logo fix

**Checkpoint**: Fix documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Diagnosis)**: No dependencies - start immediately
- **Phase 2 (Fix Path)**: Depends on Phase 1 (issue confirmed)
- **Phase 3 (Fix Typo)**: Optional, can run in parallel with Phase 2 or separately
- **Phase 4 (Testing)**: Depends on Phase 2 (or Phase 3 if executed)
- **Phase 5 (Documentation)**: Depends on Phase 4 (fix verified)

### Task Dependencies

**Phase 1**: Sequential review (T001 → T002 → T003 → T004)

**Phase 2**: Single task (T005) - main fix

**Phase 3**: Optional sequential (T006 → T007)

**Phase 4**: Sequential workflow (T008 → T009 → T010 → T011 → T012 → T013)

**Phase 5**: T014, T015 can run in parallel (different files)

---

## Implementation Details

### T005: Fix Logo Path

**File**: `frontend/docusaurus.config.js`

**Line 93 - Current** (INCORRECT):
```javascript
logo: {
  alt: 'Physical AI Logo',
  src: 'frontend/static/img/phycial_ai_logo.jpg',
},
```

**Line 93 - Fixed** (CORRECT):
```javascript
logo: {
  alt: 'Physical AI Logo',
  src: 'img/phycial_ai_logo.jpg',  // Docusaurus resolves from static/ directory
},
```

**Explanation**: Docusaurus automatically resolves asset paths from the `static/` directory. The `src` field should be relative to `static/`, not the project root.

### T006-T007: Optional Filename Fix

**Current**: `frontend/static/img/phycial_ai_logo.jpg` (typo: "phycial")
**Correct**: `frontend/static/img/physical_ai_logo.jpg` (fixed: "physical")

**Commands**:
```bash
cd frontend/static/img
mv phycial_ai_logo.jpg physical_ai_logo.jpg
```

**Then update config**:
```javascript
logo: {
  alt: 'Physical AI Logo',
  src: 'img/physical_ai_logo.jpg',
},
```

### T008-T013: Build and Deploy

**Commands**:
```bash
# Build
cd frontend
npm run build

# Test locally
npm run serve
# Visit http://localhost:3000 and check navbar logo

# Commit
cd ..
git add frontend/docusaurus.config.js
# If renamed file:
# git add frontend/static/img/physical_ai_logo.jpg
# git rm frontend/static/img/phycial_ai_logo.jpg

git commit -m "fix: Correct logo path in navbar configuration

- Update logo src from 'frontend/static/img/...' to 'img/...'
- Docusaurus resolves paths relative to static/ directory
- [Optional: Rename phycial_ai_logo.jpg to physical_ai_logo.jpg]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push and deploy
git push origin 002-personalization
cd frontend
npx gh-pages -d build -b gh-pages
```

---

## Testing Checklist

### Local Development
- [ ] Logo appears in navbar (top-left)
- [ ] Logo image loads without 404 error
- [ ] Logo alt text displays on hover
- [ ] Logo links to home page when clicked

### Production Build
- [ ] Build completes without warnings
- [ ] Logo appears in served build
- [ ] No broken image icon
- [ ] Console has no 404 errors for logo

### GitHub Pages
- [ ] Logo visible on deployed site
- [ ] Logo image loads correctly
- [ ] Logo displays on all pages (home, docs, etc.)
- [ ] No broken links or missing assets

---

## Docusaurus Path Conventions

**Static Assets**: Files in `static/` directory are served at root level

**Correct Path Examples**:
- File location: `static/img/logo.png`
- Reference in config: `'img/logo.png'` ✅
- NOT: `'static/img/logo.png'` ❌
- NOT: `'frontend/static/img/logo.png'` ❌

**Why This Matters**:
- During build, Docusaurus copies `static/` contents to output root
- URLs are resolved as `/baseUrl/img/logo.png` (e.g., `/ai-book/img/logo.png`)
- Including `static/` or `frontend/` in path creates incorrect URL

---

## Success Criteria

After completing all tasks:

✅ Logo displays in navbar on landing page
✅ Logo loads without errors (no 404)
✅ Logo visible on local development
✅ Logo visible on GitHub Pages
✅ Path follows Docusaurus conventions
✅ Build succeeds without warnings
✅ Optional: Filename typo corrected

**Estimated Time**: 10-15 minutes (or 20 minutes if renaming file)

---

## Notes

- **Priority**: High - Logo is important for branding
- **Complexity**: Low - Single line change (or 2 lines if renaming)
- **Risk**: Very Low - Simple path correction
- **Testing**: Easy to verify visually
- **Optional Enhancement**: Fix the "phycial" → "physical" typo for cleanliness

---

## References

- **Docusaurus Static Assets**: https://docusaurus.io/docs/static-assets
- **Docusaurus Config**: https://docusaurus.io/docs/api/docusaurus-config
- **Logo Config**: Line 89-94 in frontend/docusaurus.config.js
- **Logo File**: frontend/static/img/phycial_ai_logo.jpg
