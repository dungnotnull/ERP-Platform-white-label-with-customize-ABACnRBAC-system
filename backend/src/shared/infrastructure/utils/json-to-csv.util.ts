import { Parser } from 'json2csv';

export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  fields: string[],
): string {
  if (!rows.length) {
    return `${fields.join(',')}\n`;
  }

  const parser = new Parser({ fields });
  return parser.parse(rows);
}
