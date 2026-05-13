import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const MultipleChoiceQuizMode = ({ item, onAnswer }) => (
  <div className="flex flex-col gap-5">
    <h3 className="text-2xl font-heading font-bold text-white">{item.prompt}</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      {item.options.map((option, index) => (
        <motion.button
          key={`${option}-${index}`}
          type="button"
          onClick={() =>
            onAnswer({
              userAnswer: option,
              isCorrect: option === item.correctAnswer,
            })
          }
          className={clsx(
            'flex min-h-[64px] items-center justify-between rounded-xl border border-white/10 bg-surface/50 p-4 text-left transition-colors hover:border-accent hover:bg-accent/10'
          )}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-black/20 text-xs font-bold text-gray-400">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-sm font-semibold text-white">{option}</span>
          </span>
          <CheckCircle2 className="h-4 w-4 text-transparent" />
        </motion.button>
      ))}
    </div>
  </div>
);

export default MultipleChoiceQuizMode;
