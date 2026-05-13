import { Suspense, lazy, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks';
import { Timer, ProgressRing, Toast, MetaTags } from '../components/ui';
const StudyPlan = lazy(() => import('../components/ui/StudyPlan'));
const Flashcard = lazy(() => import('../components/features/Flashcard'));
const QuizBlock = lazy(() => import('../components/features/QuizBlock'));
import {
  generateSummary,
  generateFlashcards,
  generateQuiz,
  generateELI5,
  generateDeeperExplanation,
  generateChatReply,
  fetchAllCardsForTopic,
  fetchDueCardsForTopic,
  persistGeneratedCards,
  updateCardReview,
  recordFlashcardResult,
  recordStudySessionStart,
} from '../services';
import { calculateNextReview, gradeToQuality } from '../utils';
import {
  ChevronLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  Brain,
  Target,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

const TABS = [
  { id: 'plan', label: 'Plan', icon: BookOpen },
  { id: 'summary', label: 'Summary', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'quiz', label: 'Quiz Me', icon: Target },
  { id: 'eli5', label: 'ELI5', icon: Sparkles },
  { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
];

const LoadingSkeleton = ({ variant }) => {
  if (variant === 'summary') {
    return (
      <div className="space-y-4">
        <div className="skeleton-card p-6" />
        <div className="skeleton-card p-6" />
        <div className="skeleton-card p-6" />
      </div>
    );
  }

  if (variant === 'flashcards') {
    return (
      <div className="space-y-4">
        <div className="skeleton-card p-8 min-h-[260px]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton-card h-32" />
          <div className="skeleton-card h-32" />
        </div>
      </div>
    );
  }

  if (variant === 'quiz') {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="skeleton-card p-5">
            <div className="skeleton-line w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="skeleton-line" />
              <div className="skeleton-line w-5/6" />
              <div className="skeleton-line w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="skeleton-card p-6 min-h-[220px]" />;
};

const StudySession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTopic, setActiveTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('plan');

  // Cache AI responses
  const [topicContent, setTopicContent] = useState({});
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [chatError, setChatError] = useState(null);
  const [toast, setToast] = useState(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, attempted: 0 });
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [hasShownSummary, setHasShownSummary] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const loadSession = async () => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, `users/${user.uid}/sessions`, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSession({ id: docSnap.id, ...data });
          // Optionally restore local cache
          const cached = localStorage.getItem(`crambuddy_cache_${id}`);
          if (cached) {
            setTopicContent(JSON.parse(cached));
          }
        } else {
          setError('Session not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load session');
        // Try loading from cache if offline
        const cachedSession = localStorage.getItem(`crambuddy_session_${id}`);
        if (cachedSession) {
          setSession(JSON.parse(cachedSession));
          setError('Offline mode. Showing cached data.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [id, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !session?.id) return;
    recordStudySessionStart(user.uid, session.id);
  }, [user?.uid, session?.id]);

  // Save session to local storage for offline resilience
  useEffect(() => {
    if (session) {
      localStorage.setItem(`crambuddy_session_${id}`, JSON.stringify(session));
    }
  }, [session, id]);

  useEffect(() => {
    if (Object.keys(topicContent).length > 0) {
      localStorage.setItem(`crambuddy_cache_${id}`, JSON.stringify(topicContent));
    }
  }, [topicContent, id]);

  const handleStartTopic = async (topic) => {
    setActiveTopic(topic);
    setActiveTab('summary');
    setContentError(null);
    setChatError(null);

    // Check cache
    if (topicContent[topic.id]?.summary) return;

    await loadTopicContent(topic, 'summary');
  };

  const loadTopicContent = async (topic, tab) => {
    setIsGeneratingContent(true);
    setContentError(null);
    try {
      let content = null;
      if (tab === 'summary') {
        const res = await generateSummary(topic.title, session.difficulty);
        content = res.summary;
      } else if (tab === 'flashcards') {
        let allCards = await fetchAllCardsForTopic({ uid: user.uid, sessionId: id, topicId: topic.id });
        if (!allCards.length) {
          const res = await generateFlashcards(topic.title);
          const generatedCards = Array.isArray(res.flashcards) ? res.flashcards : [];
          await persistGeneratedCards({
            uid: user.uid,
            sessionId: id,
            topicId: topic.id,
            cards: generatedCards,
          });
          allCards = await fetchAllCardsForTopic({ uid: user.uid, sessionId: id, topicId: topic.id });
        }
        const dueCards = await fetchDueCardsForTopic({ uid: user.uid, sessionId: id, topicId: topic.id });
        content = (dueCards.length ? dueCards : allCards).map((card, index) => ({
          id: card.id || card.cardId || `${topic.id}-${index}`,
          front: card.front,
          back: card.back,
          easinessFactor: card.easinessFactor,
          interval: card.interval,
          repetition: card.repetition,
          nextReviewDate: card.nextReviewDate,
        }));
      } else if (tab === 'quiz') {
        const res = await generateQuiz(topic.title);
        content = res.quiz;
      } else if (tab === 'eli5') {
        const res = await generateELI5(topic.title);
        content = res.explanation;
      }

      setTopicContent((prev) => ({
        ...prev,
        [topic.id]: {
          ...prev[topic.id],
          [tab]: content,
        },
      }));
    } catch (err) {
      const message = err?.message || "We couldn't generate this content. Please try again.";
      setContentError(message);
      console.error(err);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleCardGrade = async (card, grade) => {
    if (!activeTopic || !card?.id) return;
    setIsSavingGrade(true);
    try {
      const quality = gradeToQuality(grade);
      const srsUpdate = calculateNextReview(quality, {
        easinessFactor: card.easinessFactor,
        interval: card.interval,
        repetition: card.repetition,
      });

      await updateCardReview({
        uid: user.uid,
        sessionId: id,
        cardId: card.id,
        srsUpdate,
      });

      const isCorrect = grade !== 'again';
      recordFlashcardResult(user.uid, activeTopic?.title || activeTopic?.id, isCorrect);
      setSessionStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        attempted: prev.attempted + 1,
      }));

      const dueCards = await fetchDueCardsForTopic({
        uid: user.uid,
        sessionId: id,
        topicId: activeTopic.id,
      });
      const allCards = await fetchAllCardsForTopic({
        uid: user.uid,
        sessionId: id,
        topicId: activeTopic.id,
      });

      const refreshed = (dueCards.length ? dueCards : allCards).map((item, index) => ({
        id: item.id || item.cardId || `${activeTopic.id}-${index}`,
        front: item.front,
        back: item.back,
        easinessFactor: item.easinessFactor,
        interval: item.interval,
        repetition: item.repetition,
        nextReviewDate: item.nextReviewDate,
      }));

      setTopicContent((prev) => ({
        ...prev,
        [activeTopic.id]: {
          ...prev[activeTopic.id],
          flashcards: refreshed,
        },
      }));

      showToast(`Saved review: ${grade}`, 'success');
    } catch (error) {
      console.error(error);
      showToast('Unable to save your review right now.', 'danger');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleTabChange = async (tabId) => {
    setContentError(null);
    setChatError(null);
    setActiveTab(tabId);
    if (
      tabId !== 'plan' &&
      tabId !== 'tutor' &&
      activeTopic &&
      !topicContent[activeTopic.id]?.[tabId]
    ) {
      await loadTopicContent(activeTopic, tabId);
    }
    // For tutor tab, we initialize an empty array if not present
    if (tabId === 'tutor' && activeTopic && !topicContent[activeTopic.id]?.chatHistory) {
      setTopicContent((prev) => ({
        ...prev,
        [activeTopic.id]: {
          ...prev[activeTopic.id],
          chatHistory: [
            {
              role: 'model',
              text: `Hi! I'm your AI Tutor. What questions do you have about ${activeTopic.title}?`,
            },
          ],
        },
      }));
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeTopic) return;
    setChatError(null);

    const newMessage = { role: 'user', text: chatInput };
    const currentHistory = topicContent[activeTopic.id]?.chatHistory || [];
    const updatedHistory = [...currentHistory, newMessage];

    setTopicContent((prev) => ({
      ...prev,
      [activeTopic.id]: {
        ...prev[activeTopic.id],
        chatHistory: updatedHistory,
      },
    }));

    setChatInput('');
    setIsChatting(true);

    try {
      const replyText = await generateChatReply(activeTopic.title, updatedHistory);
      setTopicContent((prev) => ({
        ...prev,
        [activeTopic.id]: {
          ...prev[activeTopic.id],
          chatHistory: [...updatedHistory, { role: 'model', text: replyText }],
        },
      }));
    } catch (e) {
      const message = e?.message || 'Unable to send your question. Please try again.';
      setChatError(message);
      console.error(e);
    } finally {
      setIsChatting(false);
    }
  };

  const markTopicDone = async () => {
    if (!activeTopic) return;

    const completedTopics = [...(session.progress?.completedTopics || [])];
    if (!completedTopics.includes(activeTopic.id)) {
      completedTopics.push(activeTopic.id);

      const newPercentage = Math.round(
        (completedTopics.length / session.studyPlan.topics.length) * 100
      );

      const updatedSession = {
        ...session,
        progress: { ...session.progress, completedTopics },
        completionPercentage: newPercentage,
      };

      setSession(updatedSession);
      showToast('Topic marked complete!', 'success');

      if (newPercentage === 100 && !hasShownSummary) {
        setShowSummaryModal(true);
        setHasShownSummary(true);
      }

      // Save to Firebase
      try {
        const docRef = doc(db, `users/${user.uid}/sessions`, id);
        await updateDoc(docRef, {
          'progress.completedTopics': completedTopics,
          completionPercentage: newPercentage,
        });
      } catch (e) {
        console.error('Failed to update progress online', e);
        showToast('Saved locally. Sync failed.', 'danger');
      }
    }

    // Go back to plan or next topic
    setActiveTab('plan');
    setActiveTopic(null);
  };

  const handleDeepDive = async () => {
    if (!activeTopic) return;
    setIsGeneratingContent(true);
    setContentError(null);
    try {
      const currentSummary = topicContent[activeTopic.id]?.summary || '';
      const res = await generateDeeperExplanation(activeTopic.title, currentSummary);
      setTopicContent((prev) => ({
        ...prev,
        [activeTopic.id]: {
          ...prev[activeTopic.id],
          summary: prev[activeTopic.id].summary + '\n\n### Deep Dive\n\n' + res.detailedExplanation,
        },
      }));
    } catch (e) {
      const message = e?.message || 'Unable to fetch deeper explanation. Please try again.';
      setContentError(message);
      console.error(e);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Parse timeAllocated (e.g., "2hrs" -> 120)
  const getMinutes = (timeStr) => {
    if (timeStr === '1hr') return 60;
    if (timeStr === '2hrs') return 120;
    if (timeStr === '3hrs') return 180;
    if (timeStr === '4hrs') return 240;
    if (timeStr === '6hrs') return 360;
    return 120; // fallback
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  if (error || !session)
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center">
        <p className="text-danger-light">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="text-accent underline">
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <>
      <MetaTags
        title={`${session.subject} Study Session`}
        description={`Study session for ${session.subject} with ${session.topics?.length || 0} topics. ${session.completionPercentage}% completed. AI-powered learning tools.`}
        type="article"
        sessionData={session}
      />
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden pb-28 lg:pb-0">
        {/* Top Bar */}
        <div className="glass border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-heading font-bold">{session.subject} Session</h1>
              <p className="text-xs text-gray-400">{session.completionPercentage}% Completed</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Timer
              initialMinutes={getMinutes(session.timeAllocated)}
              onExpire={() => alert("Time's up! Let's hope you're ready.")}
            />
            <ProgressRing percentage={session.completionPercentage} />
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (Desktop) / Hidden Mobile */}
          <div className="hidden lg:flex w-80 flex-col border-r border-white/10 glass bg-surface/50 overflow-y-auto p-4 shrink-0">
            <h2 className="font-heading font-bold text-lg mb-4 text-gray-200">Topics</h2>
            <div className="flex flex-col gap-2">
              {session.studyPlan.topics.map((topic, i) => {
                const isCompleted = session.progress?.completedTopics?.includes(topic.id);
                const isActive = activeTopic?.id === topic.id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      if (isCompleted) {
                        setActiveTopic(topic);
                        setActiveTab('summary');
                        if (!topicContent[topic.id]?.summary) loadTopicContent(topic, 'summary');
                      } else {
                        handleStartTopic(topic);
                      }
                    }}
                    className={clsx(
                      'flex flex-col text-left p-3 rounded-xl border transition-all',
                      isActive
                        ? 'bg-accent/20 border-accent'
                        : isCompleted
                          ? 'bg-success/10 border-success/20 hover:bg-success/20'
                          : 'bg-surface border-white/5 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={clsx(
                          'w-3 h-3 rounded-full',
                          isCompleted
                            ? 'bg-success'
                            : isActive
                              ? 'bg-warning animate-pulse'
                              : 'bg-danger'
                        )}
                      ></div>
                      <span className="text-xs font-bold text-gray-400">Topic {i + 1}</span>
                    </div>
                    <span className="font-medium text-sm leading-tight text-gray-200">
                      {topic.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col bg-midnight overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-white/10 shrink-0 bg-surface/30">
              {TABS.map((tab) => {
                const isDisabled = tab.id !== 'plan' && !activeTopic;
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={isDisabled}
                    className={clsx(
                      'flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2',
                      isActive
                        ? 'border-accent text-accent-light bg-accent/5'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5',
                      isDisabled && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Main View */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 relative pb-28">
              {activeTab === 'plan' && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 animate-spin text-accent" />
                    </div>
                  }
                >
                  <StudyPlan plan={session.studyPlan} onStartTopic={handleStartTopic} />
                </Suspense>
              )}

              {activeTab !== 'plan' && activeTopic && (
                <div className="max-w-4xl mx-auto w-full animate-fade-in-up flex flex-col pb-24">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                    {activeTopic.title}
                  </h2>

                  {isGeneratingContent && !topicContent[activeTopic.id]?.[activeTab] ? (
                    <LoadingSkeleton variant={activeTab} />
                  ) : contentError ? (
                    <div className="glass-card p-6 mb-8 border border-danger/30 bg-danger/10 text-danger-light">
                      <p className="text-lg font-semibold">Something went wrong.</p>
                      <p className="mt-2 text-sm leading-relaxed">{contentError}</p>
                      <button
                        onClick={() => loadTopicContent(activeTopic, activeTab)}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20 transition"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'summary' && (
                        <div className="prose prose-invert prose-violet max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-accent-light bg-surface/50 p-6 md:p-8 rounded-2xl border border-white/5 shadow-xl">
                          {topicContent[activeTopic.id]?.summary ? (
                            <ReactMarkdown>{topicContent[activeTopic.id].summary}</ReactMarkdown>
                          ) : (
                            <p className="text-gray-400">Failed to load summary.</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'flashcards' && (
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center py-20">
                              <Loader2 className="w-10 h-10 animate-spin text-accent" />
                            </div>
                          }
                        >
                          <Flashcard
                            cards={topicContent[activeTopic.id]?.flashcards || []}
                            onGrade={handleCardGrade}
                            isSavingGrade={isSavingGrade}
                          />
                        </Suspense>
                      )}

                      {activeTab === 'quiz' && (
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center py-20">
                              <Loader2 className="w-10 h-10 animate-spin text-accent" />
                            </div>
                          }
                        >
                          <QuizBlock
                            questions={topicContent[activeTopic.id]?.quiz || []}
                            onGenerateMore={() => loadTopicContent(activeTopic, 'quiz')}
                          />
                        </Suspense>
                      )}

                      {activeTab === 'eli5' && (
                        <div className="prose prose-invert prose-violet max-w-none text-lg bg-surface/50 p-6 md:p-8 rounded-2xl border border-white/5 shadow-xl">
                          {topicContent[activeTopic.id]?.eli5 ? (
                            <ReactMarkdown>{topicContent[activeTopic.id].eli5}</ReactMarkdown>
                          ) : (
                            <p className="text-gray-400">Failed to load explanation.</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'tutor' && (
                        <div className="flex flex-col h-[60vh] bg-surface/30 rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                            {chatError && (
                              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger-light">
                                {chatError}
                              </div>
                            )}
                            {topicContent[activeTopic.id]?.chatHistory?.map((msg, i) => (
                              <div
                                key={i}
                                className={clsx(
                                  'max-w-[80%] rounded-2xl p-4',
                                  msg.role === 'user'
                                    ? 'self-end bg-accent/80 text-white'
                                    : 'self-start bg-surface/80 border border-white/10 prose prose-invert prose-sm'
                                )}
                              >
                                {msg.role === 'model' ? (
                                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                                ) : (
                                  msg.text
                                )}
                              </div>
                            ))}
                            {isChatting && (
                              <div className="self-start bg-surface/80 border border-white/10 rounded-2xl p-4 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-accent" /> Thinking...
                              </div>
                            )}
                          </div>
                          <div className="p-4 border-t border-white/10 bg-surface/50 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Ask a question..."
                              className="min-w-0 flex-1 w-full bg-midnight border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={isChatting || !chatInput.trim()}
                              className="min-h-[44px] min-w-[44px] bg-accent hover:bg-accent-light px-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors touch-target"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {activeTopic && activeTab !== 'plan' && (
              <div className="hidden lg:flex absolute bottom-0 left-0 lg:left-80 right-0 bg-surface/90 backdrop-blur-md border-t border-white/10 p-4 flex-wrap items-center justify-between gap-4 z-20">
                <button
                  onClick={handleDeepDive}
                  disabled={isGeneratingContent || activeTab !== 'summary'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" /> I Need More Detail
                </button>

                <button
                  onClick={markTopicDone}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-success hover:bg-success/90 text-white font-bold text-sm transition-colors shadow-lg shadow-success/20"
                >
                  <CheckCircle2 className="w-5 h-5" /> Mark as Done
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bottom-nav-surface border-t border-white/10 px-2 py-2">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {TABS.map((tab) => {
              const isDisabled = tab.id !== 'plan' && !activeTopic;
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={isDisabled}
                  className={clsx(
                    'flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-3xl border px-3 py-3 text-[10px] font-semibold transition-all',
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-white/10 text-gray-300 hover:border-accent hover:text-white',
                    isDisabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {showSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
            <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-midnight/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold">Session complete</p>
                  <h2 className="mt-3 text-3xl font-heading font-bold text-white">Great work, champion.</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="rounded-3xl border border-white/10 bg-surface/60 p-5">
                  <p className="text-sm text-gray-400 uppercase tracking-[0.18em] font-semibold">Reviewed</p>
                  <p className="mt-3 text-3xl font-heading font-bold">{sessionStats.attempted}</p>
                  <p className="text-xs text-gray-500 mt-1">cards this session</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-surface/60 p-5">
                  <p className="text-sm text-gray-400 uppercase tracking-[0.18em] font-semibold">Correct</p>
                  <p className="mt-3 text-3xl font-heading font-bold">{sessionStats.correct}</p>
                  <p className="text-xs text-gray-500 mt-1">responses</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-surface/60 p-5">
                  <p className="text-sm text-gray-400 uppercase tracking-[0.18em] font-semibold">Accuracy</p>
                  <p className="mt-3 text-3xl font-heading font-bold">
                    {sessionStats.attempted ? Math.round((sessionStats.correct / sessionStats.attempted) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">session average</p>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-surface/60 p-6">
                <p className="text-sm text-gray-400">You completed all topics in this session. Keep your streak alive by starting another session or reviewing a topic again.</p>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </>
  );
};

export default StudySession;
