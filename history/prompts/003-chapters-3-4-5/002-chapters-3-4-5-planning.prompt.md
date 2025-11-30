---
id: phr-002-chapters-3-4-5-plan
title: Planning for Chapters 3-4-5 Implementation
stage: plan
date: 2025-11-30T04:35:00Z
surface: claude-code
model: claude-sonnet-4-5
feature: 003-chapters-3-4-5
branch: 003-chapters-3-4-5
user: ai-agent
command: /sp.plan
labels: [plan, simulation, ros2, gazebo, isaac-sim, unity, research]
links:
  spec: specs/003-chapters-3-4-5/spec.md
  plan: specs/003-chapters-3-4-5/plan.md
  research: specs/003-chapters-3-4-5/research.md
  data-model: specs/003-chapters-3-4-5/data-model.md
  quickstart: specs/003-chapters-3-4-5/quickstart.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-chapters-3-4-5/plan.md
  - specs/003-chapters-3-4-5/research.md
  - specs/003-chapters-3-4-5/data-model.md
  - specs/003-chapters-3-4-5/quickstart.md
tests:
  - name: "Constitution Check"
    result: PASS
    description: "All principles aligned, no violations"
  - name: "Research completeness"
    result: PASS
    description: "7 research areas resolved with decisions"
  - name: "Design artifacts completeness"
    result: PASS
    description: "data-model.md (6 entities), quickstart.md (10-part guide) created"
---

## Prompt

User request: `/sp.plan` (automatic execution after /sp.specify)

Context:
- Feature: Chapters 3, 4, and 5 with Simulation Tools
- Branch: 003-chapters-3-4-5
- Spec: 28 FRs, 10 SCs, 3 user stories (P1, P1, P2)
- Goal: Create implementation plan with research, design artifacts, and rollout strategy

Task: Execute /sp.plan workflow to:
1. Fill Technical Context and Constitution Check
2. Phase 0: Research and resolve all "NEEDS CLARIFICATION"
3. Phase 1: Generate data-model.md, quickstart.md
4. Phase 2: Define implementation strategy with iterations

## Response snapshot

Successfully completed all planning phases:

### **Technical Context Filled**
- Language: Markdown with MDX v3, Python 3.10+
- Dependencies: Docusaurus v3.6.3, KaTeX, remark-math@6, rehype-katex@7
- Storage: Static markdown files (frontend/docs/chapter3, chapter4, chapter5)
- Testing: Manual browser validation, build test, code execution
- Platform: Web (Docusaurus) + Ubuntu 22.04 (for code examples)
- Performance: Page load <2s, build <3min
- Scale: 3 chapters (~15-20 KB each), 12+ code examples, 9 diagrams

### **Constitution Check: ✅ PASS**
- AI Agent Responsibilities: Agent generates all content ✅
- Spec-Driven Workflow: Using /sp.spec → /sp.plan → /sp.tasks ✅
- RAG Chatbot Constraints: Content will be indexed later ✅
- Incremental Validation: 3 independently testable user stories ✅
- Operational Standards: Following specs/ structure, PHRs ✅
- No violations, no complexity justifications needed

### **Phase 0: Research (7 Areas Resolved)**

1. **Gazebo Version** → **Decision: Gazebo Harmonic** (+ Classic note)
   - Rationale: Active development, better ROS 2 support, future-proof
   - Alternatives: Classic only (rejected, deprecated), Cover both equally (rejected, confusing)

2. **ROS 2 Version** → **Decision: ROS 2 Humble (LTS)**
   - Rationale: LTS until 2027, most stable, industry standard
   - Alternatives: Iron (EOL Nov 2024), Jazzy (too new), Rolling (unstable)

3. **Gazebo-ROS 2 Integration** → **Decision: gz_ros2_control**
   - Rationale: Harmonic compatibility, new package naming
   - Alternatives: gazebo_ros2_control (Classic only)

