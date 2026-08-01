import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class Account {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['GOOGLE', 'EMAIL'],
    required: true,
  })
  provider: string;

  @Prop({ type: String, unique: true, index: true, required: true })
  providerId: string;

  @Prop({ type: String, default: null })
  refreshToken: string;

  @Prop({ type: Date, default: null })
  tokenExpiry: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
