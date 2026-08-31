import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MineGuard Global Error Boundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-coal-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-amber-500 selection:text-black">
          <div className="max-w-md w-full bg-coal-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h2 className="text-lg font-bold text-white">Application Notice</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              MineGuard encountered a temporary view rendering anomaly. Your stored database records and inspection data remain fully safe.
            </p>

            {this.state.error?.message && (
              <div className="p-3 bg-coal-950 border border-slate-800 rounded-lg text-left text-[11px] font-mono text-amber-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-coal-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold border border-slate-700 transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
