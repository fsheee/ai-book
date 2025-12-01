/**
 * RAG Chatbot API Client
 *
 * Provides a JavaScript interface for interacting with the FastAPI backend.
 * Based on frontend-api.ts contract but implemented in plain JavaScript.
 */

import { API_BASE_URL, API_KEY, CHAT_CONFIG } from './constants';

/**
 * Custom error class for API-related errors
 */
export class RagChatbotAPIError extends Error {
  constructor(message, statusCode = null, retryAfter = null, details = null) {
    super(message);
    this.name = 'RagChatbotAPIError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
    this.details = details;
  }
}

/**
 * Main API client class for RAG chatbot backend
 */
export class RagChatbotAPI {
  constructor(baseURL = API_BASE_URL, apiKey = API_KEY, timeout = 30000) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.activeEventSource = null; // Track active EventSource connection
  }

  /**
   * Make authenticated API request with error handling
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const data = await response.json().catch(() => ({}));
        throw new RagChatbotAPIError(
          data.message || 'Too many requests. Please try again later.',
          429,
          retryAfter,
          data.details
        );
      }

      // Handle other errors
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new RagChatbotAPIError(
          data.message || `Request failed with status ${response.status}`,
          response.status,
          null,
          data.details
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new RagChatbotAPIError(
          'Request timeout. Please try again.',
          408
        );
      }

      if (error instanceof RagChatbotAPIError) {
        throw error;
      }

      throw new RagChatbotAPIError(
        `Network error: ${error.message}`,
        null,
        null,
        { originalError: error.toString() }
      );
    }
  }

  /**
   * Validate question input
   */
  _validateQuestion(question) {
    if (!question || typeof question !== 'string') {
      throw new RagChatbotAPIError('Question is required and must be a string');
    }

    const trimmed = question.trim();
    if (trimmed.length === 0) {
      throw new RagChatbotAPIError('Question cannot be empty');
    }

    if (trimmed.length > CHAT_CONFIG.MAX_QUESTION_LENGTH) {
      throw new RagChatbotAPIError(
        `Question exceeds maximum length of ${CHAT_CONFIG.MAX_QUESTION_LENGTH} characters`
      );
    }

    return trimmed;
  }

  /**
   * Validate selected text input
   */
  _validateSelectedText(selectedText) {
    if (!selectedText || typeof selectedText !== 'string') {
      throw new RagChatbotAPIError('Selected text is required and must be a string');
    }

    const trimmed = selectedText.trim();
    if (trimmed.length < CHAT_CONFIG.MIN_SELECTION_LENGTH) {
      throw new RagChatbotAPIError(
        `Selected text must be at least ${CHAT_CONFIG.MIN_SELECTION_LENGTH} characters`
      );
    }

    if (trimmed.length > CHAT_CONFIG.MAX_SELECTION_LENGTH) {
      throw new RagChatbotAPIError(
        `Selected text exceeds maximum length of ${CHAT_CONFIG.MAX_SELECTION_LENGTH} characters`
      );
    }

    return trimmed;
  }

  /**
   * Perform RAG query on entire textbook (non-streaming)
   *
   * @param {Object} params - Query parameters
   * @param {string} params.question - User's question
   * @param {string} params.user_id - Anonymous user identifier (UUID)
   * @param {string} [params.chat_id] - Optional chat session ID
   * @returns {Promise<Object>} ChatResponse with answer, sources, chat_id, latency_ms
   */
  async query({ question, user_id, chat_id = null }) {
    const validatedQuestion = this._validateQuestion(question);

    const response = await this._request('/rag/query', {
      method: 'POST',
      body: JSON.stringify({
        question: validatedQuestion,
        user_id,
        chat_id,
        stream: false,
      }),
    });

    return await response.json();
  }

  /**
   * Perform RAG query with Server-Sent Events streaming
   *
   * @param {Object} params - Query parameters
   * @param {string} params.question - User's question
   * @param {string} params.user_id - Anonymous user identifier (UUID)
   * @param {string} [params.chat_id] - Optional chat session ID
   * @param {Function} onToken - Callback for each streamed token: (token: string) => void
   * @param {Function} [onComplete] - Callback when stream completes: (response: Object) => void
   * @param {Function} [onError] - Callback on error: (error: Error) => void
   * @returns {Function} Abort function to cancel streaming
   */
  streamQuery({ question, user_id, chat_id = null }, onToken, onComplete = null, onError = null) {
    const validatedQuestion = this._validateQuestion(question);

    // Close any existing EventSource connection
    if (this.activeEventSource) {
      console.log('Closing previous EventSource connection');
      this.activeEventSource.close();
      this.activeEventSource = null;
    }

    const url = `${this.baseURL}/rag/query`;
    let eventSource = null;
    let accumulatedAnswer = '';
    let finalResponse = null;

    // Use EventSource for SSE streaming
    const queryParams = new URLSearchParams({
      question: validatedQuestion,
      user_id,
      stream: 'true',
    });

    if (chat_id) {
      queryParams.append('chat_id', chat_id);
    }

    try {
      eventSource = new EventSource(`${url}?${queryParams.toString()}`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      // Track this as the active connection
      this.activeEventSource = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'done') {
            // Final message with complete response
            finalResponse = {
              answer: accumulatedAnswer,
              sources: data.sources || [],
              chat_id: data.metadata?.chat_id || chat_id,
              latency_ms: data.metadata?.latency_ms || 0,
              model_used: data.metadata?.model_used,
              tokens_used: data.metadata?.tokens_used,
            };

            if (onComplete) {
              onComplete(finalResponse);
            }

            eventSource.close();
          } else if (data.type === 'token' && data.content !== null) {
            // Streaming token
            accumulatedAnswer += data.content;
            onToken(data.content);
          } else if (data.type === 'context' && data.retrieved_chunks) {
            // Context chunks received (optional to display)
            console.log('Retrieved context chunks:', data.retrieved_chunks);
          } else if (data.type === 'error') {
            // Error from backend
            if (onError) {
              onError(new RagChatbotAPIError(data.content || 'Backend error'));
            }
            eventSource.close();
            this.activeEventSource = null; // Clear active connection
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
          if (onError) {
            onError(new RagChatbotAPIError('Failed to parse streaming response'));
          }
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        this.activeEventSource = null; // Clear active connection

        if (onError) {
          onError(
            new RagChatbotAPIError(
              'Streaming connection failed. Please try again.'
            )
          );
        }
      };

      // Return abort function
      return () => {
        if (eventSource) {
          eventSource.close();
          this.activeEventSource = null; // Clear active connection
        }
      };
    } catch (error) {
      if (onError) {
        onError(
          new RagChatbotAPIError(
            `Failed to initialize streaming: ${error.message}`
          )
        );
      }
      return () => {}; // No-op abort function
    }
  }

  /**
   * Query using only user-selected text (no vector search)
   *
   * @param {Object} params - Query parameters
   * @param {string} params.question - User's question
   * @param {string} params.selected_text - User-selected text from the textbook
   * @param {string} params.user_id - Anonymous user identifier (UUID)
   * @param {string} [params.chat_id] - Optional chat session ID
   * @returns {Promise<Object>} ChatResponse with answer (sources will be empty)
   */
  async queryFromSelection({ question, selected_text, user_id, chat_id = null }) {
    const validatedQuestion = this._validateQuestion(question);
    const validatedText = this._validateSelectedText(selected_text);

    const response = await this._request('/rag/from-selection', {
      method: 'POST',
      body: JSON.stringify({
        question: validatedQuestion,
        selected_text: validatedText,
        user_id,
        chat_id,
        stream: false,
      }),
    });

    return await response.json();
  }

  /**
   * Query from selection with streaming
   *
   * @param {Object} params - Query parameters
   * @param {string} params.question - User's question
   * @param {string} params.selected_text - User-selected text
   * @param {string} params.user_id - Anonymous user identifier (UUID)
   * @param {string} [params.chat_id] - Optional chat session ID
   * @param {Function} onToken - Callback for each streamed token
   * @param {Function} [onComplete] - Callback when stream completes
   * @param {Function} [onError] - Callback on error
   * @returns {Function} Abort function to cancel streaming
   */
  streamFromSelection(
    { question, selected_text, user_id, chat_id = null },
    onToken,
    onComplete = null,
    onError = null
  ) {
    const validatedQuestion = this._validateQuestion(question);
    const validatedText = this._validateSelectedText(selected_text);

    // Close any existing EventSource connection
    if (this.activeEventSource) {
      console.log('Closing previous EventSource connection (selection)');
      this.activeEventSource.close();
      this.activeEventSource = null;
    }

    const url = `${this.baseURL}/rag/from-selection`;
    let eventSource = null;
    let accumulatedAnswer = '';

    const queryParams = new URLSearchParams({
      question: validatedQuestion,
      selected_text: validatedText,
      user_id,
      stream: 'true',
    });

    if (chat_id) {
      queryParams.append('chat_id', chat_id);
    }

    try {
      eventSource = new EventSource(`${url}?${queryParams.toString()}`);

      // Track this as the active connection
      this.activeEventSource = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'done') {
            const finalResponse = {
              answer: accumulatedAnswer,
              sources: [], // Selection queries have no sources
              chat_id: data.metadata?.chat_id || chat_id,
              latency_ms: data.metadata?.latency_ms || 0,
            };

            if (onComplete) {
              onComplete(finalResponse);
            }

            eventSource.close();
            this.activeEventSource = null; // Clear active connection
          } else if (data.type === 'token' && data.content !== null) {
            accumulatedAnswer += data.content;
            onToken(data.content);
          } else if (data.type === 'error') {
            if (onError) {
              onError(new RagChatbotAPIError(data.content || 'Backend error'));
            }
            eventSource.close();
            this.activeEventSource = null; // Clear active connection
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
          if (onError) {
            onError(new RagChatbotAPIError('Failed to parse streaming response'));
          }
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        this.activeEventSource = null; // Clear active connection

        if (onError) {
          onError(new RagChatbotAPIError('Streaming connection failed'));
        }
      };

      return () => {
        if (eventSource) {
          eventSource.close();
          this.activeEventSource = null; // Clear active connection
        }
      };
    } catch (error) {
      if (onError) {
        onError(new RagChatbotAPIError(`Failed to initialize streaming: ${error.message}`));
      }
      return () => {};
    }
  }

  /**
   * Check backend health status
   *
   * @returns {Promise<Object>} HealthResponse with status and service health
   */
  async health() {
    const response = await this._request('/health', {
      method: 'GET',
    });

    return await response.json();
  }

  /**
   * Retry a failed request with exponential backoff
   *
   * @param {Function} requestFn - Function that returns a Promise
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   * @param {number} initialDelay - Initial delay in ms (default: 1000)
   * @returns {Promise<*>} Result of the request
   */
  async retryWithBackoff(requestFn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx except 429)
        if (
          error instanceof RagChatbotAPIError &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          error.statusCode !== 429
        ) {
          throw error;
        }

        // Wait before retrying
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export const apiClient = new RagChatbotAPI();

export default RagChatbotAPI;
