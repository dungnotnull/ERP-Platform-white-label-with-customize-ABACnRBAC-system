import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiEndpointDocument = HydratedDocument<ApiEndpoint>;

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
export class ApiEndpoint {
  @Prop({ type: String, required: true })
  method: string;

  @Prop({ type: String, required: true })
  pathPattern: string;

  @Prop({ type: String, required: true })
  label: string;
}

const ApiEndpointSchema = SchemaFactory.createForClass(ApiEndpoint);

ApiEndpointSchema.index({ method: 1, pathPattern: 1 }, { unique: true });

export { ApiEndpointSchema };
