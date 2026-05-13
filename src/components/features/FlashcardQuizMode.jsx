import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const FlashcardQuizMode = ({ item, onAnswer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setIsFlipped((value) => !value)}
        className={clsx(
          'min-h-[260px] rounded-xl border p-8 text-center transition-colors',
          isFlipped ? 'border-accent/40 bg-accent/10' : 'border-white/10 bg-surface/60'
        )}
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
          {isFlipped ? 'Answer' : 'Prompt'}
        </p>
        <p className="text-2xl font-heading font-bold text-white">
          {isFlipped ? item.correctAnswer : item.prompt}
        </p>
      </button>

      {isFlipped ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.button
            type="button"
            onClick={() => onAnswer({ userAnswer: 'Incorrect', isCorrect: false })}
            className="min-h-[44px] rounded-xl border border-danger/40 px-5 py-3 font-semibold text-danger-light transition-colors hover:bg-danger/10"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Incorrect
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onAnswer({ userAnswer: 'Correct', isCorrect: true })}
            className="min-h-[44px] rounded-xl border border-success/40 px-5 py-3 font-semibold text-success transition-colors hover:bg-success/10"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Correct
          </motion.button>
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-surface/40 px-4 py-3 text-center text-sm text-gray-400">
          Flip the card, recall the answer, then self-rate.
        </p>
      )}
    </div>
  );
};

export default FlashcardQuizMode;
