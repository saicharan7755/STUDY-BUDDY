import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clipboard, Download, FileDown, FileSpreadsheet, Link, X } from 'lucide-react';
import {
  copyFlashcardsAsText,
  copyFlashcardsShareLink,
  exportFlashcardsAsCsv,
  exportFlashcardsAsPdf,
  exportFlashcardsForAnki,
} from '../../utils/exportUtils';

const ExportModal = ({ isOpen, onClose, cards = [], deckName = 'Flashcards' }) => {
  const [status, setStatus] = useState('');
  const hasCards = cards.length > 0;

  const showStatus = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 1800);
  };

  const handleCopyText = async () => {
    await copyFlashcardsAsText(cards, deckName);
    showStatus('Copied!');
  };

  const handleShareLink = async () => {
    await copyFlashcardsShareLink(cards, deckName);
    showStatus('Link copied!');
  };

  const actions = [
    {
      id: 'pdf',
      title: 'PDF',
      detail: 'Printable study packet',
      icon: FileDown,
      onClick: () => {
        exportFlashcardsAsPdf(cards, deckName);
        showStatus('PDF exported');
      },
    },
    {
      id: 'csv',
      title: 'CSV',
      detail: 'Excel and Sheets ready',
      icon: FileSpreadsheet,
      onClick: () => {
        exportFlashcardsAsCsv(cards, deckName);
        showStatus('CSV exported');
      },
    },
    {
      id: 'anki',
      title: 'Anki',
      detail: 'Tab-separated import file',
      icon: Download,
      onClick: () => {
        exportFlashcardsForAnki(cards, deckName);
        showStatus('Anki file exported');
      },
    },
    {
      id: 'copy',
      title: 'Copy Text',
      detail: 'Numbered list',
      icon: Clipboard,
      onClick: handleCopyText,
    },
    {
      id: 'share',
      title: 'Share Link',
      detail: 'Copied URL',
      icon: Link,
      onClick: handleShareLink,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-midnight p-5 shadow-2xl shadow-black/50"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  Export deck
                </p>
                <h2 id="export-modal-title" className="mt-2 text-2xl font-heading font-bold">
                  {deckName}
                </h2>
                <p className="mt-1 text-sm text-gray-400">{cards.length} flashcards available</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                <Check className="h-4 w-4" />
                {status}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    type="button"
                    disabled={!hasCards}
                    onClick={action.onClick}
                    className="group flex min-h-[96px] items-center gap-4 rounded-xl border border-white/10 bg-surface/60 p-4 text-left transition-colors hover:border-accent/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    whileHover={!hasCards ? {} : { y: -2 }}
                    whileTap={!hasCards ? {} : { scale: 0.98 }}
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-light group-hover:bg-accent group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{action.title}</span>
                      <span className="mt-1 block text-sm text-gray-400">{action.detail}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
