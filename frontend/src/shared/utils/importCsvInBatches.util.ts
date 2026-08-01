export interface ImportProgressState {
  percent: number;
  processed: number;
  total: number;
}

export const DEFAULT_IMPORT_BATCH_SIZE = 25;

export async function importInBatches<TRow, TResult>({
  rows,
  batchSize = DEFAULT_IMPORT_BATCH_SIZE,
  importBatch,
  mergeResults,
  onProgress,
  getInitialResult
}: {
  rows: TRow[];
  batchSize?: number;
  importBatch: (batch: TRow[], batchIndex: number) => Promise<TResult>;
  mergeResults: (
    acc: TResult,
    batchResult: TResult,
    batchStartIndex: number
  ) => TResult;
  onProgress?: (state: ImportProgressState) => void;
  getInitialResult: () => TResult;
}): Promise<TResult> {
  const total = rows.length;

  if (total === 0) {
    onProgress?.({ percent: 100, processed: 0, total: 0 });
    return getInitialResult();
  }

  let acc = getInitialResult();
  let processed = 0;

  onProgress?.({ percent: 0, processed: 0, total });

  for (let batchIndex = 0; batchIndex * batchSize < total; batchIndex++) {
    const batchStartIndex = batchIndex * batchSize;
    const batch = rows.slice(batchStartIndex, batchStartIndex + batchSize);
    const batchResult = await importBatch(batch, batchIndex);
    acc = mergeResults(acc, batchResult, batchStartIndex);
    processed += batch.length;
    onProgress?.({
      percent: Math.round((processed / total) * 100),
      processed,
      total
    });
  }

  return acc;
}
