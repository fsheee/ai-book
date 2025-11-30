# Quickstart Guide: Student Environment Setup for Chapters 3-5

**Feature**: 003-chapters-3-4-5
**Date**: 2025-11-30
**Purpose**: Help students set up simulation environment for Gazebo, ROS 2, Isaac Sim, and Unity

---

## Overview

This guide helps students prepare their development environment for Chapters 3-5 of the Physical AI & Humanoid Robotics textbook. You'll install:

1. **Ubuntu 22.04** (primary platform)
2. **Gazebo Harmonic** (Chapter 3 - Robot Simulation)
3. **ROS 2 Humble** (Chapter 4 - ROS Integration)
4. **NVIDIA Isaac Sim** (Chapter 5 - Optional, requires RTX GPU)
5. **Unity ML-Agents** (Chapter 5 - Alternative for non-NVIDIA GPUs)

**Estimated Setup Time**: 2-3 hours

---

## Prerequisites

### Hardware Requirements

**Minimum** (for Chapters 3-4):
- CPU: 4 cores (Intel i5 / AMD Ryzen 5 or better)
- RAM: 8 GB
- Storage: 30 GB free space
- Graphics: Integrated graphics (Intel HD, AMD Radeon)

**Recommended** (for all chapters including Isaac Sim):
- CPU: 8 cores (Intel i7 / AMD Ryzen 7 or better)
- RAM: 16 GB
- Storage: 50 GB free space (SSD recommended)
- Graphics: **NVIDIA RTX GPU** (GTX 1660 or better, 6+ GB VRAM)

**Note**: Isaac Sim (Chapter 5) requires an NVIDIA RTX GPU. If you don't have one, use Unity ML-Agents instead (runs on any GPU/CPU).

### Operating System

**Primary Platform**: Ubuntu 22.04 LTS (recommended)

**Alternatives**:
- **Windows 10/11**: Use WSL2 (Windows Subsystem for Linux) with Ubuntu 22.04
- **macOS**: Not officially supported by ROS 2 or Gazebo. Use Docker or Linux VM

---

## Part 1: Ubuntu 22.04 Setup (30 minutes)

### Option A: Native Ubuntu Installation

**If you have a spare partition or second computer**:

1. Download Ubuntu 22.04 LTS Desktop:
   - Official: https://ubuntu.com/download/desktop
   - ISO size: ~3.6 GB

2. Create bootable USB:
   - Use Rufus (Windows) or Etcher (macOS/Linux)
   - Follow official guide: https://ubuntu.com/tutorials/create-a-usb-stick-on-windows

3. Install Ubuntu:
   - Boot from USB, select "Install Ubuntu"
   - Choose "Minimal installation" to save disk space
   - Allocate at least 30 GB for the partition

### Option B: WSL2 (Windows Users)

**Recommended for Windows 10/11 users**:

1. Enable WSL2:
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install -d Ubuntu-22.04
   ```

2. Restart computer when prompted

3. Launch Ubuntu 22.04:
   - Open "Ubuntu 22.04" from Start Menu
   - Create username and password

4. Install GUI support (optional, for Gazebo visualization):
   ```bash
   sudo apt update
   sudo apt install ubuntu-desktop xrdp
   sudo systemctl enable xrdp
   ```

5. Connect via Remote Desktop:
   - Open "Remote Desktop Connection" on Windows
   - Connect to `localhost:3389`

### Option C: Docker (Advanced Users)

**For users comfortable with Docker**:

1. Install Docker Desktop:
   - Windows/macOS: https://www.docker.com/products/docker-desktop
   - Linux: `sudo apt install docker.io`

2. Pull Ubuntu 22.04 image:
   ```bash
   docker pull ubuntu:22.04
   ```

3. Run interactive container:
   ```bash
   docker run -it --name ros2-gazebo \
     --privileged \
     -v /tmp/.X11-unix:/tmp/.X11-unix \
     -e DISPLAY=$DISPLAY \
     ubuntu:22.04 /bin/bash
   ```

4. Inside container, proceed with installation steps below

---

## Part 2: Gazebo Harmonic Installation (20 minutes)

**Platform**: Ubuntu 22.04 (native, WSL2, or Docker)

### Step 1: Add Gazebo Package Repository

```bash
# Add official Gazebo repository
sudo wget https://packages.osrfoundation.org/gazebo.gpg -O /usr/share/keyrings/pkgs-osrf-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/pkgs-osrf-archive-keyring.gpg] http://packages.osrfoundation.org/gazebo/ubuntu-stable $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/gazebo-stable.list > /dev/null

sudo apt update
```

### Step 2: Install Gazebo Harmonic

```bash
# Install Gazebo Harmonic (latest version)
sudo apt install gz-harmonic

# Verify installation
gz sim --version
# Expected output: Gazebo Sim, version 8.x.x
```

### Step 3: Test Gazebo

```bash
# Launch Gazebo with empty world
gz sim empty.sdf

