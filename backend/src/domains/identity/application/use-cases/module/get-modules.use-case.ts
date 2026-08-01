import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleEntity, ModuleEntityDocument } from '@/domains/identity/infrastructure/persistence/schemas/module.schema';

export interface ModuleOutput {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

@Injectable()
export class GetModulesUseCase implements IUseCase<void, ModuleOutput[]> {
  constructor(
    @InjectModel(ModuleEntity.name) private readonly moduleModel: Model<ModuleEntityDocument>,
  ) {}

  async execute(): Promise<ModuleOutput[]> {
    const docs = await this.moduleModel.find({ isActive: true }).sort({ name: 1 }).lean();
    return docs.map((doc) => ({
      id: (doc._id as any).toString(),
      name: doc.name,
      displayName: doc.displayName,
      description: doc.description || undefined,
    }));
  }
}
