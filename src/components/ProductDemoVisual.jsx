/**
 * Lightweight in-page demo (no heavy video asset). Shows upload → AI → cards.
 */
export default function ProductDemoVisual() {
  return (
    <div
      className="relative mx-auto aspect-video max-h-[420px] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)]"
      aria-label="Animated preview: upload notes, AI processing, flashcards appear"
    >
      <div className="absolute inset-0 flex flex-col p-6 sm:p-8">
        <div className="demo-p1 absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-2xl" aria-hidden>
            📄
          </div>
          <p className="font-heading text-lg font-semibold text-white">Upload your notes</p>
          <p className="text-center text-sm text-gray-400">PDF or paste — ready in seconds</p>
        </div>
        <div className="demo-p2 absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 sm:p-8">
          <div className="relative h-14 w-14">
            <span className="absolute inset-0 rounded-full border-2 border-accent/30" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent motion-reduce:animate-none" />
            <span className="absolute inset-2 flex items-center justify-center text-xl" aria-hidden>
              🤖
            </span>
          </div>
          <p className="font-heading text-lg font-semibold text-white">AI is building your deck</p>
          <p className="text-center text-sm text-gray-400">Analyzing concepts &amp; definitions</p>
        </div>
        <div className="demo-p3 absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 sm:p-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3" aria-hidden>
            {['Mitochondria', 'Active recall', 'Exam tip'].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-accent/30 bg-midnight/90 px-3 py-2 text-xs font-medium text-accent-light shadow-lg sm:px-4 sm:text-sm demo-card"
              >
                {label}
              </div>
            ))}
          </div>
          <p className="font-heading text-lg font-semibold text-white">Flashcards ready</p>
          <p className="text-center text-sm text-gray-400">Study with spaced repetition</p>
        </div>
      </div>
      <style>{`
        .demo-p1 { animation: cram-demo-p1 9s ease-in-out infinite; }
        .demo-p2 { animation: cram-demo-p2 9s ease-in-out infinite; }
        .demo-p3 { animation: cram-demo-p3 9s ease-in-out infinite; }
        .demo-card {
          animation: cram-card-pop 9s ease-in-out infinite;
        }
        .demo-card:nth-child(2) { animation-delay: 0.08s; }
        .demo-card:nth-child(3) { animation-delay: 0.16s; }
        @keyframes cram-demo-p1 {
          0%, 30% { opacity: 1; }
          36%, 100% { opacity: 0; }
        }
        @keyframes cram-demo-p2 {
          0%, 33% { opacity: 0; }
          36%, 63% { opacity: 1; }
          69%, 100% { opacity: 0; }
        }
        @keyframes cram-demo-p3 {
          0%, 66% { opacity: 0; }
          69%, 96% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes cram-card-pop {
          0%, 68% { transform: translateY(10px); opacity: 0; }
          72%, 94% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-4px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .demo-p1, .demo-p2, .demo-p3, .demo-card {
            animation: none !important;
          }
          .demo-p1 { opacity: 1; position: relative; }
          .demo-p2, .demo-p3 { display: none; }
        }
      `}</style>
    </div>
  );
}
