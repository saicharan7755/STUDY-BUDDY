import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  addDoc,
  collection as firestoreCollection,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import { Download, Loader2, LogIn, Save, Sparkles } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { useAuth, useLocalStorage, useStudyData } from '../hooks';
import {
  createGuestStudyState,
  generateFlashcards,
  GUEST_STUDY_STATE_KEY,
  persistGeneratedCards,
} from '../services';
import { MetaTags, FileUpload, ExportModal } from '../components/ui';
import { getCharacterCountState, TEXT_LIMITS, validateStudyText } from '../utils';
import { readFlashcardsFromShareParams } from '../utils/exportUtils';

const GuestMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signIn } = useAuth();
  const { saveDeck } = useStudyData();
  const [persistedState, setPersistedState] = useLocalStorage(
    GUEST_STUDY_STATE_KEY,
    createGuestStudyState()
  );

  const [topic, setTopic] = useState(persistedState.topic || '');
  const [count, setCount] = useState(persistedState.count || 10);
  const [cards, setCards] = useState(
    Array.isArray(persistedState.cards) ? persistedState.cards : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isFromFile, setIsFromFile] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleTextExtracted = (text) => {
    setTopic(text);
    setIsFromFile(text.length > 0);
    setError(null);
  };

  useEffect(() => {
    const sharedDeck = readFlashcardsFromShareParams(location.search);
    if (sharedDeck?.cards?.length) {
      const timeoutId = window.setTimeout(() => {
        setTopic(sharedDeck.deckName);
        setCards(sharedDeck.cards);
        setCount(Math.min(Math.max(sharedDeck.cards.length || 10, 3), 50));
        setPersistedState(
          createGuestStudyState({
            topic: sharedDeck.deckName,
            count: sharedDeck.cards.length || 10,
            cards: sharedDeck.cards,
          })
        );
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const loadedDeck = location.state?.loadedDeck;
    if (loadedDeck) {
      const timeoutId = window.setTimeout(() => {
        setTopic(loadedDeck.name);
        setCards(loadedDeck.cards);
        setCount(Math.min(Math.max(loadedDeck.cards.length || 10, 3), 50));
        setPersistedState(
          createGuestStudyState({
            topic: loadedDeck.name,
            count: loadedDeck.cards.length || 10,
            cards: loadedDeck.cards,
          })
        );
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [location.search, location.state, setPersistedState]);

  const hasCards = cards.length > 0;
  const validationErrors = validateStudyText(topic, count);
  const isValid = validationErrors.length === 0;
  const charState = getCharacterCountState(topic.length, {
    min: TEXT_LIMITS.flashcardMin,
    max: TEXT_LIMITS.flashcardMax,
  });
  const charClassName = {
    danger: 'text-danger',
    warning: 'text-warning',
    success: 'text-success',
  }[charState];

  useEffect(() => {
    setPersistedState(createGuestStudyState({ topic, count, cards }));
  }, [cards, count, setPersistedState, topic]);

  const sourceText = useMemo(
    () => cards.find((card) => typeof card.sourceText === 'string')?.sourceText || topic.trim(),
    [cards, topic]
  );

  const waitForAuthenticatedUser = async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (auth.currentUser?.uid) return auth.currentUser.uid;
      await new Promise((resolve) => {
        window.setTimeout(resolve, 100);
      });
    }
    return null;
  };

  const handleGenerate = async () => {
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '));
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await generateFlashcards(topic, count);
      const generated = (result.flashcards || []).map((card, index) => ({
        id: card.id || `guest-${Date.now()}-${index}`,
        front: card.front,
        back: card.back,
        sourceText: topic.trim(),
        createdAt: new Date().toISOString(),
      }));

      if (!generated.length) {
        throw new Error('Received empty or invalid AI response. Please try again.');
      }

      setCards(generated);
      saveDeck(topic.trim(), generated);
    } catch (e) {
      setError(e.message || 'Failed to generate flashcards.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToAccount = async () => {
    if (!hasCards) return;
    setError(null);
    setIsSaving(true);
    try {
      if (!isAuthenticated) {
        await signIn();
      }

      const uid = auth.currentUser?.uid || user?.uid || (await waitForAuthenticatedUser());
      if (!uid) throw new Error('Sign in required before saving cards.');

      const sessionRef = await addDoc(firestoreCollection(db, `users/${uid}/sessions`), {
        subject: 'Guest Flashcards',
        syllabus: sourceText || 'Guest generated flashcards',
        difficulty: 'Balanced',
        timeAllocated: '1hr',
        studyPlan: { topics: [{ id: 'guest-topic', title: sourceText || 'Guest Topic' }] },
        progress: { completedTopics: [], quizScores: {} },
        createdAt: firestoreServerTimestamp(),
        lastAccessedAt: firestoreServerTimestamp(),
        completionPercentage: 0,
      });

      await persistGeneratedCards({
        uid,
        sessionId: sessionRef.id,
        topicId: 'guest-topic',
        cards,
      });

      navigate(`/session/${sessionRef.id}`);
    } catch (e) {
      setError(e.message || 'Unable to save cards to your account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Try now - Guest flashcards"
        description="Generate flashcards instantly without signing in. Save to your account anytime."
      />
      <div className="flex-1 w-full px-6 py-10">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2">
          <section className="glass-card">
            <h1 className="text-3xl font-heading font-bold">Try it now</h1>
            <p className="text-gray-400 mt-2">
              Upload your study materials or paste text to generate flashcards without creating an account.
            </p>
            <div className="mt-6 space-y-4">
              <FileUpload onTextExtracted={handleTextExtracted} />
              <div>
                <label htmlFor="topic-text" className="block text-sm font-medium text-gray-300 mb-2">
                  Topic Content {isFromFile && <span className="text-accent">(from file)</span>}
                </label>
                <textarea
                  id="topic-text"
                  value={topic}
                  onChange={(event) => {
                    if (!isFromFile) {
                      setTopic(event.target.value);
                      if (error) setError(null);
                    }
                  }}
                  placeholder={
                    isFromFile
                      ? 'Text extracted from uploaded file...'
                      : 'Paste chapter notes or topic details...'
                  }
                  readOnly={isFromFile}
                  maxLength={TEXT_LIMITS.flashcardMax}
                  className={`w-full min-h-40 bg-surface/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y transition-all ${
                    isFromFile ? 'cursor-not-allowed opacity-75' : ''
                  }`}
                />
                <div className="mt-2 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <span className={`font-medium ${charClassName}`}>
                      {topic.length.toLocaleString()}
                    </span>
                    <span className="text-gray-400">
                      {' '}
                      / {TEXT_LIMITS.flashcardMax.toLocaleString()} characters
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Min: {TEXT_LIMITS.flashcardMin} chars - Max:{' '}
                    {TEXT_LIMITS.flashcardMax.toLocaleString()} chars
                  </div>
                </div>
                {!isValid && topic.length > 0 && (
                  <p className="mt-2 text-xs text-warning" role="status">
                    {validationErrors[0]}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="card-count" className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Flashcards
                </label>
                <select
                  id="card-count"
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  className="w-full bg-surface/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent"
                >
                  {[3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((num) => (
                    <option key={num} value={num}>
                      {num} flashcards
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && !isLoading && (
              <div className="mt-4 rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger-light">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="mt-2 text-xs underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <motion.button
                type="button"
                disabled={isLoading || !isValid}
                onClick={handleGenerate}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-target"
                whileHover={isLoading || !isValid ? {} : { scale: 1.02 }}
                whileTap={isLoading || !isValid ? {} : { scale: 0.97 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate flashcards
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                disabled={!hasCards || isSaving}
                onClick={handleSaveToAccount}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10 disabled:opacity-60 touch-target"
                whileHover={!hasCards || isSaving ? {} : { scale: 1.02 }}
                whileTap={!hasCards || isSaving ? {} : { scale: 0.97 }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving
                  </>
                ) : isAuthenticated ? (
                  <>
                    <Save className="h-4 w-4" /> Save to account
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Sign in & save
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                disabled={!hasCards}
                onClick={() => setIsExportOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 font-semibold text-accent-light hover:bg-accent/20 disabled:opacity-60 disabled:cursor-not-allowed touch-target"
                whileHover={!hasCards ? {} : { scale: 1.02 }}
                whileTap={!hasCards ? {} : { scale: 0.97 }}
              >
                <Download className="h-4 w-4" /> Export
              </motion.button>
            </div>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-heading font-bold">Preview cards</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[28rem] overflow-y-auto pr-1">
              {isLoading ? (
                [...Array(Math.min(count, 6))].map((_, index) => (
                  <motion.div
                    key={index}
                    className="rounded-xl border border-white/10 bg-surface/40 p-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                  >
                    <motion.div
                      className="mb-3 h-3 w-16 rounded-full bg-white/10"
                      animate={{ opacity: [0.35, 0.8, 0.35] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="h-4 w-4/5 rounded-full bg-white/10"
                      animate={{ opacity: [0.35, 0.8, 0.35] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.05 }}
                    />
                    <motion.div
                      className="mb-3 mt-5 h-3 w-14 rounded-full bg-white/10"
                      animate={{ opacity: [0.35, 0.8, 0.35] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    />
                    <motion.div
                      className="h-4 w-full rounded-full bg-white/10"
                      animate={{ opacity: [0.35, 0.8, 0.35] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                    />
                  </motion.div>
                ))
              ) : hasCards ? (
                cards.map((card, index) => (
                  <motion.article
                    key={card.id}
                    className="rounded-xl border border-white/10 bg-surface/40 p-4 break-words"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, delay: index * 0.045, ease: 'easeOut' }}
                    whileHover={{ y: -2 }}
                  >
                    <p className="text-xs uppercase tracking-wider text-gray-500">Front</p>
                    <p className="text-sm font-semibold text-white">{card.front}</p>
                    <p className="mt-3 text-xs uppercase tracking-wider text-gray-500">Back</p>
                    <p className="text-sm text-gray-300">{card.back}</p>
                  </motion.article>
                ))
              ) : (
                <p className="text-sm text-gray-500">Generated cards will appear here.</p>
              )}
            </div>
          </section>
        </div>
      </div>
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        cards={cards}
        deckName={topic.trim() || 'Guest Flashcards'}
      />
    </>
  );
};

export default GuestMode;
