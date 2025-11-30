/**
 * TypeScript API Client for RAG Chatbot Backend
 *
 * This file provides type-safe interfaces and a client class for interacting
 * with the FastAPI backend from the Docusaurus frontend.
 *
 * Usage:
 * ```typescript
 * import { RagChatbotAPI } from '@site/src/utils/api';
 *
 * const api = new RagChatbotAPI(
 *   process.env.REACT_APP_API_URL,
 *   process.env.REACT_APP_API_KEY
 * );
 *
 * const response = await api.query({
 *   question: "Explain inverse kinematics",
 *   user_id: getUserId()
 * });
 * ```
 */

// ============================================================================
// Request Types
// ============================================================================

export interface RagQueryRequest {
  /** User's question about the textbook content (max 1000 characters) */
  question: string;
  /** Anonymous user identifier (UUID, generated client-side) */
  user_id: string;
}

export interface SelectionQueryRequest {
  /** User's question about the selected text (max 1000 characters) */
  question: string;
  /** User-selected text from the textbook (50-8000 characters) */
  selected_text: string;
  /** Anonymous user identifier (UUID, generated client-side) */
  user_id: string;
}

export interface IngestRequest {
  /** Path to Docusaurus content directory containing MDX files */
  content_dir: string;
  /** If true, re-ingest all files; if false, only ingest new/modified files */
  force_reingest?: boolean;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ChatSource {
  /** Chapter title (e.g., "Chapter 5: Inverse Kinematics") */
  chapter: string;
  /** Section title (e.g., "5.2 Jacobian Methods") */
  section: string;
  /** Relative path to source MDX file (e.g., "docs/05-kinematics/inverse.mdx") */
  file_path: string;
  /** Cosine similarity score (0.0-1.0, higher = more relevant) */
  relevance_score: number;
  /** Optional text snippet from the source chunk */
  text_snippet?: string;
}

export interface ChatResponse {
  /** Generated answer from the chatbot */
  answer: string;
  /** Source citations (empty array for selection-based queries) */
  sources: ChatSource[];
  /** Unique identifier for this chat interaction */
  chat_id: string;
  /** Total response time in milliseconds */
  latency_ms: number;
  /** OpenAI model used (e.g., "gpt-4-turbo-preview") */
  model_used?: string;
  /** Total tokens consumed (input + output) */
  tokens_used?: number;
}

export interface IngestResponse {
  /** Overall ingestion status */
  status: 'success' | 'partial' | 'failed';
  /** Total number of chunks created and uploaded to Qdrant */
  chunks_created: number;
  /** Number of MDX files successfully processed */
  files_processed: number;
  /** Number of files skipped (unchanged content) */
  files_skipped?: number;
  /** List of errors encountered during ingestion */
  errors?: Array<{
    file_path: string;
    error_message: string;
  }>;
}

export interface HealthResponse {
  /** Service health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Health of individual services */
  services: {
    postgres: boolean;
    qdrant: boolean;
    openai: boolean;
  };
  /** ISO 8601 timestamp of health check */
  timestamp: string;
  /** API version */
  version?: string;
}

export interface ErrorResponse {
  /** Error code or type */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Seconds until retry allowed (for rate limit errors) */
  retry_after?: number;
  /** Additional error context */
  details?: Record<string, unknown>;
}

// ============================================================================
// API Client Class
// ============================================================================

export interface RagChatbotAPIConfig {
  /** Base URL of the backend API (e.g., "https://api.example.com") */
  baseURL: string;
  /** API key for authentication */
  apiKey: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export class RagChatbotAPI {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: RagChatbotAPIConfig | string, apiKey?: string) {
    if (typeof config === 'string') {
      // Legacy constructor: new RagChatbotAPI(baseURL, apiKey)
      this.baseURL = config;
      this.apiKey = apiKey || '';
      this.timeout = 30000;
    } else {
      // New constructor: new RagChatbotAPI({ baseURL, apiKey, timeout })
      this.baseURL = config.baseURL;
      this.apiKey = config.apiKey;
      this.timeout = config.timeout || 30000;
    }

    // Remove trailing slash from baseURL
    this.baseURL = this.baseURL.replace(/\/$/, '');
  }

