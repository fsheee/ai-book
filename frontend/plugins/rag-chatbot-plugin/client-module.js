/**
 * Docusaurus Client Module for RAG Chatbot
 *
 * Injects the RagChatWidget component into the DOM on client-side.
 * Handles text selection detection for context-specific queries.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

let RagChatWidget;

if (ExecutionEnvironment.canUseDOM) {
  // Dynamic import to avoid SSR issues
  RagChatWidget = require('@site/src/components/RagChatWidget').default;
}

export function onRouteDidUpdate({ location, previousLocation }) {
  if (!ExecutionEnvironment.canUseDOM) {
    return;
  }

  // Initialize chatbot on route change
  initializeChatbot();
}

function initializeChatbot() {
  if (!RagChatWidget) {
    return;
  }

  const rootElement = document.getElementById('rag-chatbot-root');
  if (!rootElement) {
    console.error('RAG chatbot root element not found');
    return;
  }

  // Get configuration from data attributes
  const position = rootElement.dataset.position || 'bottom-right';
  const startOpen = rootElement.dataset.startOpen === 'true';
  const enableTextSelection = rootElement.dataset.enableTextSelection !== 'false';

  // State for selected text
  let selectedText = null;

  // Handle text selection
  if (enableTextSelection) {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('selectionchange', handleSelectionChange);
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 50) {
      selectedText = text;
      renderChatbot();
    }
  }

  function handleSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      selectedText = null;
    }
  }

  function handleSelectionQueryComplete() {
    // Clear selection after query completes
    selectedText = null;
    window.getSelection().removeAllRanges();
    renderChatbot();
  }

  function renderChatbot() {
    ReactDOM.render(
      <RagChatWidget
        position={position}
        startOpen={startOpen}
        selectedText={selectedText}
        onSelectionQueryComplete={handleSelectionQueryComplete}
      />,
      rootElement
    );
  }

  // Initial render
  renderChatbot();
}

// Initialize on load
if (ExecutionEnvironment.canUseDOM) {
  if (document.readyState === 'complete') {
    initializeChatbot();
  } else {
    window.addEventListener('load', initializeChatbot);
  }
}
