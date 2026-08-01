import { BookingMutationLockService } from './booking-mutation-lock.service';

describe('BookingMutationLockService', () => {
  let service: BookingMutationLockService;

  beforeEach(() => {
    service = new BookingMutationLockService();
  });

  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  it('returns the value produced by the callback', async () => {
    const result = await service.runExclusive(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('propagates exceptions and releases the lock', async () => {
    class Boom extends Error {}
    await expect(service.runExclusive(() => Promise.reject(new Boom('x')))).rejects.toThrow('x');

    const after = await service.runExclusive(() => Promise.resolve('ok'));
    expect(after).toBe('ok');
  });

  it('serializes concurrent calls (no overlap)', async () => {
    let active = 0;
    let maxActive = 0;
    const trace: string[] = [];

    const task = async (name: string) => {
      await service.runExclusive(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        trace.push(`${name}:start`);
        await delay(20);
        trace.push(`${name}:end`);
        active -= 1;
      });
    };

    await Promise.all([task('A'), task('B'), task('C')]);

    expect(maxActive).toBe(1);
    expect(trace).toHaveLength(6);
    const names = trace.map((t) => t.split(':')[0]);
    expect(names[0]).toBe(names[1]);
    expect(names[2]).toBe(names[3]);
    expect(names[4]).toBe(names[5]);
  });

  it('preserves FIFO order of acquisition', async () => {
    const order: string[] = [];
    const gate = new Promise<void>((resolve) => setTimeout(resolve, 5));

    const task = async (name: string, holdMs: number) => {
      await gate;
      await service.runExclusive(async () => {
        order.push(name);
        await delay(holdMs);
      });
    };

    await Promise.all([
      task('A', 30),
      task('B', 10),
      task('C', 10),
    ]);

    expect(order).toEqual(['A', 'B', 'C']);
  });
});
