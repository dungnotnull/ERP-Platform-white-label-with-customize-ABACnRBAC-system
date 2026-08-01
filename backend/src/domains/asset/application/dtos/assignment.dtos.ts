export interface AssignDeviceInput {
  deviceId: string;
  userId: string;
  userName: string;
  assignedBy: string;
  deviceRequestId?: string;
  notes?: string;
}

export interface ReturnDeviceInput {
  deviceId: string;
  returnedBy: string;
  notes?: string;
}

export interface AssignmentOutput {
  id: string;
  currentAssignment: Record<string, unknown> | null;
  assignmentHistory: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
}
