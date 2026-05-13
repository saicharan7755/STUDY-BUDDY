import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Shuffle, Undo2, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

const Flashcard = ({ cards, onGrade, isSavingGrade = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState([...cards]);

  // Reset state when new cards arrive
  useEffect(() => {
    setShuffledCards([...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    window.speechSynthesis.cancel();
  }, [cards]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const speakText = useCallback((text, e) => {
    e.stopPropagation(); // Prevent card from flipping
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const nextCard = () => {
    if (currentIndex < shuffledCards.length - 1) {
      window.speechSynthesis.cancel();
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150); // slight delay for flip un-animation
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      window.speechSynthesis.cancel();
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  const shuffle = () => {
    const newCards = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(newCards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        nextCard();
      } else if (e.code === 'ArrowLeft') {
        prevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, shuffledCards.length]);

  if (!shuffledCards.length) return null;

  const card = shuffledCards[currentIndex];
  const gradeActions = [
    { id: 'again', label: 'Again', className: 'border-danger/40 text-danger-light hover:bg-danger/10' },
    { id: 'hard', label: 'Hard', className: 'border-warning/40 text-warning hover:bg-warning/10' },
    { id: 'good', label: 'Good', className: 'border-accent/40 text-accent-light hover:bg-accent/10' },
    { id: 'easy', label: 'Easy', className: 'border-success/40 text-success hover:bg-success/10' },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* 3D Scene */}
      <div
        className="relative w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer"
        onClick={handleFlip}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleFlip();
        }}
        role="button"
        tabIndex={0}
        aria-label="Flip card"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id || currentIndex}
            className="w-full h-full transform-style-3d absolute"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateY: isFlipped ? 180 : 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
          {/* Front */}
          <motion.div
            className="absolute inset-0 backface-hidden glass-card bg-surface/80 flex flex-col items-center justify-center p-8 border-2 border-white/5 hover:border-accent/30 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                speakText(card.front, e);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-accent transition-colors rounded-full hover:bg-white/5"
              title="Listen"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <Volume2 className="w-5 h-5" />
            </motion.button>
            <h3 className="text-2xl md:text-3xl font-heading font-semibold text-white break-words">
              {card.front}
            </h3>
            <span className="absolute bottom-4 text-xs text-gray-500 font-medium tracking-widest uppercase">
              Click or Space to Flip
            </span>
          </motion.div>

          {/* Back */}
          <motion.div
            className="absolute inset-0 backface-hidden glass-card bg-accent/10 flex flex-col items-center justify-center p-8 border-2 border-accent/40 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                speakText(card.back, e);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-accent transition-colors rounded-full hover:bg-white/5"
              title="Listen"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <Volume2 className="w-5 h-5" />
            </motion.button>
            <p className="text-xl md:text-2xl font-sans text-gray-100 leading-relaxed overflow-y-auto break-words">
              {card.back}
            </p>
          </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between w-full mt-8 px-4">
        <motion.button
          onClick={shuffle}
          className="p-3 min-h-[44px] min-w-[44px] rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-target"
          title="Shuffle"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          <Shuffle className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-6">
          <motion.button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="p-3 min-h-[44px] min-w-[44px] rounded-full bg-surface border border-white/10 hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-target"
            whileHover={currentIndex === 0 ? {} : { scale: 1.06 }}
            whileTap={currentIndex === 0 ? {} : { scale: 0.94 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <span className="text-sm font-medium font-heading text-gray-300">
            {currentIndex + 1} / {shuffledCards.length}
          </span>

          <motion.button
            onClick={nextCard}
            disabled={currentIndex === shuffledCards.length - 1}
            className="p-3 min-h-[44px] min-w-[44px] rounded-full bg-surface border border-white/10 hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-target"
            whileHover={currentIndex === shuffledCards.length - 1 ? {} : { scale: 1.06 }}
            whileTap={currentIndex === shuffledCards.length - 1 ? {} : { scale: 0.94 }}
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        <motion.button
          onClick={() => setIsFlipped(false)}
          className="p-3 min-h-[44px] min-w-[44px] rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-target"
          title="Reset Flip"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          <Undo2 className="w-5 h-5" />
        </motion.button>
      </div>
      {typeof onGrade === 'function' && (
        <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {gradeActions.map((action) => (
            <motion.button
              key={action.id}
              type="button"
              disabled={isSavingGrade}
              onClick={() => onGrade(card, action.id)}
              className={clsx(
                'rounded-xl border px-4 py-3 min-h-[44px] text-sm font-semibold leading-none transition-colors disabled:opacity-50 touch-target',
                action.className
              )}
              whileHover={isSavingGrade ? {} : { y: -2 }}
              whileTap={isSavingGrade ? {} : { scale: 0.97 }}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(Flashcard);
