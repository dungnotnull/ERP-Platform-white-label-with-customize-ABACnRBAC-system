import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AbacPolicy,
  PolicyCondition,
  AbacPolicyDocument,
} from '@/domains/identity/infrastructure/persistence/schemas/abac-policy.schema';
import { User, UserDocument } from '@/domains/identity/infrastructure/persistence/schemas/user.schema';
import { RequestUser } from '@/domains/identity/presentation/policies/policy-handler.interface';

@Injectable()
export class AbacRuleEngineService {
  private readonly logger = new Logger(AbacRuleEngineService.name);

  constructor(
    @InjectModel(AbacPolicy.name) private readonly policyModel: Model<AbacPolicyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findApplicablePolicies(
    user: RequestUser,
    resource: string,
    action: string,
  ): Promise<AbacPolicy[]> {
    const roleIds = await this.getUserRoleIds(user);

    return this.policyModel.find({
      resource,
      action,
      isActive: true,
      $or: [
        { roleIds: { $in: roleIds } },
        { roleIds: { $size: 0 } },
      ],
    }).lean();
  }

  evaluateCondition(condition: PolicyCondition, user: RequestUser, resource: any): boolean {
    const resolvedValue = this.resolveValue(condition, user, resource);
    const fieldValue = this.resolveField(condition.field, user, resource);

    switch (condition.operator) {
      case 'equals':
        if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
          return fieldValue === resolvedValue;
        }
        return String(fieldValue) === String(resolvedValue);

      case 'notEquals':
        if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
          return fieldValue !== resolvedValue;
        }
        return String(fieldValue) !== String(resolvedValue);

      case 'in':
        return Array.isArray(resolvedValue) && resolvedValue.some(
          v => String(v) === String(fieldValue),
        );

      case 'notIn':
        return Array.isArray(resolvedValue) && !resolvedValue.some(
          v => String(v) === String(fieldValue),
        );

      case 'contains':
        return String(fieldValue ?? '').includes(String(resolvedValue ?? ''));

      case 'gt':
        return Number(fieldValue) > Number(resolvedValue);

      case 'lt':
        return Number(fieldValue) < Number(resolvedValue);

      case 'gte':
        return Number(fieldValue) >= Number(resolvedValue);

      case 'lte':
        return Number(fieldValue) <= Number(resolvedValue);

      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;

      default:
        return false;
    }
  }

  evaluateAll(conditions: PolicyCondition[], user: RequestUser, resource: any): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => this.evaluateCondition(c, user, resource));
  }

  evaluateAny(conditions: PolicyCondition[], user: RequestUser, resource: any): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.some(c => this.evaluateCondition(c, user, resource));
  }

  async evaluatePolicy(
    policy: AbacPolicy,
    user: RequestUser,
    resource: any,
  ): Promise<boolean> {
    const result = this.evaluateAll(policy.conditions, user, resource);

    if (policy.effect === 'allow') return result;
    if (policy.effect === 'deny') return !result;

    return false;
  }

  async evaluateResourceAccess(
    user: RequestUser,
    resourceType: string,
    action: string,
    resource: any,
  ): Promise<boolean> {
    const policies = await this.findApplicablePolicies(user, resourceType, action);

    if (policies.length === 0) {
      this.logger.debug(`No ABAC policies for ${resourceType}:${action} — defaulting to allow`);
      return true;
    }

    // Evaluate deny policies first — deny always takes precedence over allow
    for (const policy of policies) {
      if (policy.effect !== 'deny') continue;
      const allowed = await this.evaluatePolicy(policy, user, resource);
      if (!allowed) return false;
    }

    for (const policy of policies) {
      if (policy.effect !== 'allow') continue;
      const allowed = await this.evaluatePolicy(policy, user, resource);
      if (allowed) return true;
    }

    return false;
  }

  private async getUserRoleIds(user: RequestUser): Promise<string[]> {
    if (user.roleIds && user.roleIds.length > 0) {
      return user.roleIds;
    }

    const userDoc = await this.userModel.findById(user.userId).select('roleIds').lean();
    return userDoc?.roleIds?.map(r => r.toString()) ?? [];
  }

  private resolveValue(condition: PolicyCondition, user: RequestUser, resource: any): any {
    if (condition.valueType === 'template' && typeof condition.value === 'string') {
      const template = condition.value as string;
      return template.replace(/\{\{(.+?)\}\}/g, (_match, path: string) => {
        const resolved = this.resolvePath(path.trim(), user, resource);
        return resolved != null ? String(resolved) : '';
      });
    }
    return condition.value;
  }

  private resolveField(fieldPath: string, user: RequestUser, resource: any): any {
    return this.resolvePath(fieldPath, user, resource);
  }

  private resolvePath(path: string, user: RequestUser, resource: any): any {
    const parts = path.split('.');
    let current: any = null;

    if (parts[0] === 'user' && parts.length > 1) {
      current = user;
      parts.shift();
    } else if (parts[0] === 'resource') {
      current = resource;
      parts.shift();
    } else {
      return undefined;
    }

    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }

    return current;
  }
}
