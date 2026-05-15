import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, Loader2 } from 'lucide-react';
import { useAuth, useToast } from '../hooks';
import { MetaTags } from '../components/ui';
import { AUTH_ERROR_MESSAGES } from '../constants/errorMessages';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { isAuthenticated, signIn, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      toast.success('Password updated. Sign in with your new password.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const savedRoute = typeof window !== 'undefined' ? window.sessionStorage.getItem('cramAI_lastRoute') : null;
  const from = location.state?.from?.pathname || savedRoute || '/dashboard';

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
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
      await signInWithEmail(email.trim(), password);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('cramAI_lastRoute');
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setFormError(AUTH_ERROR_MESSAGES.wrongPassword(2));
      } else if (err.code === 'auth/user-not-found') {
        setFormError(AUTH_ERROR_MESSAGES.accountNotFound);
      } else if (err.code === 'auth/account-locked') {
        setFormError(AUTH_ERROR_MESSAGES.accountLocked('a few minutes'));
      } else if (err.code === 'auth/network-request-failed') {
        setFormError(AUTH_ERROR_MESSAGES.networkError);
      } else {
        setFormError(
          'We could not sign you in with those credentials. Check your email and password.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    setGoogleLoading(true);
    try {
      await signIn();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('cramAI_lastRoute');
      }
      navigate(from, { replace: true });
    } catch (_error) {
      setFormError('Google sign-in was interrupted. Please try again.');
      toast.warning('Google sign-in was interrupted. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Log in | CRAM AI"
        description="Sign in to CRAM AI to review your study decks and progress."
      />
      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-light">
              <Brain className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white">Log in to CRAM AI</h1>
            <p className="mt-2 text-sm text-gray-400">
              Pick up your study session where you left off.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              {errors.email && (
                <p id="login-email-error" className="mt-2 text-sm text-danger" aria-live="polite">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                aria-invalid={Boolean(errors.password)}
                className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              {errors.password && (
                <p
                  id="login-password-error"
                  className="mt-2 text-sm text-danger"
                  aria-live="polite"
                >
                  {errors.password}
                </p>
              )}
              <Link
                to="/forgot-password"
                className="mt-3 inline-flex text-sm font-semibold text-accent-light transition-colors hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Forgot your password?
              </Link>
            </div>

            {formError && (
              <p
                className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-100"
                aria-live="polite"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="nav-cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-accent/20 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {submitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-accent/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {googleLoading ? 'Opening Google...' : 'Continue with Google'}
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            New to CRAM AI?{' '}
            <Link to="/signup" className="font-semibold text-accent-light hover:text-white">
              Create an account
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
