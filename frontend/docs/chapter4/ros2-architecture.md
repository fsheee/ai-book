---
title: "ROS 2 Architecture"
sidebar_position: 1
---

# ROS 2 Architecture

## Code Example 4: ROS 2 Service Client

```python
"""
ROS 2 service client for requesting robot state.

Dependencies:
- ros-humble-rclpy
- ros-humble-example-interfaces
"""

import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class ServiceClient(Node):
    """Client that calls a service to add two integers."""

    def __init__(self):
        super().__init__('service_client')
        self.client = self.create_client(AddTwoInts, 'add_two_ints')

        # Wait for service to be available
        while not self.client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Service not available, waiting...')

    def send_request(self, a: int, b: int) -> int:
        """
        Send request to add two integers.

        Parameters
        ----------
        a, b : int
            Numbers to add

        Returns
        -------
        int
            Sum of a and b
        """
        request = AddTwoInts.Request()
        request.a = a
        request.b = b

        self.get_logger().info(f'Sending request: {a} + {b}')
        future = self.client.call_async(request)
        rclpy.spin_until_future_complete(self, future)

        if future.result() is not None:
            result = future.result().sum
            self.get_logger().info(f'Result: {result}')
            return result
        else:
            self.get_logger().error('Service call failed')
            return -1

def main(args=None):
    rclpy.init(args=args)
    client = ServiceClient()
    result = client.send_request(5, 7)
    print(f'5 + 7 = {result}')
    client.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## Code Example 5: ROS 2 Action Server

```python
"""
ROS 2 action server for long-running robot motions.

Dependencies:
- ros-humble-rclpy
- ros-humble-action-msgs
"""

import rclpy
from rclpy.action import ActionServer
from rclpy.node import Node
from example_interfaces.action import Fibonacci

class FibonacciActionServer(Node):
    """Action server that computes Fibonacci sequence."""

    def __init__(self):
        super().__init__('fibonacci_action_server')
        self._action_server = ActionServer(
            self,
            Fibonacci,
            'fibonacci',
            self.execute_callback
        )
        self.get_logger().info('Action server started')

    def execute_callback(self, goal_handle):
        """
        Execute the Fibonacci action.

        Provides periodic feedback and final result.
        """
        self.get_logger().info('Executing goal...')

        # Generate Fibonacci sequence
        feedback_msg = Fibonacci.Feedback()
        feedback_msg.sequence = [0, 1]

        for i in range(1, goal_handle.request.order):
            # Send feedback
            feedback_msg.sequence.append(
                feedback_msg.sequence[i] + feedback_msg.sequence[i-1]
            )
            goal_handle.publish_feedback(feedback_msg)
            self.get_logger().info(f'Feedback: {feedback_msg.sequence}')
            rclpy.spin_once(self, timeout_sec=0.5)

        # Mark as succeeded
        goal_handle.succeed()

        # Return result
        result = Fibonacci.Result()
        result.sequence = feedback_msg.sequence
        return result

def main(args=None):
    rclpy.init(args=args)
    server = FibonacciActionServer()
    try:
        rclpy.spin(server)
    except KeyboardInterrupt:
        pass
    finally:
        server.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```
