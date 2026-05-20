import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, ShieldAlert, TriangleAlert } from 'lucide-react';

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(focusableSelectors.join(','))).filter(
    (element) => element.offsetParent !== null
  );
};

const typeStyles = {
  warning: {
    accent: 'bg-amber-50 border-amber-200 text-amber-950',
    button: 'bg-amber-500 text-slate-950 hover:bg-amber-600',
    icon: 'text-amber-500',
  },
  danger: {
    accent: 'bg-rose-50 border-rose-200 text-rose-950',
    button: 'bg-rose-500 text-white hover:bg-rose-600',
    icon: 'text-rose-500',
  },
};

const ConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  type = 'warning',
  requireTyping = false,
  isConfirming = false,
  error = '',
  returnFocusRef,
}) => {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const [confirmationText, setConfirmationText] = useState('');
  const labelId = useId();
  const descriptionId = useId();
  const hasTypingRequirement = requireTyping;
  const isConfirmEnabled = !isConfirming && (!hasTypingRequirement || confirmationText.trim().toUpperCase() === 'DELETE');

  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('');
      return;
    }

    previousActiveElementRef.current = document.activeElement;
    const returnFocusElement = returnFocusRef?.current;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
      if (returnFocusElement?.focus) {
        returnFocusElement.focus();
      } else if (previousActiveElementRef.current?.focus) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isConfirming) onCancel();
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirming, onCancel]);

  const onOverlayClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget && !isConfirming) {
        onCancel();
      }
    },
    [isConfirming, onCancel]
  );

  const handleConfirm = useCallback(
    (event) => {
      event.preventDefault();
      if (!isConfirmEnabled) return;
      onConfirm();
    },
    [isConfirmEnabled, onConfirm]
  );

  const typeConfig = typeStyles[type] || typeStyles.warning;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          onMouseDown={onOverlayClick}
          aria-hidden="true"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50"
            onMouseDown={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${typeConfig.accent}`}>
                {type === 'danger' ? (
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h2 id={labelId} className="text-xl font-heading font-bold text-white">
                  {title}
                </h2>
                <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-300">
                  {message}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close confirmation dialog"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {hasTypingRequirement && (
              <div className="mt-6">
                <label htmlFor="confirmation-input" className="block text-sm font-semibold text-slate-200">
                  Type DELETE to confirm
                </label>
                <input
                  id="confirmation-input"
                  type="text"
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  autoComplete="off"
                  aria-describedby={error ? 'confirmation-error' : undefined}
                />
              </div>
            )}

            {error && (
              <div
                id="confirmation-error"
                className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                ref={cancelButtonRef}
                disabled={isConfirming}
                className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isConfirmEnabled}
                className={`inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${typeConfig.button} ${!isConfirmEnabled ? 'pointer-events-none opacity-60' : ''}`}
              >
                {isConfirming ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
