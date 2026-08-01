/** Khớp BE — giới hạn keyword tìm kiếm (tránh URL query quá dài). */
export const SEARCH_KEYWORD_MAX_LENGTH = 50;

export function clampSearchKeyword(value: string): string {
  if (!value) {
    return "";
  }
  return value.length > SEARCH_KEYWORD_MAX_LENGTH
    ? value.slice(0, SEARCH_KEYWORD_MAX_LENGTH)
    : value;
}
