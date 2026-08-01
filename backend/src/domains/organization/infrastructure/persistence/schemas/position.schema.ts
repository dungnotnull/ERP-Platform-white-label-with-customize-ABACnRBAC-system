import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PositionDocument = HydratedDocument<Position>;

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
export class Position {
  @Prop({
    type: String,
    required: true,
    maxlength: 100,
  })
  nameVi: string;

  @Prop({ type: String, default: '', maxlength: 100 })
  nameJa: string;

  @Prop({ type: Number, default: null })
  level: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

const PositionSchema = SchemaFactory.createForClass(Position);

PositionSchema.index({ isDeleted: 1 });
PositionSchema.index(
  { nameVi: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export { PositionSchema };
