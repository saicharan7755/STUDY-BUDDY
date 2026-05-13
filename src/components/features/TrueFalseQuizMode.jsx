import { motion } from 'framer-motion';

const TrueFalseQuizMode = ({ item, onAnswer }) => (
  <div className="flex flex-col gap-6">
    <div className="rounded-xl border border-white/10 bg-surface/60 p-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        True or false
      </p>
      <h3 className="text-2xl font-heading font-bold leading-relaxed text-white">{item.prompt}</h3>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {[true, false].map((choice) => (
        <motion.button
          key={String(choice)}
          type="button"
          onClick={() =>
            onAnswer({
              userAnswer: choice ? 'True' : 'False',
              isCorrect: choice === item.correctValue,
            })
          }
          className="min-h-[52px] rounded-xl border border-white/10 bg-surface/50 px-5 py-3 text-lg font-bold text-white transition-colors hover:border-accent hover:bg-accent/10"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          {choice ? 'True' : 'False'}
        </motion.button>
      ))}
    </div>
  </div>
);

export default TrueFalseQuizMode;
