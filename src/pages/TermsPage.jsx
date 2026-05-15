import { useEffect, useState } from 'react';
import { MetaTags } from '../components/ui';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'service-description', title: 'Service Description' },
  { id: 'user-account-responsibilities', title: 'Account Responsibilities' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'ai-disclaimer', title: 'AI-Generated Content Disclaimer' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'availability', title: 'Service Availability' },
  { id: 'termination', title: 'Termination' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'contact', title: 'Contact' },
];

export default function TermsPage() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <MetaTags
        title="Terms of Service | CRAM AI"
        description="Review CRAM AI's Terms of Service for use of the study platform and AI services."
      />
      <section className="legal-page relative overflow-hidden bg-midnight py-12 text-white">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/10 to-transparent print:hidden" />
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.32em] text-accent-light">Terms of Service</p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Terms for using CRAM AI
            </h1>
            <p className="mt-4 text-sm text-gray-400 sm:text-base">
              Last updated: May 15, 2026
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-white/10 bg-surface/80 p-6 text-sm text-gray-300 shadow-xl shadow-black/20">
                <p className="font-semibold text-white">On this page</p>
                <nav className="mt-5 space-y-3" aria-label="Terms table of contents">
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
                  <nav className="mt-4 space-y-3" aria-label="Terms table of contents">
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
                <section id="acceptance" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Acceptance of Terms</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    By using CRAM AI, you agree to these Terms of Service. If you do not agree, please do not use the platform. These terms govern your access to and use of the website, mobile interfaces, and related services.
                  </p>
                </section>

                <section id="service-description" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Service Description</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    CRAM AI provides tools for converting study content into flashcards and related study materials. The service relies on AI assistance to support active recall, but it does not guarantee the accuracy or completeness of generated content.
                  </p>
                </section>

                <section id="user-account-responsibilities" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Account Responsibilities</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    You are responsible for keeping your login credentials secure and for all activity that occurs under your account. Notify us immediately if you believe your account has been compromised.
                  </p>
                </section>

                <section id="acceptable-use" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Acceptable Use Policy</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    You may not upload content that is unlawful, abusive, explicit, or infringing on third-party rights. Do not submit copyrighted material unless you own the rights or have permission to use it.
                  </p>
                </section>

                <section id="ai-disclaimer" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">AI-Generated Content Disclaimer</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    AI-generated study content is provided for educational support only. It may be inaccurate or incomplete. Always verify important information against reliable sources.
                  </p>
                </section>

                <section id="intellectual-property" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Intellectual Property</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    You retain ownership of the content you upload. By using CRAM AI, you grant the service a limited license to process and analyze your content in order to generate study output and improve the platform.
                  </p>
                </section>

                <section id="liability" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Limitation of Liability</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    To the maximum extent permitted by law, CRAM AI is not liable for any indirect, incidental, or consequential damages arising from your use of the service, including any reliance on generated study materials.
                  </p>
                </section>

                <section id="availability" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Service Availability and Downtime</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    We strive to keep CRAM AI available, but occasional downtime may occur for maintenance or service interruptions. We are not liable for temporary outages.
                  </p>
                </section>

                <section id="termination" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Termination</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    We may suspend or terminate accounts that violate these terms or pose a security risk. Upon termination, access to your account and content may be revoked.
                  </p>
                </section>

                <section id="governing-law" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Governing Law</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    These Terms are governed by the laws of California, United States, without regard to conflict of law principles.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-white">Contact</h2>
                  <p className="mt-4 leading-8 text-gray-300">
                    If you have questions about these Terms, email us at{' '}
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
