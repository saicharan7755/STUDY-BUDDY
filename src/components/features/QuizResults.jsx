import { RotateCcw, Share2, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const getGradeLetter = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins ? `${mins}m ${secs}s` : `${secs}s`;
};

const QuizResults = ({ results, timeTakenSeconds, onRetryWrong, onRetake, onShare }) => {
  const total = Math.max(1, results.length);
  const correct = results.filter((item) => item.isCorrect).length;
  const incorrect = results.filter((item) => !item.isCorrect);
  const percentage = Math.round((correct / total) * 100);
  const grade = getGradeLetter(percentage);

  return (
    <motion.div
      className="glass-card w-full bg-surface/80"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            Quiz complete
          </p>
          <h3 className="mt-3 text-4xl font-heading font-bold">
            {percentage}% <span className="text-accent">Grade {grade}</span>
          </h3>
          <p className="mt-2 text-gray-400">
            {correct} of {results.length} correct in {formatDuration(timeTakenSeconds)}.
          </p>
        </div>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
          <Target className="h-9 w-9 text-accent" />
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-heading text-lg font-bold">Questions to review</h4>
        {incorrect.length ? (
          <div className="mt-3 space-y-3">
            {incorrect.map((item, index) => (
              <article
                key={`${item.id}-${index}`}
                className="rounded-xl border border-danger/30 bg-danger/10 p-4"
              >
                <p className="text-sm font-semibold text-white">{item.prompt}</p>
                <p className="mt-2 text-sm text-gray-300">
                  Your answer:{' '}
                  <span className="text-danger-light">{item.userAnswer || 'Skipped'}</span>
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Correct answer: <span className="text-success">{item.correctAnswer}</span>
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
            No wrong answers. Nicely done.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <motion.button
          type="button"
          onClick={onRetake}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw className="h-4 w-4" />
          Retake quiz
        </motion.button>
        <motion.button
          type="button"
          onClick={onRetryWrong}
          disabled={!incorrect.length}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={!incorrect.length ? {} : { scale: 1.02 }}
          whileTap={!incorrect.length ? {} : { scale: 0.97 }}
        >
          <RotateCcw className="h-4 w-4" />
          Retry wrong answers
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onShare({ percentage, grade, correct, total: results.length })}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Share2 className="h-4 w-4" />
          Share score
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QuizResults;
