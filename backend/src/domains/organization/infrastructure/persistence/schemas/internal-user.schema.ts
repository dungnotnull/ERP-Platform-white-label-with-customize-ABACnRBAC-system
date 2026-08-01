import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InternalUserDocument = HydratedDocument<InternalUser>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class DeviceSummary {
  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: Number, default: 0 })
  activeAssignments: number;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class InternalUser {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
  })
  employeeCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  positionId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: String, default: '' })
  role: string;

  @Prop({ type: DeviceSummary, default: () => ({}) })
  deviceSummary: DeviceSummary;
}

const InternalUserSchema = SchemaFactory.createForClass(InternalUser);

InternalUserSchema.index({ departmentId: 1 });
InternalUserSchema.index({ positionId: 1 });
InternalUserSchema.index({ isActive: 1 });
InternalUserSchema.index({ isDeleted: 1 });
InternalUserSchema.index({ createdAt: -1 });
InternalUserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } },
);
InternalUserSchema.index(
  { employeeCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } },
);
InternalUserSchema.index({ 'deviceSummary.activeAssignments': -1 });
InternalUserSchema.index({ 'deviceSummary.total': -1 });

export { InternalUserSchema };
