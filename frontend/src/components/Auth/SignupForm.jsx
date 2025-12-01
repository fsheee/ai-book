import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/auth';
import styles from './Auth.module.css';

export default function SignupForm({ onSuccess, onSwitchToLogin }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(email, password);

      if (result.success) {
        if (onSuccess) onSuccess(result.user);
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <h2 className={styles.authTitle}>Create Account</h2>
      <p className={styles.authSubtitle}>Start your personalized learning journey</p>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="signup-email" className={styles.formLabel}>
          Email
        </label>
        <input
          id="signup-email"
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
        <label htmlFor="signup-password" className={styles.formLabel}>
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          className={styles.formInput}
          placeholder="Min 8 chars, 1 number, 1 special char"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="signup-confirm-password" className={styles.formLabel}>
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          className={styles.formInput}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className={styles.switchForm}>
        Already have an account?{' '}
        <button
          type="button"
          className={styles.switchButton}
          onClick={onSwitchToLogin}
          disabled={loading}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
