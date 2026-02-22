import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Attempt to reload the page to recover
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-8">
          <AlertTriangle className="w-24 h-24 text-red-400 mb-6" />
          <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong.</h1>
          <p className="text-lg text-center mb-8">
            We're sorry for the inconvenience. The application has encountered an unexpected error.
          </p>
          <Button
            onClick={this.handleReset}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
          {this.state.error && (
            <details className="mt-8 text-left bg-red-100 p-4 rounded-lg w-full max-w-2xl">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;