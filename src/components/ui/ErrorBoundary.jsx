import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

const reportErrorToService = async (error, info) => {
  try {
    if (typeof window !== 'undefined' && window.navigator && window.fetch) {
      await fetch('/.netlify/functions/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message, stack: error.stack, componentStack: info.componentStack }),
      });
    }
  } catch (reportError) {
    console.error('Error reporting failed', reportError);
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    reportErrorToService(error, info);
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-midnight px-6 py-12 text-white">
          <div className="max-w-xl w-full rounded-[2rem] border border-white/10 bg-surface/80 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-danger/10 text-danger-light">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-white">Something unexpected happened</h1>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  This has been reported to our team. You can refresh the page or return to the dashboard.
                </p>
              </div>
              <div className="w-full rounded-3xl bg-midnight/70 p-4 text-left text-sm text-gray-300">
                <p className="font-semibold text-white">Details:</p>
                <p className="break-words">{this.state.error?.message || 'Unknown rendering error.'}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={this.reset}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
                >
                  <RefreshCcw className="w-4 h-4" /> Refresh Page
                </button>
                <button
                  type="button"
                  onClick={() => window.location.assign('/dashboard')}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Home className="w-4 h-4" /> Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
