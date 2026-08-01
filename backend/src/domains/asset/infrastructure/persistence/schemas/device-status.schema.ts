import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeviceStatusDocument = HydratedDocument<DeviceStatus> & {
  id: string;
};

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
export class DeviceStatus {
  id: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
  })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

const DeviceStatusSchema = SchemaFactory.createForClass(DeviceStatus);

DeviceStatusSchema.virtual('id').get(function (this: DeviceStatusDocument) {
  return this._id?.toHexString();
});

export { DeviceStatusSchema };
