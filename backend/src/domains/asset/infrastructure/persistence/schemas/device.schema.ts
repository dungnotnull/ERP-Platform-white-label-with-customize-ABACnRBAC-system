import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device> & {
  id: string;
};

const CurrentAssignmentSchema = new MongooseSchema(
  {
    userId: { type: MongooseSchema.Types.ObjectId, ref: 'InternalUser' },
    userName: { type: String },
    assignedAt: { type: Date },
    assignedBy: { type: String },
  },
  { _id: false },
);

const AssignmentHistorySchema = new MongooseSchema(
  {
    userId: { type: MongooseSchema.Types.ObjectId },
    userName: { type: String },
    assignedAt: { type: Date },
    returnedAt: { type: Date, default: null },
    assignedBy: { type: String },
    returnedBy: { type: String, default: null },
  },
  { _id: false },
);

const MaintenanceRecordSchema = new MongooseSchema(
  {
    maintenanceType: { type: String },
    status: { type: String },
    scheduledDate: { type: Date },
    completedDate: { type: Date, default: null },
    cost: { type: Number, default: null },
    description: { type: String },
    results: { type: String },
  },
  { _id: false },
);

const TransactionSchema = new MongooseSchema(
  {
    transactionType: { type: String },
    userId: { type: MongooseSchema.Types.ObjectId, default: null },
    performedBy: { type: String, default: null },
    notes: { type: String },
    metadata: { type: MongooseSchema.Types.Mixed },
    date: { type: Date },
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
export class Device {
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  serialNumber: string;

  @Prop({ type: String, default: '' })
  model: string;

  @Prop({ type: String, default: '' })
  manufacturer: string;

  @Prop({ type: Types.ObjectId, ref: 'DeviceType' })
  deviceTypeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeviceStatus' })
  deviceStatusId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  supplierId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  purchaseDate: Date;

  @Prop({ type: Number, default: null })
  purchasePrice: number;

  @Prop({ type: Date, default: null })
  warrantyExpiryDate: Date;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: CurrentAssignmentSchema, default: null })
  currentAssignment: typeof CurrentAssignmentSchema;

  @Prop({ type: [AssignmentHistorySchema], default: [] })
  assignmentHistory: typeof AssignmentHistorySchema[];

  @Prop({ type: [MaintenanceRecordSchema], default: [] })
  maintenanceRecords: typeof MaintenanceRecordSchema[];

  @Prop({ type: [TransactionSchema], default: [] })
  transactions: typeof TransactionSchema[];

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;
}

const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.virtual('id').get(function (this: DeviceDocument) {
  return this._id?.toHexString();
});

DeviceSchema.index({ deviceTypeId: 1 });
DeviceSchema.index({ deviceStatusId: 1 });
DeviceSchema.index({ isDeleted: 1 });
DeviceSchema.index({ supplierId: 1 });
DeviceSchema.index({ deviceTypeId: 1, deviceStatusId: 1 });
DeviceSchema.index({
  isDeleted: 1,
  'currentAssignment.userId': 1,
});

export { DeviceSchema };
