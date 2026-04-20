import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.tsx'
import './index.css'
import { initSentry } from './lib/sentry'

initSentry();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);
