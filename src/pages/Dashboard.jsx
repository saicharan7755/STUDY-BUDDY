import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRetry, useToast } from '../hooks';
import useConfirmation from '../hooks/useConfirmation';
import {
  collection as firestoreCollection,
  query as firestoreQuery,
  orderBy as firestoreOrderBy,
  getDocs as firestoreGetDocs,
  getDoc as firestoreGetDoc,
  doc as firestoreDoc,
  addDoc as firestoreAddDoc,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth, useContent, useSpacedRepetition, useStudyData } from '../hooks';
import { ConfirmationDialog, TopicInput, MetaTags, ExportModal } from '../components/ui';
import { generateStudyPlan } from '../services';
import { buildLast7DaysSeries } from '../services/streakService';
import {
  BookOpen,
  Clock,
  ChevronRight,
  Download,
  Target,
  Flame,
  Trash2,
  Play,
  Layers3,
  FileText,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';

const ContentSkeletonCards = () => (
  <div className="flex flex-col gap-4">
    {[0, 1, 2].map((item) => (
      <div key={item} className="glass-card !p-5">
        <div className="mb-3 h-3 w-20 animate-pulse rounded-full bg-white/10" />
        <div className="mb-4 h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="flex gap-2">
          <div className="h-4 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

const getContentMetaLabel = (item) => {
  if (item.type === 'flashcards') return `${item.metadata?.cardCount || 0} cards`;
  if (item.type === 'quiz') return `${item.metadata?.questionCount || 0} questions`;
  return `${item.metadata?.wordCount || 0} words`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const {
    content,
    deleteContent,
    error: contentError,
    isLoading: isContentLoading,
    isSaving,
    pendingItemIds,
    refreshContent,
  } = useContent();
  const visibleContent = content.filter((item) => !item.isDeleted);
  const navigate = useNavigate();
  const { decks, loadDeck, softDeleteDeck, restoreDeck, permanentlyRemoveDeck } = useStudyData();
  const { dueCards, dueCount, estimatedMinutes } = useSpacedRepetition(decks);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalHours: 0,
    topicsMastered: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    studiedLast7Days: buildLast7DaysSeries({}),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [exportDeck, setExportDeck] = useState(null);
  const toast = useToast();
  const { openConfirmation, confirmationProps } = useConfirmation();
  const deckDeleteTimers = useRef({});
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const { execute: generateStudyPlanWithRetry, retryCount } = useRetry(generateStudyPlan, 3, 1000);

  const getContentDeleteCopy = useCallback((item) => {
    if (item.type === 'flashcards') {
      return {
        title: 'Delete Flashcard Set?',
        message: `This will permanently delete '${item.title}' and all ${item.metadata?.cardCount || 0} cards. This cannot be undone.`,
        confirmLabel: 'Yes, Delete Set',
      };
    }

    if (item.type === 'quiz') {
      return {
        title: 'Delete Quiz?',
        message: `This will permanently delete '${item.title}' and your score history. This cannot be undone.`,
        confirmLabel: 'Yes, Delete Quiz',
      };
    }

    return {
      title: 'Delete Summary?',
      message: `This will permanently delete '${item.title}'. This cannot be undone.`,
      confirmLabel: 'Yes, Delete Summary',
    };
  }, []);

  const handleContentDelete = useCallback(
    (item, triggerElement) => {
      const copy = getContentDeleteCopy(item);
      openConfirmation({
        title: copy.title,
        message: copy.message,
        confirmLabel: copy.confirmLabel,
        type: 'danger',
        onConfirm: async () => {
          const result = await deleteContent(item.id);
          if (result.error) throw result.error;
        },
        returnFocusRef: { current: triggerElement },
      });
    },
    [deleteContent, getContentDeleteCopy, openConfirmation]
  );

  const handleDeckDelete = useCallback(
    (deck, triggerElement) => {
      openConfirmation({
        title: 'Delete Flashcard Set?',
        message: `This will permanently delete '${deck.name}' and all ${deck.cards.length} cards. This cannot be undone.`,
        confirmLabel: 'Yes, Delete Set',
        type: 'danger',
        onConfirm: async () => {
          softDeleteDeck(deck.id);
          const timerId = window.setTimeout(() => {
            permanentlyRemoveDeck(deck.id);
            delete deckDeleteTimers.current[deck.id];
          }, 8000);
          deckDeleteTimers.current[deck.id] = timerId;
          toast.info(`${deck.name} deleted.`, {
            action: {
              label: 'Undo',
              onClick: () => {
                window.clearTimeout(deckDeleteTimers.current[deck.id]);
                delete deckDeleteTimers.current[deck.id];
                restoreDeck(deck);
                toast.success('Deck restored.');
              },
            },
            duration: 8000,
            showProgress: true,
          });
        },
        returnFocusRef: { current: triggerElement },
      });
    },
    [permanentlyRemoveDeck, restoreDeck, openConfirmation, softDeleteDeck, toast]
  );

  useEffect(() => {
    return () => {
      Object.values(deckDeleteTimers.current).forEach(window.clearTimeout);
      deckDeleteTimers.current = {};
    };
  }, []);

  const _loadSessions = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = firestoreQuery(
        firestoreCollection(db, `users/${user.uid}/sessions`),
        firestoreOrderBy('lastAccessedAt', 'desc')
      );
      const querySnapshot = await firestoreGetDocs(q);
      const loaded = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSessions(loaded);

      // Calculate analytics
      let hours = 0;
      let mastered = 0;
      let completed = 0;

      loaded.forEach((session) => {
        // Parse time: "1hr" -> 1, "2hrs" -> 2, "6hrs" -> 6
        const match = session.timeAllocated?.match(/(\d+)/);
        if (match) hours += parseInt(match[1]);

        if (session.completionPercentage === 100) {
          completed += 1;
        }
      });

      const cardCounts = await Promise.all(
        loaded.map(async (session) => {
          const cardsSnap = await firestoreGetDocs(
            firestoreCollection(db, `users/${user.uid}/sessions/${session.id}/cards`)
          );
          return cardsSnap.docs.reduce((total, item) => {
            const repetition = Number(item.data()?.repetition) || 0;
            return repetition >= 3 ? total + 1 : total;
          }, 0);
        })
      );
      mastered = cardCounts.reduce((sum, value) => sum + value, 0);

      const userSnap = await firestoreGetDoc(firestoreDoc(db, `users/${user.uid}`));
      const userData = userSnap.exists() ? userSnap.data() : {};
      const studiedLast7Days = buildLast7DaysSeries(userData.dailyStudyCounts || {});

      setAnalytics({
        totalHours: hours,
        topicsMastered: mastered,
        sessionsCompleted: completed,
        currentStreak: Number(userData.currentStreak) || 0,
        studiedLast7Days,
      });
    } catch (err) {
      console.error('Error loading sessions', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const timeoutId = window.setTimeout(() => {
      _loadSessions();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [_loadSessions, user?.uid]);

  const handleGeneratePlan = async (data) => {
    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generateStudyPlanWithRetry(data.syllabus, data.time, data.difficulty);
      toast.success('Study plan generated.');

      // Create session in Firestore
      const sessionRef = await firestoreAddDoc(
        firestoreCollection(db, `users/${user.uid}/sessions`),
        {
          subject: data.category,
          syllabus: data.syllabus,
          difficulty: data.difficulty,
          timeAllocated: data.time,
          studyPlan: plan,
          progress: { completedTopics: [], quizScores: {} },
          createdAt: firestoreServerTimestamp(),
          lastAccessedAt: firestoreServerTimestamp(),
          completionPercentage: 0,
        }
      );

      navigate(`/session/${sessionRef.id}`);
    } catch (err) {
      const message = err.message || 'Failed to generate plan.';
      setError(message);
      toast.error(message, {
        description: retryCount
          ? `Retrying failed requests... (attempt ${retryCount} of 3)`
          : 'Please try again in a moment.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Dashboard"
        description="Manage your study sessions, track progress, and create new AI-powered study plans."
      />
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Left Column: Create New */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              Hey {user?.displayName?.split(' ')[0]}, let's make tonight count.
            </h1>
            <p className="text-gray-400">
              Paste your materials below and let AI build your strategy.
            </p>
            {isSaving && (
              <p className="mt-2 text-xs font-medium text-accent-light" role="status">
                Saving...
              </p>
            )}
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/50 text-danger-light p-4 rounded-xl text-sm">
              {error}
              {retryCount > 0 && (
                <p className="mt-2 text-xs text-gray-300">
                  Retrying... (attempt {retryCount} of 3)
                </p>
              )}
            </div>
          )}

          <TopicInput onSubmit={handleGeneratePlan} isGenerating={isGenerating} />
        </div>

        {/* Right Column: Analytics & Past Sessions */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card !p-4 flex flex-col items-center justify-center text-center">
              <Target className="w-6 h-6 text-accent mb-2" />
              <span className="text-2xl font-bold font-heading">{analytics.topicsMastered}</span>
              <span className="text-xs text-gray-400">Topics Mastered</span>
            </div>
            <div className="glass-card !p-4 flex flex-col items-center justify-center text-center">
              <Flame className="w-6 h-6 text-danger mb-2" />
              <span className="text-2xl font-bold font-heading">{analytics.currentStreak}</span>
              <span className="text-xs text-gray-400">Day Streak</span>
            </div>
          </div>
          <div className="glass-card !p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-200">Cards studied (last 7 days)</p>
              <p className="text-xs text-gray-500">{analytics.totalHours}h total focus</p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {analytics.studiedLast7Days.map((point) => {
                const maxCount = Math.max(
                  ...analytics.studiedLast7Days.map((item) => item.count),
                  1
                );
                const heightPercent = Math.max(8, Math.round((point.count / maxCount) * 100));
                return (
                  <div key={point.key} className="flex flex-col items-center gap-1">
                    <div className="flex h-20 w-full items-end rounded-lg bg-surface/70 p-1">
                      <div
                        className="w-full rounded bg-accent/80"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{point.label}</span>
                    <span className="text-[10px] text-gray-500">{point.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card !p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  Review queue
                </p>
                <h2 className="mt-2 text-xl font-heading font-bold">Cards due today</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {dueCount
                    ? `${dueCount} cards ready in about ${estimatedMinutes} min.`
                    : 'No saved cards are due right now.'}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-lg font-bold text-accent-light">
                {dueCount}
              </div>
            </div>
            {dueCards.length > 0 && (
              <div className="mt-4 space-y-2">
                {dueCards.slice(0, 3).map((card) => (
                  <div
                    key={card.srsKey}
                    className="rounded-xl border border-white/10 bg-surface/40 px-3 py-2"
                  >
                    <p className="truncate text-sm font-semibold text-white">{card.front}</p>
                    <p className="text-xs text-gray-500">{card.deckName}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/due')}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!dueCount}
            >
              <Layers3 className="h-4 w-4" />
              Start due review
            </button>
          </div>

          <h2 className="text-xl font-heading font-bold flex items-center gap-2 mt-2">
            <FileText className="w-5 h-5 text-accent" /> Generated Content
          </h2>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Summaries, quizzes, and flashcards saved to your account.</p>
            <button
              type="button"
              onClick={refreshContent}
              className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Refresh content"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {contentError && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger-light">
              {contentError.message}
            </div>
          )}

          {isContentLoading && visibleContent.length === 0 ? (
            <ContentSkeletonCards />
          ) : visibleContent.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center text-center p-8 border-dashed border-white/20 bg-transparent">
              <FileText className="w-10 h-10 text-gray-500 mb-3" />
              <p className="text-gray-400 text-sm">No generated content saved yet.</p>
              <p className="text-gray-500 text-xs mt-1">
                Create summaries, quizzes, or flashcards inside a study session.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {content.filter((item) => !item.isDeleted).slice(0, 6).map((item) => {
                const isPending = pendingItemIds.includes(item.id) || item.isPending || item.isDeleting;
                return (
                  <div
                    key={item.id}
                    className={`glass-card !p-5 flex flex-col gap-3 ${item.isDeleting ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                          {item.type}
                        </p>
                        <h3 className="mt-1 truncate font-bold text-lg">{item.title}</h3>
                        <p className="mt-1 text-xs text-gray-400">
                          {getContentMetaLabel(item)} &bull; Updated{' '}
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                        {isPending && (
                          <p className="mt-2 text-xs font-medium text-accent-light" role="status">
                            {item.isDeleting ? 'Deleting...' : 'Saving...'}
                          </p>
                        )}
                      </div>
                      <div className="relative flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => handleContentDelete(item, event.currentTarget)}
                          disabled={isPending}
                          className="hidden min-h-[44px] min-w-[44px] rounded-full bg-danger/20 p-3 text-danger transition-colors hover:bg-danger/40 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                          title="Delete content"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenActionMenuId((current) => (current === item.id ? null : item.id));
                          }}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 sm:hidden"
                          aria-label="Open actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openActionMenuId === item.id && (
                          <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleContentDelete(item, event.currentTarget);
                                setOpenActionMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-2xl p-3 text-left text-sm font-semibold text-white transition hover:bg-white/5"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                              Delete content
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h2 className="text-xl font-heading font-bold flex items-center gap-2 mt-6">
            <BookOpen className="w-5 h-5 text-accent" /> Recent Sessions
          </h2>

          {sessions.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center text-center p-8 border-dashed border-white/20 bg-transparent">
              <Clock className="w-10 h-10 text-gray-500 mb-3" />
              <p className="text-gray-400 text-sm">No recent sessions.</p>
              <p className="text-gray-500 text-xs mt-1">
                Your night-before cram sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/session/${session.id}`)}
                  className="glass-card !p-5 cursor-pointer group flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">
                        {session.subject}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {session.timeAllocated} • {session.difficulty}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs font-bold text-accent">
                      {session.completionPercentage}%
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm font-medium text-gray-500 transition-colors group-hover:text-white">
                    Resume <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-heading font-bold flex items-center gap-2 mt-6">
            <Target className="w-5 h-5 text-accent" /> Saved Decks
          </h2>

          {decks.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center text-center p-8 border-dashed border-white/20 bg-transparent">
              <Target className="w-10 h-10 text-gray-500 mb-3" />
              <p className="text-gray-400 text-sm">No saved decks.</p>
              <p className="text-gray-500 text-xs mt-1">
                Generate flashcards in guest mode to save them here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {decks.map((deck) => (
                <div key={deck.id} className="glass-card !p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{deck.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        {deck.cards.length} cards • Created{' '}
                        {new Date(deck.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <button
                        onClick={() => setExportDeck(deck)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-accent-light transition-colors"
                        title="Export Deck"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const loadedDeck = loadDeck(deck.id);
                          if (loadedDeck) {
                            navigate('/try', { state: { loadedDeck } });
                          }
                        }}
                        className="p-2 rounded-full bg-accent hover:bg-accent-light text-white transition-colors"
                        title="Load Deck"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleDeckDelete(deck, event.currentTarget)}
                        className="hidden min-h-[44px] min-w-[44px] rounded-full bg-danger/20 p-2 text-danger transition-colors hover:bg-danger/40 sm:inline-flex"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenActionMenuId((current) => (current === deck.id ? null : deck.id));
                        }}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 sm:hidden"
                        aria-label="Open deck actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openActionMenuId === deck.id && (
                        <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeckDelete(deck, event.currentTarget);
                              setOpenActionMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-2xl p-3 text-left text-sm font-semibold text-white transition hover:bg-white/5"
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                            Delete deck
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmationDialog {...confirmationProps} />
      <ExportModal
        isOpen={Boolean(exportDeck)}
        onClose={() => setExportDeck(null)}
        cards={exportDeck?.cards || []}
        deckName={exportDeck?.name || 'Saved Deck'}
      />
    </>
  );
};

export default Dashboard;
