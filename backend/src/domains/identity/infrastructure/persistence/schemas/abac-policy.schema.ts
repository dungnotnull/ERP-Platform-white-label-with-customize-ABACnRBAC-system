import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AbacPolicyDocument = HydratedDocument<AbacPolicy>;

@Schema({
  collection: 'abac_policies',
  timestamps: true,
  versionKey: false,
})
export class AbacPolicy {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: [Types.ObjectId], ref: 'Role', default: [] })
  roleIds: Types.ObjectId[];

  @Prop({ required: true, trim: true })
  resource: string;

  @Prop({ required: true, enum: ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'] })
  action: string;

  @Prop({ required: true, enum: ['allow', 'deny'], default: 'allow' })
  effect: 'allow' | 'deny';

  @Prop({ type: [Object], default: [] })
  conditions: PolicyCondition[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'exists';
  value: any;
  valueType: 'static' | 'template';
}

export const AbacPolicySchema = SchemaFactory.createForClass(AbacPolicy);

AbacPolicySchema.index({ resource: 1, action: 1, isActive: 1 });
AbacPolicySchema.index({ roleIds: 1 });
