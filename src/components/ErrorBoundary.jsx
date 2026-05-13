import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
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
        <div className="min-h-screen flex items-center justify-center bg-midnight text-white px-6 py-12">
          <div className="max-w-lg w-full glass-card border border-white/10 p-8 text-center">
            <div className="flex items-center justify-center mb-4 text-danger-light">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-3">Oops, something broke.</h1>
            <p className="text-gray-300 mb-6">
              An unexpected error occurred while loading the app. You can retry below or refresh the
              page.
            </p>
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
            >
              <RefreshCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
