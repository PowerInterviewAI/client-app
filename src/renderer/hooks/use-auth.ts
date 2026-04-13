import { useState } from 'react';

/**
 * useAuth
 * React hook that exposes authentication actions and simple
 * state for `loading` and `error` to drive UI feedback.
 *
 * Methods call into the preload `window.electronAPI.auth` bridge
 * and surface errors by setting `error` and re-throwing so callers
 * can respond as needed.
 */
export default function useAuth() {
  // indicates an in-progress auth request (used to disable UI, show spinners)
  const [loading, setLoading] = useState(false);
  // last auth error message or null
  const [error, setError] = useState<string | null>(null);

  // Attempt to login; on failure sets `error` and throws.
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI?.auth.login(email, password);

      if (!result?.success) {
        const errMsg = result?.error || 'Login failed';
        setError(errMsg);
        throw new Error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign up a new user. Returns boolean for convenience and still
  // sets `error`/throws on failure so callers can surface messages.
  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.signup(username, email, password);
      if (!result?.success) {
        const errMsg = result?.error || 'Signup failed';
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('signup error:', err);
      setError('Signup failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Log the current user out; sets `error`/throws on failure.
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI?.auth.logout();
      if (!result?.success) {
        const errMsg = result?.error || 'Logout failed';
        setError(errMsg);
        throw new Error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Change the authenticated user's password via the bridge API.
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.auth.changePassword(currentPassword, newPassword);
      if (!result?.success) {
        const errMsg = result?.error || 'Change password failed';
        setError(errMsg);
        return false;
      }
      return true;
    } catch (err) {
      console.error('changePassword error:', err);
      setError('Change password failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Return stable object for consumers; `setError` is exposed so callers
  // can clear errors when appropriate (e.g. on input changes).
  return {
    login,
    signup,
    logout,
    changePassword,
    loading,
    error,
    setError,
  } as const;
}
