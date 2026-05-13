import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../hooks';
import { MetaTags } from '../components/ui';
import {
  buildLast7DaysSeries,
  getOverallAccuracy,
  getStudyProgressKey,
  getTodayStudyCount,
  getTopicList,
  loadStudyProgress,
} from '../services/progressStats';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const STATUS_MESSAGE = (streak) => {
  if (streak >= 7) return 'You’re on fire — keep the streak rolling!';
  if (streak >= 4) return 'Strong momentum. Every review counts!';
  if (streak >= 1) return 'Nice pace — stay consistent and build it further.';
  return 'Ready to start your first streak? Open a session and begin studying.';
};

const dashboardTiles = [
  {
    title: 'Today studied',
    key: 'today',
    icon: CalendarDays,
    accent: 'text-accent',
  },
  {
    title: 'Accuracy',
    key: 'accuracy',
    icon: CheckCircle2,
    accent: 'text-success',
  },
  {
    title: 'Streak',
    key: 'streak',
    icon: TrendingUp,
    accent: 'text-warning',
  },
  {
    title: 'Sessions',
    key: 'sessions',
    icon: ClipboardList,
    accent: 'text-accent-light',
  },
];

const StudyProgressDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(() => {
    if (!user?.uid) return;
    setStats(loadStudyProgress(user.uid));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    loadStats();

    const handleUpdate = (event) => {
      if (!event?.detail?.uid || event.detail.uid === user.uid) {
        loadStats();
      }
    };

    const handleStorage = (event) => {
      if (event.key === getStudyProgressKey(user.uid)) {
        loadStats();
      }
    };

    window.addEventListener('study-progress-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('study-progress-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadStats, user?.uid]);

  const topicList = useMemo(() => (stats ? getTopicList(stats) : []), [stats]);
  const chartData = useMemo(
    () => (stats ? buildLast7DaysSeries(stats.dailyCounts) : []),
    [stats]
  );

  const metrics = useMemo(() => {
    if (!stats) return {};
    return {
      today: getTodayStudyCount(stats),
      accuracy: getOverallAccuracy(stats),
      streak: stats.currentStreak || 0,
      sessions: stats.sessions.total || 0,
    };
  }, [stats]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
      <MetaTags
        title="Study Progress"
        description="Track your flashcard practice, accuracy, streak, and daily study trends."
      />
      <div className="mb-10 flex flex-col gap-4">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold">
            Study Progress
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-heading font-bold">
            Your study momentum, in one motivating view.
          </h1>
          <p className="mt-3 text-gray-400 max-w-2xl leading-7">
            Review your daily streak, accuracy, studied topics, and the last seven days of flashcard practice.
            This dashboard updates automatically whenever you start a session or grade a card.
          </p>
        </div>
        <div className="glass-card border border-white/10 p-5 md:p-6 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-[0.24em] font-semibold">
              Keep your learning streak alive
            </p>
            <h2 className="mt-2 text-2xl font-heading font-bold">{STATUS_MESSAGE(stats?.currentStreak || 0)}</h2>
          </div>
          <div className="rounded-3xl bg-surface/70 p-4 border border-white/10 text-center min-w-[260px]">
            <Sparkles className="mx-auto h-8 w-8 text-accent mb-3" />
            <p className="text-sm text-gray-400 uppercase tracking-[0.2em] font-semibold">Today’s focus</p>
            <p className="mt-2 text-3xl font-heading font-bold">{metrics.today ?? 0}</p>
            <p className="text-xs text-gray-500">cards reviewed today</p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {dashboardTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div key={tile.key} className="glass-card p-6 border border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-[0.18em] font-semibold">
                        {tile.title}
                      </p>
                      <p className="mt-3 text-3xl font-heading font-bold">
                        {metrics[tile.key] ?? 0}
                        {tile.key === 'accuracy' ? '%' : ''}
                      </p>
                    </div>
                    <div className={`p-3 rounded-2xl bg-white/5 ${tile.accent}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card border border-white/10 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-[0.18em] font-semibold">
                  Last 7 days
                </p>
                <h2 className="mt-2 text-xl font-heading font-bold">Daily cards studied</h2>
              </div>
              <p className="text-sm text-gray-400">Accuracy is built by daily practice.</p>
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 16,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="count" fill="#38BDF8" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card border border-white/10 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-gray-400 font-semibold">
                  Topics studied
                </p>
                <h2 className="mt-2 text-xl font-heading font-bold">Recent topic performance</h2>
              </div>
              <Award className="h-6 w-6 text-accent" />
            </div>
            {topicList.length === 0 ? (
              <p className="text-sm text-gray-400">No topics yet. Start a session to populate your progress report.</p>
            ) : (
              <div className="space-y-3">
                {topicList.slice(0, 6).map((topic) => (
                  <div key={topic.topic} className="rounded-3xl border border-white/10 bg-surface/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{topic.topic}</h3>
                        <p className="text-sm text-gray-400">{topic.studied} cards reviewed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{topic.accuracy}%</p>
                        <p className="text-xs text-gray-400">accuracy</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card border border-white/10 p-6 bg-gradient-to-br from-accent/10 via-surface/70 to-white/5">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
              <p className="text-sm uppercase tracking-[0.18em] text-gray-400 font-semibold">Motivation</p>
            </div>
            <p className="text-lg leading-8 text-gray-100">
              {STATUS_MESSAGE(stats?.currentStreak || 0)}
            </p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-midnight/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-400 font-semibold mb-2">Next move</p>
              <p className="text-sm text-gray-300">
                Open a study session, review cards, and watch your streak grow. Every completed session
                makes today's progress count toward tomorrow's momentum.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudyProgressDashboard;
