/**
 * WeatherEncouragement — slim header strip showing local weather + a daily
 * gentle line. Intentional design element, not vestigial:
 *
 * - Mental health practice context: a small humanising signal in an
 *   otherwise clinical UI. The quote pool (src/lib/quotes.ts) is curated
 *   for AASW tone safety — no toxic positivity, no commands, gentle
 *   register only.
 * - Always renders a fixed-height wrapper so layout doesn't shift when
 *   data arrives. Silently hides on any failure — never shows error state.
 * - Privacy-respecting location resolution: prefers the browser's native
 *   geolocation API (requires user consent), falls back to IP-based
 *   lookup only if the user declines or the API is unavailable.
 *
 * Do not remove without checking with the practice owner. The component
 * earns its keep clinically, not aesthetically.
 */
import { useEffect, useState } from 'react';
import {
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
  type LucideIcon,
} from 'lucide-react';
import { quoteOfTheDay } from '@/lib/quotes';

interface WeatherInfo {
  city: string;
  temp: number;
  icon: LucideIcon;
  label: string;
}

const CACHE_KEY = 'gp_weather_v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedShape = { city: string; temp: number; code: number; fetchedAt: number };

// WMO weather code → icon + short word
// https://open-meteo.com/en/docs#weathervariables
const codeToIcon = (code: number): { icon: LucideIcon; label: string } => {
  if (code === 0) return { icon: Sun, label: 'Clear' };
  if (code <= 2) return { icon: CloudSun, label: 'Mild' };
  if (code === 3) return { icon: Cloud, label: 'Cloudy' };
  if (code === 45 || code === 48) return { icon: CloudFog, label: 'Foggy' };
  if (code >= 51 && code <= 67) return { icon: CloudRain, label: 'Showers' };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: 'Snow' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: 'Showers' };
  if (code >= 95) return { icon: CloudLightning, label: 'Storms' };
  return { icon: CloudSun, label: 'Mild' };
};

/**
 * Read cached weather. Enforces a 1-hour TTL — anything older is treated
 * as a miss so we re-resolve via the permission cascade. Silent-fail:
 * any storage / parse error returns null, never throws.
 */
const readCache = (): WeatherInfo | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedShape;
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt >= CACHE_TTL_MS) return null;
    const { icon, label } = codeToIcon(parsed.code);
    return { city: parsed.city, temp: parsed.temp, icon, label };
  } catch { return null; }
};

/**
 * Persist weather with a fetchedAt timestamp so readCache can enforce TTL.
 * Silent-fail: storage quota / disabled storage is never surfaced.
 */
const writeCache = (city: string, temp: number, code: number) => {
  try {
    const payload: CachedShape = { city, temp, code, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch { /* ignore */ }
};

type GeoResult = { city?: string; lat: number; lon: number };

/**
 * Wrap navigator.geolocation.getCurrentPosition in a promise. Caller is
 * responsible for deciding whether invoking this will trigger a permission
 * prompt — this helper does NOT check permission state itself.
 */
const getBrowserPosition = (): Promise<GeoResult | null> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, maximumAge: CACHE_TTL_MS },
    );
  });

/**
 * IP-based fallback. Two reputable free providers, first to succeed wins,
 * Sydney as the final safety net so the strip never looks broken.
 * Only invoked when the consent cascade has explicitly fallen through.
 */
const ipGeoLookup = async (signal: AbortSignal): Promise<GeoResult | null> => {
  const providers: Array<() => Promise<GeoResult>> = [
    async () => {
      const r = await fetch('https://ipapi.co/json/', { signal });
      if (!r.ok) throw new Error('ipapi');
      const j = await r.json() as { city?: string; latitude?: number; longitude?: number };
      if (!j.latitude || !j.longitude) throw new Error('ipapi-empty');
      return { city: j.city, lat: j.latitude, lon: j.longitude };
    },
    async () => {
      const r = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal });
      if (!r.ok) throw new Error('geojs');
      const j = await r.json() as { city?: string; latitude?: string; longitude?: string };
      const lat = Number(j.latitude); const lon = Number(j.longitude);
      if (!lat || !lon) throw new Error('geojs-empty');
      return { city: j.city, lat, lon };
    },
  ];
  for (const p of providers) {
    try { return await p(); } catch { /* try next */ }
  }
  return null;
};

type PermState = 'granted' | 'prompt' | 'denied' | 'unsupported';

/**
 * Probe geolocation permission WITHOUT triggering a prompt. Returns
 * 'unsupported' on browsers (older Safari) that lack the Permissions API
 * or the Geolocation API entirely — caller treats that as "skip native,
 * go straight to IP fallback".
 */
const queryGeoPermission = async (): Promise<PermState> => {
  try {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported';
    if (!navigator.permissions?.query) return 'unsupported';
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state as PermState;
  } catch {
    return 'unsupported';
  }
};

