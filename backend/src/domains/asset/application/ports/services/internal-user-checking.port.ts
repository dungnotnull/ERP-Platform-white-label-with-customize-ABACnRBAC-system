export interface InternalUserCheckingPort {
  ensureUserExists(userId: string): Promise<void>;
  getUserDetails(userId: string): Promise<{ name: string }>;
}