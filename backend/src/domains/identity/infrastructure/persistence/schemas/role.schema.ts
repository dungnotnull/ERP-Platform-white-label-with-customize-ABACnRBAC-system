import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

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
export class Role {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: String, trim: true })
  displayName: string;

  @Prop({ type: [Types.ObjectId], ref: 'EndpointPermission', default: [] })
  endpointPermissionIds: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isSystem: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: String, default: 'ACTIVE', index: true })
  status: string;

  @Prop({ type: [Types.ObjectId], ref: 'Department', default: [] })
  departmentIds: Types.ObjectId[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });
