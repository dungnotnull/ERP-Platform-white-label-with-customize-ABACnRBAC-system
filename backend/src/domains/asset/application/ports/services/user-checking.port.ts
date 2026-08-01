export interface UserCheckingPort {
  ensureUserExists(userId: string): Promise<void>;
  getUserDetails(userId: string): Promise<{ name: string }>;
}
