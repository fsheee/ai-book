import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';

function DashboardSkeleton() {
  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={styles.welcomeHeader}>
          <div className={styles.skeleton} style={{height: '2.5rem', width: '60%', margin: '0 auto 0.5rem'}}></div>
          <div className={styles.skeleton} style={{height: '1.5rem', width: '40%', margin: '0 auto'}}></div>
        </div>
        <div className={styles.dashboardGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.skeleton} style={{height: '1.5rem', width: '50%', marginBottom: '1.5rem'}}></div>
              <div className={styles.skeleton} style={{height: '4rem', marginBottom: '1rem'}}></div>
              <div className={styles.skeleton} style={{height: '4rem', marginBottom: '1rem'}}></div>
              <div className={styles.skeleton} style={{height: '4rem'}}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Mock dashboard data (TODO: Replace with API call)
  const mockData = {
    progress: [
      { chapter: 'Chapter 1: Introduction', completion: 100 },
      { chapter: 'Chapter 2: Kinematics', completion: 75 },
      { chapter: 'Chapter 3: Dynamics', completion: 30 },
    ],
    recommendations: [
      { title: 'Chapter 2: Forward Kinematics', description: 'Complete this section to continue your learning path' },
      { title: 'Chapter 3: Simulation Fundamentals', description: 'Explore simulation concepts' },
      { title: 'Quiz: Kinematics Review', description: 'Test your understanding' },
    ],
    recentChats: [
      { question: 'What is forward kinematics?', timestamp: '2 hours ago' },
      { question: 'Explain DH parameters', timestamp: '1 day ago' },
      { question: 'How do I set up Gazebo?', timestamp: '2 days ago' },
    ],
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={styles.welcomeHeader}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {user.name || user.email}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            Continue your learning journey in Physical AI & Humanoid Robotics
          </p>
        </div>

        <div className={styles.dashboardGrid}>
          {/* Reading Progress Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📚 Reading Progress</h2>
            <div className={styles.progressList}>
              {mockData.progress.map((item, index) => (
                <div key={index} className={styles.progressItem}>
                  <div className={styles.progressInfo}>
                    <span className={styles.chapterName}>{item.chapter}</span>
                    <span className={styles.progressPercent}>{item.completion}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${item.completion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>💡 Recommended for You</h2>
            <div className={styles.recommendationsList}>
              {mockData.recommendations.map((item, index) => (
                <div key={index} className={styles.recommendationItem}>
                  <h3 className={styles.recommendationTitle}>{item.title}</h3>
                  <p className={styles.recommendationDesc}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Chats Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>💬 Recent Chats</h2>
            <div className={styles.chatsList}>
              {mockData.recentChats.map((chat, index) => (
                <div key={index} className={styles.chatItem}>
                  <p className={styles.chatQuestion}>{chat.question}</p>
                  <span className={styles.chatTimestamp}>{chat.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
