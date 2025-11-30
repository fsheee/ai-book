# Research: Chapters 3, 4, and 5 - Simulation Tools

**Feature**: 003-chapters-3-4-5
**Date**: 2025-11-30
**Purpose**: Resolve technical decisions for Gazebo, ROS 2, Isaac Sim, and Unity ML-Agents content

---

## 1. Gazebo Installation and Setup (Chapter 3)

**Question**: Should we prioritize Gazebo Harmonic (latest) or Gazebo Classic in Chapter 3 content?

**Decision**: **Gazebo Harmonic (Ignition Gazebo) as primary, with Gazebo Classic mentioned**

**Rationale**:
- Gazebo Harmonic is the actively developed version (released 2023, Gazebo 7.x series)
- Gazebo Classic (Gazebo 11) is in maintenance mode only (last release 2021)
- ROS 2 integration is better with Gazebo Harmonic (gz_ros2_control packages)
- Students learning now will work with Harmonic in industry (3-5 year career horizon)
- Official Gazebo documentation emphasizes Harmonic for new projects

**Alternatives Considered**:
- **Gazebo Classic only**: Rejected. More examples online but deprecated path
- **Cover both equally**: Rejected. Too confusing for students, doubles content length
- **Harmonic with Classic fallback**: **Selected**. Mention Classic for legacy code understanding

**Implementation**:
- Chapter 3 installation instructions: Gazebo Harmonic on Ubuntu 22.04
- Sidebar note: "If you're working with legacy code, see [Gazebo Classic migration guide](https://gazebosim.org/docs/harmonic/migration_from_classic)"
- Code examples: Use `gz` commands (Harmonic) not `gazebo` (Classic)

**Sources**:
- Gazebo official: https://gazebosim.org/docs/harmonic/getstarted
- Migration guide: https://gazebosim.org/docs/harmonic/migration_from_classic

---

## 2. ROS 2 Version and Compatibility (Chapter 4)

**Question**: Which ROS 2 distribution should Chapter 4 target?

**Decision**: **ROS 2 Humble (LTS)**

**Rationale**:
- Humble Hawksbill is LTS (Long-Term Support) until May 2027
- Most stable distribution for educational content (released May 2022, mature)
- Best package availability (MoveIt 2, Navigation2, ros2_control)
- Ubuntu 22.04 LTS compatible (also LTS until 2027)
- Industry standard for production systems (most companies use LTS for deployment)

**Alternatives Considered**:
- **Iron Irwini** (May 2023, EOL November 2024): Rejected. Already end-of-life
- **Jazzy Jalisco** (May 2024, EOL May 2029): Rejected. Too new, fewer packages, less documentation
- **Rolling** (continuous): Rejected. Unsuitable for education (constantly changing)

**Implementation**:
- All ROS 2 code examples: `ros2 --version` → "humble"
- Installation instructions: Ubuntu 22.04 + ROS 2 Humble
- Package versions: ros-humble-gazebo-ros2-control, ros-humble-moveit, etc.
- Python examples: rclpy from Humble distribution

**Version Compatibility Matrix**:

| ROS 2 Distribution | Ubuntu | Gazebo | Python | Support Until |
|-------------------|--------|--------|--------|---------------|
| **Humble (chosen)** | 22.04 | Harmonic | 3.10 | May 2027 |
| Iron | 22.04 | Harmonic | 3.10 | Nov 2024 (EOL) |
| Jazzy | 24.04 | Harmonic | 3.12 | May 2029 |

**Sources**:
- ROS 2 releases: https://docs.ros.org/en/humble/Releases.html
- Humble documentation: https://docs.ros.org/en/humble/

---

## 3. Gazebo-ROS 2 Integration (Chapter 4)

**Question**: Which package should we use for Gazebo-ROS 2 integration?

**Decision**: **gz_ros2_control (for Gazebo Harmonic) with explanation of naming**

