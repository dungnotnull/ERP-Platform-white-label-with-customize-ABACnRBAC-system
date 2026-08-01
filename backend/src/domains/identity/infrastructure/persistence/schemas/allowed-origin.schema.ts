import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AllowedOriginDocument = HydratedDocument<AllowedOrigin>;

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
export class AllowedOrigin {
  @Prop({ type: String, unique: true, index: true, required: true })
  origin: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: String, default: null })
  deletedBy: string;
}

export const AllowedOriginSchema = SchemaFactory.createForClass(AllowedOrigin);
