import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SystemCounterDocument = HydratedDocument<SystemCounter>;

@Schema({
  collection: 'system_counters',
  versionKey: false,
  timestamps: true,
})
export class SystemCounter {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const SystemCounterSchema = SchemaFactory.createForClass(SystemCounter);
