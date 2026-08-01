import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModuleEntityDocument = HydratedDocument<ModuleEntity>;

@Schema({
  collection: 'modules',
  versionKey: false,
  timestamps: true,
})
export class ModuleEntity {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  name: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true })
  description?: string;
}

export const ModuleEntitySchema = SchemaFactory.createForClass(ModuleEntity);

ModuleEntitySchema.index({ isActive: 1 });
