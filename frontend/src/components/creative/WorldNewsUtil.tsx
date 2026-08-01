import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image_url?: string;
  source_name: string;
  pubDate: string;
}

const CACHE_KEY = "world_news_cache";
const CACHE_TTL = 1000 * 60 * 60 * 3;

// PUBLIC KEYS - SO DONT WORRY ABOUT IT
const API_KEYS = [
  "pub_f05d64e9bcca411ead221437163c2154",
  "pub_dd72d4b88f284852be917021cacb11d9",
  "pub_3ec94252209f4932a4a79c495161c35c"
];

function readCache(): NewsItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    return Date.now() - timestamp < CACHE_TTL ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data: NewsItem[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

function isCacheValid(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const { timestamp } = JSON.parse(raw);
    return Date.now() - timestamp < CACHE_TTL;
  } catch {
    return false;
  }
}

function NewsImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100">
        <span className="text-3xl">📰</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

function HeroCard({ news }: { news: NewsItem }) {
  return (
    <div className="group relative col-span-full block h-72 overflow-hidden rounded-2xl sm:h-80">
      <div className="absolute inset-0">
        <NewsImage src={news.image_url} alt={news.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-white">
            {news.source_name}
          </span>
          <Clock className="h-3 w-3" />
          {new Date(news.pubDate).toLocaleDateString()}
        </div>
        <h3 className="line-clamp-2 text-xl font-semibold text-white transition-colors group-hover:text-blue-300 sm:text-2xl">
          {news.title}
        </h3>
        {news.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-white/70">
            {news.description}
          </p>
        )}
      </div>
      <div className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <ExternalLink className="h-4 w-4 text-white" />
      </div>
    </div>
  );
}

function GridCard({ news }: { news: NewsItem }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md">
      <div className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-slate-100">
        <NewsImage src={news.image_url} alt={news.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute right-3 top-3 rounded-full bg-white/20 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-blue-600">
          {news.title}
        </h3>
        {news.description && (
          <p className="line-clamp-2 text-xs text-slate-500">
            {news.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-slate-400">
          <span className="font-medium text-slate-500">{news.source_name}</span>
          <span>·</span>
          <Clock className="h-3 w-3" />
          <span>{new Date(news.pubDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function ListCard({ news }: { news: NewsItem }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl bg-white/60 p-3 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md">
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <NewsImage src={news.image_url} alt={news.title} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-blue-600">
          {news.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-medium text-slate-500">{news.source_name}</span>
          <span>·</span>
          <Clock className="h-3 w-3" />
          <span>{new Date(news.pubDate).toLocaleDateString()}</span>
        </div>
        <div>
          {news.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">
              {news.description}
            </p>
          )}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-blue-400" />
    </div>
  );
}

export default function WorldNewsSection() {
  const { t } = useTranslation();
  const [cachedData] = useState<NewsItem[] | null>(readCache);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    setCacheLoaded(true);
  }, []);

  const fetchWithRotation = useCallback(async (): Promise<NewsItem[]> => {
    let lastError: Error | null = null;

    for (const key of API_KEYS) {
      try {
        const res = await fetch(
          `https://newsdata.io/api/1/news?apikey=${key}&category=world&language=en&size=10`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result = await res.json();
        const news: NewsItem[] = (result.results ?? []).map((item: any) => ({
          title: item.title ?? "",
          description: item.description?.slice(0, 160) ?? "",
          url: item.url ?? "#",
          image_url: item.image_url,
          source_name: item.source_name ?? "Unknown",
          pubDate: item.pubDate ?? ""
        }));

        if (news.length > 0) {
          writeCache(news);
          return news;
        }
      } catch (err) {
        lastError = err as Error;
      }
    }

    throw lastError ?? new Error("All API keys failed");
  }, []);

  const { data, isLoading, refetch, isError } = useQuery<NewsItem[]>({
    queryKey: ["world-news"],
    queryFn: fetchWithRotation,
    staleTime: CACHE_TTL,
    refetchInterval: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: cacheLoaded && !cachedData,
    initialData: cachedData ?? undefined,
    retry: 1
  });

  const news = data ?? cachedData ?? [];

  const handleRefresh = () => {
    if (isCacheValid()) {
      setToastMsg(t("news.cacheNotice"));
      setTimeout(() => setToastMsg(""), 2500);
      return;
    }
    refetch();
  };

  if (isLoading && news.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-6 sm:p-8">
        <div className="mb-6 h-7 w-56 animate-pulse rounded-lg bg-white/60" />
        <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full h-72 rounded-2xl bg-white/50" />
          {[0, 1, 2].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white/50" />
          ))}
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="col-span-full h-20 rounded-2xl bg-white/50 sm:col-span-1 lg:col-span-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if ((isError || news.length === 0) && !isLoading) return null;

  const hero = news[0];
  const gridItems = news.slice(1, 4);
  const listItems = news.slice(4, 10);

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-6 sm:p-8 mt-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-blue-800 leading-tight tracking-tight">
          {t("news.title")}
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-700"
        >
          <RefreshCw className="h-4 w-4" />
          {t("news.refresh")}
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="mb-4 rounded-xl bg-emerald-50 py-2 text-center text-sm text-emerald-600">
          {toastMsg}
        </div>
      )}

      {/* Grid layout */}
      <div className="flex flex-col gap-4">
        {/* Hero */}
        {hero && <HeroCard news={hero} />}

        {/* 3-column grid */}
        {gridItems.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridItems.map((item, i) => (
              <GridCard key={i} news={item} />
            ))}
          </div>
        )}

        {/* Divider */}
        {listItems.length > 0 && (
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/50" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("news.otherNews")}
            </span>
            <div className="h-px flex-1 bg-white/50" />
          </div>
        )}

        {/* List */}
        {listItems.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {listItems.map((item, i) => (
              <ListCard key={i} news={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
