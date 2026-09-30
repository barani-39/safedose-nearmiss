import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * SafeDose Clinical React Error Boundary
 *
 * Catches unhandled runtime and render-phase component exceptions across the UI tree.
 * Prevents application white-screen crashes in clinical environments and displays
 * an accessible, non-punitive, safe fallback screen without exposing raw stack traces.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error internally for diagnostic auditing without leaking patient details or tokens
    console.error('[SafeDose ErrorBoundary] Uncaught runtime exception caught in component tree:', {
      name: error.name,
      message: error.message,
      componentStack: errorInfo.componentStack?.slice(0, 300),
    });
  }

  public handleReset = (): void => {
    this.state = { hasError: false, error: null };
    try {
      this.setState({ hasError: false, error: null });
    } catch {
      // Safe no-op in unmounted or isolated test harnesses
    }
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[50vh] flex items-center justify-center p-6"
        >
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 tracking-wide uppercase mb-3">
              Application Resilience Notice
            </span>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
              Something went wrong while loading this section
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Your report data has not been intentionally changed. An unexpected user-interface
              exception occurred and was safely contained by SafeDose error boundaries.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </button>

              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Return to SafeDose Home
              </a>
            </div>

            <p className="text-xs text-slate-400 mt-6">
              If this error persists during clinical operations, please notify your Hospital Safety
              & Quality Committee.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
