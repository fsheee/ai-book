/**
 * RagChatWidget - Main Component
 *
 * Orchestrates the entire chat widget functionality:
 * - Floating button and collapsible panel
 * - API calls to backend (RAG and selection queries)
 * - SSE streaming handling
 * - Chat history management via LocalStorage
 * - Error handling and loading states
 */

import React, { useState, useEffect, useCallback } from 'react';
import FloatingButton from './FloatingButton';
import ChatPanel from './ChatPanel';
import { RagChatbotAPI } from '../../utils/api';
import { useChatHistory } from '../../hooks/useChatHistory';
import { loadSettings, saveSettings } from '../../utils/storage';

/**
 * RagChatWidget Component
 *
 * @param {Object} props
 * @param {string} [props.selectedText] - User-selected text for context-specific query
 * @param {Function} [props.onSelectionQueryComplete] - Callback after selection query completes
 * @param {string} [props.position] - Floating button position: 'bottom-right', 'bottom-left', 'fullpage' (default: 'bottom-right')
 * @param {boolean} [props.startOpen] - Start with panel open (default: false)
 * @param {Function} [props.onSourceClick] - Custom handler for source citation clicks
 */
export function RagChatWidget({
  selectedText = null,
  onSelectionQueryComplete = null,
  position = 'bottom-right',
  startOpen = false,
  onSourceClick = null,
}) {
  // Chat history hook
  const chatHistory = useChatHistory();

  // UI state
  const [isOpen, setIsOpen] = useState(startOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  const [error, setError] = useState(null);
  const [currentStreamAbort, setCurrentStreamAbort] = useState(null);

  // API client
  const [apiClient] = useState(() => new RagChatbotAPI());

  // Settings
  const [settings, setSettings] = useState(() => loadSettings());

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
  }, []);

  /**
   * Handle user sending a message
   */
  const handleSendMessage = useCallback(
    async (message) => {
      // Clear any previous error
      setError(null);

      // Determine query type based on selectedText
      const isSelectionQuery = selectedText && selectedText.trim().length > 0;
      const queryType = isSelectionQuery ? 'selection' : 'rag';

      // Add user message to history
      chatHistory.addMessage({
        role: 'user',
        content: message,
        query_type: queryType,
      });

      // Show loading state
      setIsLoading(true);
      setLoadingMessage(
        isSelectionQuery ? 'Analyzing selection...' : 'Searching textbook...'
      );

      try {
        if (settings.streamingEnabled) {
          // Streaming mode
          await handleStreamingQuery(message, isSelectionQuery);
        } else {
          // Non-streaming mode
          await handleNonStreamingQuery(message, isSelectionQuery);
        }
      } catch (err) {
        console.error('Query failed:', err);
        setError({
          message: err.message || 'Failed to get response. Please try again.',
          statusCode: err.statusCode,
          retryAfter: err.retryAfter,
        });
        setIsLoading(false);
      }
    },
    [selectedText, chatHistory, settings, apiClient]
  );

  /**
   * Handle streaming query
   */
  const handleStreamingQuery = useCallback(
    async (message, isSelectionQuery) => {
      // Add streaming message placeholder
      const { messageId, updateContent, finalizeMessage } =
        chatHistory.addStreamingMessage('assistant');

      let accumulatedContent = '';

      const onToken = (token) => {
        accumulatedContent += token;
        updateContent(accumulatedContent);
      };

      const onComplete = (response) => {
        setIsLoading(false);
        setLoadingMessage('Thinking...');
        setCurrentStreamAbort(null);

        finalizeMessage({
          content: response.answer || accumulatedContent,
          sources: response.sources || [],
          query_type: isSelectionQuery ? 'selection' : 'rag',
          latency_ms: response.latency_ms,
          model_used: response.model_used,
          tokens_used: response.tokens_used,
        });

        if (isSelectionQuery && onSelectionQueryComplete) {
          onSelectionQueryComplete(response);
        }
      };

      const onError = (err) => {
        setIsLoading(false);
        setCurrentStreamAbort(null);
        setError({
          message: err.message || 'Streaming failed',
          statusCode: err.statusCode,
        });

        // Remove streaming placeholder on error
        chatHistory.messages = chatHistory.messages.filter(
          (msg) => msg.id !== messageId
        );
      };

      // Start streaming
      const abortFn = isSelectionQuery
        ? apiClient.streamFromSelection(
            {
              question: message,
              selected_text: selectedText,
              user_id: chatHistory.userId,
              chat_id: chatHistory.currentChatId,
            },
            onToken,
            onComplete,
            onError
          )
        : apiClient.streamQuery(
            {
              question: message,
              user_id: chatHistory.userId,
              chat_id: chatHistory.currentChatId,
            },
            onToken,
            onComplete,
            onError
          );

      setCurrentStreamAbort(() => abortFn);
    },
    [
      selectedText,
      chatHistory,
      apiClient,
      onSelectionQueryComplete,
    ]
  );

  /**
   * Handle non-streaming query
   */
  const handleNonStreamingQuery = useCallback(
    async (message, isSelectionQuery) => {
      const response = isSelectionQuery
        ? await apiClient.queryFromSelection({
            question: message,
            selected_text: selectedText,
            user_id: chatHistory.userId,
            chat_id: chatHistory.currentChatId,
          })
        : await apiClient.query({
            question: message,
            user_id: chatHistory.userId,
            chat_id: chatHistory.currentChatId,
          });

      setIsLoading(false);
      setLoadingMessage('Thinking...');

      // Add assistant response to history
      chatHistory.addMessage({
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        query_type: isSelectionQuery ? 'selection' : 'rag',
        latency_ms: response.latency_ms,
        model_used: response.model_used,
        tokens_used: response.tokens_used,
      });

      if (isSelectionQuery && onSelectionQueryComplete) {
        onSelectionQueryComplete(response);
      }
    },
    [selectedText, chatHistory, apiClient, onSelectionQueryComplete]
  );

  /**
   * Toggle chat panel open/closed
   */
  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);

    // Clear error when opening
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  /**
   * Close chat panel
   */
  const closePanel = useCallback(() => {
    setIsOpen(false);

    // Abort streaming if in progress
    if (currentStreamAbort) {
      currentStreamAbort();
      setCurrentStreamAbort(null);
      setIsLoading(false);
    }
  }, [currentStreamAbort]);

  /**
   * Start new conversation
   */
  const handleNewConversation = useCallback(() => {
    // Abort streaming if in progress
    if (currentStreamAbort) {
      currentStreamAbort();
      setCurrentStreamAbort(null);
    }

    // Clear current chat
    chatHistory.startNewConversation();

    // Clear UI state
    setIsLoading(false);
    setError(null);
  }, [chatHistory, currentStreamAbort]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle expand to full page
   */
  const handleExpand = useCallback(() => {
    // Navigate to /chat route for full-page mode
    if (typeof window !== 'undefined') {
      window.location.href = '/chat';
    }
  }, []);

  /**
   * Handle source click - navigate to textbook section
   */
  const handleSourceClick = useCallback(
    (source) => {
      if (onSourceClick) {
        onSourceClick(source);
      } else {
        // Default behavior: navigate to file
        if (source.file_path) {
          const relativePath = source.file_path
            .replace(/^docs\//, '/')
            .replace(/\.mdx?$/, '');
          window.location.href = relativePath;
        }
      }
    },
    [onSourceClick]
  );

  /**
   * Auto-open panel if selectedText is provided
   */
  useEffect(() => {
    if (selectedText && selectedText.trim().length > 0) {
      setIsOpen(true);
    }
  }, [selectedText]);

  /**
   * Check if there are unread messages (for badge)
   */
  const unreadCount = 0; // TODO: Implement unread tracking if needed

  // Determine if we're in fullpage mode
  const isFullPage = position === 'fullpage';

  return (
    <>
      {/* Floating button (only in floating mode) */}
      {!isFullPage && (
        <FloatingButton
          isOpen={isOpen}
          onClick={togglePanel}
          unreadCount={unreadCount}
          isActive={chatHistory.isStreaming()}
          position={position}
        />
      )}

      {/* Chat panel */}
      {(isOpen || isFullPage) && (
        <ChatPanel
          messages={chatHistory.messages}
          onSend={handleSendMessage}
          isOpen={isOpen || isFullPage}
          onClose={isFullPage ? () => { window.location.href = '/'; } : closePanel}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          error={error}
          onClearError={clearError}
          onNewConversation={handleNewConversation}
          onSourceClick={handleSourceClick}
          onExpand={!isFullPage ? handleExpand : null}
          title={selectedText ? 'Ask About Selection' : 'AI Assistant'}
          mode={isFullPage ? 'fullpage' : 'floating'}
          showExpandButton={!isFullPage}
        />
      )}
    </>
  );
}

export default RagChatWidget;
