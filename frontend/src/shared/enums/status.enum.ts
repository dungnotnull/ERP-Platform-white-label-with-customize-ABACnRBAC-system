export const BaseStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE"
} as const;

export type BaseStatusEnumType = keyof typeof BaseStatusEnum;
