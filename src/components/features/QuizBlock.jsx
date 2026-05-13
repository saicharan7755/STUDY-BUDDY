import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import FlashcardQuizMode from './FlashcardQuizMode';
import FillBlankQuizMode from './FillBlankQuizMode';
import MultipleChoiceQuizMode from './MultipleChoiceQuizMode';
import QuizModeSelector from './QuizModeSelector';
import QuizProgress from './QuizProgress';
import QuizResults from './QuizResults';
import TrueFalseQuizMode from './TrueFalseQuizMode';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const getCardText = (card, field) => String(card?.[field] || '').trim();

const getKeyword = (answer) => {
  const words = String(answer || '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 5);
  return words.sort((a, b) => b.length - a.length)[0] || words[0] || '';
};

const buildFlashcardItems = (cards) =>
  cards.map((card, index) => ({
    id: card.id || `flashcard-${index}`,
    mode: 'flashcard',
    prompt: getCardText(card, 'front'),
    correctAnswer: getCardText(card, 'back'),
  }));

const buildMultipleChoiceItems = (cards) =>
  cards
    .filter((card) => getCardText(card, 'front') && getCardText(card, 'back'))
    .map((card, index) => {
      const correctAnswer = getCardText(card, 'back');
      const distractors = shuffle(
        cards
          .filter((other) => other !== card)
          .map((other) => getCardText(other, 'back'))
          .filter((answer) => answer && answer !== correctAnswer)
      ).slice(0, 3);

      return {
        id: card.id || `multiple-choice-${index}`,
        mode: 'multiple-choice',
        prompt: getCardText(card, 'front'),
        correctAnswer,
        options: shuffle([correctAnswer, ...distractors]).slice(0, 4),
      };
    })
    .filter((item) => item.options.length === 4);

const buildTrueFalseItems = (trueFalseQuestions, fallbackQuestions) => {
  const aiItems = (trueFalseQuestions || []).map((item, index) => ({
    id: item.id || `true-false-${index}`,
    mode: 'true-false',
    prompt: item.statement || item.question,
    correctAnswer: item.answer ? 'True' : 'False',
    correctValue: Boolean(item.answer),
  }));

  if (aiItems.length) return aiItems;

  return (fallbackQuestions || []).map((item, index) => ({
    id: item.id || `true-false-fallback-${index}`,
    mode: 'true-false',
    prompt: item.explanation || item.question,
    correctAnswer: 'True',
    correctValue: true,
  }));
};

const buildFillBlankItems = (cards) =>
  cards
    .map((card, index) => {
      const answer = getCardText(card, 'back');
      const keyword = getKeyword(answer);
      if (!keyword) return null;

      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prompt = answer.replace(new RegExp(escaped, 'i'), '_____');

      return {
        id: card.id || `fill-blank-${index}`,
        mode: 'fill-blank',
        prompt,
        correctAnswer: keyword,
        acceptedAnswers: [keyword],
      };
    })
    .filter(Boolean);

const getModeLabel = (mode) => {
  if (mode === 'flashcard') return 'Flashcard Mode';
  if (mode === 'multiple-choice') return 'Multiple Choice';
  if (mode === 'true-false') return 'True or False';
  return 'Fill in the Blank';
};

const QuizBlock = ({ questions, cards = [], trueFalseQuestions = [], onGenerateMore }) => {
  const [mode, setMode] = useState(null);
  const [quizItems, setQuizItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [shareMessage, setShareMessage] = useState('');

  const modeItems = useMemo(
    () => ({
      flashcard: buildFlashcardItems(cards),
      'multiple-choice': buildMultipleChoiceItems(cards),
      'true-false': buildTrueFalseItems(trueFalseQuestions, questions),
      'fill-blank': buildFillBlankItems(cards),
    }),
    [cards, questions, trueFalseQuestions]
  );

  const availableModes = Object.entries(modeItems)
    .filter(([, items]) => items.length > 0)
    .map(([key]) => key);

  const startMode = (nextMode, items = modeItems[nextMode]) => {
    setMode(nextMode);
    setQuizItems(shuffle(items).slice(0, 10));
    setCurrentIndex(0);
    setResults([]);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setShareMessage('');
  };

  const handleAnswer = ({ userAnswer, isCorrect }) => {
    const item = quizItems[currentIndex];
    const nextResults = [
      ...results,
      {
        ...item,
        userAnswer,
        isCorrect,
      },
    ];

    setResults(nextResults);

    if (currentIndex >= quizItems.length - 1) {
      setFinishedAt(Date.now());
    } else {
      setCurrentIndex((index) => index + 1);
    }
  };

  const handleRetake = () => {
    if (!mode) return;
    startMode(mode);
  };

  const handleRetryWrong = () => {
    const wrongItems = results.filter((item) => !item.isCorrect);
    if (!wrongItems.length || !mode) return;
    startMode(mode, wrongItems);
  };

  const handleShare = async ({ percentage, grade, correct, total }) => {
    const text = `I scored ${percentage}% (${grade}) on ${getModeLabel(mode)}: ${correct}/${total}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Study Buddy quiz score', text });
        setShareMessage('Score shared.');
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage('Score copied to clipboard.');
      }
    } catch {
      setShareMessage('Sharing was cancelled.');
    }
  };

  if (!availableModes.length) {
    return (
      <div className="glass-card text-center">
        <p className="text-gray-400">No quiz material is available yet.</p>
        {onGenerateMore && (
          <button
            type="button"
            onClick={onGenerateMore}
            className="mt-4 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-light"
          >
            Generate questions
          </button>
        )}
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h3 className="text-2xl font-heading font-bold">Choose a quiz mode</h3>
          <p className="mt-2 text-sm text-gray-400">
            Each mode tests the same topic from a different angle.
          </p>
        </div>
        <QuizModeSelector availableModes={availableModes} onSelect={startMode} />
      </div>
    );
  }

  if (finishedAt) {
    const timeTakenSeconds = Math.max(1, Math.round((finishedAt - startedAt) / 1000));
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
        <QuizResults
          results={results}
          timeTakenSeconds={timeTakenSeconds}
          onRetryWrong={handleRetryWrong}
          onRetake={handleRetake}
          onShare={handleShare}
        />
        {shareMessage && <p className="text-center text-sm text-gray-400">{shareMessage}</p>}
        <button
          type="button"
          onClick={() => setMode(null)}
          className="mx-auto text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          Choose another mode
        </button>
      </div>
    );
  }

  const activeItem = quizItems[currentIndex];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            {getModeLabel(mode)}
          </p>
          <h3 className="mt-2 text-2xl font-heading font-bold">Quiz in progress</h3>
        </div>
        <motion.button
          type="button"
          onClick={() => setMode(null)}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw className="h-4 w-4" />
          Switch mode
        </motion.button>
      </div>

      <QuizProgress current={currentIndex + 1} total={quizItems.length} />

      <div className="glass-card">
        {mode === 'flashcard' && <FlashcardQuizMode item={activeItem} onAnswer={handleAnswer} />}
        {mode === 'multiple-choice' && (
          <MultipleChoiceQuizMode item={activeItem} onAnswer={handleAnswer} />
        )}
        {mode === 'true-false' && <TrueFalseQuizMode item={activeItem} onAnswer={handleAnswer} />}
        {mode === 'fill-blank' && <FillBlankQuizMode item={activeItem} onAnswer={handleAnswer} />}
      </div>
    </div>
  );
};

export default React.memo(QuizBlock);
