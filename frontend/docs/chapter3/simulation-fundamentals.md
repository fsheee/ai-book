---
title: "Simulation Fundamentals"
sidebar_position: 1
---

# Simulation Fundamentals

## Why Simulation Matters

Robot simulation has become indispensable in modern robotics development. Before simulation tools matured, roboticists had to test every algorithm directly on physical hardware—a slow, expensive, and often dangerous process. Today, simulation enables you to validate control algorithms, train machine learning models, and debug complex behaviors entirely in software before touching real hardware.

Consider a humanoid robot learning to walk. On physical hardware, each failed attempt risks damaging expensive actuators (costing $10,000+ per unit), potentially injuring researchers nearby, and consuming hours of setup time. In simulation, the same robot can attempt thousands of walking trials per hour, fall countless times without consequence, and parallelize learning across hundreds of virtual robots simultaneously.

### Key Benefits of Simulation

**Safety**: Test extreme scenarios (high-speed collisions, structural failures, aggressive motions) without risking equipment or personnel. You can deliberately push robots beyond safe operating limits to understand failure modes.

**Speed**: Simulations can run faster than real-time. A 10-minute real-world experiment can be simulated in seconds, and you can run 100 variations in parallel on cloud infrastructure.

**Cost**: Avoid hardware wear and tear. Actuators, sensors, and structural components have finite lifespans. Simulation extends hardware life by reducing test cycles.

**Reproducibility**: Physical experiments suffer from environmental variations (temperature, humidity, lighting, floor friction). Simulated environments are perfectly reproducible—critical for debugging intermittent failures.

### When Simulation Falls Short

Simulation is not a perfect replacement for physical testing. The "reality gap" (difference between simulated and real-world behavior) remains a fundamental challenge:

- **Contact dynamics**: Simulating friction, slip, and impact accurately is computationally expensive and approximation-dependent
- **Sensor noise**: Real sensors have complex noise characteristics difficult to model perfectly
- **Material properties**: Elasticity, damping, and wear are hard to simulate accurately
- **Unexpected factors**: Wind, temperature gradients, electromagnetic interference—reality has infinite complexity

**Best practice**: Use simulation for rapid iteration and algorithm validation, then verify on physical hardware before deployment. Techniques like domain randomization (Chapter 5) help bridge the reality gap.

## Types of Simulation

Robot simulation operates at different fidelity levels, each trading accuracy for computational speed:

### 1. Kinematic Simulation

Kinematic simulation models only geometric relationships—joint angles, link lengths, and poses—without considering forces, torques, or collisions. This is the simplest and fastest form of simulation.

**Use cases**:
- Forward kinematics visualization (DH parameters from Chapter 2)
- Inverse kinematics validation
- Workspace analysis (reachability maps)
- Path planning in free space

**Limitations**: No physics, no collisions, no contact forces. The robot is essentially a moving 3D model.

### 2. Dynamic Simulation

Dynamic simulation adds physics: mass, inertia, gravity, friction, and actuator torques. This is what most people mean by "robot simulation"—it's what Gazebo, PyBullet, and Isaac Sim provide.

**Use cases**:
- Controller testing (PID, model predictive control)
- Stability analysis (Zero Moment Point from Chapter 2)
- Contact-rich tasks (grasping, manipulation, walking)
- Multi-body dynamics (humanoid arms, legs, torso)

**Limitations**: Physics engines use approximations (time-stepping, collision detection). Computational cost scales with model complexity.

### 3. Sensor Simulation

Sensor simulation models cameras, LiDAR, depth sensors, IMUs, and force/torque sensors with realistic noise, latency, and artifacts.

**Use cases**:
- Perception algorithm testing (object detection, SLAM)
- Sensor fusion validation
- Vision-based control
- Synthetic data generation for machine learning

**Limitations**: Rendering photorealistic images is expensive. Sensor noise models are approximations.

### 4. Full-Stack Simulation

Full-stack simulation combines dynamics, sensors, and software-in-the-loop testing where your actual robot control code runs against the simulated robot.

**Use cases**:
- End-to-end system testing
- Hardware-software co-design
- Autonomous system validation
- Training reinforcement learning policies (Chapter 5)

**Best tools**: Gazebo + ROS 2 (Chapter 4), NVIDIA Isaac Sim (Chapter 5)

## Code Example 1: Launch Gazebo with Humanoid

Here's a simple Python script to programmatically launch Gazebo with a humanoid robot model:

```python
"""
Launch Gazebo Harmonic with a humanoid robot model.

This example demonstrates:
1. Spawning Gazebo with an empty world
2. Loading a URDF robot model
3. Starting the simulation

Dependencies:
- gz-sim (Gazebo Harmonic)
- Python 3.10+
"""

import subprocess
import time
from pathlib import Path

def launch_gazebo_with_robot(urdf_path: Path, world_name: str = "empty") -> None:
    """
    Launch Gazebo and spawn a robot from URDF.

    Parameters
    ----------
    urdf_path : Path
        Path to robot URDF file
    world_name : str
        World to load (default: "empty")

    Examples
    --------
    >>> robot_path = Path("/path/to/humanoid.urdf")
    >>> launch_gazebo_with_robot(robot_path)
    # Gazebo window opens with humanoid standing
    """
    # Launch Gazebo server and client
    print(f"Launching Gazebo with world: {world_name}")
    gazebo_process = subprocess.Popen([
        "gz", "sim", f"{world_name}.sdf", "-r"
    ])

    # Wait for Gazebo to initialize
    time.sleep(2)

    # Spawn robot from URDF
    print(f"Spawning robot from: {urdf_path}")
    spawn_result = subprocess.run([
        "gz", "service", "-s", "/world/default/create",
        "--reqtype", "gz.msgs.EntityFactory",
        "--reptype", "gz.msgs.Boolean",
        "--timeout", "1000",
        "--req", f"sdf_filename: '{urdf_path}'"
    ])

    if spawn_result.returncode == 0:
        print("✓ Robot spawned successfully")
    else:
        print("✗ Failed to spawn robot")

    # Keep simulation running
    print("Simulation running. Press Ctrl+C to exit...")
    try:
        gazebo_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down Gazebo...")
        gazebo_process.terminate()

if __name__ == "__main__":
    # Example: Replace with your URDF path
    robot_urdf = Path.home() / "robots" / "humanoid.urdf"

    if robot_urdf.exists():
        launch_gazebo_with_robot(robot_urdf)
    else:
        print(f"Error: URDF not found at {robot_urdf}")
        print("Update the path to your robot URDF file")
```

**Expected output**:
```
Launching Gazebo with world: empty
Spawning robot from: /home/user/robots/humanoid.urdf
✓ Robot spawned successfully
Simulation running. Press Ctrl+C to exit...
```

**Troubleshooting**:
- If `gz: command not found`: Install Gazebo Harmonic: `sudo apt install gz-harmonic`
- If spawn fails: Check URDF syntax with `check_urdf humanoid.urdf`
- If Gazebo crashes: Ensure graphics drivers are up-to-date

## Next Steps

Now that you understand simulation fundamentals, let's install Gazebo and run your first simulation in [Gazebo Setup](./gazebo-setup.md).
