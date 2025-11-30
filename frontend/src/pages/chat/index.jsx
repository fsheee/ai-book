/**
 * Full-Page Chat Mode
 *
 * Dedicated page for full-screen chat experience at /chat route.
 * Uses the same ChatPanel component but in full-page layout.
 */

import React from 'react';
import Layout from '@theme/Layout';
import { RagChatWidget } from '../../components/RagChatWidget';
import '../../css/custom.css';
import '../../../static/css/chatbot.css';

export default function ChatPage() {
  return (
    <Layout
      title="AI Assistant"
      description="Interactive AI assistant for Physical AI & Humanoid Robotics textbook"
      noFooter={true}
    >
      <div className="chat-page-container">
        <RagChatWidget
          startOpen={true}
          position="fullpage"
          onSourceClick={(source) => {
            // Navigate to source chapter/section
            if (source.file_path) {
              const relativePath = source.file_path
                .replace(/^docs\//, '/')
                .replace(/\.mdx?$/, '');
              window.location.href = relativePath;
            }
          }}
        />
      </div>
    </Layout>
  );
}
