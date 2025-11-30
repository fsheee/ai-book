/**
 * TextSelectionMenu Component
 *
 * Context menu that appears when user selects text on the page.
 * Provides "Ask from Selection" button to query the chatbot about selected text.
 */

import React, { useEffect, useState, useCallback } from 'react';
import './styles.css';

/**
 * TextSelectionMenu Component
 *
 * @param {Object} props
 * @param {string} props.selectedText - Currently selected text
 * @param {Object} props.position - Position of selection {top, bottom, left, right, width, height}
 * @param {boolean} props.isVisible - Whether menu should be visible
 * @param {Function} props.onAskFromSelection - Callback when "Ask from Selection" is clicked
 * @param {Function} props.onClose - Callback when menu should close
 */
export function TextSelectionMenu({
  selectedText,
  position,
  isVisible,
  onAskFromSelection,
  onClose,
}) {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isAbove, setIsAbove] = useState(false);

  /**
   * Calculate optimal menu position (above or below selection)
   */
  const calculateMenuPosition = useCallback(() => {
    if (!position) return;

    const menuWidth = 200;
    const menuHeight = 80;
    const padding = 10;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Determine if menu should appear above or below selection
    const spaceBelow = viewportHeight - position.bottom;
    const spaceAbove = position.top;
    const shouldPlaceAbove = spaceBelow < menuHeight + padding && spaceAbove > spaceBelow;

    setIsAbove(shouldPlaceAbove);

    // Calculate horizontal position (centered on selection)
    let left = position.left + (position.width / 2) - (menuWidth / 2);

    // Ensure menu stays within viewport
    if (left < padding) {
      left = padding;
    } else if (left + menuWidth > viewportWidth - padding) {
      left = viewportWidth - menuWidth - padding;
    }

    // Calculate vertical position
    const top = shouldPlaceAbove
      ? position.top - menuHeight - padding
      : position.bottom + padding;

    setMenuPosition({ top, left });
  }, [position]);

  /**
   * Update menu position when position changes
   */
  useEffect(() => {
    if (isVisible && position) {
      calculateMenuPosition();
    }
  }, [isVisible, position, calculateMenuPosition]);

  /**
   * Handle "Ask from Selection" button click
   */
  const handleAskClick = useCallback(() => {
    if (onAskFromSelection) {
      onAskFromSelection(selectedText);
    }
  }, [selectedText, onAskFromSelection]);

  /**
   * Handle close button click
   */
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible || !selectedText || !position) {
    return null;
  }

  const charCount = selectedText.length;
  const wordCount = selectedText.split(/\s+/).filter(Boolean).length;

  return (
    <div
      className={`text-selection-menu ${isAbove ? 'text-selection-menu--above' : 'text-selection-menu--below'}`}
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      {/* Selection info */}
      <div className="text-selection-menu__info">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h8v1H2v-1z" />
        </svg>
        <span className="text-selection-menu__stats">
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
        </span>
      </div>

      {/* Ask button */}
      <button
        className="text-selection-menu__button text-selection-menu__button--primary"
        onClick={handleAskClick}
        title="Ask AI assistant about this selection"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12a5 5 0 110-10 5 5 0 010 10zm-.5-7.5v3h1v-3h-1zM8 10.5a.75.75 0 100 1.5.75.75 0 000-1.5z" />
        </svg>
        <span>Ask from Selection</span>
      </button>

      {/* Close button */}
      <button
        className="text-selection-menu__button text-selection-menu__button--secondary"
        onClick={handleClose}
        title="Close"
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {/* Arrow indicator */}
      <div
        className={`text-selection-menu__arrow ${isAbove ? 'text-selection-menu__arrow--bottom' : 'text-selection-menu__arrow--top'}`}
      />
    </div>
  );
}

export default TextSelectionMenu;
