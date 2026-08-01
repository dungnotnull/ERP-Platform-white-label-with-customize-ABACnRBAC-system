import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

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
export class Department {
  @Prop({
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({ type: String, required: true, maxlength: 100 })
  nameVi: string;

  @Prop({ type: String, default: '', maxlength: 100 })
  nameJa: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ isDeleted: 1 });
DepartmentSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } },
);

export { DepartmentSchema };
