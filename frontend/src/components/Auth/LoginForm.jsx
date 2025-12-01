import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/auth';
import styles from './Auth.module.css';

export default function LoginForm({ onSuccess, onSwitchToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        if (onSuccess) onSuccess(result.user);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <h2 className={styles.authTitle}>Welcome Back</h2>
      <p className={styles.authSubtitle}>Sign in to access your personalized dashboard</p>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="login-email" className={styles.formLabel}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          className={styles.formInput}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="login-password" className={styles.formLabel}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          className={styles.formInput}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className={styles.switchForm}>
        Don't have an account?{' '}
        <button
          type="button"
          className={styles.switchButton}
          onClick={onSwitchToSignup}
          disabled={loading}
        >
          Sign up
        </button>
      </p>
    </form>
  );
}
