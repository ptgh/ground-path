import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const loadGA = () => {
  if (!GA_MEASUREMENT_ID || document.querySelector(`script[src*="gtag"]`)) return;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  window.gtag = gtag;
};

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => { loadGA(); }, []);

  useEffect(() => {
    if (window.gtag && GA_MEASUREMENT_ID) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
};

export default GoogleAnalytics;
