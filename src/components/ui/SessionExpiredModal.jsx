import { useState } from 'react';
import { Lock, X, CheckCircle2 } from 'lucide-react';

const SessionExpiredModal = ({
  isOpen,
  onClose,
  onSaveWork,
  onLogin,
  loginLabel = 'Log Back In',
  saveLabel = 'Save My Work',
}) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workSaved, setWorkSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveWork = async () => {
    try {
      await onSaveWork?.();
      setWorkSaved(true);
    } catch {
      setWorkSaved(false);
      setLoginError('Unable to save work to clipboard. Please copy manually.');
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      await onLogin?.(loginEmail.trim(), loginPassword);
      setShowLoginForm(false);
      setLoginEmail('');
      setLoginPassword('');
      onClose?.();
    } catch (error) {
      setLoginError(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-midnight/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-accent/10 text-accent-light">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-light">Session expired</p>
              <h2 className="mt-3 text-3xl font-heading font-bold text-white">Your session has expired</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-6 text-sm leading-7 text-gray-300">
          You can continue working without losing your current text. Save your work to the clipboard before signing back in.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleSaveWork}
            className="inline-flex min-h-[52px] items-center justify-center rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {saveLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowLoginForm(true)}
            className="inline-flex min-h-[52px] items-center justify-center rounded-3xl border border-white/10 bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
          >
            {loginLabel}
          </button>
        </div>

        {workSaved && (
          <div className="mt-5 flex items-center gap-2 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span>Your text is now copied to the clipboard.</span>
          </div>
        )}

        {showLoginForm && (
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div>
              <label htmlFor="session-login-email" className="block text-sm font-semibold text-gray-200">
                Email
              </label>
              <input
                id="session-login-email"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                required
              />
            </div>
            <div>
              <label htmlFor="session-login-password" className="block text-sm font-semibold text-gray-200">
                Password
              </label>
              <input
                id="session-login-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                required
              />
            </div>

            {loginError && <p className="text-sm text-rose-200">{loginError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in now'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SessionExpiredModal;