/**
 * Consent-first geo cascade. Order matters and is privacy-driven:
 *
 *   1. 'granted'     → use native geolocation immediately. No prompt fires
 *                      (the user has previously consented), no third-party
 *                      request leaves the browser.
 *   2. 'prompt'      → SKIP. We never auto-prompt on first landing — that
 *                      is hostile UX. The component renders a tiny opt-in
 *                      affordance instead; user-initiated clicks invoke
 *                      getBrowserPosition explicitly.
 *   3. 'denied'      → respect the no. Skip native entirely and fall
 *                      through to IP lookup (the user said no to precise
 *                      location, not to seeing weather at all).
 *   4. 'unsupported' → fall through to IP lookup.
 *
 * Returns null when the cascade is intentionally short-circuited (the
 * 'prompt' branch), so the caller knows to render the opt-in link rather
 * than firing any network request.
 */
const resolveLocation = async (
  permission: PermState,
  signal: AbortSignal,
): Promise<GeoResult | null> => {
  if (permission === 'granted') {
    const native = await getBrowserPosition();
    if (native) return native;
    // Granted but failed (e.g. no GPS fix) — fall through to IP.
    return ipGeoLookup(signal);
  }
  if (permission === 'prompt') {
    // Deliberate: do NOT auto-trigger a permission prompt. Return null so
    // the UI can offer an explicit opt-in link.
    return null;
  }
  // 'denied' or 'unsupported' → IP fallback only.
  return ipGeoLookup(signal);
};

const SYDNEY_FALLBACK: GeoResult = { city: 'Sydney', lat: -33.8688, lon: 151.2093 };

/**
 * Fetch current weather from open-meteo and persist to cache. Extracted
 * so both the initial effect and the user-initiated opt-in can share it.
 */
const fetchAndStoreWeather = async (
  loc: GeoResult,
  signal: AbortSignal,
): Promise<WeatherInfo | null> => {
  const wRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code`,
    { signal },
  );
  if (!wRes.ok) return null;
  const w = await wRes.json() as { current?: { temperature_2m?: number; weather_code?: number } };
  const t = w.current?.temperature_2m;
  const c = w.current?.weather_code;
  if (typeof t !== 'number' || typeof c !== 'number') return null;
  const city = loc.city ?? '';
  writeCache(city, Math.round(t), c);
  const { icon, label } = codeToIcon(c);
  return { city, temp: Math.round(t), icon, label };
};

const WeatherEncouragement = ({ compact = false }: { compact?: boolean }) => {
  const [info, setInfo] = useState<WeatherInfo | null>(() => readCache());
  // Tracks whether to render the inline "Show local weather" affordance.
  // Only true when permission is 'prompt' AND the user hasn't dismissed
  // it this session (dismissal happens implicitly on denial).
  const [canOptIn, setCanOptIn] = useState(false);
  const [optInHidden, setOptInHidden] = useState(false);
  const quote = quoteOfTheDay();

  useEffect(() => {
    if (info) return; // fresh cache hit — no network needed
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    (async () => {
      try {
        const permission = await queryGeoPermission();
        if (cancelled) return;

        if (permission === 'prompt') {
          // Surface the opt-in link; do not fetch anything.
          setCanOptIn(true);
          return;
        }

        const loc = (await resolveLocation(permission, controller.signal)) ?? SYDNEY_FALLBACK;
        if (cancelled) return;
        const next = await fetchAndStoreWeather(loc, controller.signal);
        if (cancelled || !next) return;
        setInfo(next);
      } catch {
        // silently hide
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [info]);

  // User-initiated opt-in: this is the ONLY path that may trigger a
  // browser permission prompt. If granted, we populate + cache. If denied
  // or dismissed, the link disappears for the rest of the session and the
  // IP fallback takes over.
  const handleOptIn = async () => {
    setCanOptIn(false);
    setOptInHidden(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const native = await getBrowserPosition();
      const loc = native ?? (await ipGeoLookup(controller.signal)) ?? SYDNEY_FALLBACK;
      const next = await fetchAndStoreWeather(loc, controller.signal);
      if (next) setInfo(next);
    } catch {
      /* silent */
    } finally {
      clearTimeout(timeout);
    }
  };

  const Icon = info?.icon;
  const showOptIn = !info && canOptIn && !optInHidden;

  return (
    <div
      className={
        compact
          ? 'flex items-center gap-2 text-[11px] text-surface-dark-muted/80 truncate min-h-[20px]'
          : 'hidden xl:flex items-center gap-2 text-xs text-surface-dark-muted/80 truncate min-h-[20px] max-w-[260px] 2xl:max-w-[480px]'
      }
      aria-label="Today's weather and encouragement"
    >
      {Icon && info && (
        <span className="flex items-center gap-1 shrink-0">
          <Icon className="h-3.5 w-3.5" style={{ color: 'hsl(var(--accent-sky))' }} aria-hidden />
          <span>{info.temp}°{info.city ? ` ${info.city}` : ''}</span>
          <span className="opacity-60">·</span>
        </span>
      )}
      {showOptIn && (
        <button
          type="button"
          onClick={handleOptIn}
          className="text-[10px] underline opacity-60 hover:opacity-100 shrink-0"
        >
          Show local weather
        </button>
      )}
      {showOptIn && <span className="opacity-60">·</span>}
      <span className="italic truncate" title={quote}>“{quote}”</span>
    </div>
  );
};

export default WeatherEncouragement;
