import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
          <div className="glass-panel max-w-lg w-full p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 mb-6 animate-pulse">
                <AlertTriangle size={48} />
              </div>
              
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                <span className="bg-gradient-to-r from-rose-400 to-amber-500 bg-clip-text text-transparent">
                  Oops! Something went wrong
                </span>
              </h1>
              
              <p className="text-slate-400 mb-8 max-w-sm">
                An unexpected error occurred in our system. Don't worry, our engineers have been notified.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full text-left bg-slate-900/80 border border-slate-800/80 rounded-lg p-4 mb-8 text-xs font-mono overflow-auto max-h-40 text-rose-300">
                  <span className="font-bold text-rose-400">{this.state.error.toString()}</span>
                  <pre className="mt-2 opacity-80">{this.state.error.stack}</pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] shadow-lg shadow-rose-600/20 active:scale-[0.98]"
                >
                  <RefreshCw size={18} />
                  Retry Connection
                </button>
                <a
                  href="/"
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/50 text-slate-200 font-semibold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Home size={18} />
                  Back to Home
                </a>
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
