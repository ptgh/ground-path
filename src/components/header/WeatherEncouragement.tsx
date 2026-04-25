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

const CACHE_KEY = 'gp_weather_v1';

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

const readCache = (): WeatherInfo | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { city: string; temp: number; code: number };
    const { icon, label } = codeToIcon(parsed.code);
    return { city: parsed.city, temp: parsed.temp, icon, label };
  } catch { return null; }
};

const writeCache = (city: string, temp: number, code: number) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ city, temp, code }));
  } catch { /* ignore */ }
};

/**
 * Slim header strip: weather + a daily gentle encouragement.
 * Silent on any failure — never shows an error state. Reserves a fixed
 * height so layout doesn't shift when the data arrives.
 */
const WeatherEncouragement = ({ compact = false }: { compact?: boolean }) => {
  const [info, setInfo] = useState<WeatherInfo | null>(() => readCache());
  const quote = quoteOfTheDay();

  useEffect(() => {
    if (info) return; // already cached for this session
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    (async () => {
      try {
        const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (!ipRes.ok) return;
        const ip = await ipRes.json() as { city?: string; latitude?: number; longitude?: number };
        if (!ip.latitude || !ip.longitude) return;
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${ip.latitude}&longitude=${ip.longitude}&current=temperature_2m,weather_code`,
          { signal: controller.signal },
        );
        if (!wRes.ok) return;
        const w = await wRes.json() as { current?: { temperature_2m?: number; weather_code?: number } };
        const t = w.current?.temperature_2m;
        const c = w.current?.weather_code;
        if (cancelled || typeof t !== 'number' || typeof c !== 'number') return;
        const city = ip.city ?? '';
        writeCache(city, Math.round(t), c);
        const { icon, label } = codeToIcon(c);
        setInfo({ city, temp: Math.round(t), icon, label });
      } catch {
        // silently hide
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [info]);

  // Always render the wrapper at fixed height to prevent CLS.
  // When info missing, just show the quote (still gentle).
  const Icon = info?.icon;

  return (
    <div
      className={
        compact
          ? 'flex items-center gap-2 text-[11px] text-surface-dark-muted/80 truncate min-h-[20px]'
          : 'hidden lg:flex items-center gap-2 text-xs text-surface-dark-muted/80 truncate min-h-[20px] max-w-[280px] xl:max-w-[420px] 2xl:max-w-[600px]'
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
      <span className="italic truncate" title={quote}>“{quote}”</span>
    </div>
  );
};

export default WeatherEncouragement;
