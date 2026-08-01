import { withNotDeletedFilter } from './mongo-active-record-query.util';

describe('withNotDeletedFilter', () => {
  const notDeleted = {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  };

  it('wraps criteria with $and when excluding deleted records', () => {
    const nameCriteria = {
      $or: [{ nameVi: 'Dev' }, { nameJa: 'Dev' }, { name: 'Dev' }],
    };

    expect(withNotDeletedFilter(nameCriteria, notDeleted)).toEqual({
      $and: [nameCriteria, notDeleted],
    });
  });

  it('returns criteria unchanged when includeDeleted is true', () => {
    const nameCriteria = { nameVi: 'Dev' };

    expect(withNotDeletedFilter(nameCriteria, notDeleted, true)).toBe(
      nameCriteria,
    );
  });
});
