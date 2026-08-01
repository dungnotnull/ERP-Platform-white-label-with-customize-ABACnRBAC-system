import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '@/domains/identity/presentation/decorators/public.decorator';
import { ConfigService } from '@/config/config.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Check system health' })
  async check() {
    const mongo = this.checkMongo();
    const redis = await this.checkRedis();
    const allHealthy = mongo.status === 'up' && (redis.status === 'up' || redis.status === 'skipped');

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { mongo, redis },
    };
  }

  private checkMongo() {
    const readyState = this.mongoConnection.readyState;
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    const state = stateMap[readyState] || 'unknown';
    return {
      status: readyState === 1 ? 'up' : 'down',
      state,
      database: this.mongoConnection.name,
    };
  }

  private async checkRedis() {
    const host = this.configService.redisHost;
    const port = this.configService.redisPort;

    if (!host || !port) {
      return { status: 'skipped', reason: 'Redis not configured' };
    }

    try {
      const net = await import('net');
      return await new Promise<{ status: string; host: string; port: number }>((resolve) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve({ status: 'down', host, port });
        }, 2000);

        socket.connect(port, host, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve({ status: 'up', host, port });
        });

        socket.on('error', () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve({ status: 'down', host, port });
        });
      });
    } catch {
      return { status: 'down', host, port };
    }
  }
}
