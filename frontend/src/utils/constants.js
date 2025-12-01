/**
 * API Configuration Constants
 */

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://your-backend.railway.app'  // Update with your Railway URL after deployment
    : 'http://localhost:8000';

export const API_KEY =
  process.env.NODE_ENV === 'production'
    ? 'your-production-api-key'  // Update with your production API key
    : '07e339848352f49f537f8cf57e6ddd480393476d0739f6818267929c5b44384f';  // Match backend .env API_KEY

/**
 * Rate limiting configuration (should match backend)
 */
export const RATE_LIMIT = {
  PER_MINUTE: 10,
  PER_HOUR: 100,
};

/**
 * Chat configuration
 */
export const CHAT_CONFIG = {
  MAX_QUESTION_LENGTH: 1000,
  MIN_SELECTION_LENGTH: 50,
  MAX_SELECTION_LENGTH: 8000,
  HISTORY_RETENTION_DAYS: 30,
  MAX_LOCAL_MESSAGES: 50,
};
