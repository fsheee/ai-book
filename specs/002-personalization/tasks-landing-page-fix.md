# Tasks: Landing Page Cards Display Fix (GitHub Pages)

**Issue**: Landing page feature cards display correctly on local development but not on GitHub Pages deployed site.

**Root Cause**: Inline CSS custom properties (`var(--ifm-card-background-color)`, etc.) in frontend/src/pages/index.js are not being resolved correctly in the GitHub Pages production build. The styles are using Docusaurus theme CSS variables that may not be available when inline styles are processed during the build optimization.

**Solution**: Move inline styles to CSS modules to ensure proper CSS custom property resolution during Docusaurus build process.

---

## Constitution Compliance Checklist *(mandatory)*

- ✅ **Core Principles**: Fixes deployment issue following Spec-Driven Workflow (identifying root cause, implementing targeted fix)
- ✅ **Project Sections**: Improves AI-Generated Book frontend user interface
- ✅ **Execution Guidelines**: Minimal change approach, focuses on specific issue
- ✅ **Architect Guidelines**: Preserves existing structure, follows Docusaurus best practices
- ✅ **Project Structure**: Respects existing frontend/src/ structure
- ✅ **Versioning and Governance**: Will create commit after implementation

---

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Analysis & Diagnosis

**Purpose**: Confirm the issue and identify affected components

- [X] T001 Review current landing page implementation in frontend/src/pages/index.js
- [X] T002 Inspect inline styles using CSS custom properties (--ifm-*) on feature cards
- [X] T003 Check GitHub Pages build output for CSS variable resolution issues
- [X] T004 Review Docusaurus documentation on CSS modules vs inline styles

**Checkpoint**: Root cause confirmed - inline styles with CSS variables not building correctly

---

## Phase 2: Implementation - Refactor to CSS Modules

**Purpose**: Move inline styles to CSS module for proper build-time processing

- [X] T005 Create feature card styles in frontend/src/pages/index.module.css
- [X] T006 Refactor feature cards section in frontend/src/pages/index.js to use CSS module classes
- [X] T007 Remove inline style objects from JSX in frontend/src/pages/index.js
- [X] T008 Apply CSS module classes to feature card containers

**Checkpoint**: All inline styles replaced with CSS module classes

---

## Phase 3: Testing & Validation

**Purpose**: Verify fix works locally and on GitHub Pages

- [X] T009 Test landing page display in local development (npm run start)
- [X] T010 Build production bundle locally (npm run build)
- [X] T011 Serve local production build (npm run serve) and verify card display
- [ ] T012 Deploy to GitHub Pages and verify cards display correctly
- [ ] T013 Test responsiveness on mobile and desktop viewports
- [ ] T014 Verify dark mode compatibility for feature cards

**Checkpoint**: Landing page cards display correctly on both local and GitHub Pages

---

## Phase 4: Documentation & Cleanup

**Purpose**: Document the fix and ensure code quality

- [ ] T015 Add inline code comments explaining CSS module usage
- [ ] T016 Update IMPLEMENTATION_COMPLETE_SUMMARY.md with fix details
- [ ] T017 Create git commit with descriptive message
- [ ] T018 Push changes to GitHub repository

**Checkpoint**: Fix deployed and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Analysis)**: No dependencies - start immediately
- **Phase 2 (Implementation)**: Depends on Phase 1 completion
- **Phase 3 (Testing)**: Depends on Phase 2 completion
- **Phase 4 (Documentation)**: Depends on Phase 3 completion

### Task Dependencies

#### Phase 1: All tasks can run sequentially for analysis
#### Phase 2: Sequential execution required
- T005 must complete before T006
- T006, T007, T008 can be done together in the same file edit

#### Phase 3: Sequential testing workflow
- T009 → T010 → T011 → T012 → T013 → T014

#### Phase 4: Can run in parallel after Phase 3
- T015, T016 can run in parallel (different files)
- T017 → T018 must be sequential (commit then push)

---

## Implementation Details

### T005: Create CSS Module Styles

**File**: `frontend/src/pages/index.module.css`

Add the following styles:

```css
/* Feature Cards Section */
.featuresSection {
  background: var(--ifm-color-emphasis-100);
  padding: 3rem 0;
}

.featureCard {
  padding: 1.5rem;
  background: var(--ifm-card-background-color);
  border-radius: 8px;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid var(--ifm-color-emphasis-300);
}

.featureCardTitle {
  color: var(--ifm-heading-color);
}

.featureCardText {
  color: var(--ifm-font-color-base);
}

.featureCol {
  padding: 1rem;
}
```

### T006-T008: Refactor JSX

