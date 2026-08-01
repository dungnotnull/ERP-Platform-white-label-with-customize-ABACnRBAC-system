import { SEARCH_KEYWORD_MAX_LENGTH } from '@/shared/constants/search.constant';
import { escapeRegexLiteral } from '@/shared/utils/escape-regex-literal.util';

export function sanitizeSearchKeyword(
  search?: string | null,
): string | undefined {
  if (search == null) {
    return undefined;
  }

  const trimmed = String(search).trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length <= SEARCH_KEYWORD_MAX_LENGTH) {
    return trimmed;
  }

  return trimmed.slice(0, SEARCH_KEYWORD_MAX_LENGTH);
}

export function escapeRegex(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

/** Sanitize length/trim rồi escape để dùng an toàn trong MongoDB $regex. */
export function sanitizeSearchKeywordForRegex(
  search?: string | null,
): string | undefined {
  const keyword = sanitizeSearchKeyword(search);
  if (!keyword) {
    return undefined;
  }
  return escapeRegexLiteral(keyword);
}
