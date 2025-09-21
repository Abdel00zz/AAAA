import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Here you would typically log to an error reporting service
    }

    private handleReset = () => {
        // Simple reset strategy: reload the page.
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-text">
                    <div className="text-center p-8 bg-surface border border-error rounded-lg shadow-claude max-w-lg">
                        <span className="material-symbols-outlined text-5xl text-error">error</span>
                        <h1 className="mt-4 text-2xl font-bold text-text font-title">Quelque chose s'est mal passé.</h1>
                        <p className="mt-2 text-secondary">
                            Nous avons rencontré une erreur inattendue. Veuillez nous excuser pour la gêne occasionnée.
                        </p>
                        <details className="mt-4 text-left bg-background p-2 border rounded-md text-xs text-secondary">
                            <summary>Détails de l'erreur</summary>
                            <pre className="mt-2 whitespace-pre-wrap break-all">
                                {this.state.error?.toString()}
                            </pre>
                        </details>
                        <button
                            onClick={this.handleReset}
                            className="font-button mt-6 px-6 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover"
                        >
                            Recharger l'application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;