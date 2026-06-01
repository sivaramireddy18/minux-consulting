import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';

interface LoginFormProps {
  onToggleForm: () => void;
}

export const LoginForm = ({ onToggleForm }: LoginFormProps) => {
  const { login, forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Forgot Password Overlay state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Form Submission Handlers
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      // Secure fallback: Display generic security failure response
      setErrorMsg(
        err.response?.data?.error || 
        'Login failed. Please check your credentials configuration and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setForgotError(null);
    setForgotSuccess(null);
    setLoading(true);

    try {
      await forgotPassword(forgotEmail);
      setForgotSuccess('If registered, a secure reset link has been dispatched to your email.');
      setForgotEmail('');
    } catch (err: any) {
      setForgotError('Failed to dispatch reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300">
      
      {/* 1. Main Standard Login Card View */}
      {!showForgot ? (
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-400">Log in to enter your secure workspace</p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col">
              <label htmlFor="login-email" className="text-xs font-semibold text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white/10"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setErrorMsg(null);
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition duration-150"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 outline-none transition duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50"
          >
            {loading ? 'Authenticating Credentials...' : 'Sign In &rarr;'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150"
            >
              Sign Up
            </button>
          </p>
        </form>
      ) : (
        
        // 2. Sliding Forgot Password Card View
        <form onSubmit={handleForgotSubmit} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-400">Request a secure expiration recovery link</p>
          </div>

          {forgotError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
              {forgotError}
            </div>
          )}

          {forgotSuccess && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs font-medium text-green-400">
              {forgotSuccess}
            </div>
          )}

          <div className="flex flex-col">
            <label htmlFor="forgot-email" className="text-xs font-semibold text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-red-500 focus:bg-white/10"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 outline-none transition duration-200 hover:bg-red-500 hover:shadow-red-500/40 disabled:opacity-50"
            >
              {loading ? 'Processing Request...' : 'Send Secure Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotError(null);
                setForgotSuccess(null);
              }}
              className="flex w-full items-center justify-center rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 outline-none transition duration-200 hover:bg-white/10 hover:text-white"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
