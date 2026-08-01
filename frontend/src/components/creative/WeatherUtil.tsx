import { useQuery } from "@tanstack/react-query";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  CloudDrizzle
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import peaceBg1 from "@/assets/videos/peace_bg_1.mp4";
import peaceBg2 from "@/assets/videos/peace_bg_2.mp4";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

const CACHE_KEY = "weather_cache_hcmc";
const CACHE_TTL = 1000 * 60 * 60 * 2;

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=10.8231&longitude=106.6297" +
  "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
  "&timezone=Asia/Ho_Chi_Minh";

function getWeatherIcon(code: number, className = "w-8 h-8") {
  if ([0, 1].includes(code))
    return <Sun className={`${className} text-amber-400`} />;
  if ([2, 3].includes(code))
    return <Cloud className={`${className} text-slate-400`} />;
  if ([45, 48].includes(code))
    return <Cloud className={`${className} text-slate-300`} />;
  if ([51, 53, 55].includes(code))
    return <CloudDrizzle className={`${className} text-blue-400`} />;
  if ([61, 63, 65, 80, 81, 82].includes(code))
    return <CloudRain className={`${className} text-blue-500`} />;
  if ([71, 73, 75].includes(code))
    return <CloudSnow className={`${className} text-sky-300`} />;
  if ([95, 96, 99].includes(code))
    return <CloudLightning className={`${className} text-yellow-400`} />;
  return <Cloud className={`${className} text-slate-400`} />;
}

const WEATHER_CODE_TO_KEY: Record<number, string> = {
  0: "clear",
  1: "mainlyClear",
  2: "partlyCloudy",
  3: "overcast",
  45: "fog",
  48: "fogIce",
  51: "drizzleLight",
  53: "drizzle",
  55: "drizzleDense",
  61: "rainLight",
  63: "rain",
  65: "rainHeavy",
  71: "snowLight",
  73: "snow",
  75: "snowHeavy",
  80: "showers",
  81: "showersHeavy",
  82: "thundershower",
  95: "thunderstorm",
  96: "thunderstormHail",
  99: "thunderstormHeavy"
};

const DAY_INDEX_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function readCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    return Date.now() - timestamp < CACHE_TTL ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data: WeatherData) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
      <div className="text-slate-400">{icon}</div>
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-lg font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function DayCard({
  day,
  maxTemp,
  minTemp,
  code,
  index
}: {
  day: string;
  maxTemp: number;
  minTemp: number;
  code: number;
  index: number;
}) {
  const { t } = useTranslation();
  const date = new Date(day + "T00:00:00");
  const dayKey = DAY_INDEX_TO_KEY[date.getDay()];
  const label = index === 0 ? t("weather.today") : t(`weather.days.${dayKey}`);

  return (
    <div className="flex min-w-[100px] flex-shrink-0 flex-col items-center gap-2 rounded-2xl bg-white/60 px-3 py-4 backdrop-blur-sm">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {getWeatherIcon(code, "w-5 h-5")}
      <div className="text-center">
        <span className="text-sm font-semibold text-slate-700">
          {Math.round(maxTemp)}°
        </span>
        <span className="text-xs text-slate-400">
          {" "}
          / {Math.round(minTemp)}°
        </span>
      </div>
    </div>
  );
}

const VIDEO_SOURCES = [peaceBg1, peaceBg2];

function BackgroundVideo() {
  const src = useMemo(
    () => VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)],
    []
  );
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="none"
      className="absolute inset-0 h-full w-full object-cover opacity-30"
    />
  );
}

export default function WeatherSection() {
  const { t } = useTranslation();
  const [cachedData] = useState<WeatherData | null>(readCache);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    setCacheLoaded(true);
  }, []);

  const fetchWeather = useCallback(async (): Promise<WeatherData> => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch weather");
    const result: WeatherData = await res.json();
    writeCache(result);
    return result;
  }, []);

  const { data, isError } = useQuery<WeatherData>({
    queryKey: ["weather", "hcmc"],
    queryFn: fetchWeather,
    staleTime: CACHE_TTL,
    refetchInterval: 1000 * 60 * 45,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: cacheLoaded && !cachedData,
    initialData: cachedData ?? undefined,
    retry: 1
  });

  const weather = data ?? cachedData;

  if (!weather || isError) return null;

  const { current, daily } = weather;
  const feelsLike = Math.round(current.temperature_2m - 1.5);
  const conditionKey = WEATHER_CODE_TO_KEY[current.weather_code] ?? "unknown";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-6 sm:p-8">
      <BackgroundVideo />

      {/* Location */}
      <div className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <MapPin className="h-4 w-4 text-blue-400" />
        {t("weather.location")}
      </div>

      {/* Current weather */}
      <div className="mb-6 flex items-center gap-5">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70 shadow-sm backdrop-blur-sm">
          {getWeatherIcon(current.weather_code, "w-10 h-10")}
        </div>
        <div>
          <div className="flex items-end gap-1 leading-none">
            <span className="text-6xl font-light tracking-tight text-slate-800">
              {Math.round(current.temperature_2m)}
            </span>
            <span className="mb-1 text-2xl font-light text-slate-400">°C</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-blue-500">
            {t(`weather.conditions.${conditionKey}`)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {t("weather.feelsLike", { temp: feelsLike })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard
          icon={<Droplets className="h-4 w-4" />}
          label={t("weather.humidity")}
          value={`${current.relative_humidity_2m}%`}
        />
        <StatCard
          icon={<Wind className="h-4 w-4" />}
          label={t("weather.wind")}
          value={`${Math.round(current.wind_speed_10m)} km/h`}
        />
        <StatCard
          icon={<Thermometer className="h-4 w-4" />}
          label={t("weather.maxTemp")}
          value={`${Math.round(daily.temperature_2m_max[0])}°C`}
        />
      </div>

      {/* Divider */}
      <div className="mb-4 h-px w-full bg-white/50" />

      {/* 7-day forecast */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {t("weather.forecast7days")}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {daily.time.slice(0, 7).map((day, i) => (
          <DayCard
            key={day}
            day={day}
            maxTemp={daily.temperature_2m_max[i]}
            minTemp={daily.temperature_2m_min[i]}
            code={daily.weather_code[i]}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
