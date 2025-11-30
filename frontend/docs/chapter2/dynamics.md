---
title: "Dynamics"
sidebar_position: 2
description: "Learn about forces, torques, and stability analysis for humanoid robots."
keywords: ["dynamics", "forces", "torques", "ZMP", "stability", "Newton-Euler"]
tags: ["dynamics", "theory", "control"]
difficulty: "intermediate"
estimated_time: 20
---

# Dynamics

## Introduction to Dynamics

While kinematics describes the geometry of motion, **dynamics** extends this understanding by incorporating the **forces and torques** that cause motion. In robotics, dynamics answers questions like: "What torques must the motors produce to achieve a desired motion?" and "How will the robot move under given forces?"

**Newton-Euler vs. Lagrangian Formulations:**

Two main approaches exist for deriving robot dynamics:

1. **Newton-Euler**: Based on Newton's second law ($F = ma$) and Euler's equations for rotational motion. This method is computationally efficient and well-suited for real-time control.

2. **Lagrangian**: Based on energy (kinetic and potential). Uses generalized coordinates and the Euler-Lagrange equations. This method is systematic and elegant for deriving equations of motion.

**Why Dynamics Matter for Humanoid Robots:**

- **Motion Control**: Controllers need torque commands to execute trajectories
- **Force Interaction**: Understanding contact forces with the environment (floor, objects)
- **Balance & Stability**: Predicting and maintaining stable standing/walking
- **Energy Efficiency**: Optimizing motions to minimize energy consumption
- **Simulation**: Accurate physics simulation for training and testing

For humanoid robots, dynamics is especially crucial because they must constantly fight gravity, maintain balance on two legs, and coordinate many degrees of freedom simultaneously.

## Rigid Body Dynamics

### Mass, Inertia, and Forces

A **rigid body** is an idealized object where distances between points remain constant (no deformation). For a rigid body with mass $m$:

**Newton's Second Law (Translation):**
$$
F = m \ddot{p}
$$
where $F$ is the net force and $\ddot{p}$ is the acceleration of the center of mass.

**Euler's Equation (Rotation):**
$$
\tau = I \dot{\omega} + \omega \times (I \omega)
$$
where:
- $\tau$ is the net torque
- $I$ is the inertia tensor (3×3 matrix describing resistance to rotation)
- $\omega$ is angular velocity
- $\dot{\omega}$ is angular acceleration

**Inertia Tensor Example:**

For a uniform rectangular block with dimensions $(a, b, c)$ and mass $m$:

$$
I = \begin{bmatrix}
\frac{m}{12}(b^2 + c^2) & 0 & 0 \\
0 & \frac{m}{12}(a^2 + c^2) & 0 \\
0 & 0 & \frac{m}{12}(a^2 + b^2)
\end{bmatrix}
$$

### Equations of Motion

For a single rigid body, the equations of motion combine translation and rotation:

$$
\begin{bmatrix} F \\ \tau \end{bmatrix} = \begin{bmatrix} m I_3 & 0 \\ 0 & I \end{bmatrix} \begin{bmatrix} \ddot{p} \\ \dot{\omega} \end{bmatrix} + \begin{bmatrix} 0 \\ \omega \times I\omega \end{bmatrix}
$$

This compact form shows how forces produce linear acceleration and torques produce angular acceleration.

### Example: Pendulum Dynamics

Consider a simple pendulum: a point mass $m$ at the end of a massless rod of length $l$, pivoting about a fixed point.

![Pendulum Free Body Diagram](/img/chapter2/pendulum-fbd.svg)
*Figure 2.3: Free body diagram of a simple pendulum showing forces and torques*

**Derivation using Lagrangian:**

Kinetic energy: $T = \frac{1}{2} m l^2 \dot{\theta}^2$

Potential energy: $V = -mgl\cos\theta$ (with reference at pivot)

Lagrangian: $L = T - V = \frac{1}{2} m l^2 \dot{\theta}^2 + mgl\cos\theta$

Euler-Lagrange equation: $\frac{d}{dt}\frac{\partial L}{\partial \dot{\theta}} - \frac{\partial L}{\partial \theta} = \tau$

**Result:**
$$
ml^2 \ddot{\theta} + mgl\sin\theta = \tau
$$

