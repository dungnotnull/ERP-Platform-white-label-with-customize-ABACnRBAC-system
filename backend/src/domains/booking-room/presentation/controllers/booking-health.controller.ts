import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingMutationLockService } from '../../application/services/booking-mutation-lock.service';
import { Public } from '@/domains/identity/presentation/decorators/public.decorator';

@ApiTags('booking-health')
@Controller('booking-health')
export class BookingHealthController {
  constructor(private readonly lockService: BookingMutationLockService) {}

  @Public()
  @Get('mutex-status')
  @ApiOperation({
    summary: 'Get booking mutation queue health status',
    description: 'Public endpoint to monitor booking queue mutex health and metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current queue health metrics',
    schema: {
      type: 'object',
      properties: {
        isHealthy: { type: 'boolean', description: 'Whether queue is operating normally' },
        queueDepth: { type: 'number', description: 'Current number of requests in queue' },
        totalProcessed: { type: 'number', description: 'Total requests processed since startup' },
        totalRejected: { type: 'number', description: 'Total requests rejected due to queue full' },
        maxObservedDepth: { type: 'number', description: 'Maximum queue depth observed' },
        isMutexLocked: { type: 'boolean', description: 'Whether mutex is currently held' },
      },
    },
  })
  getMutexStatus() {
    return this.lockService.getHealthStatus();
  }
}
