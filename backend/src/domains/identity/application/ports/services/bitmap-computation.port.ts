export interface IBitmapComputationService {
  computeBitmap(userId: string): Promise<Buffer>;
}
