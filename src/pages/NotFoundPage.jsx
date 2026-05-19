import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Search } from 'lucide-react';
import { MetaTags } from '../components/ui';
import { useAuth, useContent } from '../hooks';

const SUPPORT_EMAIL = 'support@cramai.ai';

const fallbackPages = [
  { label: 'Dashboard', path: '/dashboard', description: 'Return to your study dashboard.' },
  { label: 'Due cards', path: '/due', description: 'Review cards waiting for your next session.' },
  { label: 'Study progress', path: '/progress', description: 'Track your learning streak and improvement.' },
  { label: 'Forgot password', path: '/forgot-password', description: 'Request a new password reset link.' },
  { label: 'Help center', path: '/privacy-policy', description: 'Review privacy and support information.' },
];

const searchItemMatches = (value, query) =>
  value?.toLowerCase().includes(query) || false;

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { content = [] } = useContent();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.analytics?.page === 'function') {
      window.analytics.page('404', { url: location.pathname });
    }
  }, [location.pathname]);

  const searchPool = useMemo(() => {
    const contentItems = content
      .map((item) => ({
        key: item.id,
        label: item.title,
        description: item.sourceText || item.type || 'Saved study item',
        path: isAuthenticated ? '/dashboard' : '/login',
        source: 'Saved content',
      }))
      .slice(0, 20);

    return [...fallbackPages, ...contentItems];
  }, [content, isAuthenticated]);

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      setResults([]);
      return;
    }

    setResults(
      searchPool
        .filter((item) =>
          searchItemMatches(item.label, normalizedQuery) ||
          searchItemMatches(item.description, normalizedQuery)
        )
        .slice(0, 5)
    );
  }, [query, searchPool]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    if (results.length > 0) {
      navigate(results[0].path || (isAuthenticated ? '/dashboard' : '/')); 
    } else {
      setResults([
        {
          key: 'no-results',
          label: 'No matches found',
          description: 'Try a different keyword or return to the main page.',
          path: isAuthenticated ? '/dashboard' : '/',
        },
      ]);
    }
  };

  const primaryAction = isAuthenticated ? '/dashboard' : '/';
  const primaryLabel = isAuthenticated ? 'Go to Dashboard' : 'Go Home';

  return (
    <>
      <MetaTags
        title="Page Not Found | CRAM AI"
        description="The page you were looking for doesn't exist or has been moved. Search for what you need or return to the dashboard."
      />
      <section className="relative flex min-h-[calc(100vh-5rem)] flex-1 items-center justify-center overflow-hidden px-6 py-12 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-32 top-12 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute left-6 top-24 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-violet-200">
                  404 error
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  Tried URL: <span className="font-semibold text-white">{location.pathname}</span>
                </div>
              </div>

              <div>
                <p className="text-8xl font-heading font-black tracking-tight text-violet-200 md:text-[8rem]">404</p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Page Not Found
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-violet-300 sm:text-lg">
                  The page you're looking for doesn't exist or has been moved. Use the search bar below or return to the app to continue studying.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to={primaryAction}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-violet-400"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-violet-100 transition hover:border-violet-300/50 hover:bg-violet-500/10"
                >
                  Contact Support
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-950 via-slate-950 to-slate-900 p-8 shadow-2xl shadow-black/40">
              <div className="absolute -right-10 top-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.22),_transparent_35%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.32em] text-violet-200">
                    Search the app
                  </div>
                  <form className="space-y-4" onSubmit={handleSearchSubmit}>
                    <label htmlFor="notfound-search" className="sr-only">
                      Search site content
                    </label>
                    <div className="flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-violet-400/80">
                      <Search className="h-5 w-5 text-violet-300" />
                      <input
                        id="notfound-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Try searching for what you need..."
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Search content
                    </button>
                  </form>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5 text-sm text-slate-300 shadow-inner shadow-black/25">
                  <p className="mb-4 text-sm font-medium text-violet-100">Search results</p>
                  <div className="space-y-3">
                    {(query ? results : fallbackPages.slice(0, 4)).map((item) => (
                      <div key={item.key || item.path} className="rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-violet-300/20">
                        {item.path ? (
                          <Link to={item.path} className="font-semibold text-white hover:text-violet-200">
                            {item.label}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">{item.label}</span>
                        )}
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
