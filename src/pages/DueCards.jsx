import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Layers3, Loader2, Play, Sparkles } from 'lucide-react';
import { MetaTags } from '../components/ui';
import { useSpacedRepetition, useStudyData } from '../hooks';

const Flashcard = lazy(() => import('../components/features/Flashcard'));

const DueCards = () => {
  const navigate = useNavigate();
  const { decks } = useStudyData();
  const { dueCards, dueCount, estimatedMinutes, reviewCard, formatNextReview } =
    useSpacedRepetition(decks);
  const [isReviewing, setIsReviewing] = useState(false);

  const handleGrade = (card, rating) => {
    const nextState = reviewCard(card, rating);
    return nextState
      ? {
          nextReviewDate: nextState.nextReviewDate,
          message: `Next review: ${formatNextReview(nextState.nextReviewDate)}`,
        }
      : null;
  };

  const isComplete = isReviewing && dueCount === 0;

  return (
    <>
      <MetaTags
        title="Cards due today"
        description="Review flashcards that are due today using spaced repetition."
      />
      <div className="flex-1 w-full px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>

          <section className="glass-card">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
                  Spaced repetition
                </p>
                <h1 className="mt-3 text-3xl font-heading font-bold md:text-4xl">
                  Cards due today
                </h1>
                <p className="mt-2 text-gray-400">
                  Review the cards your memory is most ready to strengthen.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsReviewing(true)}
                disabled={!dueCount}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={!dueCount ? {} : { scale: 1.02 }}
                whileTap={!dueCount ? {} : { scale: 0.97 }}
              >
                <Play className="h-4 w-4" />
                Start Review
              </motion.button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-surface/50 p-5">
                <Layers3 className="mb-3 h-5 w-5 text-accent" />
                <p className="text-3xl font-heading font-bold">{dueCount}</p>
                <p className="text-sm text-gray-400">cards due today</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-surface/50 p-5">
                <Clock className="mb-3 h-5 w-5 text-warning" />
                <p className="text-3xl font-heading font-bold">{estimatedMinutes} min</p>
                <p className="text-sm text-gray-400">estimated study time</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-surface/50 p-5">
                <Sparkles className="mb-3 h-5 w-5 text-success" />
                <p className="text-3xl font-heading font-bold">
                  {new Set(dueCards.map((card) => card.deckId)).size}
                </p>
                <p className="text-sm text-gray-400">decks represented</p>
              </div>
            </div>
          </section>

          {isComplete ? (
            <section className="glass-card text-center">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-success" />
              <h2 className="text-2xl font-heading font-bold">All caught up.</h2>
              <p className="mt-2 text-gray-400">
                Your next set of cards will appear here when they are due.
              </p>
            </section>
          ) : isReviewing ? (
            <section className="glass-card">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-accent" />
                  </div>
                }
              >
                <Flashcard cards={dueCards} onGrade={handleGrade} />
              </Suspense>
            </section>
          ) : (
            <section className="glass-card">
              <h2 className="text-xl font-heading font-bold">Due queue</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {dueCards.length ? (
                  dueCards.slice(0, 8).map((card) => (
                    <article
                      key={card.srsKey}
                      className="rounded-xl border border-white/10 bg-surface/40 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {card.deckName}
                      </p>
                      <p className="mt-2 font-semibold text-white">{card.front}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Repetitions: {card.repetitions} - Ease: {card.easeFactor.toFixed(2)}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">
                    No cards are due today. Generate or save a deck to start building a schedule.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default DueCards;
