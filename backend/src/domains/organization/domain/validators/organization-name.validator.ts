export const ORGANIZATION_NAME_MAX_LENGTH = 100;

function validateNameLength(value: string, label: string): string {
  if (value.length > ORGANIZATION_NAME_MAX_LENGTH) {
    throw new Error(
      `${label} must not exceed ${ORGANIZATION_NAME_MAX_LENGTH} characters`,
    );
  }
  return value;
}

export function normalizeAndValidateOrganizationNameVi(
  name: string | undefined,
  required: boolean,
  label = 'nameVi',
): string {
  const trimmed = name?.trim() ?? '';

  if (!trimmed) {
    if (required) {
      throw new Error(`${label} is required`);
    }
    return '';
  }

  return validateNameLength(trimmed, label);
}

export function normalizeAndValidateOrganizationNameJa(
  name: string | undefined,
): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return '';
  }
  return validateNameLength(trimmed, 'nameJa');
}

/** @deprecated Use normalizeAndValidateOrganizationNameVi */
export function normalizeAndValidateDepartmentName(
  name: string | undefined,
  required: boolean,
): string {
  return normalizeAndValidateOrganizationNameVi(name, required, 'department name');
}

/** @deprecated Use normalizeAndValidateOrganizationNameVi */
export function normalizeAndValidatePositionName(
  name: string | undefined,
  required: boolean,
): string {
  return normalizeAndValidateOrganizationNameVi(name, required, 'position name');
}