For small angles ($\sin\theta \approx \theta$), this linearizes to:
$$
\ddot{\theta} + \frac{g}{l}\theta = \frac{\tau}{ml^2}
$$

**Python Simulation:**

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint

def pendulum_dynamics(state, t, m, l, g, damping=0.1):
    """
    Simulate pendulum dynamics.

    Parameters:
    -----------
    state : array (2,)
        [theta, theta_dot]
    t : float
        Time
    m, l, g : float
        Mass, length, gravity
    damping : float
        Damping coefficient

    Returns:
    --------
    state_dot : array (2,)
        [theta_dot, theta_ddot]
    """
    theta, theta_dot = state

    # Equation of motion: theta_ddot = -(g/l)*sin(theta) - damping*theta_dot
    theta_ddot = -(g / l) * np.sin(theta) - damping * theta_dot

    return [theta_dot, theta_ddot]

# Parameters
m, l, g = 1.0, 1.0, 9.81  # kg, m, m/s²
theta0, theta_dot0 = np.pi / 3, 0.0  # Initial: 60°, at rest

# Time vector
t = np.linspace(0, 10, 500)

# Simulate
state0 = [theta0, theta_dot0]
solution = odeint(pendulum_dynamics, state0, t, args=(m, l, g))

# Plot
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(t, np.degrees(solution[:, 0]))
plt.xlabel('Time (s)')
plt.ylabel('Angle (degrees)')
plt.title('Pendulum Angle vs Time')
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(solution[:, 0], solution[:, 1])
plt.xlabel('Angle (rad)')
plt.ylabel('Angular velocity (rad/s)')
plt.title('Phase Portrait')
plt.grid(True)
plt.tight_layout()
plt.show()
```

This simulation shows the pendulum's oscillatory motion and how it gradually dampens over time.

## Multi-Body Dynamics

Humanoid robots are **kinematic chains** of rigid bodies connected by joints. Computing their dynamics involves:

1. **Forward Dynamics**: Given joint torques, compute joint accelerations
2. **Inverse Dynamics**: Given desired joint accelerations, compute required torques

### Newton-Euler Recursive Algorithm

The Newton-Euler algorithm efficiently computes inverse dynamics for serial manipulators:

**Outward Pass (Base → End-effector):**
- Propagate velocities and accelerations from base to tip

**Inward Pass (End-effector → Base):**
- Propagate forces and torques from tip to base

**Algorithm Outline:**

For each link $i$ (outward pass):
$$
\omega_i = R_{i-1}^i \omega_{i-1} + \dot{\theta}_i z_i
$$
$$
\alpha_i = R_{i-1}^i \alpha_{i-1} + R_{i-1}^i \omega_{i-1} \times \dot{\theta}_i z_i + \ddot{\theta}_i z_i
$$
$$
a_i = R_{i-1}^i (a_{i-1} + \alpha_{i-1} \times p_{i-1,i} + \omega_{i-1} \times (\omega_{i-1} \times p_{i-1,i}))
$$

For each link $i$ (inward pass):
$$
f_i = R_{i+1}^i f_{i+1} + m_i a_{c_i}
$$
$$
\tau_i = R_{i+1}^i \tau_{i+1} + p_{i,c_i} \times m_i a_{c_i} + p_{i,i+1} \times R_{i+1}^i f_{i+1}
$$

where:
- $\omega_i$: angular velocity of link $i$
- $\alpha_i$: angular acceleration
- $a_i$: linear acceleration
- $f_i$, $\tau_i$: forces and torques

### Example: 2-Link Planar Arm Dynamics

For a 2-link arm in the plane, the equations of motion are:

$$
\begin{bmatrix}
M_{11} & M_{12} \\
M_{21} & M_{22}
\end{bmatrix}
\begin{bmatrix}
\ddot{\theta}_1 \\
\ddot{\theta}_2
\end{bmatrix} +
\begin{bmatrix}
C_1 \\
C_2
\end{bmatrix} +
\begin{bmatrix}
G_1 \\
G_2
\end{bmatrix} =
\begin{bmatrix}
\tau_1 \\
\tau_2
\end{bmatrix}
$$

where:
- $M$: Mass matrix (inertia terms)
- $C$: Coriolis and centrifugal terms
- $G$: Gravity terms
- $\tau$: Joint torques

**Python Implementation:**

```python
import numpy as np

