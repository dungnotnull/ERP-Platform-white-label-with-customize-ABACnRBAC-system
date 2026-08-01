import { ExecutionContext } from '@nestjs/common';
import { IPolicyHandler } from './policy-handler.interface';

export class AndPolicy implements IPolicyHandler {
  constructor(private policies: IPolicyHandler[]) {}
  canAccess(user: any, context: ExecutionContext): boolean {
    return this.policies.every(p => p.canAccess(user, context));
  }
}

export class OrPolicy implements IPolicyHandler {
  constructor(private policies: IPolicyHandler[]) {}
  canAccess(user: any, context: ExecutionContext): boolean {
    return this.policies.some(p => p.canAccess(user, context));
  }
}
