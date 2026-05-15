import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cramAI_cookieConsent';

const CookieConsentBanner = () => {
  const [consent, setConsent] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!consent) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, consent);
    } catch (error) {
      console.error('Unable to write cookie consent to localStorage', error);
    }
  }, [consent]);

  const handleDecision = (value) => {
    setConsent(value);
  };

  if (consent) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 print:hidden">
      <div className="mx-auto max-w-6xl px-5 pb-5 lg:px-6">
        <div className="rounded-3xl border border-white/10 bg-surface/95 p-5 text-sm text-gray-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-white">Cookie preferences</p>
              <p className="mt-2 text-gray-300">
                We use cookies to keep CRAM AI secure, deliver essential functionality, and improve the experience. Decide how you want to use non-essential cookies.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => handleDecision('accepted')}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-3 font-semibold text-black transition hover:bg-accent-light"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => handleDecision('rejected')}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:border-accent hover:text-accent"
              >
                Reject Non-Essential
              </button>
            </div>
          </div>
          <div className="mt-4 text-gray-300">
            <Link
              to="/privacy-policy"
              className="font-semibold text-accent-light underline-offset-2 transition hover:text-white"
            >
              Learn more in our Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