4. **Isaac Sim Access** → **Decision: Omniverse (free for education)**
   - Rationale: Free for students, includes Isaac Gym, no licensing barriers
   - Alternatives: Cloud-based (less accessible), Skip entirely (rejected, industry-leading)

5. **Unity ML-Agents** → **Decision: Release 20 (latest stable)**
   - Rationale: Stable API, Unity 2022.3 LTS compatible, good docs
   - Alternatives: Release 18 (older), Development branch (unstable)

6. **Code Style** → **Decision: Python 3.10+ with type hints**
   - Rationale: Consistency with Chapter 2, professional practices
   - Alternatives: No type hints (rejected, inconsistent)

7. **Robot Formats** → **Decision: URDF (Ch 3) + USD (Ch 5)**
   - Rationale: Cover both industry standards (ROS/Gazebo + Isaac Sim)
   - Alternatives: URDF only (rejected, can't use Isaac Sim), USD only (rejected, incompatible with ROS)

### **Phase 1: Design Artifacts**

**data-model.md (6 Entities)**:
1. Chapter (id, title, slug, sections, diagrams, citations)
2. Section (id, title, filename, subsections, code examples)
3. Subsection (id, title, level, content)
4. CodeExample (id, language, code, dependencies, expected_output)
5. Diagram (id, filename, path, format [svg/png/mermaid], alt_text)
6. Citation (id, title, url, type, source, status)

**Chapter-specific breakdown**:
- Chapter 3: 4 sections, 3 code examples, 3 diagrams, 5+ citations
- Chapter 4: 4 sections, 5 code examples, 3 diagrams, 8+ citations
- Chapter 5: 4 sections, 4 code examples, 3 diagrams, 6+ citations
- Total: 12 sections, 12 code examples, 9 diagrams, 19+ citations

**quickstart.md (10-Part Guide)**:
1. Ubuntu 22.04 setup (native, WSL2, Docker options)
2. Gazebo Harmonic installation (20 min)
3. ROS 2 Humble installation (30 min)
4. Additional ROS 2 packages (ros2_control, MoveIt 2)
5. Python environment setup (numpy, scipy, transforms3d)
6. NVIDIA Isaac Sim (optional, 60 min, requires RTX GPU)
7. Unity ML-Agents (alternative, 45 min)
8. Verification checklist (test all installations)
9. Common issues and solutions (7 troubleshooting scenarios)
10. Next steps and resources

### **Phase 2: Implementation Strategy**

**4 Iterations (30 days total)**:

**Iteration 1: Chapter 3 - Simulation Fundamentals (5-7 days)**
- Write 4 sections: simulation-fundamentals.md, gazebo-setup.md, physics-engines.md, sensor-modeling.md
- Create 3 Python code examples: launch Gazebo, read sensors, apply torques
- Create 3 SVG diagrams: Gazebo architecture, URDF tree, physics comparison
- Cite Gazebo official docs

**Iteration 2: Chapter 4 - ROS 2 Integration (7-10 days)**
- Write 4 sections: ros2-architecture.md, ros2-control.md, gazebo-ros2-integration.md, moveit2.md
- Create 5 Python/C++ code examples: ROS 2 node, publisher, subscriber, service, action server
- Create 3 SVG diagrams: ROS 2 graph, DDS architecture, MoveIt 2 pipeline
- Cite ROS 2 and MoveIt 2 docs

**Iteration 3: Chapter 5 - Advanced AI Simulation (7-10 days)**
- Write 4 sections: isaac-sim.md, domain-randomization.md, isaac-gym-rl.md, unity-ml-agents.md
- Create 4 Python code examples: load humanoid (Isaac Sim), domain randomization, synthetic data, RL training
- Create 3 SVG diagrams: Isaac Sim workflow, domain rand examples, Unity ML-Agents arch
- Cite NVIDIA Isaac Sim, Isaac Gym papers, Unity docs

**Iteration 4: Integration and Polish (2-3 days)**
- Update sidebars.js, intro.md
- Cross-reference Chapter 2
- Build test, visual test, code test
- Citation validation

**Testing Strategy**:
- Manual: Launch dev server, verify all pages render
- Build: npm run build, check for errors
- Code: Execute all 12+ examples on Ubuntu 22.04
- Citations: Verify all external links are live

### **Risks & Mitigation (6 Identified)**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ROS 2 + Gazebo version conflict | Medium | High | Document tested combinations, provide compatibility matrix |
| Isaac Sim licensing | Low | Medium | Focus on free educational access, Unity as alternative |
| Windows compatibility | Medium | Medium | WSL2/Docker instructions, Ubuntu 22.04 as primary |
| Gazebo install errors | Medium | High | Troubleshooting section in quickstart |
| No GPU for Isaac Sim | High | Low | Make optional (P2 story), emphasize Gazebo |
| Broken external links | Low | Low | Use official docs, verify during citation validation |

### **Rollout Plan (30 Days)**

- Phase 3 (Days 1-7): Chapter 3 implementation
- Phase 4 (Days 8-17): Chapter 4 implementation
- Phase 5 (Days 18-27): Chapter 5 implementation
- Phase 6 (Days 28-30): Integration & validation

## Outcome

- ✅ Impact: Complete implementation plan for 3 simulation chapters. Clear 30-day path from planning to production-ready content. Research resolved all technical unknowns (Gazebo Harmonic, ROS 2 Humble, Isaac Sim free access, Unity Release 20). Design artifacts define 6 content entities and 10-part student setup guide.
- 🧪 Tests: Constitution Check PASS (no violations). Research completeness PASS (7 areas resolved). Design artifacts PASS (data-model.md has 6 entities, quickstart.md has 10 parts with 2-3 hour setup time).
- 📁 Files: 4 files created:
  - plan.md (336 lines, complete implementation strategy)
  - research.md (7 research areas with decisions, rationale, alternatives, sources)
  - data-model.md (6 entities: Chapter, Section, Subsection, CodeExample, Diagram, Citation)
  - quickstart.md (10-part student setup guide for Ubuntu/Gazebo/ROS2/Isaac/Unity)
- 🔁 Next prompts: Run `/sp.tasks` to generate task breakdown for Iteration 1 (Chapter 3). Begin implementation with T001 (create chapter3/index.md).
- 🧠 Reflection: Planning successfully balanced practical (Gazebo, ROS 2) with advanced (Isaac Sim, Unity). Research decisions well-documented (Harmonic over Classic, Humble LTS, Release 20 Unity). Quickstart covers 3 platforms (native Ubuntu, WSL2, Docker) and 2 GPU scenarios (NVIDIA RTX, non-NVIDIA). Rollout realistic (30 days for 3 chapters). Risk analysis identifies compatibility and access issues with mitigation. Data model reuses Chapter 2 patterns for consistency.

## Evaluation notes (flywheel)

- Failure modes observed: None. Planning workflow completed successfully.
- Graders run and results (PASS/FAIL):
  - Constitution compliance: PASS (all 6 principle categories aligned)
  - Research resolution: PASS (7 areas, all with decisions and rationale)
  - Design artifact quality: PASS (data-model.md comprehensive, quickstart.md actionable)
  - Implementation strategy: PASS (4 iterations, 30-day timeline, clear testing approach)
  - Risk analysis: PASS (6 risks identified with likelihood/impact/mitigation)
- Prompt variant (if applicable): Standard /sp.plan workflow
- Next experiment (smallest change to try): Execute /sp.tasks and measure whether task generation produces 100+ tasks (estimate: 30-40 per chapter × 3 = 90-120 tasks). Monitor if task breakdown includes validation tasks for each code example (12+ code validation tasks expected). Test if quickstart.md is clear enough for a student with zero robotics experience to follow.
