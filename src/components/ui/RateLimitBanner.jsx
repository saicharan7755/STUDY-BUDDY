import { useEffect, useMemo, useState } from 'react';

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const RateLimitBanner = ({ secondsRemaining = 0, onExpire, onClose }) => {
  const [seconds, setSeconds] = useState(secondsRemaining);
  const countdown = useMemo(() => formatCountdown(seconds), [seconds]);

  useEffect(() => {
    setSeconds(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }

    const intervalId = window.setInterval(() => {
      setSeconds((current) => {
        const next = current - 1;
        if (next <= 0) {
          window.clearInterval(intervalId);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [seconds, onExpire]);

  if (seconds <= 0) return null;

  return (
    <div className="mb-4 rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-lg shadow-black/20 sm:flex sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
        <div>
          <p className="font-semibold text-amber-100">Slow down!</p>
          <p className="mt-1 text-sm text-amber-100/90">
            You can generate again in <span className="font-semibold">{countdown}</span>.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 sm:mt-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onExpire}
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-amber-400/90 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          Reset Timer
        </button>
      </div>
    </div>
  );
};

export default RateLimitBanner;
