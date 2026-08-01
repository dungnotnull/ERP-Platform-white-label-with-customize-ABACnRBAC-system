import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking> & {
  id: string;
};

const BookingHistorySchema = new MongooseSchema(
  {
    action: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'CANCELLED', 'COMPLETED'],
      required: true,
    },
    actorId: { type: MongooseSchema.Types.ObjectId, required: true },
    changes: { type: MongooseSchema.Types.Mixed },
    timestamp: { type: Date, required: true },
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
export class Booking {
  id: string;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'MeetingRoom', required: true })
  roomIds: Types.ObjectId[];

  @Prop({ default: '' })
  title: string;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Department', default: [] })
  departmentIds: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'InternalUser', default: [] })
  participantIds: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'InternalUser', default: [] })
  conflictedUsers: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'InternalUser' })
  creatorId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: '' })
  jpTitle: string;

  @Prop({ default: '' })
  jpNote: string;

  @Prop({
    type: String,
    enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
    default: 'SCHEDULED',
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: [BookingHistorySchema], default: [] })
  history: typeof BookingHistorySchema[];

  @Prop({ type: Number, default: 0, required: true })
  version: number;
}

const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.virtual('id').get(function (this: BookingDocument) {
  return this._id?.toHexString();
});

BookingSchema.index({ title: 1 });
BookingSchema.index({ jpTitle: 1 });
BookingSchema.index({ roomIds: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ startTime: 1, endTime: 1 });
BookingSchema.index({ endTime: 1, isDeleted: 1 });
BookingSchema.index({ status: 1, isDeleted: 1 });
BookingSchema.index({ participantIds: 1 });
BookingSchema.index({ departmentIds: 1 });


export { BookingSchema };
