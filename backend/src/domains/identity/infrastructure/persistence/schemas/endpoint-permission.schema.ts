import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EndpointPermissionDocument = HydratedDocument<EndpointPermission>;

@Schema({
  collection: 'endpoint_permissions',
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
export class EndpointPermission {
  @Prop({
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true,
  })
  method: string;

  @Prop({ type: String, required: true, trim: true })
  pathPattern: string;

  @Prop({ type: String, required: true, trim: true })
  module: string;

  @Prop({ type: String, required: true, trim: true })
  permission: string;

  @Prop({ type: Number, required: true, min: 0 })
  bitIndex: number;

  @Prop({ type: String, trim: true })
  pathRegex: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: '' })
  description: string;
}

const EndpointPermissionSchema = SchemaFactory.createForClass(EndpointPermission);

EndpointPermissionSchema.index({ bitIndex: 1 }, { unique: true });
EndpointPermissionSchema.index({ method: 1, pathPattern: 1, permission: 1 }, { unique: true });
EndpointPermissionSchema.index({ isActive: 1 });
EndpointPermissionSchema.index({ module: 1 });

export { EndpointPermissionSchema };
