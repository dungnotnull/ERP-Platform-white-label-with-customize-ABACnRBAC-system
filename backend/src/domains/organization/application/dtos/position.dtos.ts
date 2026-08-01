import { LocalizedOrganizationNameOutput } from '@/domains/organization/application/dtos/department.dtos';

export interface CreatePositionInput {
  nameVi: string;
  nameJa?: string;
  level?: number;
}

export interface UpdatePositionInput {
  id: string;
  nameVi?: string;
  nameJa?: string;
  level?: number;
}

export interface PositionOutput extends LocalizedOrganizationNameOutput {
  id: string;
  level: number | null;
}
