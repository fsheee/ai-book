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
        <div className="container" style={{padding: '2rem 0'}}>
          <div className="row">
            <div className="col col--12">
              <h2>About This Textbook</h2>
              <p>
                This comprehensive textbook covers the fundamentals of Physical AI and Humanoid Robotics,
                from kinematics and dynamics to advanced control and AI integration.
              </p>
              <h3>Features</h3>
              <ul>
                <li>Interactive code examples with Python</li>
                <li>Mathematical derivations with LaTeX rendering</li>
                <li>Visual diagrams and flowcharts</li>
                <li>RAG-powered chatbot for Q&A</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