# Expected: Gazebo GUI window opens
# If no window appears in WSL2, check X server setup
```

**Troubleshooting**:
- **Error: "Could not find library"**: Run `sudo ldconfig`
- **Black screen in Gazebo**: Update graphics drivers or use software rendering: `LIBGL_ALWAYS_SOFTWARE=1 gz sim`
- **WSL2 no display**: Install VcXsrv (Windows X server) and set `export DISPLAY=:0`

---

## Part 3: ROS 2 Humble Installation (30 minutes)

**Platform**: Ubuntu 22.04

### Step 1: Add ROS 2 Repository

```bash
# Ensure locale supports UTF-8
sudo apt install locales
sudo locale-gen en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
export LANG=en_US.UTF-8

# Add ROS 2 apt repository
sudo apt install software-properties-common
sudo add-apt-repository universe

sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -

sudo sh -c 'echo "deb [arch=$(dpkg --print-architecture)] http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/ros2-latest.list'

sudo apt update
```

### Step 2: Install ROS 2 Humble Desktop

```bash
# Install ROS 2 Humble (includes RViz, demos, tutorials)
sudo apt install ros-humble-desktop

# Install development tools
sudo apt install ros-dev-tools
```

### Step 3: Environment Setup

```bash
# Add ROS 2 to bash profile
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc

# Verify installation
ros2 --version
# Expected: ros2 cli version: 0.18.x
```

### Step 4: Install ROS 2 - Gazebo Integration

```bash
# Install Gazebo-ROS 2 packages
sudo apt install ros-humble-gz-ros2-control ros-humble-gz-sim-vendor
```

### Step 5: Test ROS 2

```bash
# Terminal 1: Start demo talker
ros2 run demo_nodes_py talker

# Terminal 2: Start demo listener
ros2 run demo_nodes_py listener

# Expected: Listener prints "I heard: [Hello World: N]"
```

---

## Part 4: Additional ROS 2 Packages (15 minutes)

**For Chapter 4 examples**:

```bash
# Install ros2_control
sudo apt install ros-humble-ros2-control ros-humble-ros2-controllers

# Install MoveIt 2 (motion planning)
sudo apt install ros-humble-moveit

# Install navigation (optional, for future chapters)
sudo apt install ros-humble-navigation2 ros-humble-nav2-bringup
```

---

## Part 5: Python Environment Setup (10 minutes)

### Step 1: Install Python 3.10

```bash
# Ubuntu 22.04 comes with Python 3.10
python3 --version
# Expected: Python 3.10.x

# Install pip
sudo apt install python3-pip
```

### Step 2: Install Python Libraries

```bash
# Install scientific computing libraries
pip3 install numpy scipy matplotlib

# Install robotics libraries
pip3 install transforms3d pybullet

# Verify installations
python3 -c "import numpy as np; print(np.__version__)"
# Expected: 1.24.x or later
```

---

## Part 6: NVIDIA Isaac Sim (Optional, 60 minutes)

**Requirements**: NVIDIA RTX GPU (GTX 1660 or better), Ubuntu 22.04

### Step 1: Install NVIDIA Drivers

```bash
# Check if NVIDIA GPU is detected
lspci | grep -i nvidia

# Install latest NVIDIA drivers
sudo apt install nvidia-driver-535

# Reboot
sudo reboot

# Verify driver installation
nvidia-smi
# Expected: Driver version 535.x, CUDA version 12.2
```

### Step 2: Install Omniverse Launcher

1. Download Omniverse:
   - Go to: https://www.nvidia.com/en-us/omniverse/download/
   - Click "Download Omniverse" (requires free NVIDIA account)
   - Save `omniverse-launcher-linux.AppImage`

2. Install Omniverse:
   ```bash
   # Make executable
   chmod +x omniverse-launcher-linux.AppImage

   # Run launcher
   ./omniverse-launcher-linux.AppImage
   ```

### Step 3: Install Isaac Sim

1. In Omniverse Launcher:
   - Go to "Exchange" tab
   - Search "Isaac Sim"
   - Click "Install" (downloads ~20 GB)
   - Wait for installation to complete (30-45 minutes)

2. Launch Isaac Sim:
   - Click "Launch" in Omniverse
   - First launch takes 5-10 minutes (shader compilation)

### Step 4: Install Isaac Sim Python API

```bash
# Find Isaac Sim installation path
ISAAC_SIM_PATH=~/.local/share/ov/pkg/isaac_sim-*

# Add to Python path
echo "export PYTHONPATH=$PYTHONPATH:$ISAAC_SIM_PATH" >> ~/.bashrc
source ~/.bashrc

