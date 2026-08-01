import { Types } from 'mongoose';

/**
 * Matches documents where a ref field was stored as ObjectId or legacy string.
 */
export function buildMongoObjectIdOrStringFieldMatch(
  field: string,
  id: string,
): Record<string, unknown> {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return { [field]: id };
  }
  const objectId = new Types.ObjectId(id);
  return {
    $or: [{ [field]: objectId }, { [field]: id }],
  };
}