  /**
   * Full-book RAG query
   *
   * Answer a question using Retrieval-Augmented Generation from the entire textbook.
   *
   * @param request - Query request with question and user_id
   * @returns Promise resolving to chat response with answer and sources
   * @throws Error if request fails or rate limit exceeded
   *
   * @example
   * ```typescript
   * const response = await api.query({
   *   question: "What is inverse kinematics?",
   *   user_id: getUserId()
   * });
   * console.log(response.answer);
   * console.log(response.sources); // Array of source citations
   * ```
   */
  async query(request: RagQueryRequest): Promise<ChatResponse> {
    return this.fetchJSON<ChatResponse>('/rag/query', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Selection-based query
   *
   * Answer a question using only user-selected text as context (no vector search).
   *
   * @param request - Query request with question, selected_text, and user_id
   * @returns Promise resolving to chat response (sources array will be empty)
   * @throws Error if selected_text is too short (<50 chars) or too long (>8000 chars)
   *
   * @example
   * ```typescript
   * const selectedText = window.getSelection()?.toString() || '';
   * const response = await api.queryFromSelection({
   *   question: "What sensors are mentioned here?",
   *   selected_text: selectedText,
   *   user_id: getUserId()
   * });
   * ```
   */
  async queryFromSelection(request: SelectionQueryRequest): Promise<ChatResponse> {
    return this.fetchJSON<ChatResponse>('/rag/from-selection', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Ingest textbook content
   *
   * Admin endpoint to ingest and embed MDX files from Docusaurus content directory.
   * This operation may take several minutes for large textbooks.
   *
   * @param request - Ingestion request with content_dir path
   * @returns Promise resolving to ingestion response with status and metrics
   * @throws Error if content_dir doesn't exist or ingestion fails
   *
   * @example
   * ```typescript
   * const response = await api.embedBook({
   *   content_dir: '/app/docs',
   *   force_reingest: false
   * });
   * console.log(`Processed ${response.files_processed} files, created ${response.chunks_created} chunks`);
   * ```
   */
  async embedBook(request: IngestRequest): Promise<IngestResponse> {
    return this.fetchJSON<IngestResponse>('/embed-book', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Health check
   *
   * Check the health status of the API and its dependencies (Postgres, Qdrant, OpenAI).
   *
   * @returns Promise resolving to health response
   *
   * @example
   * ```typescript
   * const health = await api.health();
   * if (health.status === 'healthy') {
   *   console.log('All services operational');
   * } else {
   *   console.warn('Some services degraded:', health.services);
   * }
   * ```
   */
  async health(): Promise<HealthResponse> {
    return this.fetchJSON<HealthResponse>('/health', {
      method: 'GET',
    });
  }

  /**
   * Stream full-book RAG query with Server-Sent Events
   *
   * Same as `query()` but returns a ReadableStream for token-by-token streaming.
   *
   * @param request - Query request with question and user_id
   * @param onToken - Callback invoked for each token received
   * @param onComplete - Callback invoked when response is complete
   * @param onError - Callback invoked on error
   *
   * @example
   * ```typescript
   * api.streamQuery(
   *   { question: "Explain IK", user_id: getUserId() },
   *   (token) => console.log('Token:', token),
   *   (response) => console.log('Complete:', response),
   *   (error) => console.error('Error:', error)
   * );
   * ```
   */
  streamQuery(
    request: RagQueryRequest,
    onToken: (token: string) => void,
    onComplete: (response: ChatResponse) => void,
    onError: (error: Error) => void
  ): void {
    this.streamSSE('/rag/query', request, onToken, onComplete, onError);
  }

  /**
   * Stream selection-based query with Server-Sent Events
   *
   * Same as `queryFromSelection()` but returns a ReadableStream for token-by-token streaming.
   *
   * @param request - Query request with question, selected_text, and user_id
   * @param onToken - Callback invoked for each token received
   * @param onComplete - Callback invoked when response is complete
   * @param onError - Callback invoked on error
   */
  streamFromSelection(
    request: SelectionQueryRequest,
    onToken: (token: string) => void,
    onComplete: (response: ChatResponse) => void,
    onError: (error: Error) => void
  ): void {
    this.streamSSE('/rag/from-selection', request, onToken, onComplete, onError);
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private async fetchJSON<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('X-API-Key', this.apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'UNKNOWN_ERROR',
          message: response.statusText,
        })) as ErrorResponse;

        throw new RagChatbotAPIError(
          errorData.message || response.statusText,
          response.status,
          errorData
        );
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof RagChatbotAPIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new RagChatbotAPIError('Request timeout', 408);
      }

      throw new RagChatbotAPIError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  private streamSSE(
    endpoint: string,
    request: RagQueryRequest | SelectionQueryRequest,
    onToken: (token: string) => void,
    onComplete: (response: ChatResponse) => void,
    onError: (error: Error) => void
  ): void {
    const url = `${this.baseURL}${endpoint}`;

    // Use EventSource for SSE (note: EventSource doesn't support custom headers,
    // so we pass API key as query parameter for streaming endpoints)
    const eventSource = new EventSource(`${url}?api_key=${this.apiKey}`);

    eventSource.addEventListener('token', (event) => {
      const data = JSON.parse(event.data);
      onToken(data.token);
    });

    eventSource.addEventListener('complete', (event) => {
      const response = JSON.parse(event.data) as ChatResponse;
      onComplete(response);
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      onError(new Error('SSE connection error'));
      eventSource.close();
    });
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class RagChatbotAPIError extends Error {
  public statusCode: number;
  public errorData?: ErrorResponse;

  constructor(message: string, statusCode: number, errorData?: ErrorResponse) {
    super(message);
    this.name = 'RagChatbotAPIError';
    this.statusCode = statusCode;
    this.errorData = errorData;
  }

  get isRateLimitError(): boolean {
    return this.statusCode === 429;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  get retryAfter(): number | undefined {
    return this.errorData?.retry_after;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate or retrieve anonymous user ID from LocalStorage
 *
 * @returns UUID v4 string stored in localStorage
 */
export function getUserId(): string {
  const STORAGE_KEY = 'rag_chatbot_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}

/**
 * Validate question input
 *
 * @param question - User's question
 * @returns true if valid, error message if invalid
 */
export function validateQuestion(question: string): true | string {
  if (!question || question.trim().length === 0) {
    return 'Please enter a question';
  }

  if (question.length > 1000) {
    return 'Question is too long (maximum 1000 characters)';
  }

  return true;
}

/**
 * Validate selected text
 *
 * @param text - Selected text
 * @returns true if valid, error message if invalid
 */
export function validateSelectedText(text: string): true | string {
  if (!text || text.trim().length === 0) {
    return 'No text selected';
  }

  if (text.length < 50) {
    return `Selected text is too short (minimum 50 characters, you selected ${text.length})`;
  }

  if (text.length > 8000) {
    return `Selected text is too long (maximum 8000 characters, you selected ${text.length})`;
  }

  return true;
}

/**
 * Format latency for display
 *
 * @param latencyMs - Latency in milliseconds
 * @returns Formatted string (e.g., "1.2s", "850ms")
 */
export function formatLatency(latencyMs: number): string {
  if (latencyMs < 1000) {
    return `${latencyMs}ms`;
  }
  return `${(latencyMs / 1000).toFixed(1)}s`;
}

/**
 * Format relevance score as percentage
 *
 * @param score - Relevance score (0.0-1.0)
 * @returns Formatted percentage string (e.g., "92%")
 */
export function formatRelevance(score: number): string {
  return `${Math.round(score * 100)}%`;
}
