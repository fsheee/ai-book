import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
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
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome`}
      description="AI-Generated Textbook for Physical AI & Humanoid Robotics">
      <HomepageHeader />
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
        <section style={{background: 'var(--ifm-color-emphasis-100)', padding: '3rem 0'}}>
          <div className="container">
            <div className="row">
              <div className="col col--12 text--center">
                <h2 style={{fontSize: '2.5rem', marginBottom: '2rem'}}>Features</h2>
              </div>
            </div>
            <div className="row">
              <div className="col col--6" style={{padding: '1rem'}}>
                <div style={{padding: '1.5rem', background: 'var(--ifm-card-background-color)', borderRadius: '8px', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--ifm-color-emphasis-300)'}}>
                  <h3 style={{color: 'var(--ifm-heading-color)'}}>📝 Interactive Code Examples</h3>
                  <p style={{color: 'var(--ifm-font-color-base)'}}>Learn with hands-on Python code examples that you can run and modify directly in your browser.</p>
                </div>
              </div>
              <div className="col col--6" style={{padding: '1rem'}}>
                <div style={{padding: '1.5rem', background: 'var(--ifm-card-background-color)', borderRadius: '8px', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--ifm-color-emphasis-300)'}}>
                  <h3 style={{color: 'var(--ifm-heading-color)'}}>🔢 Mathematical Derivations</h3>
                  <p style={{color: 'var(--ifm-font-color-base)'}}>Clear mathematical explanations with beautiful LaTeX rendering for complex equations and proofs.</p>
                </div>
              </div>
              <div className="col col--6" style={{padding: '1rem'}}>
                <div style={{padding: '1.5rem', background: 'var(--ifm-card-background-color)', borderRadius: '8px', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--ifm-color-emphasis-300)'}}>
                  <h3 style={{color: 'var(--ifm-heading-color)'}}>📊 Visual Diagrams</h3>
                  <p style={{color: 'var(--ifm-font-color-base)'}}>Understand concepts faster with detailed diagrams, flowcharts, and visual representations.</p>
                </div>
              </div>
              <div className="col col--6" style={{padding: '1rem'}}>
                <div style={{padding: '1.5rem', background: 'var(--ifm-card-background-color)', borderRadius: '8px', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--ifm-color-emphasis-300)'}}>
                  <h3 style={{color: 'var(--ifm-heading-color)'}}>🤖 RAG-Powered Chatbot</h3>
                  <p style={{color: 'var(--ifm-font-color-base)'}}>Get instant answers to your questions with our intelligent chatbot that understands the textbook content.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
