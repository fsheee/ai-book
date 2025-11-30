/**
 * Chat History Management Hook
 *
 * Provides state management and operations for chat history,
 * integrating LocalStorage for persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserId,
  getChatId,
  createNewChatSession,
  saveMessage,
  loadCurrentChatHistory,
  clearCurrentChat,
  clearChatHistory,
  getChatSessions,
  switchChatSession,
} from '../utils/storage';

/**
 * Custom hook for managing chat history
 *
 * @returns {Object} Chat history state and methods
 */
export function useChatHistory() {
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user ID and load history on mount
  useEffect(() => {
    const initializeChat = () => {
      try {
        const uid = getUserId();
        const cid = getChatId();
        setUserId(uid);
        setCurrentChatId(cid);

        // Load history for current chat
        const history = loadCurrentChatHistory();
        setMessages(history);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  /**
   * Add a new message to the chat history
   *
   * @param {Object} message - Message object
   * @param {string} message.role - "user" or "assistant"
   * @param {string} message.content - Message text
   * @param {Array} [message.sources] - Source citations (for assistant)
   * @param {string} [message.query_type] - "rag" or "selection"
   */
  const addMessage = useCallback(
    (message) => {
      const messageWithMeta = saveMessage({
        ...message,
        chat_id: currentChatId,
      });

      setMessages((prev) => [...prev, messageWithMeta]);
      return messageWithMeta;
    },
    [currentChatId]
  );

  /**
   * Update an existing message (useful for streaming)
   *
   * @param {string} messageId - Message ID to update
   * @param {Object} updates - Fields to update
   */
  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  /**
   * Add streaming message placeholder and return update function
   *
   * @param {string} role - Message role ("user" or "assistant")
   * @returns {Object} { messageId, updateContent }
   */
  const addStreamingMessage = useCallback(
    (role = 'assistant') => {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const placeholderMessage = {
        id: messageId,
        role,
        content: '',
        timestamp,
        chat_id: currentChatId,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, placeholderMessage]);

      // Return update function for streaming content
      const updateContent = (newContent) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: newContent }
              : msg
          )
        );
      };

      const finalizeMessage = (finalData = {}) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, ...finalData, isStreaming: false }
              : msg
          )
        );

        // Save finalized message to LocalStorage
        const finalMessage = messages.find((m) => m.id === messageId);
        if (finalMessage) {
          saveMessage({ ...finalMessage, ...finalData, isStreaming: false });
        }
      };

      return {
        messageId,
        updateContent,
        finalizeMessage,
      };
    },
    [currentChatId, messages]
  );

  /**
   * Clear all messages in current chat session
   */
  const clearMessages = useCallback(() => {
    clearCurrentChat();
    setMessages([]);

    // Create new chat session
    const newChatId = createNewChatSession();
    setCurrentChatId(newChatId);
  }, []);

  /**
   * Clear all chat history (all sessions)
   */
  const clearAllHistory = useCallback(() => {
    clearChatHistory();
    setMessages([]);

    // Create new chat session
    const newChatId = createNewChatSession();
    setCurrentChatId(newChatId);
  }, []);

  /**
   * Start a new chat conversation
   */
  const startNewConversation = useCallback(() => {
    const newChatId = createNewChatSession();
    setCurrentChatId(newChatId);
    setMessages([]);
  }, []);

  /**
   * Load a specific chat session
   *
   * @param {string} chatId - Chat session ID to load
   */
  const loadChatSession = useCallback((chatId) => {
    switchChatSession(chatId);
    setCurrentChatId(chatId);

    const history = loadCurrentChatHistory();
    setMessages(history);
  }, []);

  /**
   * Get all available chat sessions
   *
   * @returns {Array} Array of chat session metadata
   */
  const getAllSessions = useCallback(() => {
    return getChatSessions();
  }, []);

  /**
   * Get message count for current session
   *
   * @returns {number} Number of messages
   */
  const getMessageCount = useCallback(() => {
    return messages.length;
  }, [messages]);

  /**
   * Get last user message
   *
   * @returns {Object|null} Last user message or null
   */
  const getLastUserMessage = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  /**
   * Get last assistant message
   *
   * @returns {Object|null} Last assistant message or null
   */
  const getLastAssistantMessage = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  /**
   * Check if chat is empty
   *
   * @returns {boolean} True if no messages
   */
  const isEmpty = useCallback(() => {
    return messages.length === 0;
  }, [messages]);

  /**
   * Check if currently streaming a message
   *
   * @returns {boolean} True if any message is streaming
   */
  const isStreaming = useCallback(() => {
    return messages.some((msg) => msg.isStreaming === true);
  }, [messages]);

  return {
    // State
    messages,
    currentChatId,
    userId,
    isLoading,

    // Message operations
    addMessage,
    updateMessage,
    addStreamingMessage,

    // History operations
    clearMessages,
    clearAllHistory,
    startNewConversation,
    loadChatSession,
    getAllSessions,

    // Utility methods
    getMessageCount,
    getLastUserMessage,
    getLastAssistantMessage,
    isEmpty,
    isStreaming,
  };
}

export default useChatHistory;
