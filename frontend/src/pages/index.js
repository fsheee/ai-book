import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/Auth/AuthModal';
import Dashboard from '../components/Dashboard/Dashboard';
import styles from './index.module.css';

function HomepageHeader({ onLoginClick }) {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/Chapter1">
            Start Learning
          </Link>
          <button
            className="button button--outline button--secondary button--lg"
            onClick={onLoginClick}
            style={{marginLeft: '1rem'}}>
            Login / Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}

function HomeContent() {
  const {siteConfig} = useDocusaurusContext();
  const { user, loading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <Layout
        title={`Welcome`}
        description="AI-Generated Textbook for Physical AI & Humanoid Robotics">
        <div style={{padding: '4rem 0', textAlign: 'center'}}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Welcome`}
      description="AI-Generated Textbook for Physical AI & Humanoid Robotics">
      {user ? (
        // Authenticated: Show personalized dashboard
        <>
          <div style={{textAlign: 'right', padding: '1rem 2rem', borderBottom: '1px solid var(--ifm-color-emphasis-300)'}}>
            <button
              className="button button--sm button--outline button--secondary"
              onClick={logout}
              style={{fontSize: '0.9rem'}}>
              Logout
            </button>
          </div>
          <Dashboard user={user} />
        </>
      ) : (
        // Unauthenticated: Show generic landing page
        <>
          <HomepageHeader onLoginClick={() => setShowAuthModal(true)} />
          <main>
        {/* About Section */}
        <section className="container" style={{padding: '3rem 0'}}>
          <div className="row">
            <div className="col col--12 text--center">
              <h2 style={{fontSize: '2.5rem', marginBottom: '1rem'}}>About This Textbook</h2>
              <p style={{fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--ifm-color-emphasis-700)'}}>
                This comprehensive textbook covers the fundamentals of Physical AI and Humanoid Robotics,
                from kinematics and dynamics to advanced control and AI integration.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className="container">
            <div className="row">
              <div className="col col--12 text--center">
                <h2 style={{fontSize: '2.5rem', marginBottom: '2rem'}}>Features</h2>
              </div>
            </div>
            <div className="row">
              <div className={clsx('col col--6', styles.featureCol)}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureCardTitle}>📝 Interactive Code Examples</h3>
                  <p className={styles.featureCardText}>Learn with hands-on Python code examples that you can run and modify directly in your browser.</p>
                </div>
              </div>
              <div className={clsx('col col--6', styles.featureCol)}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureCardTitle}>🔢 Mathematical Derivations</h3>
                  <p className={styles.featureCardText}>Clear mathematical explanations with beautiful LaTeX rendering for complex equations and proofs.</p>
                </div>
              </div>
              <div className={clsx('col col--6', styles.featureCol)}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureCardTitle}>📊 Visual Diagrams</h3>
                  <p className={styles.featureCardText}>Understand concepts faster with detailed diagrams, flowcharts, and visual representations.</p>
                </div>
              </div>
              <div className={clsx('col col--6', styles.featureCol)}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureCardTitle}>🤖 RAG-Powered Chatbot</h3>
                  <p className={styles.featureCardText}>Get instant answers to your questions with our intelligent chatbot that understands the textbook content.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
          </main>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode="login"
          />
        </>
      )}
    </Layout>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
