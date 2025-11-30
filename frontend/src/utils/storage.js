/**
 * LocalStorage utilities for chat history management
 *
 * Implements hybrid storage strategy: LocalStorage for immediate persistence,
 * with Postgres backend sync for long-term retention (30 days).
 */

import { CHAT_CONFIG } from './constants';

const STORAGE_KEYS = {
  USER_ID: 'rag_chatbot_user_id',
  CHAT_HISTORY: 'rag_chatbot_history',
  CURRENT_CHAT_ID: 'rag_chatbot_current_chat_id',
  SETTINGS: 'rag_chatbot_settings',
};

/**
 * Generate a unique user ID (UUID v4)
 */
export function generateUserId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create anonymous user ID
 * Persists across sessions in LocalStorage
 *
 * @returns {string} UUID user identifier
 */
export function getUserId() {
  try {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
      userId = generateUserId();
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }

    return userId;
  } catch (error) {
    console.error('LocalStorage unavailable:', error);
    // Fallback to session-based ID if localStorage unavailable
    if (!window._sessionUserId) {
      window._sessionUserId = generateUserId();
    }
    return window._sessionUserId;
  }
}

/**
 * Get current chat session ID or create new one
 *
 * @returns {string} Chat session ID
 */
export function getChatId() {
  try {
    let chatId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID);

    if (!chatId) {
      chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, chatId);
    }

    return chatId;
  } catch (error) {
    console.error('LocalStorage unavailable:', error);
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create a new chat session
 *
 * @returns {string} New chat session ID
 */
export function createNewChatSession() {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, chatId);
  } catch (error) {
    console.error('Failed to save chat ID:', error);
  }
  return chatId;
}

/**
 * Save message to LocalStorage chat history
 *
 * @param {Object} message - Message object
 * @param {string} message.role - "user" or "assistant"
 * @param {string} message.content - Message text
 * @param {Array} [message.sources] - Source citations (for assistant messages)
 * @param {string} [message.chat_id] - Chat session ID
 * @param {string} [message.query_type] - "rag" or "selection"
 */
export function saveMessage(message) {
  try {
    const history = loadChatHistory();
    const timestamp = new Date().toISOString();

    const messageWithMeta = {
      ...message,
      timestamp,
      chat_id: message.chat_id || getChatId(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    history.push(messageWithMeta);

    // Keep only last N messages to avoid LocalStorage quota
    const trimmedHistory = history.slice(-CHAT_CONFIG.MAX_LOCAL_MESSAGES);

    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(trimmedHistory));

    return messageWithMeta;
  } catch (error) {
    console.error('Failed to save message to LocalStorage:', error);
    return message;
  }
}

/**
 * Load chat history from LocalStorage
 *
 * @param {string} [chatId] - Optional: filter by specific chat session
 * @returns {Array} Array of message objects
 */
export function loadChatHistory(chatId = null) {
  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);

    if (!historyJson) {
      return [];
    }

    const history = JSON.parse(historyJson);

    // Filter by chat_id if provided
    if (chatId) {
      return history.filter((msg) => msg.chat_id === chatId);
    }

    // Remove messages older than retention period
    const retentionMs = CHAT_CONFIG.HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);

    return history.filter((msg) => {
      if (!msg.timestamp) return true; // Keep messages without timestamp
      return new Date(msg.timestamp) > cutoffDate;
    });
  } catch (error) {
    console.error('Failed to load chat history from LocalStorage:', error);
    return [];
  }
}

/**
 * Load messages for current chat session
 *
 * @returns {Array} Array of message objects for current session
 */
export function loadCurrentChatHistory() {
  const currentChatId = getChatId();
  return loadChatHistory(currentChatId);
}

/**
 * Clear entire chat history from LocalStorage
 */
export function clearChatHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT_ID);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

/**
 * Clear only current chat session, keep others
 */
export function clearCurrentChat() {
  try {
    const currentChatId = getChatId();
    const allHistory = loadChatHistory();

    // Remove messages from current chat
    const remainingHistory = allHistory.filter((msg) => msg.chat_id !== currentChatId);

    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(remainingHistory));

    // Create new chat session
    createNewChatSession();
  } catch (error) {
    console.error('Failed to clear current chat:', error);
  }
}

/**
 * Get all unique chat sessions
 *
 * @returns {Array} Array of { chat_id, first_message_time, message_count }
 */
export function getChatSessions() {
  try {
    const history = loadChatHistory();
    const sessions = new Map();

    history.forEach((msg) => {
      const chatId = msg.chat_id || 'unknown';

      if (!sessions.has(chatId)) {
        sessions.set(chatId, {
          chat_id: chatId,
          first_message_time: msg.timestamp,
          last_message_time: msg.timestamp,
          message_count: 0,
          first_question: null,
        });
      }

      const session = sessions.get(chatId);
      session.message_count++;
      session.last_message_time = msg.timestamp;

      // Capture first user question as session title
      if (!session.first_question && msg.role === 'user') {
        session.first_question = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      }
    });

    // Convert Map to array and sort by last message time (most recent first)
    return Array.from(sessions.values()).sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );
  } catch (error) {
    console.error('Failed to get chat sessions:', error);
    return [];
  }
}

/**
 * Switch to a specific chat session
 *
 * @param {string} chatId - Chat session ID to switch to
 */
export function switchChatSession(chatId) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, chatId);
  } catch (error) {
    console.error('Failed to switch chat session:', error);
  }
}

/**
 * Save user settings
 *
 * @param {Object} settings - Settings object
 */
export function saveSettings(settings) {
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Load user settings
 *
 * @returns {Object} Settings object with defaults
 */
export function loadSettings() {
  try {
    const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    const defaults = {
      streamingEnabled: true,
      soundEnabled: false,
      theme: 'auto', // 'light', 'dark', 'auto'
      fontSize: 'medium', // 'small', 'medium', 'large'
    };

    if (!settingsJson) {
      return defaults;
    }

    return { ...defaults, ...JSON.parse(settingsJson) };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      streamingEnabled: true,
      soundEnabled: false,
      theme: 'auto',
      fontSize: 'medium',
    };
  }
}

/**
 * Check if LocalStorage is available
 *
 * @returns {boolean} True if LocalStorage is available
 */
export function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get LocalStorage usage statistics
 *
 * @returns {Object} { used: number, available: number, percentage: number }
 */
export function getStorageStats() {
  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // LocalStorage typically has 5-10MB limit, we'll use 5MB as conservative estimate
    const limit = 5 * 1024 * 1024; // 5MB in bytes
    const usedKB = (totalSize / 1024).toFixed(2);
    const availableKB = ((limit - totalSize) / 1024).toFixed(2);
    const percentage = ((totalSize / limit) * 100).toFixed(1);

    return {
      used: parseFloat(usedKB),
      available: parseFloat(availableKB),
      percentage: parseFloat(percentage),
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

export default {
  getUserId,
  getChatId,
  createNewChatSession,
  saveMessage,
  loadChatHistory,
  loadCurrentChatHistory,
  clearChatHistory,
  clearCurrentChat,
  getChatSessions,
  switchChatSession,
  saveSettings,
  loadSettings,
  isLocalStorageAvailable,
  getStorageStats,
};
