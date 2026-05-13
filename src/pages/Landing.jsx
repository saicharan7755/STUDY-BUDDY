import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  FileUp,
  RefreshCw,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks';
import { MetaTags, AnimatedCounter, LandingFaq, ProductDemoVisual, LazyDemoVideo } from '../components/ui';

const SECTION = 'scroll-mt-24 sm:scroll-mt-28';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered',
    desc: 'Turns dense notes into clear question-and-answer cards automatically.',
  },
  {
    icon: Smartphone,
    title: 'Study Anywhere',
    desc: 'Pick up on phone or laptop — your decks sync with your flow.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'From upload to review-ready flashcards in under a minute.',
  },
  {
    icon: RefreshCw,
    title: 'Spaced Repetition',
    desc: 'Review timing that helps facts stick for the exam and beyond.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    desc: 'See what you have mastered and what still needs reps.',
  },
  {
    icon: Target,
    title: 'Smart Quiz Mode',
    desc: 'Mix recall types so you are not just memorizing — you are applying.',
  },
];

const testimonials = [
  {
    quote:
      'I stopped rewriting the same definitions by hand. CRAM AI got me a deck I actually used the night before biochem.',
    name: 'Jordan M.',
    role: 'Pre-med, state university',
    initials: 'JM',
  },
  {
    quote:
      'The cards felt like they came from my lecture slides. Editing a few lines was enough to make it exam-perfect.',
    name: 'Alex R.',
    role: 'Beta tester, CS major',
    initials: 'AR',
  },
  {
    quote:
      'Finally something built for how students cram — fast setup, no fluff.',
    name: 'Sam K.',
    role: 'Early adopter, business school',
    initials: 'SK',
  },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/try');
    }
  };

  return (
    <>
      <MetaTags
        title="CRAM AI — Turn notes into smart flashcards"
        description="Upload any document. AI creates personalized study cards with spaced repetition so you study less and remember more. Built for students."
      />
      <div className="w-full flex flex-col items-stretch pb-16">
        {/* Hero */}
        <header className="w-full px-5 sm:px-6 pt-10 sm:pt-16 pb-14 md:pb-20">
          <div className="mx-auto flex max-w-[min(100%,72rem)] flex-col items-center text-center">
            <h1 className="font-heading text-[clamp(1.75rem,5vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-white animate-fade-in-up">
              Turn Your Notes Into Smart Flashcards in Seconds — Powered by AI
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-400 md:text-xl">
              Upload any document. Our AI creates personalized study cards so you study less and
              remember more.
            </p>

            <div className="mt-10 flex w-full max-w-lg flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="cta-primary group relative inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-accent/25 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] sm:min-h-[56px] sm:px-8 sm:text-lg"
              >
                Create My First Study Set — Free
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                onClick={() => scrollToId('demo')}
                className="cta-secondary inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-accent/50 hover:bg-white/10 hover:shadow-lg active:scale-[0.98] sm:min-h-[56px] sm:px-8"
              >
                <span className="text-lg leading-none text-accent-light" aria-hidden>
                  ▶
                </span>
                <span>Watch Demo</span>
              </button>
            </div>

            <p className="mt-8 text-sm font-medium text-gray-300 sm:text-base">
              <span className="text-amber-400" aria-hidden>
                ⭐
              </span>{' '}
              Used by 2,000+ students
            </p>

            <div className="mt-12 w-full max-w-4xl">
              <img
                src="/landing-hero-screenshot.svg"
                alt="CRAM AI study interface showing flashcard front and back with study controls"
                width={960}
                height={540}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="mx-auto w-full rounded-2xl border border-white/10 shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)] transition-transform duration-300 hover:scale-[1.01]"
              />
            </div>
          </div>
        </header>

        {/* Demo */}
        <section id="demo" className={`${SECTION} w-full px-5 sm:px-6 py-16 md:py-24`}>
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <h2 className="font-heading text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              See CRAM AI in Action
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-400 sm:text-base">
              Upload notes → AI processing → flashcards you can study right away.
            </p>
            <div className="mt-10">
              {import.meta.env.VITE_LANDING_DEMO_MP4 ? (
                <LazyDemoVideo />
              ) : (
                <ProductDemoVisual />
              )}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className={`${SECTION} w-full bg-white/[0.02] px-5 sm:px-6 py-16 md:py-24`}>
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <h2 className="font-heading text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-gray-400">
              Three steps from messy notes to confident recall.
            </p>
            <div className="mx-auto mt-14 flex max-w-5xl flex-col md:flex-row md:items-stretch md:gap-3" role="list">
              {[
                {
                  step: 1,
                  icon: FileUp,
                  emoji: '📄',
                  title: 'Upload Your Notes',
                  desc: 'Paste text, upload PDFs, or type your topic',
                },
                {
                  step: 2,
                  icon: Sparkles,
                  emoji: '🤖',
                  title: 'AI Does the Work',
                  desc: 'Our AI analyzes your content and creates smart flashcards instantly',
                },
                {
                  step: 3,
                  icon: Brain,
                  emoji: '🧠',
                  title: 'Study & Retain',
                  desc: 'Review with spaced repetition and ace your exams with confidence',
                },
              ].map((item, idx) => (
                <Fragment key={item.step}>
                  <article
                    role="listitem"
                    className="group flex flex-1 flex-col items-center rounded-2xl border border-white/10 bg-surface/40 p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/35 hover:shadow-lg hover:shadow-black/40"
                  >
                    <span className="mb-3 text-3xl md:hidden" aria-hidden>
                      {item.emoji}
                    </span>
                    <div className="mb-4 hidden h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-light transition-transform duration-300 group-hover:scale-110 md:flex">
                      <item.icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                    </div>
                    <span className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-light">
                      Step {item.step}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
                  </article>
                  {idx < 2 && (
                    <div
                      className="flex flex-shrink-0 items-center justify-center py-2 md:w-10 md:py-0"
                      aria-hidden
                    >
                      <span className="text-2xl text-accent/60 md:hidden">↓</span>
                      <span className="hidden text-2xl font-light text-accent/50 md:inline">→</span>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="cta-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                Try It Free — No Account Needed
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className={`${SECTION} w-full px-5 sm:px-6 py-16 md:py-24`}>
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <h2 className="font-heading text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Built for real study sessions
            </h2>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <li
                  key={title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:bg-white/[0.06] hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent-light transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Social proof */}
        <section id="trust" className={`${SECTION} w-full bg-white/[0.02] px-5 sm:px-6 py-16 md:py-24`}>
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-accent-light">
              Built by a student, for students
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
              <div className="text-center">
                <p className="font-heading text-4xl font-bold tabular-nums text-white sm:text-5xl">
                  <AnimatedCounter value={500} suffix="+" />
                </p>
                <p className="mt-1 text-sm text-gray-400">flashcard sets created</p>
              </div>
              <div className="hidden h-12 w-px bg-white/15 sm:block" aria-hidden />
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 text-amber-400" aria-label="4.8 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 sm:h-7 sm:w-7 ${i === 4 ? 'text-amber-400/50' : ''}`}
                      fill="currentColor"
                      strokeWidth={0}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="text-lg font-semibold text-white">4.8 / 5</p>
                <p className="text-sm text-gray-500">from beta feedback</p>
              </div>
            </div>
            <p className="mt-10 text-center text-sm text-gray-500">
              Loved on campus discords and study-group group chats — share your deck link and cram
              together.
            </p>
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <li
                  key={t.name}
                  className="flex flex-col rounded-2xl border border-white/10 bg-surface/50 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-light text-sm font-bold text-white"
                      aria-hidden
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <blockquote className="text-sm leading-relaxed text-gray-300">&ldquo;{t.quote}&rdquo;</blockquote>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LandingFaq />

        {/* Final CTA */}
        <section className="w-full px-5 sm:px-6 py-16 md:py-20" aria-labelledby="final-cta-heading">
          <div className="mx-auto max-w-[min(100%,72rem)] rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/20 via-midnight to-midnight p-10 text-center shadow-[0_24px_60px_-12px_rgba(124,58,237,0.35)] sm:p-14">
            <h2 id="final-cta-heading" className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Ready for your smartest cram session yet?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-300">
              Generate flashcards now and walk into the exam with recall you can trust.
            </p>
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="cta-primary mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              Generate Flashcards Now
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </section>
      </div>

      <style>{`
        .cta-primary {
          background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 55%, #6d28d9 100%);
        }
        .cta-primary:hover {
          background: linear-gradient(180deg, #a78bfa 0%, #7c3aed 50%, #5b21b6 100%);
        }
        .cta-primary:focus-visible {
          outline: 2px solid #c4b5fd;
          outline-offset: 3px;
        }
        .cta-secondary:focus-visible {
          outline: 2px solid #a78bfa;
          outline-offset: 3px;
        }
      `}</style>
    </>
  );
}
