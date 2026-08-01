import { Types } from 'mongoose';
import { buildMongoObjectIdOrStringFieldMatch } from './mongo-object-id-field-match.util';

describe('buildMongoObjectIdOrStringFieldMatch', () => {
  const id = '6a0c224c5b9357fe62164fca';

  it('matches ObjectId and string forms for valid hex ids', () => {
    const match = buildMongoObjectIdOrStringFieldMatch('departmentId', id);

    expect(match).toEqual({
      $or: [
        { departmentId: new Types.ObjectId(id) },
        { departmentId: id },
      ],
    });
  });

  it('uses exact value for non-ObjectId ids', () => {
    expect(buildMongoObjectIdOrStringFieldMatch('departmentId', 'dept-eng')).toEqual({
      departmentId: 'dept-eng',
    });
  });
});
