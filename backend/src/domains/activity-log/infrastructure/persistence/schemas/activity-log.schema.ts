import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

@Schema({
  timestamps: false,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class ActivityLog {
  id: string;

  @Prop({ type: String, default: null })
  userId: string | null;

  @Prop({ type: String, default: null })
  userEmail: string | null;

  @Prop({ type: String, default: null })
  userName: string | null;

  @Prop({ type: Boolean, default: null })
  isSuperadmin: boolean | null;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  method: string;

  @Prop({ type: String, required: true })
  endpoint: string;

  @Prop({ type: Number, required: true })
  statusCode: number;

  @Prop({ type: String, required: true })
  ipAddress: string;

  @Prop({ type: String, default: '' })
  userAgent: string;

  @Prop({ type: Object, default: null })
  requestBody: Record<string, any> | null;

  @Prop({ type: Number, default: 0 })
  responseTimeMs: number;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ userEmail: 1, timestamp: -1 });
ActivityLogSchema.index({ method: 1 });
ActivityLogSchema.index(
  { endpoint: 'text', userEmail: 'text', userName: 'text' },
  { weights: { endpoint: 1, userEmail: 2, userName: 2 } },
);

ActivityLogSchema.virtual('id').get(function (this: ActivityLogDocument) {
  return this._id?.toHexString();
});

export { ActivityLogSchema };
