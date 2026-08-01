export class UserRoleAssignmentService {
  public validateRoleAssignment(roleIds: string[], availableRoleIds: string[]): void {
    if (!roleIds || roleIds.length === 0) {
      throw new Error('At least one role is required for assignment');
    }

    for (const roleId of roleIds) {
      if (!availableRoleIds.includes(roleId)) {
        throw new Error(`Invalid role id: "${roleId}"`);
      }
    }
  }

  public getDefaultRoleIds(): string[] {
    return [];
  }
}
