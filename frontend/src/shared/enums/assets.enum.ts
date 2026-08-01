export enum AssetStatus {
  PENDING_REPAIR = "pending_repair",
  USABLE = "usable",
  BROKEN = "broken",
  HANDED_OVER = "handed_over",
  // DISPOSED = "disposed",
  MAINTENANCE = "maintenance",
  LOST = "lost"
}

export enum PurchaseOrderStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  PENDING = "pending"
}

export enum DeviceRequestStatus {
  REJECTED = "REJECTED",
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED"
}
