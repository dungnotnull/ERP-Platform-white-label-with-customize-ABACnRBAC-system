import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MeetingRoomDocument = HydratedDocument<MeetingRoom> & {
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
export class MeetingRoom {
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  jpName: string;

  @Prop({ required: true, type: Number })
  capacity: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

const MeetingRoomSchema = SchemaFactory.createForClass(MeetingRoom);

MeetingRoomSchema.virtual('id').get(function (this: MeetingRoomDocument) {
  return this._id?.toHexString();
});

MeetingRoomSchema.index({ isActive: 1 });

export { MeetingRoomSchema };
