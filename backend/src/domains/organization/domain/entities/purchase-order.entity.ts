import { Entity } from '@/shared/domain/entity.base';
import { PurchaseOrderItemProps } from '../value-objects/purchase-order-item.vo';

export interface PurchaseOrderProps {
  orderDate: Date;
  totalAmount: number;
  invoiceNumber: string;
  notes: string;
  status: string;
  items: PurchaseOrderItemProps[];
}

export class PurchaseOrderEntity extends Entity<PurchaseOrderProps> {
  get orderDate(): Date {
    return this.props.orderDate;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get invoiceNumber(): string {
    return this.props.invoiceNumber;
  }

  get notes(): string {
    return this.props.notes;
  }

  get status(): string {
    return this.props.status;
  }

  get items(): PurchaseOrderItemProps[] {
    return this.props.items;
  }

  constructor(id: string, props: PurchaseOrderProps) {
    super(id, props);
  }

  public calculateTotal(): number {
    const total = this.props.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    this.props.totalAmount = total;
    return total;
  }

  public approve(): void {
    this.props.status = 'approved';
  }

  public isApproved(): boolean {
    return this.props.status === 'approved';
  }

  public update(props: Partial<Pick<PurchaseOrderProps, 'invoiceNumber' | 'notes' | 'status' | 'items'>>): void {
    if (props.invoiceNumber !== undefined) {
      this.props.invoiceNumber = props.invoiceNumber;
    }
    if (props.notes !== undefined) {
      this.props.notes = props.notes;
    }
    if (props.status !== undefined) {
      this.props.status = props.status;
    }
    if (props.items !== undefined) {
      this.props.items = props.items;
      this.calculateTotal();
    }
  }
}
