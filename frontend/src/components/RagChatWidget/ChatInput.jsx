/**
 * ChatInput Component
 *
 * Message input field with send button, validation, and keyboard shortcuts.
 * Supports Enter to send and Shift+Enter for newlines.
 */

import React, { useState, useRef, useEffect } from 'react';
import { CHAT_CONFIG } from '../../utils/constants';

/**
 * ChatInput Component
 *
 * @param {Object} props
 * @param {Function} props.onSend - Callback when message is sent: (message: string) => void
 * @param {boolean} [props.disabled] - Disable input (e.g., while processing)
 * @param {string} [props.placeholder] - Input placeholder text
 * @param {string} [props.initialValue] - Initial input value
 * @param {number} [props.maxLength] - Maximum message length
 * @param {boolean} [props.autoFocus] - Auto-focus input on mount
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question about the textbook...',
  initialValue = '',
  maxLength = CHAT_CONFIG.MAX_QUESTION_LENGTH,
  autoFocus = false,
}) {
  const [message, setMessage] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  /**
   * Handle message input change
   */
  const handleChange = (e) => {
    const value = e.target.value;

    // Enforce max length
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  /**
   * Handle send button click
   */
  const handleSend = () => {
    const trimmed = message.trim();

    if (!trimmed) {
      return; // Don't send empty messages
    }

    if (disabled) {
      return; // Don't send if disabled
    }

    // Call onSend callback
    onSend(trimmed);

    // Clear input
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e) => {
    // Enter without Shift: Send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Shift+Enter: Allow newline (default behavior)
  };

  /**
   * Check if send button should be enabled
   */
  const canSend = message.trim().length > 0 && !disabled;

  /**
   * Calculate character count and display warning if near limit
   */
  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isAtLimit = characterCount >= maxLength;

  return (
    <div className={`chat-input ${isFocused ? 'chat-input--focused' : ''}`}>
      <div className="chat-input__wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={maxLength}
          aria-label="Chat message input"
        />

        <button
          className={`chat-input__send-button ${
            canSend ? 'chat-input__send-button--enabled' : ''
          }`}
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="chat-input__send-icon"
          >
            <path d="M2 3l18 9-18 9V3zm2 13.5l11.5-6.5L4 3.5v13z" />
            <path d="M4 10.5h10v-1H4v1z" />
          </svg>
        </button>
      </div>

      {/* Character counter (show only when near or at limit) */}
      {(isNearLimit || isAtLimit) && (
        <div
          className={`chat-input__character-count ${
            isAtLimit ? 'chat-input__character-count--limit' : ''
          }`}
        >
          {characterCount} / {maxLength}
        </div>
      )}

      {/* Keyboard hint */}
      {isFocused && !disabled && (
        <div className="chat-input__hint">
          <span className="chat-input__hint-key">Enter</span> to send,{' '}
          <span className="chat-input__hint-key">Shift+Enter</span> for new line
        </div>
      )}

      {/* Validation message */}
      {disabled && (
        <div className="chat-input__disabled-message">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="7" r="6" stroke="currentColor" fill="none" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" opacity="0.5">
              <animate
                attributeName="r"
                from="1.5"
                to="5"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.5"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <span>Processing your question...</span>
        </div>
      )}
    </div>
  );
}

export default ChatInput;
