import { Component, type ReactNode } from 'react';
import { captureError } from '../../lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    captureError(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            Oups, quelque chose s'est mal passe
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Une erreur inattendue est survenue. Essaie de recharger la page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}
