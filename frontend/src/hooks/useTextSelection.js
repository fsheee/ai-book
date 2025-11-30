/**
 * useTextSelection Hook
 *
 * React hook for detecting and managing text selection on the page.
 * Returns selected text, selection position, and utility functions.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Check if selection is valid (non-empty, within content area)
 */
function isValidSelection(selection) {
  if (!selection || selection.isCollapsed || !selection.rangeCount) {
    return false;
  }

  const text = selection.toString().trim();
  if (text.length === 0) {
    return false;
  }

  // Check if selection is within main content (not in chat widget or header)
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.ELEMENT_NODE
    ? container
    : container.parentElement;

  // Exclude selections in chat widget, navbar, footer
  const excludeSelectors = [
    '.chat-panel',
    '.floating-button',
    '.navbar',
    '.footer',
    '[data-no-select]',
  ];

  for (const selector of excludeSelectors) {
    if (element.closest(selector)) {
      return false;
    }
  }

  return true;
}

/**
 * Get position of selection for context menu placement
 */
function getSelectionPosition(selection) {
  if (!selection || !selection.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    top: rect.top + window.scrollY,
    bottom: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * useTextSelection Hook
 *
 * @param {Object} options - Configuration options
 * @param {number} [options.minLength=50] - Minimum text length to trigger selection
 * @param {number} [options.maxLength=8000] - Maximum text length allowed
 * @param {number} [options.debounceMs=200] - Debounce delay for selection changes
 * @returns {Object} Selection state and utilities
 */
export function useTextSelection(options = {}) {
  const {
    minLength = 50,
    maxLength = 8000,
    debounceMs = 200,
  } = options;

  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [isTextSelected, setIsTextSelected] = useState(false);

  /**
   * Handle text selection change
   */
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();

    if (!isValidSelection(selection)) {
      setSelectedText('');
      setSelectionPosition(null);
      setIsTextSelected(false);
      return;
    }

    const text = selection.toString().trim();

    // Validate text length
    if (text.length < minLength || text.length > maxLength) {
      setSelectedText('');
      setSelectionPosition(null);
      setIsTextSelected(false);
      return;
    }

    // Update state
    setSelectedText(text);
    setSelectionPosition(getSelectionPosition(selection));
    setIsTextSelected(true);
  }, [minLength, maxLength]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    setSelectedText('');
    setSelectionPosition(null);
    setIsTextSelected(false);
  }, []);

  /**
   * Set up selection listeners
   */
  useEffect(() => {
    let timeoutId = null;

    const debouncedHandler = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleSelectionChange, debounceMs);
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', debouncedHandler);

    // Listen for mouse up (for better UX on selection completion)
    document.addEventListener('mouseup', debouncedHandler);

    // Listen for key up (for keyboard selection)
    document.addEventListener('keyup', debouncedHandler);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('selectionchange', debouncedHandler);
      document.removeEventListener('mouseup', debouncedHandler);
      document.removeEventListener('keyup', debouncedHandler);
    };
  }, [handleSelectionChange, debounceMs]);

  /**
   * Clear selection when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't clear if clicking on context menu or chat widget
      if (event.target.closest('.text-selection-menu') ||
          event.target.closest('.chat-panel')) {
        return;
      }

      // Check if there's still a valid selection
      const selection = window.getSelection();
      if (!isValidSelection(selection)) {
        clearSelection();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSelection]);

  return {
    selectedText,
    selectionPosition,
    isTextSelected,
    clearSelection,
    isValid: isTextSelected && selectedText.length >= minLength && selectedText.length <= maxLength,
  };
}

export default useTextSelection;
