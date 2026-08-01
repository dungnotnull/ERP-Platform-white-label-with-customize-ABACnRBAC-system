import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { UserOutput } from '@/domains/identity/application/dtos/user.dtos';
import { UserNotFoundException } from '@/domains/identity/domain/exceptions/user-not-found.exception';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';
import { InternalUserQueryPort } from '@/domains/identity/application/ports/internal-user-query.port';
import { RouteMapService } from '@/domains/identity/application/services/route-map.service';

@Injectable()
export class GetUserUseCase implements IUseCase<string, UserOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('IBitmapComputationService') private readonly bitmapComputer: IBitmapComputationService,
    @Inject('INTERNAL_USER_QUERY_PORT') private readonly internalUserQueryPort: InternalUserQueryPort,
    private readonly routeMapService: RouteMapService,
  ) {}

  async execute(id: string): Promise<UserOutput> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }

    const bitmap = user.isSuperadmin
      ? Buffer.alloc(0)
      : await this.bitmapComputer.computeBitmap(id);

    const permissions = this.resolvePermissionPaths(bitmap);
    const existedRole = await this.internalUserQueryPort.findDepartmentCodeByEmail(user.email);

    return {
      id: user.id,
      name: user.name,
      nickName: user.nickName,
      bio: user.bio,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      gender: user.gender,
      maritalStatus: user.maritalStatus,
      birthday: user.birthday,
      address: user.address,
      phone: user.phone,
      roleIds: user.roleIds,
      isSuperadmin: user.isSuperadmin,
      departmentIds: user.departmentIds,
      permissions,
      currentTeam: user.currentTeam,
      onBoardingCompleted: user.onBoardingCompleted,
      lastLogin: user.lastLogin,
      visibleMenus: user.visibleMenus,
      existedRole,
    };
  }

  private resolvePermissionPaths(bitmap: Buffer): string[] {
    if (!bitmap || bitmap.length === 0) return [];

    const entries = this.routeMapService.routes;

    if (!entries || entries.length === 0) return [];

    return entries
      .filter(entry => {
        const byteIndex = entry.bitIndex >> 3;
        if (byteIndex >= bitmap.length) return false;
        return (bitmap[byteIndex] & (1 << (entry.bitIndex & 7))) !== 0;
      })
      .map(entry => `${entry.method}:${entry.pathPattern}`);
  }
}
