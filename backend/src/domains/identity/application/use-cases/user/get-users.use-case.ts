import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { PaginatedUsersOutput, UserFilterInput } from '@/domains/identity/application/dtos/user.dtos';
import { UserRepositoryPort, UserFilterInput as PortFilterInput } from '@/domains/identity/application/ports/repositories/user.repository.port';

export interface GetUsersInput {
  filter?: UserFilterInput;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetUsersUseCase implements IUseCase<GetUsersInput, PaginatedUsersOutput> {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
  ) { }

  async execute(input: GetUsersInput): Promise<PaginatedUsersOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const filter: PortFilterInput = {
      search: input.filter?.search,
      status: input.filter?.status,
      roleId: input.filter?.roleId,
      departmentId: input.filter?.departmentId
    };

    const result = await this.userRepository.findPaginated(filter, page, limit);

    return {
      items: result.items.map((user) => ({
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
        permissions: [],
        currentTeam: user.currentTeam,
        onBoardingCompleted: user.onBoardingCompleted,
        lastLogin: user.lastLogin,
        visibleMenus: user.visibleMenus,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
