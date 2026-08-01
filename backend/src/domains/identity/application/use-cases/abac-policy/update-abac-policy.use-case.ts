import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { AbacPolicy, AbacPolicyDocument, PolicyCondition } from '@/domains/identity/infrastructure/persistence/schemas/abac-policy.schema';
import { AbacPolicyOutput } from './create-abac-policy.use-case';

export interface UpdateAbacPolicyInput {
  id: string;
  description?: string;
  roleIds?: string[];
  effect?: 'allow' | 'deny';
  conditions?: PolicyCondition[];
  isActive?: boolean;
}

@Injectable()
export class UpdateAbacPolicyUseCase implements IUseCase<UpdateAbacPolicyInput, AbacPolicyOutput> {
  constructor(
    @InjectModel(AbacPolicy.name) private readonly policyModel: Model<AbacPolicyDocument>,
  ) {}

  async execute(input: UpdateAbacPolicyInput): Promise<AbacPolicyOutput> {
    const doc = await this.policyModel.findById(input.id);
    if (!doc) {
      throw new NotFoundException(`Policy not found: ${input.id}`);
    }

    if (input.description !== undefined) doc.description = input.description;
    if (input.roleIds !== undefined) doc.roleIds = input.roleIds as any;
    if (input.effect !== undefined) doc.effect = input.effect;
    if (input.conditions !== undefined) doc.conditions = input.conditions as any;
    if (input.isActive !== undefined) doc.isActive = input.isActive;

    await doc.save();

    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description ?? '',
      roleIds: doc.roleIds.map(r => r.toString()),
      resource: doc.resource,
      action: doc.action,
      effect: doc.effect,
      conditions: doc.conditions,
      isActive: doc.isActive,
    };
  }
}
