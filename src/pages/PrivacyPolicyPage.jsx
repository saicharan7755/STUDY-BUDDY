import { useEffect, useState } from 'react';
import { MetaTags } from '../components/ui';

const sections = [
  { id: 'overview', title: 'Overview' },
  { id: 'data-collection', title: 'What We Collect' },
  { id: 'how-we-collect', title: 'How We Collect Data' },
  { id: 'why-we-collect', title: 'Why We Collect Data' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'third-party', title: 'Third-Party Services' },
  { id: 'user-rights', title: 'Your Rights' },
  { id: 'cookie-policy', title: 'Cookie Policy' },
  { id: 'children-privacy', title: "Children's Privacy" },
  { id: 'contact', title: 'Contact' },
];

export default function PrivacyPolicyPage() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <MetaTags
        title="Privacy Policy | CRAM AI"
        description="Read CRAM AI's Privacy Policy for how we collect, store, and protect your study data."
      />
      <section className="legal-page relative overflow-hidden bg-midnight py-12 text-white">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/10 to-transparent print:hidden" />
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.32em] text-accent-light">Privacy Policy</p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Privacy and data use at CRAM AI
            </h1>
            <p className="mt-4 text-sm text-gray-400 sm:text-base">
              Last updated: May 15, 2026
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-white/10 bg-surface/80 p-6 text-sm text-gray-300 shadow-xl shadow-black/20">
                <p className="font-semibold text-white">On this page</p>
                <nav className="mt-5 space-y-3" aria-label="Privacy policy table of contents">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block rounded-2xl px-3 py-2 text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <main className="space-y-12">
              <div className="lg:hidden">
                <details className="rounded-3xl border border-white/10 bg-surface/80 p-5 text-sm text-gray-300">
                  <summary className="cursor-pointer font-semibold text-white">Table of contents</summary>
                  <nav className="mt-4 space-y-3" aria-label="Privacy policy table of contents">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block rounded-2xl px-3 py-2 text-gray-300 transition hover:bg-white/5 hover:text-white"
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </details>
              </div>

              <article className="space-y-10 rounded-3xl border border-white/10 bg-surface/80 p-8 shadow-xl shadow-black/20">
                <section id="overview" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Overview</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    CRAM AI is an AI-powered study tool that helps learners turn notes, documents, and study materials into active recall practice. We take your privacy seriously and built this policy to explain how we collect, use, protect, and retain your information.
                  </p>
                </section>

                <section id="data-collection" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">What We Collect</h2>
                  <ul className="mt-4 space-y-3 pl-5 text-gray-300">
                    <li className="list-disc">Account information such as email address and password hash.</li>
                    <li className="list-disc">Uploaded study content and documents submitted by you.</li>
                    <li className="list-disc">Usage analytics including app interactions, study session details, and feature usage.</li>
                    <li className="list-disc">Cookies and device information needed to operate the service.</li>
                  </ul>
                </section>

                <section id="how-we-collect" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">How We Collect Data</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    We collect data when you register for an account, submit study content, use the application, or interact with our pages. We may also gather data through cookies, local storage, and third-party analytics tools to understand how the service is used and to keep it secure.
                  </p>
                </section>

                <section id="why-we-collect" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Why We Collect Data</h2>
                  <ul className="mt-4 space-y-3 pl-5 text-gray-300">
                    <li className="list-disc">To provide and maintain your account and study materials.</li>
                    <li className="list-disc">To generate AI-powered flashcards and review content based on what you upload.</li>
                    <li className="list-disc">To improve the product, debug issues, and safeguard the service.</li>
                    <li className="list-disc">To communicate important updates, support requests, and notifications.</li>
                  </ul>
                </section>

                <section id="data-retention" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Data Retention</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    We retain your account data until you delete your account, plus up to 90 days for recovery and audit purposes. Uploaded study content and analytics data are retained for up to two years after your last activity unless you request deletion sooner. We keep cookie and local storage data for session management and analytics for no longer than 12 months.
                  </p>
                </section>

                <section id="third-party" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Third-Party Services</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    CRAM AI uses trusted third-party services to deliver the platform. This may include AI providers for study content processing, hosting providers such as Vercel, authentication and storage services like Firebase, and analytics tools for product improvement.
                  </p>
                </section>

                <section id="user-rights" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Your Rights</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    If you live in the EU, UK, or California, you have the right to access, correct, export, or delete your personal data. You may also withdraw consent for non-essential processing and request that we stop using your information for marketing or analytics.
                  </p>
                  <p className="mt-4 leading-8 text-gray-300">
                    To exercise these rights, contact us at support@cramai.ai. We will respond within the timeframes required by applicable law.
                  </p>
                </section>

                <section id="cookie-policy" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Cookie Policy</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    We use essential cookies to keep CRAM AI secure and functional. Non-essential cookies help us understand usage patterns and improve the service. You can accept or reject non-essential cookies through the consent banner shown on your first visit.
                  </p>
                </section>

                <section id="children-privacy" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Children's Privacy</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    CRAM AI is not directed at children under 13 and we do not knowingly collect data from anyone under 13. If we learn that we have collected personal data from a child under 13, we will promptly delete it.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Contact</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    For privacy questions or requests, email us at{' '}
                    <a href="mailto:support@cramai.ai" className="text-accent-light underline hover:text-white">
                      support@cramai.ai
                    </a>
                    .
                  </p>
                </section>
              </article>
            </main>
          </div>
        </div>

        {showTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 hidden rounded-full bg-accent px-4 py-3 text-black shadow-2xl shadow-black/30 transition hover:bg-accent-light lg:flex"
          >
            Back to top
          </button>
        )}
      </section>
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          .legal-page * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
          a::after { content: " (" attr(href) ")"; font-size: 90%; }
        }
      `}</style>
    </>
  );
}
