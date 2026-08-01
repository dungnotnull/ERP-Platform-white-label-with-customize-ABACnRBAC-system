export const AccountProviderEnum = {
  GOOGLE: 'GOOGLE',
  EMAIL: 'EMAIL',
} as const;

export type AccountProviderEnumType =
  (typeof AccountProviderEnum)[keyof typeof AccountProviderEnum];
