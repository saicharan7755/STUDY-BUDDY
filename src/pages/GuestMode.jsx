import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  addDoc,
  collection as firestoreCollection,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import { Loader2, LogIn, Save, Sparkles } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { useAuth, useStudyData } from '../hooks';
import { generateFlashcards, persistGeneratedCards } from '../services';
import { MetaTags, FileUpload } from '../components/ui';

const GuestMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signIn } = useAuth();
  const { saveDeck, loadDeck } = useStudyData();

  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isFromFile, setIsFromFile] = useState(false);

  const validateInput = (text, numCards) => {
    const errors = [];

    if (!text.trim()) {
      errors.push('Text cannot be empty');
    }

    if (text.length < 50) {
      errors.push('Text must be at least 50 characters long');
    }

    if (text.length > 10000) {
      errors.push('Text cannot exceed 10,000 characters');
    }

    // Check for meaningful content: should have some letters, spaces, and not just symbols/numbers
    const hasLetters = /[a-zA-Z]/.test(text);
    const hasSpaces = /\s/.test(text);
    const wordCount = text.trim().split(/\s+/).length;
    const symbolRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;

    if (!hasLetters || !hasSpaces || wordCount < 5 || symbolRatio > 0.5) {
      errors.push('Text appears to be random or non-meaningful. Please provide coherent content.');
    }

    if (numCards < 3 || numCards > 50) {
      errors.push('Number of flashcards must be between 3 and 50');
    }

    return errors;
  };

  const handleTextExtracted = (text) => {
    setTopic(text);
    setIsFromFile(text.length > 0);
    setError(null);
  };

  useEffect(() => {
    const loadedDeck = location.state?.loadedDeck;
    if (loadedDeck) {
      setTopic(loadedDeck.name);
      setCards(loadedDeck.cards);
    }
  }, [location.state]);

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
    const validationErrors = validateInput(topic, count);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
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
      // Save as a deck
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
                    }
                  }}
                  placeholder={isFromFile ? "Text extracted from uploaded file..." : "Paste chapter notes or topic details..."}
                  readOnly={isFromFile}
                  className={`w-full h-40 bg-surface/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none ${
                    isFromFile ? 'cursor-not-allowed opacity-75' : ''
                  }`}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">
                    <span className={`font-medium ${
                      topic.length < 50 ? 'text-danger' :
                      topic.length > 8000 ? 'text-warning' :
                      topic.length > 10000 ? 'text-danger' : 'text-success'
                    }`}>
                      {topic.length.toLocaleString()}
                    </span>
                    <span className="text-gray-400"> / 10,000 characters</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Min: 50 chars • Max: 10,000 chars
                  </div>
                </div>
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
                  {[3,5,7,10,15,20,25,30,35,40,45,50].map(num => (
                    <option key={num} value={num}>{num} flashcards</option>
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
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isLoading || !isValid}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
