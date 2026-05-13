import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LogOut, Menu, X } from 'lucide-react';
import { useAuth, useSpacedRepetition, useStudyData } from '../../hooks';
import OptimizedImage from './OptimizedImage';

const NAV_LINKS = [
  { href: '#demo', label: 'Demo' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#trust', label: 'Reviews' },
  { href: '#faq', label: 'FAQ' },
];

function scrollToHash(hash) {
  if (!hash || hash === '#') return;
  const id = hash.slice(1);
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const Navbar = () => {
  const { user, isAuthenticated, signOut, signIn } = useAuth();
  const { decks } = useStudyData();
  const { dueCount } = useSpacedRepetition(decks);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const avatarName = encodeURIComponent(user?.displayName || 'User');
  const avatarBase =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${avatarName}&background=1d1f2d&color=fff&rounded=true`;
  const avatarSrc = user?.photoURL || `${avatarBase}&size=128`;
  const avatarSrcSet = user?.photoURL
    ? undefined
    : `${avatarBase}&size=128 1x, ${avatarBase}&size=256 2x`;
  const avatarWebpSrcSet = user?.photoURL
    ? undefined
    : `${avatarBase}&format=webp&size=128 1x, ${avatarBase}&format=webp&size=256 2x`;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMobileOpen(false));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handlePrimaryCta = async () => {
    setMobileOpen(false);
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/try');
    }
  };

  const hashHref = (hash) => (hash.startsWith('#') ? `/${hash}` : hash);

  const handleNavClick = (e, href) => {
    if (location.pathname === '/' && href.startsWith('#')) {
      e.preventDefault();
      scrollToHash(href);
      setMobileOpen(false);
    }
  };

  return (
    <nav
      className={`nav-landing sticky top-0 z-[100] border-b px-5 py-3 transition-[box-shadow,border-color] duration-200 sm:px-6 ${
        scrolled ? 'border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]' : 'border-transparent'
      }`}
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-[min(100%,72rem)] items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 group shrink-0">
          <Brain className="h-8 w-8 shrink-0 text-accent group-hover:text-accent-light transition-colors" />
          <span className="font-heading text-xl font-bold tracking-tight sm:text-2xl">CRAM AI</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex md:gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={hashHref(href)}
              onClick={(e) => handleNavClick(e, href)}
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-accent-light"
              >
                Dashboard
              </Link>
              <Link
                to="/progress"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-accent-light"
              >
                Progress
              </Link>
              <Link
                to="/due"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 transition-colors hover:text-accent-light"
              >
                Review
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                  {dueCount}
                </span>
              </Link>
            </>
          )}
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                signIn();
              }}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="nav-cta hidden rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] md:inline-flex md:items-center md:justify-center"
          >
            <span className="hidden lg:inline">
              {isAuthenticated ? 'Open Dashboard' : 'Try it now — Free'}
            </span>
            <span className="lg:hidden">{isAuthenticated ? 'Dashboard' : 'Try now'}</span>
          </button>
          {isAuthenticated && (
            <div className="flex items-center gap-3 pl-2">
              <div className="flex items-center gap-2">
                <OptimizedImage
                  src={avatarSrc}
                  alt=""
                  className="h-8 w-8 rounded-full border border-accent/50"
                  srcSet={
                    avatarSrcSet
                      ? [
                          { type: 'image/webp', srcSet: avatarWebpSrcSet },
                          { type: 'image/jpeg', srcSet: avatarSrcSet },
                        ]
                      : undefined
                  }
                  sizes="32px"
                  width="32"
                  height="32"
                />
                <span className="max-w-[120px] truncate text-sm font-medium text-gray-200">
                  {user?.displayName?.split(' ')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-danger"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="nav-cta rounded-lg px-3 py-2 text-xs font-bold text-white shadow-md sm:text-sm"
          >
            {isAuthenticated ? 'Dashboard' : 'Try now'}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={`border-white/10 md:hidden ${
          mobileOpen
            ? 'max-h-[85vh] border-t border-white/10 opacity-100'
            : 'pointer-events-none max-h-0 overflow-hidden border-t border-transparent opacity-0'
        } transition-all duration-200 ease-out`}
      >
        <div className="mx-auto flex max-w-[min(100%,72rem)] flex-col gap-1 px-5 py-4 sm:px-6">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={hashHref(href)}
              className="rounded-lg px-3 py-3 text-base font-medium text-gray-200 hover:bg-white/5"
              onClick={(e) => handleNavClick(e, href)}
            >
              {label}
            </a>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-lg px-3 py-3 text-base font-medium text-gray-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/progress"
                className="rounded-lg px-3 py-3 text-base font-medium text-gray-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                Progress
              </Link>
              <Link
                to="/due"
                className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-gray-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                Review
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-2 py-1 text-xs font-bold leading-none text-white">
                  {dueCount}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
                className="rounded-lg px-3 py-3 text-left text-base text-gray-400 hover:bg-white/5"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                signIn();
                setMobileOpen(false);
              }}
              className="rounded-lg px-3 py-3 text-left text-base font-medium text-gray-200 hover:bg-white/5"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="nav-cta mt-2 w-full rounded-xl py-3.5 text-center text-base font-bold text-white shadow-lg"
          >
            {isAuthenticated ? 'Open Dashboard' : 'Try it now — Free'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
