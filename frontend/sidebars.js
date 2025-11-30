// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'Chapter1',
      label: 'Chapter 1: Introduction to Humanoid Robotics',
    },
    {
      type: 'category',
      label: 'Chapter 2: Kinematics and Dynamics',
      collapsible: true,
      collapsed: false,
      link: {
        type: 'doc',
        id: 'chapter2/index',
      },
      items: [
        'chapter2/kinematics',
        'chapter2/dynamics',
      ],
    },
    {
      type: 'category',
      label: 'Chapter 3: Robot Simulation Fundamentals',
      collapsible: true,
      collapsed: true,
      link: {
        type: 'doc',
        id: 'chapter3/index',
      },
      items: [
        'chapter3/simulation-fundamentals',
        // More sections coming soon (gazebo-setup, physics-engines, sensor-modeling)
      ],
    },
    {
      type: 'category',
      label: 'Chapter 4: ROS 2 Integration',
      collapsible: true,
      collapsed: true,
      link: {
        type: 'doc',
        id: 'chapter4/index',
      },
      items: [
        'chapter4/ros2-architecture',
        // More sections coming soon (ros2-control, gazebo-ros2-integration, moveit2)
      ],
    },
    {
      type: 'category',
      label: 'Chapter 5: Advanced AI Simulation',
      collapsible: true,
      collapsed: true,
      link: {
        type: 'doc',
        id: 'chapter5/index',
      },
      items: [
        // Sections coming soon (isaac-sim, domain-randomization, isaac-gym-rl, unity-ml-agents)
      ],
    },
  ],
};

module.exports = sidebars;
