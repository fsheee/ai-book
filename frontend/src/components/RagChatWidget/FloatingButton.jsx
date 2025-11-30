/**
 * FloatingButton Component
 *
 * Floating action button positioned in bottom-right corner.
 * Toggles chat panel visibility and shows unread indicator.
 */

import React from 'react';

/**
 * FloatingButton Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether chat panel is currently open
 * @param {Function} props.onClick - Callback when button is clicked
 * @param {number} [props.unreadCount] - Number of unread messages (shows badge)
 * @param {boolean} [props.isActive] - Show active/pulse animation
 * @param {string} [props.position] - Position: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
 */
export function FloatingButton({
  isOpen,
  onClick,
  unreadCount = 0,
  isActive = false,
  position = 'bottom-right',
}) {
  const showBadge = unreadCount > 0;
  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <button
      className={`floating-button floating-button--${position} ${
        isOpen ? 'floating-button--open' : ''
      } ${isActive ? 'floating-button--active' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title={isOpen ? 'Close chat' : 'Open chat'}
    >
      {/* Main icon */}
      <div className="floating-button__icon">
        {isOpen ? (
          // Close icon (X)
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Chat/message icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            <circle cx="12" cy="11" r="1.5" fill="currentColor" />
            <circle cx="8" cy="11" r="1.5" fill="currentColor" />
            <circle cx="16" cy="11" r="1.5" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* Unread badge */}
      {showBadge && !isOpen && (
        <div className="floating-button__badge">
          <span className="floating-button__badge-count">{displayCount}</span>
        </div>
      )}

      {/* Active pulse effect */}
      {isActive && !isOpen && (
        <div className="floating-button__pulse" />
      )}

      {/* Tooltip */}
      <div className="floating-button__tooltip">
        {isOpen ? 'Close AI Assistant' : 'Ask AI Assistant'}
      </div>
    </button>
  );
}

export default FloatingButton;
