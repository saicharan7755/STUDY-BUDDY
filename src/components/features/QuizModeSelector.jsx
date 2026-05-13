import { BookOpenCheck, CheckSquare, Layers3, TextCursorInput } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const MODES = [
  {
    id: 'flashcard',
    title: 'Flashcard Mode',
    description: 'Flip each card and self-rate correct or incorrect.',
    icon: Layers3,
  },
  {
    id: 'multiple-choice',
    title: 'Multiple Choice',
    description: 'Pick the right answer from four deck-based options.',
    icon: BookOpenCheck,
  },
  {
    id: 'true-false',
    title: 'True or False',
    description: 'Judge AI-generated statements about this topic.',
    icon: CheckSquare,
  },
  {
    id: 'fill-blank',
    title: 'Fill in the Blank',
    description: 'Type the missing keyword from each answer.',
    icon: TextCursorInput,
  },
];

const QuizModeSelector = ({ availableModes = [], onSelect }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {MODES.map((mode) => {
      const Icon = mode.icon;
      const isAvailable = availableModes.includes(mode.id);

      return (
        <motion.button
          key={mode.id}
          type="button"
          disabled={!isAvailable}
          onClick={() => onSelect(mode.id)}
          className={clsx(
            'rounded-xl border p-5 text-left transition-all min-h-[132px]',
            isAvailable
              ? 'border-white/10 bg-surface/50 hover:border-accent hover:bg-accent/10'
              : 'border-white/5 bg-surface/20 opacity-50 cursor-not-allowed'
          )}
          whileHover={isAvailable ? { y: -2 } : {}}
          whileTap={isAvailable ? { scale: 0.98 } : {}}
        >
          <Icon className="mb-4 h-6 w-6 text-accent" />
          <h3 className="font-heading text-lg font-bold text-white">{mode.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{mode.description}</p>
        </motion.button>
      );
    })}
  </div>
);

export default QuizModeSelector;
