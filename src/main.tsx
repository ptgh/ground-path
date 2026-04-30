import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.tsx'
import './index.css'
import { initSentry, Sentry } from './lib/sentry'

initSentry();

const SentryFallback = () => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
    <div className="max-w-sm text-center space-y-3">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        We&apos;ve logged this and will look into it. Please refresh the page or return home.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-sm underline text-primary"
      >
        Refresh
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<SentryFallback />}>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </Sentry.ErrorBoundary>
);
