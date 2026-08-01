import { LoginUseCase } from './login.use-case';
import { InvalidCredentialsException } from '@/domains/identity/domain/exceptions/invalid-credentials.exception';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-v4'),
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepo: { findByEmail: jest.Mock; save: jest.Mock };
  let mockPasswordHasher: { compare: jest.Mock };
  let mockTokenGenerator: { generateAccessToken: jest.Mock; generateRefreshToken: jest.Mock };
  let mockBitmapComputer: { computeBitmap: jest.Mock };

  const createMockUser = (overrides?: Record<string, any>) => ({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    nickName: '',
    bio: '',
    profilePicture: null,
    status: 'ACTIVE',
    gender: null,
    maritalStatus: null,
    birthday: null,
    address: '',
    phone: '',
    roleIds: ['role-1'],
    currentTeam: null,
    onBoardingCompleted: true,
    lastLogin: null,
    permVersion: 5,
    isSuperadmin: false,
    departmentId: 'dept-1',
    recordLogin: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockPasswordHasher = { compare: jest.fn() };
    mockTokenGenerator = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };
    mockBitmapComputer = { computeBitmap: jest.fn().mockResolvedValue(Buffer.from([0x01, 0x02])) };

    useCase = new LoginUseCase(
      mockUserRepo as any,
      mockPasswordHasher as any,
      mockTokenGenerator as any,
      mockBitmapComputer as any,
    );
  });

  it('should return tokens and user on successful login', async () => {
    const mockUser = createMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
  });

  it('should throw InvalidCredentialsException when user not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'notfound@example.com', password: 'password123' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('should throw InvalidCredentialsException when password does not match', async () => {
    const mockUser = createMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('should call bitmapComputer.computeBitmap with user.id', async () => {
    const mockUser = createMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(mockBitmapComputer.computeBitmap).toHaveBeenCalledWith('user-1');
  });

  it('should call generateAccessToken with correct ABAC payload', async () => {
    const bitmap = Buffer.from([0x01, 0x02]);
    mockBitmapComputer.computeBitmap.mockResolvedValue(bitmap);
    const mockUser = createMockUser({
      permVersion: 5,
      isSuperadmin: false,
      departmentId: 'dept-1',
    });
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(mockTokenGenerator.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'test@example.com',
      pv: 5,
      perms: bitmap.toString('base64'),
      sad: false,
      dept: 'dept-1',
      rids: ['role-1'],
    });
  });

  it('should base64-encode bitmap in the access token payload', async () => {
    const bitmap = Buffer.from([0xff, 0xaa, 0x55]);
    mockBitmapComputer.computeBitmap.mockResolvedValue(bitmap);
    mockUserRepo.findByEmail.mockResolvedValue(createMockUser());
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    const callArgs = mockTokenGenerator.generateAccessToken.mock.calls[0][0];
    expect(callArgs.perms).toBe(bitmap.toString('base64'));
  });

  it('should call user.recordLogin with EMAIL', async () => {
    const mockUser = createMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(mockUser.recordLogin).toHaveBeenCalledWith('EMAIL');
  });

  it('should call userRepository.save after recording login', async () => {
    const mockUser = createMockUser();
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(mockUserRepo.save).toHaveBeenCalledWith(mockUser);
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should handle superadmin user correctly (sad: true in payload)', async () => {
    const mockUser = createMockUser({ isSuperadmin: true });
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    const callArgs = mockTokenGenerator.generateAccessToken.mock.calls[0][0];
    expect(callArgs.sad).toBe(true);
  });

  it('should handle user without departmentId (dept: empty string in payload)', async () => {
    const mockUser = createMockUser({ departmentId: undefined });
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.compare.mockResolvedValue(true);

    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    const callArgs = mockTokenGenerator.generateAccessToken.mock.calls[0][0];
    expect(callArgs.dept).toBe('');
  });
});
