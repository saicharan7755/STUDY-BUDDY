import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

const QuizBlock = ({ questions, onGenerateMore }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!questions || questions.length === 0) return null;

  const handleSelect = (qIndex, option) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const score = Object.keys(answers).reduce((acc, qIndex) => {
    return acc + (answers[qIndex] === questions[qIndex].correct ? 1 : 0);
  }, 0);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
      {questions.map((q, i) => {
        const selectedOption = answers[i];

        return (
          <div key={q.id || i} className="glass-card flex flex-col gap-4">
            <h4 className="text-lg font-medium">
              <span className="text-accent-light mr-2 font-heading">{i + 1}.</span>
              {q.question}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {q.options.map((opt, optIndex) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === q.correct;

                let optionClass =
                  'bg-surface/50 border-white/10 hover:border-accent hover:bg-white/5 cursor-pointer';

                if (showResults) {
                  if (isCorrect)
                    optionClass = 'bg-success/20 border-success text-white ring-1 ring-success';
                  else if (isSelected && !isCorrect)
                    optionClass = 'bg-danger/20 border-danger text-white';
                  else optionClass = 'bg-surface/30 border-white/5 opacity-50 cursor-default';
                } else if (isSelected) {
                  optionClass = 'bg-accent/20 border-accent ring-1 ring-accent';
                }

                return (
                  <div
                    key={optIndex}
                    onClick={() => handleSelect(i, opt)}
                    className={clsx(
                      'p-4 rounded-xl border transition-all duration-200 flex items-center justify-between',
                      optionClass
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-black/20 flex items-center justify-center text-xs font-bold text-gray-400">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                    </div>
                    {showResults && isCorrect && <CheckCircle2 className="w-5 h-5 text-success" />}
                    {showResults && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-danger" />
                    )}
                  </div>
                );
              })}
            </div>

            {showResults && (
              <div
                className={clsx(
                  'mt-4 p-4 rounded-lg text-sm font-medium flex gap-3',
                  selectedOption === q.correct
                    ? 'bg-success/10 text-success-light'
                    : 'bg-danger/10 text-danger-light'
                )}
              >
                <div className="flex-1">
                  <strong>Explanation: </strong> {q.explanation}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-col items-center gap-4 mt-6">
        {!showResults ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="bg-accent hover:bg-accent-light text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-accent/25"
          >
            Submit Answers
          </button>
        ) : (
          <div className="glass-card w-full text-center py-8 bg-surface/80 flex flex-col items-center gap-4 border-accent/20">
            <h3 className="text-2xl font-heading font-bold">
              You scored <span className="text-accent text-3xl">{score}</span> out of{' '}
              {questions.length}
            </h3>
            <p className="text-gray-300">
              {score === questions.length
                ? "Perfect recall! You're ready."
                : score >= questions.length / 2
                  ? 'Great job, almost there!'
                  : 'Keep reviewing, active recall takes practice.'}
            </p>
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              {onGenerateMore && (
                <button
                  onClick={onGenerateMore}
                  className="bg-white/10 hover:bg-accent px-6 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Generate More Questions
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(QuizBlock);