**Rationale**:
- Gazebo Harmonic uses `gz_` prefix for packages (not `gazebo_`)
- Package `gz_ros2_control` is the official ROS 2 control interface for Harmonic
- Backwards compatible path: `gazebo_ros2_control` for Gazebo Classic (mention but don't focus)
- Consistent with Gazebo's rebranding (Ignition → Gazebo, but kept `gz` prefix)

**Alternatives Considered**:
- **gazebo_ros2_control**: Rejected. Only works with Gazebo Classic
- **Cover both packages equally**: Rejected. Confusing, students won't know which to use
- **gz_ros2_control with Classic note**: **Selected**

**Implementation**:
- Installation: `sudo apt install ros-humble-gz-ros2-control`
- Code examples: Use `<plugin name="gz_ros2_control::GazeboSimROS2ControlPlugin">`
- Sidebar note: "For Gazebo Classic, use gazebo_ros2_control package instead"
- Explain naming: "The 'gz' prefix comes from Ignition Gazebo's legacy name"

**Package Naming Guide**:
- Gazebo Harmonic: `gz_ros2_control`, `gz_sim`, `gz_launch`
- Gazebo Classic: `gazebo_ros2_control`, `gazebo_ros`, `gazebo_plugins`

**Sources**:
- gz_ros2_control: https://github.com/ros-controls/gz_ros2_control
- ROS 2 control: https://control.ros.org/humble/

---

## 4. NVIDIA Isaac Sim Access (Chapter 5)

**Question**: How should students access Isaac Sim? Is it free for education?

**Decision**: **Isaac Sim via Omniverse (free for individual use and education)**

**Rationale**:
- Isaac Sim is free for individual developers and educational institutions
- No licensing fees for non-commercial use (verified on NVIDIA website)
- Omniverse launcher provides easy installation (Windows, Linux)
- Includes Isaac Gym functionality for RL training
- Educational resources available: Isaac Sim tutorials, documentation
- Requires NVIDIA RTX GPU (provide Unity ML-Agents as CPU alternative)

**Alternatives Considered**:
- **Isaac Gym standalone**: Rejected. Deprecated, superseded by Isaac Sim
- **Cloud-based Isaac Sim**: Rejected. Requires NVIDIA NGC account, less accessible
- **Skip Isaac Sim entirely**: Rejected. Industry-leading tool, critical for AI robotics

**Implementation**:
- Chapter 5 prerequisites: State "NVIDIA RTX GPU required (GTX 1660 or better)"
- Fallback: "If you don't have an NVIDIA GPU, skip to Unity ML-Agents section"
- Installation guide: Omniverse launcher → Isaac Sim installation
- License: "Free for educational and non-commercial use"
- Isaac Gym: "Included in Isaac Sim 2023.1.0+, no separate install needed"

**GPU Requirements** (from NVIDIA docs):
- Minimum: NVIDIA GeForce GTX 1660 (6 GB VRAM)
- Recommended: NVIDIA RTX 3060 or better (12 GB VRAM)
- For RL training: NVIDIA RTX 4070 or better (16 GB+ VRAM)

**Sources**:
- Isaac Sim: https://developer.nvidia.com/isaac-sim
- Omniverse: https://www.nvidia.com/en-us/omniverse/
- Isaac Gym paper: https://arxiv.org/abs/2108.10470

---

## 5. Unity ML-Agents Version (Chapter 5)

**Question**: Which Unity ML-Agents release should we target?

**Decision**: **Unity ML-Agents Release 20 (latest stable)**

**Rationale**:
- Release 20 (November 2022) is latest stable with good documentation
- Compatible with Unity 2021.3 LTS and Unity 2022.3 LTS
- Stable API, well-tested with thousands of users
- Python package `mlagents==0.30.0` matches Release 20
- Extensive examples in Unity repo (3DBall, Walker, Humanoid)

**Alternatives Considered**:
- **Release 18** (April 2021): Rejected. Older, missing recent features
- **Development branch**: Rejected. Unstable, unsuitable for education
- **Release 21+**: Rejected. Not released yet (as of late 2023)

**Implementation**:
- Unity version: 2022.3 LTS (recommended) or 2021.3 LTS
- ML-Agents package: com.unity.ml-agents@2.0.1 (from Unity Package Manager)
- Python training: `pip install mlagents==0.30.0`
- Examples: Reference Unity ML-Agents GitHub (https://github.com/Unity-Technologies/ml-agents)
- Tutorial: "Getting Started with ML-Agents" from Unity docs

**Compatibility Matrix**:

| ML-Agents Release | Unity Version | Python Package | Release Date |
|------------------|---------------|----------------|--------------|
| 18 | 2020.3+ | mlagents==0.28.0 | April 2021 |
| 19 | 2021.3+ | mlagents==0.29.0 | February 2022 |
| **20 (chosen)** | 2021.3+, 2022.3 | mlagents==0.30.0 | November 2022 |

**Sources**:
- Unity ML-Agents: https://unity.com/products/machine-learning-agents
- GitHub repo: https://github.com/Unity-Technologies/ml-agents
- Installation: https://github.com/Unity-Technologies/ml-agents/blob/main/docs/Installation.md

---

## 6. Code Example Format (All Chapters)

**Question**: What coding style should we use for Python examples?

**Decision**: **Python 3.10+ with type hints, NumPy-style docstrings, match Chapter 2 style**

**Rationale**:
- Consistency with existing Chapter 2 code (already uses type hints)
- Python 3.10+ for modern syntax (structural pattern matching, better error messages)
- Type hints improve code clarity and IDE support
- NumPy-style docstrings are standard in scientific Python community
- Educational benefit: Students learn professional coding practices

**Alternatives Considered**:
- **No type hints**: Rejected. Inconsistent with Chapter 2
- **Google-style docstrings**: Rejected. NumPy style more common in robotics
- **Python 3.8**: Rejected. Ubuntu 22.04 has Python 3.10, no reason to downgrade

**Implementation**:
- All functions: Type hints for parameters and return values
- All public functions: NumPy-style docstrings with Parameters, Returns, Examples
- Imports: Use `from typing import List, Dict, Optional, Tuple` etc.
- Example structure:
  ```python
  import numpy as np
  from typing import Tuple

  def forward_kinematics(theta: np.ndarray) -> Tuple[float, float]:
      """
      Calculate end-effector position from joint angles.

      Parameters
      ----------
      theta : np.ndarray
          Joint angles in radians, shape (2,)

      Returns
      -------
      x : float
          End-effector x position in meters
      y : float
          End-effector y position in meters

      Examples
      --------
      >>> fk([0, np.pi/2])
      (1.0, 1.0)
      """
      # Implementation
      pass
  ```

**Style Guide**:
- Line length: 88 characters (Black formatter default)
- Imports: Standard library → Third-party → Local
- Comments: Explain "why", not "what" (code should be self-documenting)

**Sources**:
- PEP 484 (type hints): https://peps.python.org/pep-0484/
- NumPy docstrings: https://numpydoc.readthedocs.io/en/latest/format.html

---

## 7. URDF vs. USD (Chapters 3 and 5)

**Question**: Should we teach URDF, USD, or both for robot model formats?

**Decision**: **URDF in Chapter 3, USD in Chapter 5 (both covered)**

**Rationale**:
- URDF (Unified Robot Description Format) is ROS/Gazebo standard
- USD (Universal Scene Description) is Isaac Sim/Omniverse standard
- Both formats are essential for modern robotics
- Natural progression: URDF first (simpler, XML-based) → USD later (complex, scene graphs)
- Cannot convert perfectly between formats (different capabilities)

**Alternatives Considered**:
- **URDF only**: Rejected. Students won't be able to use Isaac Sim effectively
- **USD only**: Rejected. Incompatible with ROS/Gazebo ecosystem
- **URDF + USD conversion tools**: Rejected. Lossy conversion, better to learn both natively

**Implementation**:
- **Chapter 3 (Gazebo)**:
  - Introduce URDF format (XML structure)
  - Explain links, joints, visuals, collisions
  - Show example: humanoid arm URDF
  - Tools: `check_urdf`, `urdf_to_graphiz`
- **Chapter 5 (Isaac Sim)**:
  - Introduce USD format (scene description)
  - Explain prims, stages, layers
  - Show how to import URDF into Isaac Sim (automatic conversion)
  - Show native USD robot creation
  - Tools: `usdview`, Isaac Sim USD API

**Format Comparison Table**:

| Feature | URDF | USD |
|---------|------|-----|
| **Use Case** | ROS/Gazebo robots | Omniverse/Isaac Sim |
| **Format** | XML | Binary or ASCII |
| **Complexity** | Simple (1 file) | Complex (multi-file, layers) |
| **Capabilities** | Kinematics, collision | Full scene graph, rendering |
| **Learning Curve** | Easy | Moderate |
| **Tooling** | ROS tools | Omniverse, usdview |

**Sources**:
- URDF tutorial: http://wiki.ros.org/urdf/Tutorials
- USD documentation: https://openusd.org/release/index.html
- Isaac Sim USD: https://docs.omniverse.nvidia.com/isaacsim/latest/features/environment_setup/ext_omni_isaac_urdf.html

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Gazebo version | **Harmonic** (+ Classic note) | Active development, better ROS 2 support |
| ROS 2 version | **Humble (LTS)** | Stable, supported until 2027, industry standard |
| Gazebo-ROS 2 | **gz_ros2_control** | Harmonic compatibility |
| Isaac Sim access | **Omniverse (free)** | Free for education, includes Isaac Gym |
| Unity ML-Agents | **Release 20** | Latest stable, good docs, Unity 2022.3 LTS |
| Code style | **Python 3.10+ + type hints** | Consistency with Chapter 2, professional practices |
| Robot formats | **URDF (Ch 3) + USD (Ch 5)** | Cover both industry standards |

---

## Open Questions (None)

All research questions resolved. Ready to proceed to Phase 1 (Design Artifacts).

---

**Research Complete**: 2025-11-30
**Approved for Implementation**: Yes