def two_link_arm_inverse_dynamics(theta, theta_dot, theta_ddot, m1, m2, l1, l2, g=9.81):
    """
    Compute inverse dynamics for 2-link planar arm.

    Parameters:
    -----------
    theta : array (2,)
        Joint angles [θ₁, θ₂]
    theta_dot : array (2,)
        Joint velocities
    theta_ddot : array (2,)
        Joint accelerations
    m1, m2 : float
        Link masses
    l1, l2 : float
        Link lengths
    g : float
        Gravity

    Returns:
    --------
    tau : array (2,)
        Required joint torques [τ₁, τ₂]
    """
    theta1, theta2 = theta
    theta1_dot, theta2_dot = theta_dot
    theta1_ddot, theta2_ddot = theta_ddot

    # Mass matrix elements
    M11 = (m1 + m2) * l1**2 + m2 * l2**2 + 2 * m2 * l1 * l2 * np.cos(theta2)
    M12 = m2 * l2**2 + m2 * l1 * l2 * np.cos(theta2)
    M21 = M12
    M22 = m2 * l2**2

    M = np.array([[M11, M12], [M21, M22]])

    # Coriolis and centrifugal terms
    h = -m2 * l1 * l2 * np.sin(theta2)
    C1 = h * (2 * theta1_dot * theta2_dot + theta2_dot**2)
    C2 = h * theta1_dot**2

    C = np.array([C1, C2])

    # Gravity terms
    G1 = (m1 + m2) * g * l1 * np.cos(theta1) + m2 * g * l2 * np.cos(theta1 + theta2)
    G2 = m2 * g * l2 * np.cos(theta1 + theta2)

    G = np.array([G1, G2])

    # Compute torques: τ = M·θ̈ + C + G
    tau = M @ theta_ddot + C + G

    return tau

# Example: Compute torques for specific motion
theta = np.array([np.pi/4, np.pi/6])        # 45°, 30°
theta_dot = np.array([0.1, 0.2])            # rad/s
theta_ddot = np.array([0.5, -0.3])          # rad/s²
m1, m2 = 1.5, 1.0                           # kg
l1, l2 = 0.5, 0.4                           # m

tau = two_link_arm_inverse_dynamics(theta, theta_dot, theta_ddot, m1, m2, l1, l2)
print(f"Required torques: τ₁ = {tau[0]:.3f} Nm, τ₂ = {tau[1]:.3f} Nm")
```

This code computes the exact motor torques needed to produce a specified motion, accounting for inertia, Coriolis forces, and gravity.

## Humanoid-Specific Concepts

### Balance and Stability

**Static Stability**: A robot is statically stable if its center of mass (CoM) projection falls within the support polygon (the convex hull of contact points with the ground).

**Dynamic Stability**: During motion, a robot can be dynamically stable even if the CoM projection is outside the support polygon, as long as momentum is properly controlled.

**Center of Mass (CoM) Calculation:**

For a multi-link system:
$$
\text{CoM} = \frac{\sum_{i=1}^{n} m_i \mathbf{p}_i}{\sum_{i=1}^{n} m_i}
$$

where $m_i$ is the mass of link $i$ and $\mathbf{p}_i$ is its position.

### Zero Moment Point (ZMP)

The **Zero Moment Point** is a point on the ground where the net moment of all forces acting on the robot is zero. It's a key concept for bipedal locomotion.

**ZMP Definition:**

The ZMP is the point $(x_{zmp}, y_{zmp})$ where:
$$
\tau_x = 0, \quad \tau_y = 0
$$

**ZMP Criterion for Stability:**

A biped is dynamically balanced if the ZMP lies inside the support polygon. If the ZMP reaches the edge, the robot is about to tip over.

**ZMP Computation:**

For a simplified model (inverted pendulum), the ZMP position is:

$$
x_{zmp} = x_{com} - \frac{h}{g} \ddot{x}_{com}
$$

where:
- $x_{com}$: horizontal position of center of mass
- $h$: height of CoM above ground
- $\ddot{x}_{com}$: horizontal acceleration of CoM
- $g$: gravitational acceleration

**Practical Use:**

ZMP-based controllers plan trajectories such that the ZMP stays safely inside the foot support region during walking.

### Example: Standing Humanoid Balance

![ZMP Analysis](/img/chapter2/zmp-standing.svg)
*Figure 2.4: ZMP analysis for a standing humanoid robot showing center of mass, support polygon, and stability*

```python
import numpy as np

