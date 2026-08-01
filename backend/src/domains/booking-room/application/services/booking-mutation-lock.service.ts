import { Injectable, Logger } from '@nestjs/common';
import { Mutex } from 'async-mutex';
import { Cron, CronExpression } from '@nestjs/schedule';

const QUEUE_DEPTH_WARNING_THRESHOLD = 3;
const QUEUE_DEPTH_REJECT_THRESHOLD = 7;
const MAX_QUEUE_HISTORY = 100;

interface QueuedRequest {
  timestamp: number;
  operation: string;
}

@Injectable()
export class BookingMutationLockService {
  private readonly mutex = new Mutex();
  private readonly logger = new Logger(BookingMutationLockService.name);
  private pendingQueue: QueuedRequest[] = [];
  private queueDepthCounter = 0;
  private totalProcessedRequests = 0;
  private totalRejectedRequests = 0;
  private maxObservedQueueDepth = 0;

  runExclusive<T>(callback: () => Promise<T>, operation = 'mutation'): Promise<T> {
    this.trackQueueEntry(operation);

    const wrappedCallback = async (): Promise<T> => {
      this.trackQueueStart();
      try {
        return await callback();
      } finally {
        this.trackQueueEnd();
      }
    };

    return this.mutex.runExclusive(wrappedCallback);
  }

  private trackQueueEntry(operation: string): void {
    this.queueDepthCounter++;
    this.pendingQueue.push({
      timestamp: Date.now(),
      operation,
    });

    this.lazyCleanupIfNeeded();

    if (this.queueDepthCounter >= QUEUE_DEPTH_REJECT_THRESHOLD) {
      this.queueDepthCounter--;
      this.pendingQueue.pop();
      this.totalRejectedRequests++;
      this.logger.warn(
        `Queue depth ${this.queueDepthCounter} >= reject threshold ${QUEUE_DEPTH_REJECT_THRESHOLD}. Rejecting request.`
      );
      throw new Error('BOOKING_QUEUE_FULL');
    }

    if (this.queueDepthCounter > this.maxObservedQueueDepth) {
      this.maxObservedQueueDepth = this.queueDepthCounter;
    }

    if (this.queueDepthCounter >= QUEUE_DEPTH_WARNING_THRESHOLD) {
      this.logger.warn(
        `Queue depth: ${this.queueDepthCounter} (operation: ${operation}). Performance may degrade.`
      );
    }
  }

  private trackQueueStart(): void {
    const entry = this.pendingQueue.shift();
    if (entry) {
      const waitTime = Date.now() - entry.timestamp;
      if (waitTime > 1000) {
        this.logger.warn(`Request waited ${waitTime}ms in queue (operation: ${entry.operation})`);
      }
    }
  }

  private trackQueueEnd(): void {
    this.queueDepthCounter--;
    this.totalProcessedRequests++;
  }

  private lazyCleanupIfNeeded(): void {
    if (this.pendingQueue.length > MAX_QUEUE_HISTORY) {
      const before = this.pendingQueue.length;
      this.pendingQueue = this.pendingQueue.slice(-MAX_QUEUE_HISTORY);
      this.logger.debug(
        `Lazy cleanup triggered: queue history ${before} -> ${this.pendingQueue.length} entries`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private dailyCleanup(): void {
    const beforeLength = this.pendingQueue.length;
    const beforeProcessed = this.totalProcessedRequests;
    const beforeRejected = this.totalRejectedRequests;

    this.pendingQueue = [];
    this.totalProcessedRequests = 0;
    this.totalRejectedRequests = 0;

    this.logger.log(
      `Daily cleanup completed. Cleared ${beforeLength} queue history entries. Reset metrics: processed=${beforeProcessed}, rejected=${beforeRejected}`,
    );
  }

  getQueueDepth(): number {
    return this.queueDepthCounter;
  }

  getHealthStatus(): {
    isHealthy: boolean;
    queueDepth: number;
    totalProcessed: number;
    totalRejected: number;
    maxObservedDepth: number;
    isMutexLocked: boolean;
  } {
    const isHealthy = this.queueDepthCounter < QUEUE_DEPTH_REJECT_THRESHOLD;
    return {
      isHealthy,
      queueDepth: this.queueDepthCounter,
      totalProcessed: this.totalProcessedRequests,
      totalRejected: this.totalRejectedRequests,
      maxObservedDepth: this.maxObservedQueueDepth,
      isMutexLocked: this.mutex.isLocked(),
    };
  }

  resetMetrics(): void {
    this.totalProcessedRequests = 0;
    this.totalRejectedRequests = 0;
    this.maxObservedQueueDepth = 0;
  }
}
