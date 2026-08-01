import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { PurchaseOrderProps } from './purchase-order.entity';

export interface SupplierProps {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  notes: string;
  purchaseOrders: PurchaseOrderProps[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class SupplierEntity extends AggregateRoot<SupplierProps> {
  get name(): string {
    return this.props.name;
  }

  get contactPerson(): string {
    return this.props.contactPerson;
  }

  get phone(): string {
    return this.props.phone;
  }

  get email(): string {
    return this.props.email;
  }

  get address(): string {
    return this.props.address;
  }

  get website(): string {
    return this.props.website;
  }

  get notes(): string {
    return this.props.notes;
  }

  get purchaseOrders(): PurchaseOrderProps[] {
    return this.props.purchaseOrders;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  constructor(id: string, props: SupplierProps) {
    super(id, props);
  }

  public addPurchaseOrder(order: PurchaseOrderProps): void {
    this.props.purchaseOrders.push(order);
  }

  public updatePurchaseOrder(orderId: string, updates: Partial<PurchaseOrderProps>): void {
    const index = this.props.purchaseOrders.findIndex((_order, i) => {
      const candidate = this.props.purchaseOrders[i] as unknown as Record<string, unknown>;
      return String(candidate._id) === orderId || String(i) === orderId;
    });
    if (index === -1) {
      return;
    }
    const existing = this.props.purchaseOrders[index];
    this.props.purchaseOrders[index] = { ...existing, ...updates };
  }

  public update(props: Partial<Pick<SupplierProps, 'name' | 'contactPerson' | 'phone' | 'email' | 'address' | 'website' | 'notes'>>): void {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }
    if (props.contactPerson !== undefined) {
      this.props.contactPerson = props.contactPerson;
    }
    if (props.phone !== undefined) {
      this.props.phone = props.phone;
    }
    if (props.email !== undefined) {
      this.props.email = props.email;
    }
    if (props.address !== undefined) {
      this.props.address = props.address;
    }
    if (props.website !== undefined) {
      this.props.website = props.website;
    }
    if (props.notes !== undefined) {
      this.props.notes = props.notes;
    }
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this.props.name,
      contactPerson: this.props.contactPerson,
      phone: this.props.phone,
      email: this.props.email,
      address: this.props.address,
      website: this.props.website,
      notes: this.props.notes,
      purchaseOrders: this.props.purchaseOrders,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
