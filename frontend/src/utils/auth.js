/**
 * Auth utility functions for JWT token management
 * TODO: Integrate with actual backend API once available
 */

/**
 * Store JWT tokens in localStorage
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export function storeTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
}

/**
 * Retrieve access token from localStorage
 * @returns {string|null} Access token or null
 */
export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Retrieve refresh token from localStorage
 * @returns {string|null} Refresh token or null
 */
export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

/**
 * Clear all tokens from localStorage
 */
export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  const accessToken = getAccessToken();
  const user = localStorage.getItem('user');
  return !!(accessToken || user);
}

/**
 * Decode JWT token (basic implementation, doesn't verify signature)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {object} Validation result with isValid and message
 */
export function validatePassword(password) {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }

  return { isValid: true, message: 'Password is strong' };
}
