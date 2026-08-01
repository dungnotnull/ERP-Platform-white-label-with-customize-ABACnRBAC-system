import { BaseStatusEnum } from './status.enum';

export const UserStatusEnum = {
  ...BaseStatusEnum,
  ONBOARDING: 'ONBOARDING',
} as const;

export type UserStatusEnumType = (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

export const GenderEnum = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export type GenderEnumType = (typeof GenderEnum)[keyof typeof GenderEnum];

export const MaritalStatusEnum = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  IN_A_RELATIONSHIP: 'IN_A_RELATIONSHIP',
  OTHER: 'OTHER',
} as const;

export type MaritalStatusEnumType =
  (typeof MaritalStatusEnum)[keyof typeof MaritalStatusEnum];
