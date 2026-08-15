"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { captureError } from "@/lib/monitoring";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback renderer — defaults to the shared `ErrorState` component. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Identifies which subtree failed in logs/monitoring — e.g. "shopper-dashboard.recent-tryons-card". */
  context: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Wraps an arbitrary subtree so a render error there shows a local
 * fallback instead of taking down the whole page — Next.js's own
 * `app/error.tsx` only catches errors at the route-segment level, not
 * around an individual dashboard widget. React error boundaries require a
 * class component (`getDerivedStateFromError`/`componentDidCatch` have no
 * hook equivalent) — this is the one class component in the app by
 * necessity. See docs/frontend/OBSERVABILITY.md "Error boundary".
 *
 * Not applied everywhere in this pass (that would be a much larger diff
 * across every dashboard) — wrap a component with it wherever an
 * individual widget's failure shouldn't block the rest of the page, e.g.:
 *   <ErrorBoundary context="admin-dashboard.alerts-panel">
 *     <AlertsPanel alerts={alerts} />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureError(error, { context: this.props.context, componentStack: errorInfo.componentStack });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <ErrorState
        description="This part of the page couldn't load. The rest of the app is unaffected."
        onRetry={this.reset}
      />
    );
  }
}

export { ErrorBoundary };
