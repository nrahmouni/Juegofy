import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onBackToMenu?: () => void;
}

interface State {
  hasError: boolean;
}

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GameErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
          <div className="text-5xl mb-4">🛠️</div>
          <h2 className="text-xl font-black text-white mb-2">
            ¡Ups! Este juego está en mantenimiento
          </h2>
          <p className="text-sm text-white/60 mb-6 max-w-xs">
            Ha ocurrido un error al cargar el minijuego. Prueba otro o vuelve al menú.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-3 rounded-2xl bg-white/10 text-white font-bold border border-white/20"
            >
              Reintentar
            </button>
            {this.props.onBackToMenu && (
              <button
                type="button"
                onClick={this.props.onBackToMenu}
                className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold"
              >
                Volver al menú
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