# Test Python import
python3 -c "from isaacsim import SimulationApp; print('Isaac Sim Python API loaded')"
```

**Troubleshooting**:
- **Out of VRAM**: Reduce quality settings in Isaac Sim preferences
- **Slow performance**: Ensure NVIDIA driver is installed correctly, check `nvidia-smi`
- **AppImage doesn't run**: Install FUSE: `sudo apt install libfuse2`

---

## Part 7: Unity ML-Agents (Alternative, 45 minutes)

**For students without NVIDIA GPUs**

### Step 1: Install Unity Hub

1. Download Unity Hub:
   - Go to: https://unity.com/download
   - Download Unity Hub for Linux
   - Save `UnityHub.AppImage`

2. Install Unity Hub:
   ```bash
   chmod +x UnityHub.AppImage
   ./UnityHub.AppImage
   ```

### Step 2: Install Unity Editor

1. In Unity Hub:
   - Sign in with Unity account (create free account if needed)
   - Click "Installs" → "Install Editor"
   - Select "Unity 2022.3 LTS" (Long-Term Support)
   - Add modules: "Linux Build Support"
   - Click "Install" (downloads ~5 GB)

### Step 3: Install ML-Agents Package

1. Clone ML-Agents repository:
   ```bash
   cd ~/Projects
   git clone https://github.com/Unity-Technologies/ml-agents.git
   cd ml-agents
   git checkout release_20
   ```

2. Install Python package:
   ```bash
   pip3 install mlagents==0.30.0
   ```

3. Verify installation:
   ```bash
   mlagents-learn --help
   # Expected: Usage information for mlagents-learn
   ```

### Step 4: Test ML-Agents

1. Open Unity Hub → "Projects" → "Add project from disk"
2. Navigate to `ml-agents/Project`
3. Wait for Unity to import project (5-10 minutes)
4. Open `3DBall` scene in `Assets/ML-Agents/Examples/3DBall`
5. Click "Play" to test simulation

---

## Part 8: Verification Checklist

**Run these commands to verify your setup**:

### Gazebo Test

```bash
gz sim shapes.sdf
# Expected: Window with basic shapes
```

### ROS 2 Test

```bash
ros2 topic list
# Expected: List of topics (even if empty)
```

### Python Test

```bash
python3 -c "import numpy, scipy, matplotlib; print('All libraries loaded')"
# Expected: "All libraries loaded"
```

### Isaac Sim Test (if installed)

```bash
python3 -c "from isaacsim import SimulationApp; print('Isaac Sim ready')"
# Expected: "Isaac Sim ready"
```

### Unity Test (if installed)

```bash
mlagents-learn --help
# Expected: Usage information
```

---

## Part 9: Common Issues and Solutions

### Issue 1: Gazebo won't launch in WSL2

**Solution**:
1. Install Windows X server (VcXsrv):
   - Download from: https://sourceforge.net/projects/vcxsrv/
   - Run XLaunch with "Disable access control" checked

2. Set DISPLAY in WSL2:
   ```bash
   export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
   echo "export DISPLAY=\$(cat /etc/resolv.conf | grep nameserver | awk '{print \$2}'):0" >> ~/.bashrc
   ```

### Issue 2: ROS 2 commands not found

**Solution**:
```bash
# Source ROS 2 setup
source /opt/ros/humble/setup.bash

# Add to ~/.bashrc to make permanent
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

### Issue 3: Isaac Sim crashes on startup

**Solution**:
1. Update NVIDIA drivers: `sudo ubuntu-drivers autoinstall`
2. Check GPU VRAM: `nvidia-smi` (need at least 4 GB free)
3. Try launching with lower quality:
   - In Omniverse, go to Isaac Sim Settings
   - Set "Render Quality" to "Low"

### Issue 4: Unity Hub won't install on Linux

**Solution**:
```bash
# Install dependencies
sudo apt install libgl1 libglib2.0-0 libgstreamer1.0-0

# Try alternative download
wget https://public-cdn.cloud.unity3d.com/hub/prod/UnityHub.AppImage
chmod +x UnityHub.AppImage
./UnityHub.AppImage
```

---

## Part 10: Next Steps

**After completing setup**:

1. **Verify with Chapter 3**: Start reading "Robot Simulation Fundamentals"
2. **Test Gazebo**: Follow "Hello World" example in Chapter 3
3. **Test ROS 2**: Follow "Your First Node" example in Chapter 4
4. **Optional**: Explore Isaac Sim tutorials or Unity ML-Agents examples

**Recommended Learning Path**:
- Chapters 3-4 (Gazebo + ROS 2): Essential for all students
- Chapter 5 (Isaac Sim or Unity): Choose based on your GPU

---

## Additional Resources

**Gazebo**:
- Official docs: https://gazebosim.org/docs/harmonic
- Tutorials: https://gazebosim.org/docs/harmonic/tutorials
- Forum: https://answers.gazebosim.org

**ROS 2**:
- Official docs: https://docs.ros.org/en/humble/
- Tutorials: https://docs.ros.org/en/humble/Tutorials.html
- Forum: https://robotics.stackexchange.com/questions/tagged/ros2

**NVIDIA Isaac Sim**:
- Official docs: https://docs.omniverse.nvidia.com/isaacsim/latest/
- Tutorials: https://docs.omniverse.nvidia.com/isaacsim/latest/tutorials.html
- Forum: https://forums.developer.nvidia.com/c/omniverse/simulation/69

**Unity ML-Agents**:
- GitHub: https://github.com/Unity-Technologies/ml-agents
- Documentation: https://github.com/Unity-Technologies/ml-agents/blob/main/docs/README.md
- Forum: https://forum.unity.com/forums/ml-agents.453/

---

**Setup Guide Version**: 1.0.0
**Last Updated**: 2025-11-30
**Tested On**: Ubuntu 22.04 LTS, Windows 11 + WSL2
