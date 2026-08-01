/**
 * Combines business criteria with a soft-delete filter without clobbering `$or` keys.
 */
export function withNotDeletedFilter(
  criteria: Record<string, unknown>,
  notDeletedFilter: Record<string, unknown>,
  includeDeleted?: boolean,
): Record<string, unknown> {
  if (includeDeleted) {
    return criteria;
  }
  return { $and: [criteria, notDeletedFilter] };
}
