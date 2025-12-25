import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlowButton } from './GlowButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md space-y-6">
            <h2 className="text-3xl font-serif font-bold text-amber-500">
              Что-то пошло не так
            </h2>
            <p className="text-white/70">
              Произошла непредвиденная ошибка. Мы уже работаем над её устранением.
            </p>
            <div className="pt-4">
              <GlowButton onClick={this.handleReload}>
                Обновить страницу
              </GlowButton>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-8 p-4 bg-zinc-900 rounded-lg text-left text-xs text-red-400 overflow-auto max-h-48">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
