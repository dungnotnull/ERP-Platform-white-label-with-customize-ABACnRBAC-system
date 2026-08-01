import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import _ from 'lodash';
import { EndpointPermission, EndpointPermissionDocument } from '@/domains/identity/infrastructure/persistence/schemas/endpoint-permission.schema';

interface RouteEntry {
  method: string;
  pathPattern: string;
  regex: RegExp;
  bitIndex: number;
  isParametric: boolean;
}

@Injectable()
export class RouteMapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RouteMapService.name);
  private _routes: RouteEntry[] = [];

  get routes(): RouteEntry[] {
    return this._routes;
  }

  constructor(
    @InjectModel(EndpointPermission.name)
    private epModel: Model<EndpointPermissionDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.reload();
    this.logger.log(`RouteMap loaded with ${this._routes.length} active endpoint permissions`);
  }

  async reload(): Promise<void> {
    const eps = await this.epModel
      .find({ isActive: true })
      .select('method pathPattern pathRegex bitIndex')
      .lean();

    this._routes = _(eps)
      .map(ep => ({
        method: ep.method,
        pathPattern: ep.pathPattern,
        regex: new RegExp(ep.pathRegex),
        bitIndex: ep.bitIndex,
        isParametric: ep.pathPattern.includes(':'),
      }))
      .sortBy(e => Number(e.isParametric))
      .value();
  }

  removeApiPrefix(url: string): string {
    return url.replace(/^\/api\/v1/, '');
  }

  resolve(method: string, path: string): number | null {
  const cleanPath = this.removeApiPrefix(path.split('?')[0]);

  const entry = _.find(this._routes, (r) => 
    r.method === _.toUpper(method) && r.regex.test(cleanPath)
  );

  return entry?.bitIndex ?? null;
}
}