**File**: `frontend/src/pages/index.js`

**Before** (lines 49-83):
```jsx
<section style={{background: 'var(--ifm-color-emphasis-100)', padding: '3rem 0'}}>
  <div className="container">
    <div className="row">
      <div className="col col--6" style={{padding: '1rem'}}>
        <div style={{padding: '1.5rem', background: 'var(--ifm-card-background-color)', ...}}>
          <h3 style={{color: 'var(--ifm-heading-color)'}}>📝 Interactive Code Examples</h3>
          <p style={{color: 'var(--ifm-font-color-base)'}}>...</p>
        </div>
      </div>
      {/* ... repeat for 4 cards ... */}
    </div>
  </div>
</section>
```

**After**:
```jsx
<section className={styles.featuresSection}>
  <div className="container">
    <div className="row">
      <div className={clsx('col col--6', styles.featureCol)}>
        <div className={styles.featureCard}>
          <h3 className={styles.featureCardTitle}>📝 Interactive Code Examples</h3>
          <p className={styles.featureCardText}>...</p>
        </div>
      </div>
      {/* ... repeat for 4 cards ... */}
    </div>
  </div>
</section>
```

### T012: Deploy to GitHub Pages

**Commands**:
```bash
cd frontend
npm run build
npm run deploy
# OR push to main branch to trigger GitHub Actions workflow
```

**Verification**:
- Visit https://fsheee.github.io/ai-book/
- Inspect feature cards section
- Verify cards have proper background, borders, and shadows
- Check console for any CSS-related errors

---

## Testing Checklist

### Local Development (T009)
- [ ] Cards display with correct background color
- [ ] Cards have proper border and shadow
- [ ] Text colors are readable (heading and body)
- [ ] Grid layout (2x2) displays correctly

### Production Build (T010-T011)
- [ ] Build completes without CSS warnings
- [ ] Served build shows cards correctly
- [ ] No missing CSS custom property warnings
- [ ] All theme variables resolved

### GitHub Pages (T012-T014)
- [ ] Cards visible on deployed site
- [ ] Styles match local development
- [ ] Responsive on mobile (cards stack vertically)
- [ ] Dark mode styling works correctly
- [ ] No layout shifts or missing styles

---

## Rollback Plan

If the fix introduces issues:

1. Revert `frontend/src/pages/index.module.css` changes (remove new styles)
2. Revert `frontend/src/pages/index.js` changes (restore inline styles)
3. Investigate alternative solutions:
   - Use Docusaurus theme components instead of custom cards
   - Create separate CSS file (not module) with global styles
   - Use styled-components or emotion for CSS-in-JS

---

## Technical Notes

### Why This Fix Works

**Problem**: Inline styles with CSS custom properties are processed as strings by React. During Docusaurus's build optimization, these string values may not be resolved to actual CSS variables because they're not part of the CSS cascade.

**Solution**: CSS modules are processed at build time by Docusaurus's webpack configuration. CSS custom properties in module files are properly resolved because they're part of the stylesheet cascade, not JavaScript strings.

**Alternative Considered**: Using global CSS file instead of CSS module. Rejected because CSS modules provide better scoping and are the Docusaurus-recommended approach for page-specific styles.

### Docusaurus Build Process

1. **Development**: Inline styles work because browser directly evaluates CSS variables
2. **Production Build**: Webpack/PostCSS optimize styles, may strip or mishandle inline CSS variable strings
3. **CSS Modules**: Processed through Docusaurus's CSS pipeline, ensuring proper variable resolution and minification

---

## Expected Outcome

After completing all tasks:

✅ Landing page feature cards display correctly on GitHub Pages
✅ Styles match local development exactly
✅ Dark mode compatibility maintained
✅ Responsive layout preserved
✅ Code follows Docusaurus best practices
✅ No inline styles with CSS custom properties remaining

**Estimated Time**: 30-45 minutes for full implementation and deployment

---

## Post-Implementation

### Create PHR (Prompt History Record)

After completing implementation:

```bash
.specify/scripts/bash/create-phr.sh \
  --title "fix-landing-page-cards-github-pages" \
  --stage "misc" \
  --json
```

Fill PHR with:
- **Problem**: Landing page cards not displaying on GitHub Pages
- **Root Cause**: Inline CSS custom properties not resolved in production build
- **Solution**: Refactored to CSS modules
- **Result**: Cards display correctly on both local and deployed site

---

## References

- **Docusaurus Styling**: https://docusaurus.io/docs/styling-layout#css-modules
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Issue File**: frontend/src/pages/index.js (lines 49-83)
- **Config File**: frontend/docusaurus.config.js (baseUrl, deploymentBranch)
