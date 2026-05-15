import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Brain, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks';
import { MetaTags, Toast } from '../components/ui';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { isAuthenticated, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Use at least 8 characters for your password.';
    }

    if (!agreed) {
      nextErrors.agreed = 'You must accept the Terms of Service and Privacy Policy.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error?.message || 'We could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Sign up | CRAM AI"
        description="Create a CRAM AI account to save your study notes and access AI-powered study tools."
      />
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-light">
              <Brain className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white">Create your CRAM AI account</h1>
            <p className="mt-2 text-sm text-gray-400">
              Start saving your study content and unlock intelligent review sessions.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-gray-200">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              {errors.email && (
                <p id="signup-email-error" className="mt-2 text-sm text-danger" aria-live="polite">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-gray-200">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
                aria-invalid={Boolean(errors.password)}
                className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              {errors.password && (
                <p id="signup-password-error" className="mt-2 text-sm text-danger" aria-live="polite">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <label htmlFor="signup-terms" className="flex items-start gap-3 text-sm text-gray-200">
                <input
                  id="signup-terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-surface/80 text-accent focus:ring-accent"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms-of-service" className="font-semibold text-accent-light hover:text-white">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" className="font-semibold text-accent-light hover:text-white">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.agreed && (
                <p className="mt-2 text-sm text-danger" aria-live="polite">
                  {errors.agreed}
                </p>
              )}
            </div>

            {formError && (
              <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-100" aria-live="polite">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !agreed}
              className="nav-cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-accent/20 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent-light hover:text-white">
              Log in
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
