import { parseRequestLocale } from './parse-request-locale';

describe('parseRequestLocale', () => {
  it('defaults to vi when header is missing', () => {
    expect(parseRequestLocale(undefined)).toBe('vi');
    expect(parseRequestLocale('')).toBe('vi');
  });

  it('parses vi locale', () => {
    expect(parseRequestLocale('vi')).toBe('vi');
    expect(parseRequestLocale('vi-VN,en;q=0.9')).toBe('vi');
  });

  it('parses ja/jp locale', () => {
    expect(parseRequestLocale('ja')).toBe('ja');
    expect(parseRequestLocale('jp')).toBe('ja');
    expect(parseRequestLocale('ja-JP,en;q=0.8')).toBe('ja');
  });
});
