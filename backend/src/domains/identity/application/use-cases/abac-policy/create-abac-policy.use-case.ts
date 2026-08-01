import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { AbacPolicy, AbacPolicyDocument } from '@/domains/identity/infrastructure/persistence/schemas/abac-policy.schema';

export interface CreateAbacPolicyInput {
  name: string;
  description?: string;
  roleIds: string[];
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    valueType: 'static' | 'template';
  }>;
  createdBy: string;
}

export interface AbacPolicyOutput {
  id: string;
  name: string;
  description: string;
  roleIds: string[];
  resource: string;
  action: string;
  effect: string;
  conditions: any[];
  isActive: boolean;
}

@Injectable()
export class CreateAbacPolicyUseCase implements IUseCase<CreateAbacPolicyInput, AbacPolicyOutput> {
  constructor(
    @InjectModel(AbacPolicy.name) private readonly policyModel: Model<AbacPolicyDocument>,
  ) {}

  async execute(input: CreateAbacPolicyInput): Promise<AbacPolicyOutput> {
    const existing = await this.policyModel.findOne({ name: input.name });
    if (existing) {
      throw new ConflictException(`Policy "${input.name}" already exists`);
    }

    const doc = await this.policyModel.create({
      name: input.name,
      description: input.description ?? '',
      roleIds: input.roleIds,
      resource: input.resource,
      action: input.action,
      effect: input.effect,
      conditions: input.conditions,
      isActive: true,
      createdBy: input.createdBy,
    });

    return this.toOutput(doc);
  }

  private toOutput(doc: AbacPolicyDocument): AbacPolicyOutput {
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
