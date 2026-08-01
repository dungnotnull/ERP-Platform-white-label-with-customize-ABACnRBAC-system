import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EndpointPermission, EndpointPermissionDocument } from '@/domains/identity/infrastructure/persistence/schemas/endpoint-permission.schema';
import _ from 'lodash';

export interface DiscoveredRoute {
  method: string;
  path: string;
  module: string;
  isAssigned: boolean;
}

const REQUEST_METHOD_TO_HTTP: Record<number, string> = {
  0: 'GET',
  1: 'POST',
  2: 'PUT',
  3: 'DELETE',
  4: 'PATCH',
  5: 'OPTIONS',
  6: 'HEAD',
  7: 'ALL',
};

@Injectable()
export class RouteDiscoveryService implements OnApplicationBootstrap {
  private discoveredRoutes: DiscoveredRoute[] = [];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    @InjectModel(EndpointPermission.name)
    private readonly epModel: Model<EndpointPermissionDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const controllers = this.discoveryService.getControllers();
    const assignedPerms = await this.epModel.find({ isActive: true }).lean();
    const assignedSet = new Set(
      assignedPerms.map((ep) => `${ep.method.toUpperCase()}:${ep.pathPattern}`),
    );

    const routes: DiscoveredRoute[] = [];

    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const controllerPath: string = this.reflector.get('path', metatype) || '';
      const module = this.inferModule(controllerPath);

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) => name !== 'constructor' && typeof prototype[name] === 'function',
      );

      for (const methodName of methodNames) {
        const requestMethod: number | undefined = this.reflector.get('requestMethod', prototype[methodName]);
        const endpointPath: string | undefined = this.reflector.get('path', prototype[methodName]);
        if (requestMethod === undefined || endpointPath === undefined) continue;

        const httpMethod = REQUEST_METHOD_TO_HTTP[requestMethod] || 'GET';
        const fullPath = `/${controllerPath}/${endpointPath}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        const key = `${httpMethod}:${fullPath}`;

        routes.push({
          method: httpMethod,
          path: fullPath,
          module,
          isAssigned: assignedSet.has(key),
        });
      }
    }

    this.discoveredRoutes = _(routes)
      .uniqBy((r) => `${r.method}:${r.path}`)
      .sortBy(['module', 'path'])
      .value();
  }

  getRoutes(module?: string): DiscoveredRoute[] {
    if (module) {
      return this.discoveredRoutes.filter((r) => r.module === module);
    }
    return this.discoveredRoutes;
  }

  private inferModule(controllerPath: string): string {
    const path = controllerPath.replace(/^\//, '').replace(/s$/, '');
    const moduleMap: Record<string, string> = {
      'auth': 'user',
      'user': 'user',
      'role': 'role',
      'permission': 'role',
      'endpoint-permission': 'role',
      'module': 'role',
      'device': 'device',
      'device-type': 'device-type',
      'device-status': 'device-status',
      'device-assignment': 'device-assignment',
      'device-maintenance': 'device-maintenance',
      'device-request': 'device-request',
      'department': 'department',
      'position': 'position',
      'internal-user': 'internal-user',
      'supplier': 'supplier',
      'health': 'health',
    };
    return moduleMap[controllerPath.replace(/^\//, '')] || path;
  }
}
