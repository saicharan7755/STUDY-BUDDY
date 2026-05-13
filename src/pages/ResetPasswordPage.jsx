import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { AlertCircle, Brain, Loader2 } from 'lucide-react';
import { auth } from '../config/firebase';
import { MetaTags } from '../components/ui';

const passwordRules = {
  minLength: (value) => value.length >= 8,
  hasNumber: (value) => /\d/.test(value),
  hasSpecial: (value) => /[^A-Za-z0-9]/.test(value),
};

function getPasswordStrength(password) {
  const score = Object.values(passwordRules).filter((rule) => rule(password)).length;

  if (!password) return { label: '', width: '0%', className: 'bg-white/20' };
  if (score <= 1) return { label: 'Weak', width: '33%', className: 'bg-danger' };
  if (score === 2) return { label: 'Medium', width: '66%', className: 'bg-warning' };
  return { label: 'Strong', width: '100%', className: 'bg-success' };
}

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetCode = searchParams.get('oobCode') || token || '';
  const mode = searchParams.get('mode');

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  useEffect(() => {
    let active = true;

    const verifyToken = async () => {
      if (!resetCode || (mode && mode !== 'resetPassword')) {
        setTokenError('This reset link is invalid or missing a required token.');
        setCheckingToken(false);
        return;
      }

      try {
        await verifyPasswordResetCode(auth, resetCode);
        if (active) setTokenError('');
      } catch (_error) {
        if (active) {
          setTokenError(
            'This reset link is invalid or has expired. Request a new link to continue.'
          );
        }
      } finally {
        if (active) setCheckingToken(false);
      }
    };

    verifyToken();

    return () => {
      active = false;
    };
  }, [mode, resetCode]);

  const validate = () => {
    const nextErrors = {};

    if (!newPassword) {
      nextErrors.newPassword = 'Enter a new password.';
    } else if (!passwordRules.minLength(newPassword)) {
      nextErrors.newPassword = 'Password must be at least 8 characters.';
    } else if (!passwordRules.hasNumber(newPassword)) {
      nextErrors.newPassword = 'Password must include at least one number.';
    } else if (!passwordRules.hasSpecial(newPassword)) {
      nextErrors.newPassword = 'Password must include at least one special character.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, resetCode, newPassword);
      navigate('/login?reset=success', { replace: true });
    } catch (error) {
      if (
        error?.code === 'auth/expired-action-code' ||
        error?.code === 'auth/invalid-action-code'
      ) {
        setTokenError('This reset link is invalid or has expired. Request a new link to continue.');
        return;
      }

      if (error?.code === 'auth/weak-password') {
        setErrors({ newPassword: 'Choose a stronger password before continuing.' });
        return;
      }

      setSubmitError('We could not update your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingToken) {
    return (
      <section className="flex flex-1 items-center justify-center px-5 py-12 text-accent-light sm:px-6">
        <Loader2 className="h-10 w-10 animate-spin" aria-label="Checking reset link" />
      </section>
    );
  }

  return (
    <>
      <MetaTags
        title="Reset Password | CRAM AI"
        description="Create a new CRAM AI password from your reset link."
      />
      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
          {tokenError ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger">
                <AlertCircle className="h-7 w-7" aria-hidden />
              </div>
              <h1 className="font-heading text-3xl font-bold text-white">Reset link unavailable</h1>
              <p className="mt-4 text-sm leading-6 text-gray-300" aria-live="polite">
                {tokenError}
              </p>
              <Link
                to="/forgot-password"
                className="nav-cta mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-accent/20"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-light">
                  <Brain className="h-7 w-7" aria-hidden />
                </div>
                <h1 className="font-heading text-3xl font-bold text-white">
                  Create a new password
                </h1>
                <p className="mt-2 text-sm text-gray-400">
                  Use a strong password you have not used before.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-gray-200"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setErrors((current) => ({ ...current, newPassword: '' }));
                    }}
                    aria-describedby="password-strength reset-password-error"
                    aria-invalid={Boolean(errors.newPassword)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  <div id="password-strength" className="mt-3" aria-live="polite">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${strength.className}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Strength:{' '}
                      <span className="font-semibold text-gray-200">
                        {strength.label || 'Start typing'}
                      </span>
                    </p>
                  </div>
                  {errors.newPassword && (
                    <p
                      id="reset-password-error"
                      className="mt-2 text-sm text-danger"
                      aria-live="polite"
                    >
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-gray-200"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setErrors((current) => ({ ...current, confirmPassword: '' }));
                    }}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  {errors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      className="mt-2 text-sm text-danger"
                      aria-live="polite"
                    >
                      {errors.confirmPassword}
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
                  disabled={submitting}
                  className="nav-cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-lg shadow-accent/20 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
