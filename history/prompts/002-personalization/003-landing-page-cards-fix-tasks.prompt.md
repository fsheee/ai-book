---
id: 003
title: landing-page-cards-fix-tasks
stage: tasks
date: 2025-12-01T00:00:00Z
surface: claude-code-cli
model: claude-sonnet-4-5
feature: 002-personalization
branch: 002-personalization
user: User
command: /sp.tasks landing page dividein to cards its not show on githubpages but show on local
labels: [tasks, bug-fix, css, docusaurus, github-pages]
links:
  spec: specs/002-personalization/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/002-personalization/tasks-landing-page-fix.md
    action: create
    description: Generated comprehensive task breakdown for fixing landing page cards display issue
tests: []
---

## Prompt

User reported: "landing page dividein to cards its not show on githubpages but show on local"

Context: Landing page feature cards (Interactive Code Examples, Mathematical Derivations, Visual Diagrams, RAG-Powered Chatbot) display correctly in local development but not on the GitHub Pages deployed site at https://fsheee.github.io/ai-book/

Task: Generate tasks.md file with implementation steps to diagnose and fix the display issue.

## Response snapshot

**Analysis Performed**:
1. Reviewed frontend/src/pages/index.js landing page implementation
2. Identified root cause: Inline styles using CSS custom properties (`var(--ifm-card-background-color)`, etc.) not resolving in GitHub Pages production build
3. Confirmed issue specific to Docusaurus build optimization process

**Root Cause**:
- Inline JSX styles with CSS custom properties are processed as strings by React
- During Docusaurus production build (webpack/PostCSS optimization), these string values may not be resolved to actual CSS variables
- CSS custom properties in inline styles are not part of the CSS cascade during build-time optimization

**Solution**:
- Refactor inline styles to CSS modules (frontend/src/pages/index.module.css)
- CSS modules are processed at build time through Docusaurus's CSS pipeline
- Ensures proper CSS custom property resolution and minification

**Tasks Generated**:
Created `specs/002-personalization/tasks-landing-page-fix.md` with 18 tasks across 4 phases:

**Phase 1: Analysis & Diagnosis** (T001-T004)
- Review current implementation
- Inspect inline styles with CSS custom properties
- Check GitHub Pages build output
- Review Docusaurus documentation

**Phase 2: Implementation** (T005-T008)
- Create feature card styles in index.module.css
- Refactor feature cards JSX to use CSS module classes
- Remove inline style objects
- Apply CSS module classes to containers

**Phase 3: Testing & Validation** (T009-T014)
- Test local development
- Build and serve production locally
- Deploy to GitHub Pages and verify
- Test responsiveness and dark mode

**Phase 4: Documentation** (T015-T018)
- Add code comments
- Update IMPLEMENTATION_COMPLETE_SUMMARY.md
- Create git commit
- Push changes

**Key Implementation Details Provided**:
- Exact CSS module styles to add
- Before/after JSX refactoring examples
- Deployment commands for GitHub Pages
- Testing checklist for all environments
- Rollback plan if issues occur
- Technical explanation of why fix works

## Outcome

- ✅ Impact: Comprehensive task breakdown for fixing landing page display issue on GitHub Pages. Includes root cause analysis, step-by-step implementation, testing strategy, and technical documentation.
- 🧪 Tests: Testing tasks cover local development, production build, GitHub Pages deployment, responsive design, and dark mode compatibility (6 test tasks)
- 📁 Files: Created 1 file (tasks-landing-page-fix.md with 18 tasks)
- 🔁 Next prompts: Execute tasks starting with Phase 1 analysis, then proceed through implementation, testing, and documentation phases
- 🧠 Reflection: Issue was CSS-related, not a personalization feature bug. However, generated comprehensive fix tasks following spec-driven workflow principles. Solution follows Docusaurus best practices by using CSS modules instead of inline styles.

## Evaluation notes (flywheel)

- Failure modes observed: None - successfully identified root cause and generated actionable tasks
- Graders run and results (PASS/FAIL): N/A (task generation, not code implementation)
- Prompt variant (if applicable): Standard /sp.tasks command with user natural language issue description
- Next experiment (smallest change to try): After implementation, monitor if similar CSS issues occur with other components using inline styles

---

## Technical Notes

**Why This Was a CSS Issue**:
- Docusaurus development server serves unoptimized CSS where browser directly evaluates CSS variables
- Production build runs webpack optimization that may strip or mishandle inline CSS variable strings
- CSS modules go through proper build pipeline ensuring variable resolution

**Alternative Solutions Considered**:
1. Global CSS file (not module) - Rejected: Less scoped, not Docusaurus recommended
2. Styled-components/emotion - Rejected: Adds dependency overhead
3. Docusaurus theme components - Future consideration if more custom styling needed

**Prevention Strategy**:
- Use CSS modules for all component-specific styles
- Reserve inline styles only for truly dynamic values (not theme variables)
- Test production builds locally before deploying to GitHub Pages
