import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { RESOURCE_ACTION_KEY, ResourceActionMetadata } from '@/domains/identity/presentation/decorators/resource-action.decorator';

@Injectable()
export class ResourceLoaderInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResourceLoaderInterceptor.name);
  private readonly modelRegistry: Map<string, Model<any>> = new Map();

  constructor(
    private readonly reflector: Reflector,
  ) {}

  registerModel(resourceName: string, model: Model<any>): void {
    this.modelRegistry.set(resourceName.toLowerCase(), model);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.get<ResourceActionMetadata>(
      RESOURCE_ACTION_KEY,
      context.getHandler(),
    );
    if (!meta) return next.handle();
    const request = context.switchToHttp().getRequest();
    const resourceId = request.params.id;
    if (!resourceId) return next.handle();

    const model = this.modelRegistry.get(meta.resource.toLowerCase());
    if (!model) {
      this.logger.warn(`No model registered for resource "${meta.resource}"`);
      return next.handle();
    }

    return from(model.findById(resourceId).lean()).pipe(
      tap(resource => {
        if (resource) {
          request._resource = resource;
        }
      }),
      switchMap(() => next.handle()),
    );
  }
}
