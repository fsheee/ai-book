/**
 * ChatMessage Component
 *
 * Displays a single chat message with markdown rendering and source citations.
 * Differentiates between user and assistant messages.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * ChatMessage Component
 *
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {string} props.message.role - "user" or "assistant"
 * @param {string} props.message.content - Message text
 * @param {Array} [props.message.sources] - Source citations (for assistant messages)
 * @param {boolean} [props.message.isStreaming] - If message is currently streaming
 * @param {string} [props.message.query_type] - "rag" or "selection"
 * @param {string} [props.message.timestamp] - ISO timestamp
 * @param {Function} [props.onSourceClick] - Callback when source is clicked
 */
export function ChatMessage({ message, onSourceClick }) {
  const { role, content, sources = [], isStreaming = false, query_type, timestamp } = message;

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  /**
   * Handle source citation click
   */
  const handleSourceClick = (source) => {
    if (onSourceClick) {
      onSourceClick(source);
    } else {
      // Default behavior: navigate to file
      if (source.file_path) {
        // Extract path relative to docs root
        // e.g., "docs/05-kinematics/inverse.mdx" -> "/05-kinematics/inverse"
        const relativePath = source.file_path
          .replace(/^docs\//, '/')
          .replace(/\.mdx?$/, '');
        window.location.href = relativePath;
      }
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (isoString) => {
    if (!isoString) return '';

    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  /**
   * Markdown components with syntax highlighting
   */
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`chat-message chat-message--${role}`}>
      <div className="chat-message__avatar">
        {isUser ? (
          <div className="chat-message__avatar-icon chat-message__avatar-icon--user">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 10c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        ) : (
          <div className="chat-message__avatar-icon chat-message__avatar-icon--assistant">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2L3 7v6c0 3.31 2.16 6.41 5 7.43 2.84-1.02 5-4.12 5-7.43V7l-7-5zm0 2.18L12 6v7c0 2.17-1.08 4.11-2 4.92-.92-.81-2-2.75-2-4.92V6l2-1.82z" />
              <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
        )}
      </div>

      <div className="chat-message__content-wrapper">
        <div className="chat-message__header">
          <span className="chat-message__role">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          {query_type === 'selection' && isAssistant && (
            <span className="chat-message__badge chat-message__badge--selection">
              From Selection
            </span>
          )}
          {timestamp && (
            <span className="chat-message__timestamp">
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>

        <div className="chat-message__content">
          {content ? (
            <ReactMarkdown components={markdownComponents}>
              {content}
            </ReactMarkdown>
          ) : isStreaming ? (
            <div className="chat-message__streaming-indicator">
              <span className="chat-message__dot"></span>
              <span className="chat-message__dot"></span>
              <span className="chat-message__dot"></span>
            </div>
          ) : (
            <em className="chat-message__empty">No content</em>
          )}
        </div>

        {/* Source citations (only for assistant RAG messages) */}
        {isAssistant && sources && sources.length > 0 && (
          <div className="chat-message__sources">
            <div className="chat-message__sources-header">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1L1 5v5c0 3.31 2.16 5.43 4.5 6.36.92.37 1.96.64 2.5.64s1.58-.27 2.5-.64C12.84 15.43 15 13.31 15 10V5L8 1z" />
              </svg>
              <span>Sources ({sources.length})</span>
            </div>
            <div className="chat-message__sources-list">
              {sources.map((source, index) => (
                <button
                  key={index}
                  className="chat-message__source"
                  onClick={() => handleSourceClick(source)}
                  title={`Navigate to ${source.chapter} - ${source.section}`}
                >
                  <div className="chat-message__source-title">
                    {source.chapter}
                  </div>
                  {source.section && (
                    <div className="chat-message__source-section">
                      {source.section}
                    </div>
                  )}
                  {source.relevance_score !== undefined && (
                    <div className="chat-message__source-score">
                      {Math.round(source.relevance_score * 100)}% match
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Streaming indicator at the end of message */}
        {isStreaming && content && (
          <span className="chat-message__cursor">▋</span>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
