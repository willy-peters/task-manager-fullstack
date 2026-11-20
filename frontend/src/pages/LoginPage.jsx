import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { pingHealth } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import useTheme from '../hooks/useTheme.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login, sessionNotice, logoutMessage, clearSessionNotice } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    pingHealth();
  }, []);

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (sessionNotice || logoutMessage) clearSessionNotice();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setSubmitError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAlert = submitError || sessionNotice;

  return (
    <div className="relative min-h-screen bg-surface flex flex-col justify-center items-center px-margin-sm sm:px-margin py-space-xl overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="focus-ring w-10 h-10 rounded-full bg-surface-container-lowest shadow-level1 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      {/* Ambient soft glow spheres */}
      <div className="pointer-events-none fixed -top-24 left-1/4 w-96 h-96 bg-primary-fixed opacity-40 blur-3xl rounded-full" />
      <div className="pointer-events-none fixed top-1/3 right-1/4 w-80 h-80 bg-secondary-container opacity-35 blur-3xl rounded-full" />

      <main className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-xl p-space-lg sm:p-10 shadow-level1 border border-outline-variant/30">
        <div className="flex flex-col w-full space-y-space-md">
          {/* Brand Header (no logo, just Task Manager) */}
          <div className="flex flex-col items-center text-center pt-space-xs">
            <span className="text-headline-md text-on-surface tracking-tight">Task Manager</span>
          </div>

          {/* Centered Welcome Header */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-headline-lg text-on-surface">Sign in to your account</h1>
          </div>

          {/* Logged Out Success Message */}
          {logoutMessage && !activeAlert && (
            <div
              role="status"
              className="flex items-center gap-space-sm rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant p-space-sm px-space-md text-body-sm"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              <span className="flex-1 font-medium">{logoutMessage}</span>
            </div>
          )}

          {/* Inline Error / Session Alert */}
          {activeAlert && (
            <div
              role="alert"
              className="flex items-start gap-space-sm rounded-lg bg-error-container text-on-error-container p-space-sm px-space-md text-body-sm"
            >
              <span aria-hidden="true" className="material-symbols-outlined icon-filled text-[18px] text-error mt-0.5">
                error
              </span>
              <span className="flex-1">{activeAlert}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="flex flex-col w-full space-y-space-md" noValidate onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-label-lg text-on-surface" htmlFor="login-email">
                Email address
              </label>
              <div className="relative flex items-center w-full">
                <span className="material-symbols-outlined absolute left-3.5 text-secondary text-[20px] pointer-events-none">
                  mail
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`input h-12 pl-11 pr-4 ${fieldErrors.email ? 'input-error' : ''}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-body-sm text-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-label-lg text-on-surface" htmlFor="login-password">
                Password
              </label>
              <div className="relative flex items-center w-full">
                <span className="material-symbols-outlined absolute left-3.5 text-secondary text-[20px] pointer-events-none">
                  lock
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={`input h-12 pl-11 pr-12 ${fieldErrors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="focus-ring absolute right-1 w-11 h-11 flex items-center justify-center text-secondary hover:text-on-surface rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-body-sm text-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full h-12 text-label-lg font-semibold group"
            >
              {isSubmitting ? (
                <>
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="w-full h-px bg-surface-container-high" />

          {/* Register Link Footer */}
          <div className="flex items-center justify-center gap-1.5 pt-space-xs">
            <span className="text-body-md text-on-surface-variant">Don&apos;t have an account?</span>
            <Link
              to="/register"
              className="text-label-lg text-primary hover:text-on-primary-fixed-variant font-semibold hover:underline focus-ring rounded"
            >
              Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
