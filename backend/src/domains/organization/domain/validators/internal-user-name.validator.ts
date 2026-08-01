import { INTERNAL_USER_NAME_MAX_LENGTH } from '@/domains/organization/presentation/dtos/organization.dto';

export function normalizeAndValidateEmployeeName(
  name: string | undefined,
  required: boolean,
): string {
  const trimmed = name?.trim() ?? '';

  if (!trimmed) {
    if (required) {
      throw new Error('name is required');
    }
    return '';
  }

  if (trimmed.length > INTERNAL_USER_NAME_MAX_LENGTH) {
    throw new Error(
      `name must not exceed ${INTERNAL_USER_NAME_MAX_LENGTH} characters`,
    );
  }

  return trimmed;
}
