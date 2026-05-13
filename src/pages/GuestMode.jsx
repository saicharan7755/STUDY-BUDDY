import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection as firestoreCollection,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import { Loader2, LogIn, Save, Sparkles } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { generateFlashcards } from '../services/ai';
import {
  clearGuestFlashcards,
  loadGuestFlashcards,
  saveGuestFlashcards,
} from '../services/guestFlashcards';
import { persistGeneratedCards } from '../services/cardRepository';
import MetaTags from '../components/MetaTags';

const GuestMode = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn } = useAuth();
  const cachedCards = useMemo(() => loadGuestFlashcards(), []);

  const [topic, setTopic] = useState(cachedCards[0]?.sourceText || '');
  const [cards, setCards] = useState(cachedCards);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveGuestFlashcards(cards);
  }, [cards]);

  const hasCards = cards.length > 0;

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
    if (!topic.trim()) return;
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateFlashcards(topic);
      const generated = (result.flashcards || []).map((card, index) => ({
        id: card.id || `guest-${Date.now()}-${index}`,
        front: card.front,
        back: card.back,
        sourceText: topic.trim(),
        createdAt: new Date().toISOString(),
      }));
      setCards(generated);
    } catch (e) {
      setError(e.message || 'Failed to generate flashcards.');
    } finally {
      setIsGenerating(false);
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

      clearGuestFlashcards();
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
              Paste any topic to generate flashcards without creating an account.
            </p>
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Paste chapter notes or topic details..."
              className="mt-6 w-full h-40 bg-surface/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            {error && (
              <p className="mt-3 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger-light">
                {error}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isGenerating || !topic.trim()}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-light disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate flashcards
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!hasCards || isSaving}
                onClick={handleSaveToAccount}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10 disabled:opacity-60"
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
              </button>
            </div>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-heading font-bold">Preview cards</h2>
            <div className="mt-4 space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {hasCards ? (
                cards.map((card) => (
                  <article key={card.id} className="rounded-xl border border-white/10 bg-surface/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500">Front</p>
                    <p className="text-sm font-semibold text-white">{card.front}</p>
                    <p className="mt-3 text-xs uppercase tracking-wider text-gray-500">Back</p>
                    <p className="text-sm text-gray-300">{card.back}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-gray-500">Generated cards will appear here.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default GuestMode;
