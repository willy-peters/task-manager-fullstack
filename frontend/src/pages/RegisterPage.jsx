import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pingHealth } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import useTheme from '../hooks/useTheme.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    pingHealth();
  }, []);

  const validate = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      errors.name = 'Full name must be between 2 and 50 characters.';
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (password.length < 8 || password.length > 72) {
      errors.password = 'Password must be between 8 and 72 characters.';
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setSubmitError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center px-margin-sm sm:px-margin py-space-xl overflow-hidden">
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

      {/* Ambient Soft Glow Spheres */}
      <div className="pointer-events-none fixed -top-16 left-1/4 w-96 h-96 bg-primary-fixed opacity-40 blur-3xl rounded-full" />
      <div className="pointer-events-none fixed top-1/3 right-1/4 w-80 h-80 bg-secondary-container opacity-35 blur-3xl rounded-full" />

      <main className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-xl shadow-level3 p-space-lg sm:p-10 border border-outline-variant/30">
        {/* App Branding Header (no logo, just Task Manager) */}
        <div className="flex flex-col items-center text-center mb-space-lg">
          <h1 className="text-headline-lg text-on-surface">Task Manager</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Create your account to get started
          </p>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-space-md flex items-start gap-space-sm rounded-lg bg-error-container text-on-error-container p-space-sm px-space-md text-body-sm"
          >
            <span aria-hidden="true" className="material-symbols-outlined icon-filled text-[18px] text-error mt-0.5">
              error
            </span>
            <span className="flex-1">{submitError}</span>
          </div>
        )}

        <form className="space-y-space-md" noValidate onSubmit={handleSubmit}>
          {/* Field 1: Full Name */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-label-lg text-on-surface" htmlFor="register-name">
              Full Name
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-xl">
                person
              </span>
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Ada Lovelace"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                className={`input pl-11 pr-4 ${fieldErrors.name ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-body-sm text-error" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Field 2: Email */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-label-lg text-on-surface" htmlFor="register-email">
              Email
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-xl">
                mail
              </span>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                className={`input pl-11 pr-4 ${fieldErrors.email ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-body-sm text-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Field 3: Password */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-label-lg text-on-surface" htmlFor="register-password">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-xl">
                lock
              </span>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`input pl-11 pr-11 ${fieldErrors.password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="focus-ring absolute right-2 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
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

          {/* Field 4: Confirm Password */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-label-lg text-on-surface" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-xl">
                lock_reset
              </span>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                className={`input pl-11 pr-11 ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="focus-ring absolute right-2 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-body-sm text-error" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 px-6 text-label-lg font-semibold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-space-lg text-center">
          <p className="text-body-md text-on-surface-variant">
            Already have an account?
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline ml-1 focus-ring rounded"
            >
              Login here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
