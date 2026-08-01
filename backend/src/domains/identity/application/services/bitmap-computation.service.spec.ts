import { Types } from 'mongoose';
import { BitmapComputationService } from './bitmap-computation.service';

describe('BitmapComputationService', () => {
  let service: BitmapComputationService;
  let userModel: any;
  let roleModel: any;
  let epModel: any;

  const mockSelectLean = (returnValue: any) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(returnValue),
    };
    return chain;
  };

  beforeEach(() => {
    userModel = {
      findById: jest.fn(),
    };
    roleModel = {
      find: jest.fn(),
    };
    epModel = {
      find: jest.fn(),
    };

    service = new BitmapComputationService(userModel, roleModel, epModel);
  });

  describe('computeBitmap', () => {
    it('returns empty buffer when user has no roles', async () => {
      userModel.findById = jest.fn().mockReturnValue(mockSelectLean({ _id: new Types.ObjectId(), roleIds: [] }));

      const result = await service.computeBitmap(new Types.ObjectId().toString());

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('returns empty buffer when user not found', async () => {
      userModel.findById = jest.fn().mockReturnValue(mockSelectLean(null));

      const result = await service.computeBitmap(new Types.ObjectId().toString());

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('returns empty buffer when roles have no endpoint permissions', async () => {
      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: new Types.ObjectId(), roleIds: [new Types.ObjectId()] }),
      );
      roleModel.find = jest.fn().mockReturnValue(mockSelectLean([{ _id: new Types.ObjectId(), endpointPermissionIds: [] }]));

      const result = await service.computeBitmap(new Types.ObjectId().toString());

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('returns empty buffer when all endpoint permissions are inactive', async () => {
      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: new Types.ObjectId(), roleIds: [new Types.ObjectId()] }),
      );
      const epId = new Types.ObjectId();
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: new Types.ObjectId(), endpointPermissionIds: [epId] }]),
      );
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([]));

      const result = await service.computeBitmap(new Types.ObjectId().toString());

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('computes bitmap correctly with single role and single permission', async () => {
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]),
      );
      epModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: epId, bitIndex: 3 }]),
      );

      const result = await service.computeBitmap(userId.toString());

      // bitIndex 3 -> byte 0, bit 3 -> 0b00001000 = 8
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(8);
    });

    it('computes bitmap correctly with multiple roles and multiple permissions', async () => {
      const roleId1 = new Types.ObjectId();
      const roleId2 = new Types.ObjectId();
      const epId1 = new Types.ObjectId();
      const epId2 = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId1, roleId2] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([
          { _id: roleId1, endpointPermissionIds: [epId1] },
          { _id: roleId2, endpointPermissionIds: [epId2] },
        ]),
      );
      epModel.find = jest.fn().mockReturnValue(
        mockSelectLean([
          { _id: epId1, bitIndex: 0 },
          { _id: epId2, bitIndex: 2 },
        ]),
      );

      const result = await service.computeBitmap(userId.toString());

      // bitIndex 0 -> bit 0, bitIndex 2 -> bit 2 => 0b00000101 = 5
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(5);
    });

    it('deduplicates permission IDs across roles (same EP in 2 roles)', async () => {
      const roleId1 = new Types.ObjectId();
      const roleId2 = new Types.ObjectId();
      const sharedEpId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId1, roleId2] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([
          { _id: roleId1, endpointPermissionIds: [sharedEpId] },
          { _id: roleId2, endpointPermissionIds: [sharedEpId] },
        ]),
      );
      epModel.find = jest.fn().mockImplementation((query: any) => {
        // Should only be called once with deduplicated IDs
        return mockSelectLean([{ _id: sharedEpId, bitIndex: 5 }]);
      });

      const result = await service.computeBitmap(userId.toString());

      // Verify epModel.find was called with only 1 unique EP id
      const epFindCall = epModel.find.mock.calls[0][0];
      const idsInQuery = epFindCall._id.$in;
      expect(idsInQuery).toHaveLength(1);

      // bitIndex 5 -> byte 0, bit 5 -> 0b00100000 = 32
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(32);
    });

    it('sets correct bits for various bitIndex values (0, 7, 8, 15, 31)', async () => {
      const roleId = new Types.ObjectId();
      const ep1 = new Types.ObjectId();
      const ep2 = new Types.ObjectId();
      const ep3 = new Types.ObjectId();
      const ep4 = new Types.ObjectId();
      const ep5 = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: roleId, endpointPermissionIds: [ep1, ep2, ep3, ep4, ep5] }]),
      );
      epModel.find = jest.fn().mockReturnValue(
        mockSelectLean([
          { _id: ep1, bitIndex: 0 },   // byte 0, bit 0 -> 0x01
          { _id: ep2, bitIndex: 7 },   // byte 0, bit 7 -> 0x80
          { _id: ep3, bitIndex: 8 },   // byte 1, bit 0 -> 0x01
          { _id: ep4, bitIndex: 15 },  // byte 1, bit 7 -> 0x80
          { _id: ep5, bitIndex: 31 },  // byte 3, bit 7 -> 0x80
        ]),
      );

      const result = await service.computeBitmap(userId.toString());

      // maxBit = 31, buffer size = ceil(32/8) = 4 bytes
      expect(result).toHaveLength(4);
      expect(result[0]).toBe(0x81); // bits 0 and 7
      expect(result[1]).toBe(0x81); // bits 8 and 15
      expect(result[2]).toBe(0x00); // no bits set
      expect(result[3]).toBe(0x80); // bit 31
    });

    it('handles high bitIndex values (creates large enough buffer)', async () => {
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]),
      );
      epModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: epId, bitIndex: 100 }]),
      );

      const result = await service.computeBitmap(userId.toString());

      // bitIndex 100 -> byte 12, bit 4
      const expectedSize = Math.ceil(101 / 8);
      expect(result).toHaveLength(expectedSize);
      expect(result[12]).toBe(1 << 4);
    });

    it('filters out inactive roles', async () => {
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      // roleModel.find with isActive: true returns empty (role is inactive)
      roleModel.find = jest.fn().mockReturnValue(mockSelectLean([]));

      const result = await service.computeBitmap(userId.toString());

      // Verify roleModel.find was called with isActive: true
      const roleFindCall = roleModel.find.mock.calls[0][0];
      expect(roleFindCall.isActive).toBe(true);
      expect(result).toEqual(Buffer.alloc(0));
    });

    it('filters out inactive endpoint permissions', async () => {
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]),
      );
      // All EPs are inactive, so find returns empty
      epModel.find = jest.fn().mockReturnValue(mockSelectLean([]));

      const result = await service.computeBitmap(userId.toString());

      // Verify epModel.find was called with isActive: true
      const epFindCall = epModel.find.mock.calls[0][0];
      expect(epFindCall.isActive).toBe(true);
      expect(result).toEqual(Buffer.alloc(0));
    });

    it('returns empty buffer when user has roleIds but all roles are inactive', async () => {
      const roleId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      roleModel.find = jest.fn().mockReturnValue(mockSelectLean([]));

      const result = await service.computeBitmap(userId.toString());

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('handles extremely large bitIndex (10,000+)', async () => {
      const roleId = new Types.ObjectId();
      const epId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [roleId] }),
      );
      roleModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: roleId, endpointPermissionIds: [epId] }]),
      );
      epModel.find = jest.fn().mockReturnValue(
        mockSelectLean([{ _id: epId, bitIndex: 10000 }]),
      );

      const result = await service.computeBitmap(userId.toString());

      const expectedBytes = Math.ceil(10001 / 8);
      expect(result).toHaveLength(expectedBytes);
      const byteIndex = Math.floor(10000 / 8);
      const bitMask = 1 << (10000 % 8);
      expect(result[byteIndex] & bitMask).toBe(bitMask);
    });

    it('returns empty buffer for empty roleIds array', async () => {
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: [] }),
      );

      const result = await service.computeBitmap(userId.toString());

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('returns empty buffer for user with null/undefined roleIds', async () => {
      const userId = new Types.ObjectId();

      userModel.findById = jest.fn().mockReturnValue(
        mockSelectLean({ _id: userId, roleIds: null }),
      );

      const result = await service.computeBitmap(userId.toString());

      expect(result).toEqual(Buffer.alloc(0));
    });
  });
});
