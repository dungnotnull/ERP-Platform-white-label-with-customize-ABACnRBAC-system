/** Escape user input for safe use inside MongoDB / JS RegExp literal patterns. */
export function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