def compute_zmp_2d(com_position, com_acceleration, com_height, g=9.81):
    """
    Compute ZMP position for a standing humanoid in 2D (sagittal plane).

    Parameters:
    -----------
    com_position : float
        Horizontal position of center of mass (m)
    com_acceleration : float
        Horizontal acceleration of CoM (m/s²)
    com_height : float
        Height of CoM above ground (m)
    g : float
        Gravitational acceleration (m/s²)

    Returns:
    --------
    zmp_position : float
        ZMP horizontal position (m)
    """
    zmp_position = com_position - (com_height / g) * com_acceleration
    return zmp_position

def check_stability(zmp_position, foot_left, foot_right):
    """
    Check if ZMP is within support polygon (between feet).

    Parameters:
    -----------
    zmp_position : float
        ZMP horizontal position
    foot_left, foot_right : float
        Left and right foot boundaries

    Returns:
    --------
    stable : bool
        True if stable (ZMP inside support)
    """
    return foot_left <= zmp_position <= foot_right

# Example: Standing humanoid
com_pos = 0.0        # CoM at origin
com_acc = 0.5        # Slight forward acceleration (m/s²)
com_h = 0.9          # CoM height (m)
foot_left = -0.1     # Left foot at -0.1 m
foot_right = 0.1     # Right foot at 0.1 m

zmp = compute_zmp_2d(com_pos, com_acc, com_h)
stable = check_stability(zmp, foot_left, foot_right)

print(f"Center of Mass: {com_pos:.3f} m")
print(f"ZMP Position: {zmp:.3f} m")
print(f"Support Polygon: [{foot_left}, {foot_right}] m")
print(f"Stable: {stable}")

if not stable:
    print("Warning: Robot is tipping over!")
else:
    margin = min(zmp - foot_left, foot_right - zmp)
    print(f"Stability margin: {margin:.3f} m")
```

This code demonstrates how to compute and monitor the ZMP for balance control.

## Practical Considerations

### Actuator Torque Limits

Real motors have maximum torque limits. Controllers must ensure that planned motions stay within these bounds:

$$
\tau_{\min,i} \leq \tau_i \leq \tau_{\max,i} \quad \forall i
$$

Violating limits leads to tracking errors or motor damage.

### Energy Efficiency

Minimizing energy consumption is crucial for battery-powered humanoids. Energy-optimal trajectories can be found by minimizing:

$$
E = \int_0^T \sum_{i=1}^{n} |\tau_i \dot{\theta}_i| \, dt
$$

subject to task constraints (e.g., reach target in time $T$).

### Simulation Tools

Accurate dynamics simulation is essential for testing control algorithms:

- **Gazebo**: ROS-integrated physics simulator using ODE or Bullet
- **MuJoCo**: Fast, accurate simulator popular in reinforcement learning
- **PyBullet**: Python interface to Bullet physics engine
- **NVIDIA Isaac Gym**: GPU-accelerated simulator for parallel training

**Example Workflow:**
1. Design controller in simulation (test millions of scenarios quickly)
2. Tune parameters based on simulated performance
3. Transfer to real robot (with domain adaptation if needed)

---

## Summary

Dynamics extends kinematics by incorporating forces and torques, enabling us to understand and control how humanoid robots actually move. Key concepts include:

- **Rigid Body Dynamics**: Newton-Euler equations for single bodies
- **Multi-Body Dynamics**: Recursive algorithms for kinematic chains
- **Inverse Dynamics**: Computing required torques for desired motions
- **Balance & Stability**: Static vs. dynamic, CoM analysis
- **Zero Moment Point (ZMP)**: Critical for bipedal walking control
- **Practical Constraints**: Torque limits, energy efficiency, simulation

Together with kinematics from the previous section, dynamics provides the foundation for motion planning, control, and simulation of humanoid robots.

**Next Steps**: Explore practical [Examples](./examples.md) or continue to advanced topics in motion control and planning.
