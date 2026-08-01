export type AppLocale = 'vi' | 'ja';

export function parseRequestLocale(acceptLanguage?: string): AppLocale {
  if (!acceptLanguage?.trim()) {
    return 'vi';
  }

  const primary = acceptLanguage.split(',')[0]?.trim().split(';')[0]?.trim();
  const lang = primary?.split('-')[0]?.toLowerCase() ?? 'vi';

  if (lang === 'ja' || lang === 'jp') {
    return 'ja';
  }

  return 'vi';
}
