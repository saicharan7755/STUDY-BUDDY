import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth, useStudyData } from '../hooks';
import { TopicInput, MetaTags } from '../components/ui';
import { generateStudyPlan, buildLast7DaysSeries } from '../services';
import { BookOpen, Clock, ChevronRight, Target, Flame, Trash2, Play } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { decks, deleteDeck, loadDeck } = useStudyData();
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
      const plan = await generateStudyPlan(data.syllabus, data.time, data.difficulty);

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
      setError(err.message || 'Failed to generate plan.');
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
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/50 text-danger-light p-4 rounded-xl text-sm">
              {error}
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
                const maxCount = Math.max(...analytics.studiedLast7Days.map((item) => item.count), 1);
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

          <h2 className="text-xl font-heading font-bold flex items-center gap-2 mt-2">
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
                <div
                  key={deck.id}
                  className="glass-card !p-5 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{deck.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        {deck.cards.length} cards • Created {new Date(deck.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                        onClick={() => deleteDeck(deck.id)}
                        className="p-2 rounded-full bg-danger/20 hover:bg-danger/40 text-danger transition-colors"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
