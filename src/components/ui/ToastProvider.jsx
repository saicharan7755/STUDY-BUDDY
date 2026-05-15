import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import UndoToast from './UndoToast';
import { ToastContext } from './ToastContext';

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

const typeStyles = {
  success: 'border-emerald-500 bg-emerald-500/95 text-white',
  error: 'border-rose-500 bg-rose-500/95 text-white',
  warning: 'border-amber-400 bg-amber-500/95 text-slate-950',
  info: 'border-sky-500 bg-sky-500/95 text-slate-950',
};

const typeIcons = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const getRole = (type) => (type === 'error' ? 'alert' : 'status');
const getAriaLive = (type) => (type === 'error' ? 'assertive' : 'polite');

const buildToast = (id, type, message, options = {}) => ({
  id,
  type,
  message,
  description: options.description || '',
  duration: options.duration !== undefined ? options.duration : DEFAULT_DURATION,
  action: options.action,
  showProgress: options.showProgress || false,
});

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [queue, setQueue] = useState([]);
  const timers = useRef({});
  const reduceMotion = useReducedMotion();

  const flushQueue = useCallback(() => {
    setToasts((currentToasts) => {
      if (currentToasts.length >= MAX_VISIBLE || queue.length === 0) return currentToasts;
      const [nextToast, ...rest] = queue;
      setQueue(rest);
      return [...currentToasts, nextToast];
    });
  }, [queue]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type, message, options = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextToast = buildToast(id, type, message, options);

      setToasts((currentToasts) => {
        if (currentToasts.length < MAX_VISIBLE) {
          return [...currentToasts, nextToast];
        }
        setQueue((existing) => [...existing, nextToast]);
        return currentToasts;
      });
      return id;
    },
    []
  );

  const toastApi = useMemo(
    () => ({
      success: (message, options) => addToast('success', message, options),
      error: (message, options) => addToast('error', message, options),
      warning: (message, options) => addToast('warning', message, options),
      info: (message, options) => addToast('info', message, options),
      addToast,
      removeToast,
    }),
    [addToast, removeToast]
  );

  useEffect(() => {
    if (queue.length === 0) return;
    flushQueue();
  }, [queue, flushQueue]);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration === null) return;
      if (timers.current[toast.id]) return;
      timers.current[toast.id] = window.setTimeout(() => {
        removeToast(toast.id);
        delete timers.current[toast.id];
      }, toast.duration);
    });
  }, [toasts, removeToast]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(window.clearTimeout);
      timers.current = {};
    };
  }, []);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex items-center justify-center px-4 sm:right-4 sm:left-auto sm:justify-end">
        <div className="w-full max-w-[min(100vw-2rem,420px)] space-y-3">
          <AnimatePresence>
            {toasts.map((toast) => {
              const Icon = typeIcons[toast.type] || Info;
              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  role={getRole(toast.type)}
                  aria-live={getAriaLive(toast.type)}
                  aria-atomic="true"
                  className={`rounded-3xl border p-4 shadow-2xl shadow-black/30 backdrop-blur-xl ${typeStyles[toast.type]}`}
                >
                  {toast.showProgress ? (
                    <UndoToast
                      message={toast.message}
                      actionLabel={toast.action?.label || 'Undo'}
                      onUndo={() => {
                        toast.action?.onClick?.();
                        removeToast(toast.id);
                      }}
                      onClose={() => removeToast(toast.id)}
                      duration={toast.duration}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="mt-1">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight">{toast.message}</p>
                        {toast.description && (
                          <p className="mt-1 text-sm leading-6 opacity-90">{toast.description}</p>
                        )}
                        {toast.action && (
                          <button
                            type="button"
                            onClick={toast.action.onClick}
                            className="mt-3 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                          >
                            {toast.action.label}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeToast(toast.id)}
                        className="rounded-full p-2 text-white/90 transition hover:text-white"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
