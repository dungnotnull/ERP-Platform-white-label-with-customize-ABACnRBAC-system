import { Readable } from 'stream';
import csv from 'csv-parser';

export type CsvDelimiter = ',' | ';' | '\t';

function countDelimiterOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      count++;
    }
  }

  return count;
}

export function detectCsvDelimiter(content: string): CsvDelimiter {
  const firstLine =
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? '';

  if (!firstLine) {
    return ',';
  }

  const counts: Record<CsvDelimiter, number> = {
    ',': countDelimiterOutsideQuotes(firstLine, ','),
    ';': countDelimiterOutsideQuotes(firstLine, ';'),
    '\t': countDelimiterOutsideQuotes(firstLine, '\t'),
  };

  const maxCount = Math.max(counts[','], counts[';'], counts['\t']);
  if (maxCount === 0) {
    return ',';
  }

  const delimiters: CsvDelimiter[] = [',', ';', '\t'];
  return delimiters.find((delimiter) => counts[delimiter] === maxCount) ?? ',';
}

export async function parseCsvBuffer(
  buffer: Buffer,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];

    const content = buffer
      .toString('utf8')
      .replace(/^\uFEFF/, '');
    const separator = detectCsvDelimiter(content);

    Readable.from(content)
      .pipe(csv({ separator }))
      .on('data', (row: Record<string, string>) => {
        const cleanedRow = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key.replace(/^\uFEFF/, '').trim(),
            typeof value === 'string'
              ? value.replace(/^\uFEFF/, '').trim()
              : value,
          ]),
        );

        rows.push(cleanedRow);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

export function getCsvValue(
  row: Record<string, string>,
  keys: string[],
): string | undefined {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]),
  );

  for (const key of keys) {
    const value = normalized[key.toLowerCase()];
    if (value !== undefined && value !== '') {
      return value.trim();
    }
  }

  return undefined;
}
