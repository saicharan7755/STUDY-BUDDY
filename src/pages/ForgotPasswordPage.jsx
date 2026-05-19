import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Brain, CheckCircle2, Loader2 } from 'lucide-react';
import { auth } from '../config/firebase';
import { MetaTags } from '../components/ui';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_KEY = 'cram-ai-password-reset-requested-at';
const RATE_LIMIT_MS = 60_000;

function getRemainingSeconds() {
  const requestedAt = Number(window.localStorage.getItem(RATE_LIMIT_KEY) || 0);
  if (!requestedAt) return 0;

  const remaining = RATE_LIMIT_MS - (Date.now() - requestedAt);
  return Math.max(0, Math.ceil(remaining / 1000));
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [cooldown, setCooldown] = useState(() => getRemainingSeconds());

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const successMessage = submittedEmail
    ? `If an account exists for ${submittedEmail}, you'll receive a reset link within a few minutes. Check your spam folder if you don't see it.`
    : '';

  const validate = () => {
    if (!normalizedEmail) {
      setError('Enter your email address.');
      return false;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return false;
    }

    setError('');
    return true;
  };

  const startCooldown = () => {
    window.localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
    setCooldown(60);

    const intervalId = window.setInterval(() => {
      const remaining = getRemainingSeconds();
      setCooldown(remaining);
      if (remaining <= 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const remaining = getRemainingSeconds();
    if (remaining > 0) {
      setCooldown(remaining);
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      setSubmittedEmail(normalizedEmail);
      startCooldown();
    } catch (error) {
      if (error?.code === 'auth/invalid-email') {
        setError('Enter a valid email address.');
        return;
      }

      if (error?.code === 'auth/too-many-requests') {
        setSubmitError('Too many reset attempts. Please wait a minute and try again.');
        startCooldown();
        return;
      }

      setSubmittedEmail(normalizedEmail);
      startCooldown();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Forgot Password | CRAM AI"
        description="Request a CRAM AI password reset link."
      />
      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
          {submittedEmail ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" aria-hidden />
              </div>
              <h1 className="font-heading text-3xl font-bold text-white">Check your inbox</h1>
              <p className="mt-4 text-sm leading-6 text-gray-300" aria-live="polite">
                {successMessage}
              </p>
              <Link
                to="/login"
                className="nav-cta mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-accent/20"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-light">
                  <Brain className="h-7 w-7" aria-hidden />
                </div>
                <h1 className="font-heading text-3xl font-bold text-white">Reset your password</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Enter your account email and we will send a reset link.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {redirectMessage && (
                  <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent-light">
                    {redirectMessage}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-2 block text-sm font-semibold text-gray-200"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError('');
                      setSubmitError('');
                    }}
                    aria-describedby={error ? 'forgot-email-error' : undefined}
                    aria-invalid={Boolean(error)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  {error && (
                    <p
                      id="forgot-email-error"
                      className="mt-2 text-sm text-danger"
                      aria-live="polite"
                    >
                      {error}
                    </p>
                  )}
                </div>

                {submitError && (
                  <p
                    className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-100"
                    aria-live="polite"
                  >
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || cooldown > 0}
                  className="nav-cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-accent/20 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {submitting
                    ? 'Sending...'
                    : cooldown > 0
                      ? `Try again in ${cooldown}s`
                      : 'Send Reset Link'}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-6 inline-flex w-full justify-center text-sm font-semibold text-accent-light transition-colors hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </section>
    </>
  );
}
