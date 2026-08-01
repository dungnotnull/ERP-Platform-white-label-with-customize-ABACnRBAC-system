import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema({
  _id: false,
})
export class PurchaseOrderItem {
  @Prop({ type: Types.ObjectId })
  deviceTypeId: Types.ObjectId;

  @Prop({ type: String })
  deviceName: string;

  @Prop({ type: Number })
  quantity: number;

  @Prop({ type: Number })
  unitPrice: number;
}

@Schema({
  _id: false,
  timestamps: false,
})
export class PurchaseOrder {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  orderDate: Date;

  @Prop({ type: Number, default: 0 })
  totalAmount: number;

  @Prop({ type: String, default: '' })
  invoiceNumber: string;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: String, default: 'draft' })
  status: string;

  @Prop({ type: [PurchaseOrderItem], default: [] })
  items: PurchaseOrderItem[];
}

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
export class Supplier {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: '' })
  contactPerson: string;

  @Prop({ type: String, default: '' })
  phone: string;

  @Prop({ type: String, default: '' })
  email: string;

  @Prop({ type: String, default: '' })
  address: string;

  @Prop({ type: String, default: '' })
  website: string;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: [PurchaseOrder], default: [] })
  purchaseOrders: PurchaseOrder[];
}

const SupplierSchema = SchemaFactory.createForClass(Supplier);

export { SupplierSchema };
