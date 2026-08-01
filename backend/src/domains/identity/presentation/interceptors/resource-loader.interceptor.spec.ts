import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { ResourceLoaderInterceptor } from './resource-loader.interceptor';
import { Types } from 'mongoose';

const makeHandlerFn = () => jest.fn();

const makeContext = (overrides: Record<string, any> = {}): { ctx: ExecutionContext; request: any } => {
  const request: any = {
    params: {},
    ...overrides,
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: makeHandlerFn(),
  } as any;
  return { ctx, request };
};

describe('ResourceLoaderInterceptor', () => {
  let interceptor: ResourceLoaderInterceptor;
  let reflector: Reflector;
  let model: any;

  beforeEach(() => {
    reflector = new Reflector();
    model = {
      findById: jest.fn(),
    };
    interceptor = new ResourceLoaderInterceptor(reflector);
  });

  describe('intercept', () => {
    it('returns next.handle() unchanged when no @ResourceAction decorator', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      const { ctx } = makeContext();
      const next: CallHandler = { handle: () => of('original') };

      const result = await lastValueFrom(interceptor.intercept(ctx, next));

      expect(result).toBe('original');
    });

    it('returns next.handle() when request.params.id is missing', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });
      const { ctx } = makeContext({ params: {} });
      const next: CallHandler = { handle: () => of('no-id') };

      const result = await lastValueFrom(interceptor.intercept(ctx, next));

      expect(result).toBe('no-id');
    });

    it('returns next.handle() when no model registered for resource type', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'widget', action: 'read' });
      const { ctx } = makeContext({ params: { id: '123' } });
      const next: CallHandler = { handle: () => of('no-model') };

      const result = await lastValueFrom(interceptor.intercept(ctx, next));

      expect(result).toBe('no-model');
    });

    it('calls model.findById(resourceId).lean() and attaches result', async () => {
      interceptor.registerModel('device', model as any);
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });

      const doc = { _id: new Types.ObjectId(), name: 'Device 1', departmentId: 'dept1' };
      const mockLean = jest.fn().mockResolvedValue(doc);
      model.findById = jest.fn().mockReturnValue({ lean: mockLean });

      const { ctx, request } = makeContext({ params: { id: '507f1f77bcf86cd799439011' } });
      const next: CallHandler = { handle: () => of('loaded') };

      await lastValueFrom(interceptor.intercept(ctx, next));

      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(request._resource).toEqual(doc);
    });

    it('does NOT attach _resource when model.findById returns null', async () => {
      interceptor.registerModel('device', model as any);
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });

      const mockLean = jest.fn().mockResolvedValue(null);
      model.findById = jest.fn().mockReturnValue({ lean: mockLean });

      const { ctx, request } = makeContext({ params: { id: 'nonexistent' } });
      const next: CallHandler = { handle: () => of('not-found') };

      await lastValueFrom(interceptor.intercept(ctx, next));

      expect(request._resource).toBeUndefined();
    });

    it('calls next.handle() in the pipeline', async () => {
      interceptor.registerModel('device', model as any);
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });

      const mockLean = jest.fn().mockResolvedValue({ _id: 'd1' });
      model.findById = jest.fn().mockReturnValue({ lean: mockLean });

      const { ctx } = makeContext({ params: { id: 'd1' } });
      const next: CallHandler = { handle: () => of('pipeline-output') };

      const result = await lastValueFrom(interceptor.intercept(ctx, next));

      expect(result).toBe('pipeline-output');
    });

    it('case-insensitive resource name lookup in registry', async () => {
      interceptor.registerModel('Device', model as any);
      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'DEVICE', action: 'read' });

      const doc = { _id: 'd1' };
      const mockLean = jest.fn().mockResolvedValue(doc);
      model.findById = jest.fn().mockReturnValue({ lean: mockLean });

      const { ctx } = makeContext({ params: { id: 'd1' } });
      const next: CallHandler = { handle: () => of('ok') };

      await lastValueFrom(interceptor.intercept(ctx, next));

      expect(model.findById).toHaveBeenCalled();
    });
  });

  describe('registerModel', () => {
    it('stores model with lowercase key', async () => {
      interceptor.registerModel('DeviceProfile', model as any);

      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'deviceprofile', action: 'read' });
      const mockLean = jest.fn().mockResolvedValue({ _id: 'd1' });
      model.findById = jest.fn().mockReturnValue({ lean: mockLean });

      const { ctx } = makeContext({ params: { id: 'd1' } });
      const next: CallHandler = { handle: () => of('ok') };

      await lastValueFrom(interceptor.intercept(ctx, next));
      expect(model.findById).toHaveBeenCalled();
    });

    it('overwrites existing registration for same resource name', async () => {
      const model2: any = { findById: jest.fn() };

      interceptor.registerModel('device', model as any);
      interceptor.registerModel('device', model2 as any);

      jest.spyOn(reflector, 'get').mockReturnValue({ resource: 'device', action: 'read' });
      const mockLean = jest.fn().mockResolvedValue({ _id: 'd1' });
      model2.findById = jest.fn().mockReturnValue({ lean: mockLean });

      const { ctx } = makeContext({ params: { id: 'd1' } });
      const next: CallHandler = { handle: () => of('ok') };

      await lastValueFrom(interceptor.intercept(ctx, next));
      expect(model2.findById).toHaveBeenCalled();
      expect(model.findById).not.toHaveBeenCalled();
    });
  });
});
