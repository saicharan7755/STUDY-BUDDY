import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Brain } from 'lucide-react';

const BrandedLoadingScreen = ({ timeoutMs = 3000, onRetry, errorMessage }) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!onRetry) return undefined;

    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
      setTimedOut(false);
    };
  }, [onRetry, timeoutMs]);

  const retryLabel = useMemo(
    () => (timedOut ? 'Try again' : 'Still checking your session...'),
    [timedOut]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/95 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-accent/10 text-accent transition-all duration-300 hover:scale-[1.02]">
            <Brain className="h-10 w-10 animate-pulse" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-accent-light/80">CRAM AI</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-white">Verifying your session</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-gray-300">
              We are checking your authentication status and preparing your study workspace.
              This happens automatically and keeps the experience smooth.
            </p>
          </div>

          <div className="flex h-4 w-full items-center gap-3 rounded-full bg-white/5 p-1">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent to-accent-light animate-pulse-glow" />
          </div>

          {timedOut ? (
            <div className="space-y-4 text-left">
              <p className="text-sm text-gray-300">
                The auth check is taking longer than expected. If the page does not recover, tap retry.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center justify-center rounded-3xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
                >
                  {retryLabel}
                </button>
                <p className="text-sm text-gray-400">{errorMessage || ''}</p>
              </div>
            </div>
          ) : (
            <p className="max-w-md text-sm text-gray-400">
              Hang tight — this is a branded loading state designed to feel intentional, not broken.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

BrandedLoadingScreen.propTypes = {
  timeoutMs: PropTypes.number,
  onRetry: PropTypes.func,
  errorMessage: PropTypes.string,
};

export default BrandedLoadingScreen;
