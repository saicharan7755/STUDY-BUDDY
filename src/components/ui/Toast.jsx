import { X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const accent = type === 'success' ? 'bg-success/90 text-white' : 'bg-danger/90 text-white';

  return (
    <div
      className={`fixed bottom-24 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl border border-white/10 px-5 py-4 shadow-2xl shadow-black/30 ${accent}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm leading-6">{message}</div>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
