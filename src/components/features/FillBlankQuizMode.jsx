import { useState } from 'react';
import { motion } from 'framer-motion';

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');

const FillBlankQuizMode = ({ item, onAnswer }) => {
  const [answer, setAnswer] = useState('');

  const submit = () => {
    const normalizedAnswer = normalize(answer);
    const accepted = item.acceptedAnswers.map(normalize);
    onAnswer({
      userAnswer: answer,
      isCorrect: accepted.includes(normalizedAnswer),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-white/10 bg-surface/60 p-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Fill in the blank
        </p>
        <h3 className="text-2xl font-heading font-bold leading-relaxed text-white">
          {item.prompt}
        </h3>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && answer.trim()) submit();
          }}
          placeholder="Type the missing word..."
          className="min-h-[48px] flex-1 rounded-xl border border-white/10 bg-midnight px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-accent"
        />
        <motion.button
          type="button"
          onClick={submit}
          disabled={!answer.trim()}
          className="min-h-[48px] rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={!answer.trim() ? {} : { scale: 1.02 }}
          whileTap={!answer.trim() ? {} : { scale: 0.97 }}
        >
          Submit
        </motion.button>
      </div>
    </div>
  );
};

export default FillBlankQuizMode;
