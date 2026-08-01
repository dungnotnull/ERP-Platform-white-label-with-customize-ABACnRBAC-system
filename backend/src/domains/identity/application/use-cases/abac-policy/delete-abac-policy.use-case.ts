import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUseCase } from '@/shared/application/use-case.interface';
import { AbacPolicy, AbacPolicyDocument } from '@/domains/identity/infrastructure/persistence/schemas/abac-policy.schema';

@Injectable()
export class DeleteAbacPolicyUseCase implements IUseCase<string, void> {
  constructor(
    @InjectModel(AbacPolicy.name) private readonly policyModel: Model<AbacPolicyDocument>,
  ) {}

  async execute(id: string): Promise<void> {
    const doc = await this.policyModel.findByIdAndDelete(id);
    if (!doc) {
      throw new NotFoundException(`Policy not found: ${id}`);
    }
  }
}
