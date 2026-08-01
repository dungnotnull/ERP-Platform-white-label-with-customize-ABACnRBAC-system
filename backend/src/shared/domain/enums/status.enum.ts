export const BaseStatusEnum = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type BaseStatusEnumType = (typeof BaseStatusEnum)[keyof typeof BaseStatusEnum];
