import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DeviceRequestDocument = HydratedDocument<DeviceRequest> & {
  id: string;
};

const REQUEST_TYPE_ENUM = ['NEW_ASSIGNMENT', 'REPLACEMENT', 'ADDITIONAL', 'RETURN', 'REPAIR'];

const REQUEST_STATUS_ENUM = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
];

const RequestItemSchema = new MongooseSchema(
  {
    deviceTypeId: { type: MongooseSchema.Types.ObjectId, ref: 'DeviceType', },
    quantity: { type: Number },
  },
  { _id: false },
);

const ReplacementDeviceSchema = new MongooseSchema(
  {
    oldDeviceId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Device',
    },
    newDeviceId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Device',
    },
  },
  { _id: false },
);

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
export class DeviceRequest {
  id: string;

  @Prop({
    type: String,
    required: true,
    enum: REQUEST_TYPE_ENUM,
  })
  type: string;

  @Prop({
    type: String,
    default: 'PENDING',
    enum: REQUEST_STATUS_ENUM,
  })
  status: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'InternalUser',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  requestedByUserId: Types.ObjectId;

  @Prop({ type: String, default: '' })
  reason: string;

  @Prop({ type: Types.ObjectId, default: null })
  approvedByUserId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  approvedAt: Date;

  @Prop({ type: Date, default: null })
  completedAt: Date;

  @Prop({ type: [RequestItemSchema], default: [] })
  items: typeof RequestItemSchema[];

  @Prop({ type: [ReplacementDeviceSchema], default: [] })
  replacementDevices: typeof ReplacementDeviceSchema[];
}

const DeviceRequestSchema = SchemaFactory.createForClass(DeviceRequest);

DeviceRequestSchema.virtual('id').get(function (this: DeviceRequestDocument) {
  return this._id?.toHexString();
});

DeviceRequestSchema.index({ status: 1 });
DeviceRequestSchema.index({ userId: 1 });
DeviceRequestSchema.index({ requestedByUserId: 1 });

export { DeviceRequestSchema };
