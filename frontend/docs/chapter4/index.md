---
title: "ROS 2 Integration for Robotics"
sidebar_position: 4
description: "Master ROS 2 for humanoid robotics: nodes, topics, services, actions, and integration with Gazebo simulation."
keywords: ["ros2", "robot operating system", "gazebo integration", "moveit2", "ros2_control"]
tags: ["chapter4", "ros2", "integration"]
difficulty: "intermediate"
estimated_time: 90
---

# Chapter 4: ROS 2 Integration for Robotics

Welcome to Chapter 4! Here you'll master ROS 2 (Robot Operating System 2), the industry-standard middleware for robot software architecture. ROS 2 provides the communication infrastructure, tools, and libraries that connect your perception, planning, and control systems into a cohesive robotic application.

## Why ROS 2?

ROS 2 is used by virtually every major robotics company and research lab worldwide. It solves the fundamental challenge of robot software: how do you get dozens of independent software components (perception, planning, control, logging, visualization) to communicate reliably in real-time?

## Learning Outcomes

- **Create** ROS 2 nodes that publish and subscribe to topics
- **Integrate** ROS 2 with Gazebo for hardware-in-the-loop simulation
- **Configure** ros2_control for humanoid robot actuation
- **Use** MoveIt 2 for motion planning and collision avoidance
- **Apply** best practices for real-time robot control systems

## Code Example 2: Basic ROS 2 Publisher Node

```python
"""
Simple ROS 2 publisher node that sends joint commands.

Dependencies:
- ros-humble-rclpy
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import Float64MultiArray

class JointCommandPublisher(Node):
    """Publish joint position commands at 10 Hz."""

    def __init__(self):
        super().__init__('joint_command_publisher')
        self.publisher_ = self.create_publisher(
            Float64MultiArray,
            '/joint_commands',
            10
        )
        self.timer = self.create_timer(0.1, self.timer_callback)  # 10 Hz
        self.get_logger().info('Joint command publisher started')

    def timer_callback(self):
        msg = Float64MultiArray()
        # Example: 6 joint positions for humanoid arm
        msg.data = [0.0, 0.5, -0.5, 0.0, 0.5, 0.0]
        self.publisher_.publish(msg)
        self.get_logger().info(f'Publishing: {msg.data}')

def main(args=None):
    rclpy.init(args=args)
    node = JointCommandPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## Code Example 3: ROS 2 Subscriber for Camera Images

```python
"""
ROS 2 subscriber that receives camera images from Gazebo.

Dependencies:
- ros-humble-rclpy
- ros-humble-sensor-msgs
- opencv-python
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2

class CameraSubscriber(Node):
    """Subscribe to camera images and display them."""

    def __init__(self):
        super().__init__('camera_subscriber')
        self.subscription = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10
        )
        self.bridge = CvBridge()
        self.get_logger().info('Camera subscriber started')

    def image_callback(self, msg: Image):
        """Process incoming camera images."""
        try:
            # Convert ROS Image message to OpenCV format
            cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')

            # Display image
            cv2.imshow('Camera Feed', cv_image)
            cv2.waitKey(1)

            self.get_logger().info(
                f'Received image: {cv_image.shape[1]}x{cv_image.shape[0]}'
            )
        except Exception as e:
            self.get_logger().error(f'Error processing image: {e}')

def main(args=None):
    rclpy.init(args=args)
    node = CameraSubscriber()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        cv2.destroyAllWindows()
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

Let's continue with more examples in the following sections...
