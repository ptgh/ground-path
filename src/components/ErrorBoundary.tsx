import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-6">
          <div className="text-center max-w-sm space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                An unexpected error occurred. Please try refreshing the page. If the issue persists, return to the home page.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              <Button variant="ghost" asChild className="gap-2 text-muted-foreground">
                <a href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to groundpath
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 pt-2">
              <Shield className="h-3 w-3" />
              <span>groundpath</span>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
