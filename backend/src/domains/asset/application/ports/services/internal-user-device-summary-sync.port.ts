export interface InternalUserDeviceSummarySyncPort {
  refreshForUser(userId: string): Promise<void>;
}
