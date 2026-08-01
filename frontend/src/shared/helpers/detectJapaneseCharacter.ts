function containsKanji(str: string): boolean {
  const kanjiRegex = /[\u4E00-\u9FAF]/;
  return kanjiRegex.test(str);
}

function extractKanji(str: string): string[] {
  return str.match(/[\u4E00-\u9FAF]/g) || [];
}

function isKanji(char: string): boolean {
  if (char.length !== 1) return false;
  return /^[\u4E00-\u9FAF]$/.test(char);
}

function containsHiragana(str: string): boolean {
  const hiraganaRegex = /[\u3040-\u309F]/;
  return hiraganaRegex.test(str);
}

function extractHiragana(str: string): string[] {
  return str.match(/[\u3040-\u309F]/g) || [];
}

function isHiragana(char: string): boolean {
  return char.length === 1 && /^[\u3040-\u309F]$/.test(char);
}

function containsKatakana(str: string): boolean {
  const katakanaRegex = /[\u30A0-\u30FF]/;
  return katakanaRegex.test(str);
}

function extractKatakana(str: string): string[] {
  return str.match(/[\u30A0-\u30FF]/g) || [];
}

function isKatakana(char: string): boolean {
  return char.length === 1 && /^[\u30A0-\u30FF]$/.test(char);
}

function containsKana(str: string): boolean {
  const kanaRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  return kanaRegex.test(str);
}

function extractKana(str: string): string[] {
  return str.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || [];
}

function isKana(char: string): boolean {
  return isHiragana(char) || isKatakana(char);
}

function halfWidthToFullWidth(str: string) {
  return str.replace(/[\uFF66-\uFF9F]/g, match =>
    String.fromCharCode(match.charCodeAt(0) - 0xfee0)
  );
}

function katakanaToHiragana(str: string) {
  return str.replace(/[\u30A1-\u30FA]/g, match =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
}

function convertJapaneseText(str: string) {
  const normalized = str.normalize("NFKC");
  return katakanaToHiragana(normalized);
}

export {
  containsKanji,
  extractKanji,
  isKanji,
  containsHiragana,
  extractHiragana,
  isHiragana,
  containsKatakana,
  extractKatakana,
  isKatakana,
  containsKana,
  extractKana,
  isKana,
  halfWidthToFullWidth,
  katakanaToHiragana,
  convertJapaneseText
};
