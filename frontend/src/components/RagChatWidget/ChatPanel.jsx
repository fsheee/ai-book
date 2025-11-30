/**
 * ChatPanel Component
 *
 * Collapsible chat panel with message list, input, loading indicators,
 * and error handling. Main UI container for the chat interface.
 */

import React, { useRef, useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

/**
 * ChatPanel Component
 *
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {Function} props.onSend - Callback when user sends message
 * @param {boolean} [props.isOpen] - Whether panel is open
 * @param {Function} [props.onClose] - Callback to close panel
 * @param {boolean} [props.isLoading] - Show loading indicator
 * @param {string} [props.loadingMessage] - Custom loading message
 * @param {Object} [props.error] - Error object if any
 * @param {Function} [props.onClearError] - Callback to clear error
 * @param {Function} [props.onNewConversation] - Callback to start new conversation
 * @param {Function} [props.onSourceClick] - Callback when source citation clicked
 * @param {boolean} [props.showHeader] - Show panel header (default: true)
 * @param {string} [props.title] - Panel title (default: "AI Assistant")
 * @param {boolean} [props.showExpandButton] - Show expand to full page button (default: true)
 * @param {Function} [props.onExpand] - Callback when expand button clicked
 * @param {string} [props.mode] - Display mode: 'floating' or 'fullpage' (default: 'floating')
 * @param {string} [props.selectedText] - User-selected text for context display
 * @param {Function} [props.onClearSelection] - Callback to clear selected text
 */
export function ChatPanel({
  messages = [],
  onSend,
  isOpen = true,
  onClose,
  isLoading = false,
  loadingMessage = 'Thinking...',
  error = null,
  onClearError,
  onNewConversation,
  onSourceClick,
  showHeader = true,
  title = 'AI Assistant',
  showExpandButton = true,
  onExpand,
  mode = 'floating',
  selectedText = null,
  onClearSelection,
}) {
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  /**
   * Detect if user has scrolled up (disable auto-scroll)
   */
  const handleScroll = () => {
    if (!messageListRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setAutoScroll(isAtBottom);
  };

  /**
   * Handle send message
   */
  const handleSend = (message) => {
    if (onSend) {
      onSend(message);
    }

    // Re-enable auto-scroll when sending new message
    setAutoScroll(true);
  };

  /**
   * Check if chat is empty
   */
  const isEmpty = messages.length === 0;

  /**
   * Check if currently streaming
   */
  const isStreaming = messages.some((msg) => msg.isStreaming === true);

  return (
    <div className={`chat-panel chat-panel--${mode} ${isOpen ? 'chat-panel--open' : 'chat-panel--closed'}`}>
      {/* Header */}
      {showHeader && (
        <div className="chat-panel__header">
          <div className="chat-panel__title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.18L17 8v5c0 3.77-2.13 7.28-5 8.08-2.87-.8-5-4.31-5-8.08V8l5-2.82z" />
              <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
            </svg>
            <h3>{title}</h3>
          </div>

          <div className="chat-panel__header-actions">
            {/* Expand to full page button (only in floating mode) */}
            {mode === 'floating' && showExpandButton && onExpand && (
              <button
                className="chat-panel__icon-button"
                onClick={onExpand}
                title="Expand to full page"
                aria-label="Expand to full page"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3h6v2H5v4H3V3zm14 0v6h-2V5h-4V3h6zM9 15H5v-4H3v6h6v-2zm8 0h-4v2h6v-6h-2v4z" />
                </svg>
              </button>
            )}

            {/* New conversation button */}
            {!isEmpty && onNewConversation && (
              <button
                className="chat-panel__icon-button"
                onClick={onNewConversation}
                title="Start new conversation"
                aria-label="Start new conversation"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6V4h8v12z" />
                  <path d="M12 12H8v-2h4v2zm0-3H8V7h4v2z" />
                </svg>
              </button>
            )}

            {/* Minimize/Close button */}
            {onClose && (
              <button
                className="chat-panel__icon-button"
                onClick={onClose}
                title={mode === 'fullpage' ? 'Back to textbook' : 'Minimize chat'}
                aria-label={mode === 'fullpage' ? 'Back to textbook' : 'Minimize chat'}
              >
                {mode === 'fullpage' ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 10l-6-6v4H3v4h6v4l6-6z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Text Context Banner */}
      {selectedText && (
        <div className="chat-panel__context-banner">
          <div className="chat-panel__context-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h8v1H2v-1z" />
            </svg>
            <span className="chat-panel__context-label">Context: Selected Text</span>
            {onClearSelection && (
              <button
                className="chat-panel__context-close"
                onClick={onClearSelection}
                title="Clear selection"
                aria-label="Clear selected text"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M10 4L4 10M4 4l6 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
            )}
          </div>
          <div className="chat-panel__context-text">
            {selectedText.length > 200 ? `${selectedText.substring(0, 200)}...` : selectedText}
          </div>
          <div className="chat-panel__context-info">
            {selectedText.split(/\s+/).filter(Boolean).length} words · {selectedText.length} characters
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        className="chat-panel__messages"
        ref={messageListRef}
        onScroll={handleScroll}
      >
        {isEmpty && !isLoading && !error ? (
          // Empty state
          <div className="chat-panel__empty-state">
            <div className="chat-panel__empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" opacity="0.3">
                <path d="M32 8L12 20v16c0 12.4 8.64 24 18 27.2 9.36-3.2 18-14.8 18-27.2V20L32 8zm0 6.36L44 22v14c0 9.24-5.28 17.28-12 20.16-6.72-2.88-12-10.92-12-20.16V22l12-7.64z" />
                <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <h4 className="chat-panel__empty-title">Ask me anything!</h4>
            <p className="chat-panel__empty-description">
              I can answer questions about the textbook content. Try asking about concepts,
              examples, or explanations from any chapter.
            </p>
            <div className="chat-panel__suggestions">
              <button
                className="chat-panel__suggestion"
                onClick={() => handleSend('Explain inverse kinematics')}
              >
                Explain inverse kinematics
              </button>
              <button
                className="chat-panel__suggestion"
                onClick={() => handleSend('What is sensor fusion?')}
              >
                What is sensor fusion?
              </button>
              <button
                className="chat-panel__suggestion"
                onClick={() => handleSend('How do humanoid robots balance?')}
              >
                How do humanoid robots balance?
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Message list */}
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || index}
                message={message}
                onSourceClick={onSourceClick}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="chat-panel__loading">
                <div className="chat-panel__loading-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
                    <path
                      d="M12 2 A10 10 0 0 1 22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                </div>
                <span className="chat-panel__loading-text">{loadingMessage}</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="chat-panel__error">
                <div className="chat-panel__error-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" />
                  </svg>
                </div>
                <div className="chat-panel__error-content">
                  <div className="chat-panel__error-message">
                    {error.message || 'An error occurred'}
                  </div>
                  {error.retryAfter && (
                    <div className="chat-panel__error-retry">
                      Please wait {error.retryAfter} seconds before trying again.
                    </div>
                  )}
                  {onClearError && (
                    <button
                      className="chat-panel__error-dismiss"
                      onClick={onClearError}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button (show when not at bottom) */}
      {!autoScroll && !isEmpty && (
        <button
          className="chat-panel__scroll-button"
          onClick={() => {
            setAutoScroll(true);
            scrollToBottom('smooth');
          }}
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 14l-6-6h12l-6 6z" />
          </svg>
        </button>
      )}

      {/* Input area */}
      <div className="chat-panel__input-area">
        <ChatInput
          onSend={handleSend}
          disabled={isLoading || isStreaming || !!error}
          placeholder={
            error
              ? 'Please resolve the error above before continuing...'
              : isLoading || isStreaming
              ? 'Processing...'
              : 'Ask a question about the textbook...'
          }
          autoFocus={isOpen && !isEmpty}
        />
      </div>

      {/* Footer with disclaimer */}
      <div className="chat-panel__footer">
        <p className="chat-panel__disclaimer">
          AI-generated answers may contain errors. Always verify important information.
        </p>
      </div>
    </div>
  );
}

export default ChatPanel;
