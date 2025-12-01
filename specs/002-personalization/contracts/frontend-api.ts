/**
 * Frontend API Client for User Personalization
 *
 * TypeScript interfaces and API client for all backend endpoints.
 * Generated from OpenAPI specification.
 *
 * Usage:
 *   import { apiClient } from './api';
 *   const user = await apiClient.auth.login({ email, password });
 */

// ==================== TYPE DEFINITIONS ====================

// ===== Authentication Types =====
export interface RegisterRequest {
  email: string;
  password: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  reset_token: string;
  new_password: string;
}

// ===== User Types =====
export interface User {
  user_id: string;
  email: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserProfile {
  user_id: string;
  email: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserProfileUpdate {
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  email?: string;
}

export interface UserPreferences {
  preference_id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  layout_mode: 'normal' | 'compact' | 'comfortable';
  show_progress_bar: boolean;
  show_recommendations: boolean;
  auto_save_progress: boolean;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  theme?: 'light' | 'dark' | 'auto';
  font_size?: 'small' | 'medium' | 'large' | 'extra_large';
  layout_mode?: 'normal' | 'compact' | 'comfortable';
  show_progress_bar?: boolean;
  show_recommendations?: boolean;
  auto_save_progress?: boolean;
}

export interface AccountDeletionRequest {
  password: string;
  confirmation: 'DELETE';
}

// ===== Progress Types =====
export interface ProgressUpdate {
  chapter_id: string;
  section_id?: string;
  progress_percentage: number; // 0-100
  time_spent_seconds?: number;
  last_position?: string; // JSON string
}

export interface Progress {
  progress_id: string;
  user_id: string;
  chapter_id: string;
  section_id: string | null;
  progress_percentage: number;
  time_spent_seconds: number;
  status: 'unread' | 'in_progress' | 'completed';
  last_read_at: string;
  completed_at: string | null;
}

export interface ProgressStats {
  completed_chapters: number;
  in_progress_chapters: number;
  total_chapters: number;
  total_time_spent_seconds: number;
  completion_percentage: number;
}

// ===== Recommendation Types =====
export interface Recommendation {
  recommendation_id: string;
  chapter_id: string;
  chapter_title: string;
  recommendation_type: 'next_chapter' | 'fill_gap' | 'revisit' | 'popular';
  reasoning: string;
  priority: 1 | 2 | 3; // 1=highest
  score: number; // 0.000-1.000
  created_at: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}

// ===== Bookmark Types =====
export interface BookmarkCreate {
  chapter_id: string;
  section_id: string;
  bookmark_text?: string;
  notes?: string;
}

export interface Bookmark {
  bookmark_id: string;
  user_id: string;
  chapter_id: string;
  section_id: string;
  bookmark_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookmarkUpdate {
  notes?: string;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
}

// ===== Highlight Types =====
export interface HighlightCreate {
  chapter_id: string;
  highlighted_text: string;
  start_offset: number;
  end_offset: number;
  color?: 'yellow' | 'green' | 'pink' | 'blue' | 'purple';
  notes?: string;
}

export interface Highlight {
  highlight_id: string;
  user_id: string;
  chapter_id: string;
  highlighted_text: string;
  start_offset: number;
  end_offset: number;
  color: 'yellow' | 'green' | 'pink' | 'blue' | 'purple';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HighlightUpdate {
  color?: 'yellow' | 'green' | 'pink' | 'blue' | 'purple';
  notes?: string;
}

export interface HighlightsResponse {
  highlights: Highlight[];
}

// ===== Chat Types =====
export interface ChatSession {
  chat_id: string;
  user_id: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
  preview?: string;
}

export interface ChatMessage {
  message_id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  query_type: 'rag' | 'selection' | null;
  sources: any[] | null;
  created_at: string;
}

export interface ChatHistoryResponse {
  chats: ChatSession[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChatSearchResponse {
  results: ChatMessage[];
  total: number;
}

export interface ChatHistoryParams {
  limit?: number;
  offset?: number;
  include_archived?: boolean;
}

export interface ChatSearchParams {
  q: string;
  limit?: number;
}

export interface ChatUpdateRequest {
  is_archived: boolean;
}

export interface ClearAllChatHistoryRequest {
  confirmation: 'DELETE_ALL';
}

// ===== Dashboard Types =====
export interface Dashboard {
  user: UserProfile;
  progress_stats: ProgressStats;
  recent_progress: Progress[];
  recommendations: Recommendation[];
  recent_bookmarks: Bookmark[];
  recent_chats: ChatSession[];
}

// ===== Error Types =====
export interface ApiError {
  error: string;
  message: string;
  status_code: number;
}

export class ApiException extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
    this.name = 'ApiException';
  }
}

// ==================== API CLIENT ====================

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultOptions: RequestInit = {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    // Handle non-JSON responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      throw new ApiException(response.status, data as ApiError);
    }

    return data as T;
  }

  // ===== Authentication Methods =====
  auth = {
    /**
     * Register new user account
     */
    register: async (data: RegisterRequest): Promise<User> => {
      return this.request<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Login user
     */
    login: async (data: LoginRequest): Promise<LoginResponse> => {
      return this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Logout user
     */
    logout: async (): Promise<{ message: string }> => {
      return this.request('/auth/logout', {
        method: 'POST',
      });
    },

    /**
     * Refresh access token
     */
    refresh: async (): Promise<{ message: string }> => {
      return this.request('/auth/refresh', {
        method: 'POST',
      });
    },

    /**
     * Request password reset email
     */
    requestPasswordReset: async (email: string): Promise<{ message: string }> => {
      return this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    /**
     * Confirm password reset with token
     */
    confirmPasswordReset: async (
      data: PasswordResetConfirm
    ): Promise<{ message: string }> => {
      return this.request('/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Get current user info
     */
    me: async (): Promise<User> => {
      return this.request<User>('/auth/me');
    },
  };

  // ===== User Methods =====
  user = {
    /**
     * Get user profile
     */
    getProfile: async (): Promise<UserProfile> => {
      return this.request<UserProfile>('/user/profile');
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: UserProfileUpdate): Promise<UserProfile> => {
      return this.request<UserProfile>('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    /**
     * Get user preferences
     */
    getPreferences: async (): Promise<UserPreferences> => {
      return this.request<UserPreferences>('/user/preferences');
    },

    /**
     * Update user preferences
     */
    updatePreferences: async (
      data: UserPreferencesUpdate
    ): Promise<UserPreferences> => {
      return this.request<UserPreferences>('/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete user account
     */
    deleteAccount: async (
      data: AccountDeletionRequest
    ): Promise<{ message: string }> => {
      return this.request('/user/account', {
        method: 'DELETE',
        body: JSON.stringify(data),
      });
    },
  };

  // ===== Progress Methods =====
  progress = {
    /**
     * Save reading progress
     */
    save: async (data: ProgressUpdate): Promise<{ status: string }> => {
      return this.request('/progress/save', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Get progress for specific chapter
     */
    getChapter: async (chapterId: string): Promise<Progress> => {
      return this.request<Progress>(`/progress/${chapterId}`);
    },

    /**
     * Get all user progress
     */
    getAll: async (): Promise<{ progress: Progress[] }> => {
      return this.request<{ progress: Progress[] }>('/progress/all');
    },

    /**
     * Get overall progress statistics
     */
    getStats: async (): Promise<ProgressStats> => {
      return this.request<ProgressStats>('/progress/stats');
    },
  };

  // ===== Recommendations Methods =====
  recommendations = {
    /**
     * Get personalized recommendations
     */
    get: async (limit: number = 5): Promise<RecommendationsResponse> => {
      return this.request<RecommendationsResponse>(
        `/recommendations?limit=${limit}`
      );
    },

    /**
     * Manually refresh recommendations
     */
    refresh: async (): Promise<RecommendationsResponse> => {
      return this.request<RecommendationsResponse>('/recommendations/refresh', {
        method: 'POST',
      });
    },
  };

  // ===== Bookmarks Methods =====
  bookmarks = {
    /**
     * Get all user bookmarks
     */
    getAll: async (chapterId?: string): Promise<BookmarksResponse> => {
      const url = chapterId
        ? `/bookmarks?chapter_id=${chapterId}`
        : '/bookmarks';
      return this.request<BookmarksResponse>(url);
    },

    /**
     * Create bookmark
     */
    create: async (data: BookmarkCreate): Promise<Bookmark> => {
      return this.request<Bookmark>('/bookmarks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Update bookmark
     */
    update: async (
      bookmarkId: string,
      data: BookmarkUpdate
    ): Promise<Bookmark> => {
      return this.request<Bookmark>(`/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete bookmark
     */
    delete: async (bookmarkId: string): Promise<void> => {
      return this.request(`/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });
    },
  };

  // ===== Highlights Methods =====
  highlights = {
    /**
     * Get all user highlights
     */
    getAll: async (chapterId?: string): Promise<HighlightsResponse> => {
      const url = chapterId
        ? `/highlights?chapter_id=${chapterId}`
        : '/highlights';
      return this.request<HighlightsResponse>(url);
    },

    /**
     * Get highlights for specific chapter
     */
    getChapter: async (chapterId: string): Promise<HighlightsResponse> => {
      return this.request<HighlightsResponse>(`/highlights/${chapterId}`);
    },

    /**
     * Create highlight
     */
    create: async (data: HighlightCreate): Promise<Highlight> => {
      return this.request<Highlight>('/highlights', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Update highlight
     */
    update: async (
      highlightId: string,
      data: HighlightUpdate
    ): Promise<Highlight> => {
      return this.request<Highlight>(`/highlights/${highlightId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete highlight
     */
    delete: async (highlightId: string): Promise<void> => {
      return this.request(`/highlights/${highlightId}`, {
        method: 'DELETE',
      });
    },
  };

  // ===== Chat Methods =====
  chat = {
    /**
     * Get chat history
     */
    getHistory: async (params?: ChatHistoryParams): Promise<ChatHistoryResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.include_archived)
        queryParams.set('include_archived', params.include_archived.toString());

      const url = `/chat/history${queryParams.toString() ? `?${queryParams}` : ''}`;
      return this.request<ChatHistoryResponse>(url);
    },

    /**
     * Search chat history
     */
    search: async (params: ChatSearchParams): Promise<ChatSearchResponse> => {
      const queryParams = new URLSearchParams();
      queryParams.set('q', params.q);
      if (params.limit) queryParams.set('limit', params.limit.toString());

      return this.request<ChatSearchResponse>(`/chat/history/search?${queryParams}`);
    },

    /**
     * Delete chat session
     */
    delete: async (chatId: string): Promise<void> => {
      return this.request(`/chat/history/${chatId}`, {
        method: 'DELETE',
      });
    },

    /**
     * Update chat session (archive/unarchive)
     */
    update: async (
      chatId: string,
      data: ChatUpdateRequest
    ): Promise<void> => {
      return this.request(`/chat/history/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    /**
     * Clear all chat history
     */
    clearAll: async (
      data: ClearAllChatHistoryRequest
    ): Promise<{ message: string }> => {
      return this.request('/chat/history/all', {
        method: 'DELETE',
        body: JSON.stringify(data),
      });
    },
  };

  // ===== Dashboard Methods =====
  dashboard = {
    /**
     * Get personalized dashboard data
     */
    get: async (): Promise<Dashboard> => {
      return this.request<Dashboard>('/dashboard');
    },
  };
}

// ==================== SINGLETON INSTANCE ====================

/**
 * Global API client instance
 *
 * Usage:
 *   import { apiClient } from './api';
 *   const user = await apiClient.auth.login({ email, password });
 */
export const apiClient = new ApiClient();

// ==================== REACT HOOKS (Optional) ====================

/**
 * React hooks for common API operations
 * Requires react-query or SWR for data fetching
 */

// Example with react-query (install: npm install @tanstack/react-query)
/*
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.auth.me(),
    retry: false,
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => apiClient.user.getProfile(),
  });
}

export function useProgressStats() {
  return useQuery({
    queryKey: ['progress', 'stats'],
    queryFn: () => apiClient.progress.getStats(),
  });
}

export function useRecommendations(limit: number = 5) {
  return useQuery({
    queryKey: ['recommendations', limit],
    queryFn: () => apiClient.recommendations.get(limit),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useBookmarks(chapterId?: string) {
  return useQuery({
    queryKey: ['bookmarks', chapterId],
    queryFn: () => apiClient.bookmarks.getAll(chapterId),
  });
}

export function useHighlights(chapterId?: string) {
  return useQuery({
    queryKey: ['highlights', chapterId],
    queryFn: () => apiClient.highlights.getAll(chapterId),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.dashboard.get(),
  });
}

// Mutations
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.auth.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.auth.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useSaveProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProgressUpdate) => apiClient.progress.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookmarkCreate) => apiClient.bookmarks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useCreateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HighlightCreate) => apiClient.highlights.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });
}
*/

// ==================== LOCAL STORAGE HELPERS ====================

/**
 * Helper functions for managing local storage preferences
 * (for guest users before authentication)
 */

export const localStorage = {
  /**
   * Save guest preferences to localStorage
   */
  saveGuestPreferences: (preferences: Partial<UserPreferences>) => {
    window.localStorage.setItem(
      'guest_preferences',
      JSON.stringify(preferences)
    );
  },

  /**
   * Load guest preferences from localStorage
   */
  loadGuestPreferences: (): Partial<UserPreferences> | null => {
    const data = window.localStorage.getItem('guest_preferences');
    return data ? JSON.parse(data) : null;
  },

  /**
   * Clear guest preferences
   */
  clearGuestPreferences: () => {
    window.localStorage.removeItem('guest_preferences');
  },

  /**
   * Save guest reading progress to localStorage
   */
  saveGuestProgress: (chapterId: string, progress: Partial<ProgressUpdate>) => {
    const key = `guest_progress_${chapterId}`;
    window.localStorage.setItem(key, JSON.stringify(progress));
  },

  /**
   * Load guest reading progress from localStorage
   */
  loadGuestProgress: (chapterId: string): Partial<ProgressUpdate> | null => {
    const key = `guest_progress_${chapterId}`;
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Clear all guest progress
   */
  clearGuestProgress: () => {
    const keys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith('guest_progress_')
    );
    keys.forEach((key) => window.localStorage.removeItem(key));
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format time spent in human-readable format
 */
export function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get progress status color
 */
export function getProgressStatusColor(
  status: Progress['status']
): string {
  switch (status) {
    case 'unread':
      return '#9E9E9E'; // gray
    case 'in_progress':
      return '#2196F3'; // blue
    case 'completed':
      return '#4CAF50'; // green
    default:
      return '#9E9E9E';
  }
}

/**
 * Get highlight color hex
 */
export function getHighlightColorHex(
  color: Highlight['color']
): string {
  switch (color) {
    case 'yellow':
      return '#FFEB3B80'; // 50% opacity
    case 'green':
      return '#8BC34A80';
    case 'pink':
      return '#F4433680';
    case 'blue':
      return '#2196F380';
    case 'purple':
      return '#9C27B080';
    default:
      return '#FFEB3B80';
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ==================== EXPORTS ====================

export default apiClient;
