/** @deprecated Replaced by ABAC system. Do not use in new code. */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PermissionDocument = HydratedDocument<Permission>;

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
export class Permission {
  @Prop({ type: String, unique: true, index: true, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, default: 'ACTIVE', index: true })
  status: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: String, default: null })
  deletedBy: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
