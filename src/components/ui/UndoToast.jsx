import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUturnLeft, X } from 'lucide-react';

const UndoToast = ({
  message,
  actionLabel = 'Undo',
  onUndo,
  onClose,
  duration = 8000,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <ArrowUturnLeft className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-white">{message}</p>
            <p className="mt-1 text-sm text-slate-400">Undo within {Math.round(duration / 1000)} seconds.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: reduceMotion ? 0 : duration / 1000, ease: 'linear' }}
          className="h-full rounded-full bg-emerald-400"
        />
      </div>
      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex min-h-[44px] min-w-[88px] items-center justify-center rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default UndoToast;
