import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { AbacPolicy, AbacPolicyDocument } from '@/domains/identity/infrastructure/persistence/schemas/abac-policy.schema';
import { AbacPolicyOutput } from './create-abac-policy.use-case';

@Injectable()
export class GetAbacPoliciesUseCase implements IUseCase<void, AbacPolicyOutput[]> {
  constructor(
    @InjectModel(AbacPolicy.name) private readonly policyModel: Model<AbacPolicyDocument>,
  ) {}

  async execute(): Promise<AbacPolicyOutput[]> {
    const docs = await this.policyModel.find().sort({ name: 1 }).lean();
    return docs.map(doc => ({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description ?? '',
      roleIds: (doc.roleIds ?? []).map(r => r.toString()),
      resource: doc.resource,
      action: doc.action,
      effect: doc.effect,
      conditions: doc.conditions ?? [],
      isActive: doc.isActive,
    }));
  }
}
