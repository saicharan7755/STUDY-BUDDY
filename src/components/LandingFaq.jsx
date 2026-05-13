import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const FAQ_ITEMS = [
  {
    q: 'Is CRAM AI free?',
    a: 'You can create your first study set for free. We offer generous free limits so students can try the full flow before upgrading.',
  },
  {
    q: 'What subjects does it work for?',
    a: 'Any subject with text-based material — biology, history, law, languages, and more. Paste notes, upload PDFs, or describe a topic.',
  },
  {
    q: 'How accurate are the AI-generated flashcards?',
    a: 'Cards are generated from your source material. Always review once; you can edit any card to match how you learn best.',
  },
  {
    q: "Can I edit the flashcards after they're created?",
    a: 'Yes. Every card can be edited, deleted, or reorganized after generation so your deck stays exam-ready.',
  },
  {
    q: 'Does it work with PDFs and images?',
    a: 'PDFs and pasted text work great. Image support depends on your upload; text-based PDFs give the best results.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Your study content is used to generate cards and is handled with standard security practices. Check our privacy policy for retention and account details.',
  },
];

export default function LandingFaq() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="w-full max-w-[min(100%,72rem)] mx-auto px-5 sm:px-6 py-20 md:py-28">
      <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-4">Questions, answered</h2>
      <p className="text-center text-gray-400 max-w-xl mx-auto mb-12">
        Everything you need to know before your first session.
      </p>
      <div className="max-w-2xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          const panelId = `${baseId}-panel-${i}`;
          const headerId = `${baseId}-header-${i}`;
          return (
            <div
              key={item.q}
              className={twMerge(
                'rounded-xl border transition-colors duration-200',
                isOpen ? 'border-accent/40 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-white/15'
              )}
            >
              <h3 className="text-base font-semibold m-0">
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-xl"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={twMerge(
                      'h-5 w-5 shrink-0 text-accent-light transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={twMerge(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 pt-0 text-sm text-gray-400 leading-relaxed border-t border-transparent">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
