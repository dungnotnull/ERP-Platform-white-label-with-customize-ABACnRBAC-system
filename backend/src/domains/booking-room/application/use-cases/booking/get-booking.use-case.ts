import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { BookingNotFoundException } from '../../../domain/exceptions/booking-not-found.exception';
import { InternalUserQueryPort } from '../../ports/services/internal-user-query.port';
import { DepartmentQueryPort } from '../../ports/services/department-query.port';
import { BookingHistoryItemProps } from '@/domains/booking-room/domain/value-objects/booking-history.vo';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';

export interface ConflictedUserDetails {
  userId: string;
  overlappingBookingIds: string[];
}

export interface BookingActorOutput {
  id: string;
  name: string;
  department: { nameVi: string; nameJa: string } | null;
}

export interface GetBookingOutput extends Record<string, unknown> {
  creator: BookingActorOutput;
  lastEditor: BookingActorOutput | null;
  participants: BookingActorOutput[];
  conflictedUsersDetails: ConflictedUserDetails[];
}

@Injectable()
export class GetBookingUseCase implements IUseCase<string, GetBookingOutput> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    @Inject('InternalUserQueryPort')
    private readonly internalUserQueryPort: InternalUserQueryPort,
    @Inject('DepartmentQueryPort')
    private readonly departmentQueryPort: DepartmentQueryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string): Promise<GetBookingOutput> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundException(id);
    }

    const plainBooking = booking.toPlainObject();
    const history = (plainBooking.history as BookingHistoryItemProps[]) || [];
    const lastUpdatedEntry = [...history]
      .filter((entry) => entry.action === 'UPDATED')
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )[0];

    const actorIds = Array.from(
      new Set(
        [booking.creatorId, lastUpdatedEntry?.actorId].filter(
          (actorId): actorId is string => Boolean(actorId),
        ),
      ),
    );

    const [actorsById, participants] = await Promise.all([
      this.resolveActors(actorIds),
      this.resolveParticipants(booking.participantIds),
    ]);

    return {
      ...plainBooking,
      creator:
        actorsById.get(booking.creatorId) ??
        this.fallbackActor(booking.creatorId),
      lastEditor: lastUpdatedEntry
        ? (actorsById.get(lastUpdatedEntry.actorId) ??
          this.fallbackActor(lastUpdatedEntry.actorId))
        : null,
      participants,
      // FE không dùng; bỏ scan timeline để giảm latency khi mở edit modal.
      conflictedUsersDetails: [],
    };
  }

  private fallbackActor(id: string): BookingActorOutput {
    return { id, name: id, department: null };
  }

  private async resolveParticipants(
    participantIds: string[],
  ): Promise<BookingActorOutput[]> {
    if (participantIds.length === 0) {
      return [];
    }

    const users = await this.internalUserQueryPort.findByIds(participantIds);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const departmentMap = await this.loadDepartments(
      users.map((user) => user.departmentId),
    );

    return participantIds.map((participantId) => {
      const internalUser = userMap.get(participantId);
      if (!internalUser) {
        return this.fallbackActor(participantId);
      }

      return this.toActorOutput(participantId, internalUser, departmentMap);
    });
  }

  private async resolveActors(
    actorIds: string[],
  ): Promise<Map<string, BookingActorOutput>> {
    const result = new Map<string, BookingActorOutput>();
    if (actorIds.length === 0) {
      return result;
    }

    const internalUsers = await this.internalUserQueryPort.findByIds(actorIds);
    const foundInternalIds = new Set(internalUsers.map((user) => user.id));
    const missingIds = actorIds.filter((id) => !foundInternalIds.has(id));

    const authUsers = await Promise.all(
      missingIds.map(async (actorId) => {
        const authUser = await this.userRepository.findById(actorId);
        return authUser ? { actorId, authUser } : null;
      }),
    );

    const authResolved = authUsers.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );

    const emails = authResolved.map(({ authUser }) => authUser.email);
    const internalByEmailEntries = await Promise.all(
      emails.map(async (email) => {
        const internalUser = await this.internalUserQueryPort.findByEmail(email);
        return [email.toLowerCase(), internalUser] as const;
      }),
    );
    const internalByEmail = new Map(
      internalByEmailEntries.filter(([, user]) => user !== null),
    );

    const linkedInternalUsers = [
      ...internalUsers,
      ...authResolved
        .map(({ authUser }) =>
          internalByEmail.get(authUser.email.toLowerCase()),
        )
        .filter((user): user is NonNullable<typeof user> => Boolean(user)),
    ];

    const departmentMap = await this.loadDepartments(
      linkedInternalUsers.map((user) => user.departmentId),
    );

    for (const internalUser of internalUsers) {
      result.set(
        internalUser.id,
        this.toActorOutput(internalUser.id, internalUser, departmentMap),
      );
    }

    for (const { actorId, authUser } of authResolved) {
      const linked = internalByEmail.get(authUser.email.toLowerCase());
      if (linked) {
        result.set(actorId, this.toActorOutput(actorId, linked, departmentMap));
      } else {
        result.set(actorId, {
          id: actorId,
          name: authUser.name,
          department: null,
        });
      }
    }

    for (const actorId of actorIds) {
      if (!result.has(actorId)) {
        result.set(actorId, this.fallbackActor(actorId));
      }
    }

    return result;
  }

  private async loadDepartments(
    departmentIds: string[],
  ): Promise<Map<string, { nameVi: string; nameJa: string }>> {
    const uniqueIds = Array.from(
      new Set(departmentIds.filter((id) => Boolean(id))),
    );
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const departments = await this.departmentQueryPort.findByIds(uniqueIds);
    return new Map(
      departments.map((department) => [
        department.id,
        { nameVi: department.nameVi, nameJa: department.nameJa },
      ]),
    );
  }

  private toActorOutput(
    actorId: string,
    internalUser: { name: string; departmentId: string },
    departmentMap: Map<string, { nameVi: string; nameJa: string }>,
  ): BookingActorOutput {
    const department = internalUser.departmentId
      ? (departmentMap.get(internalUser.departmentId) ?? null)
      : null;

    return {
      id: actorId,
      name: internalUser.name,
      department,
    };
  }
}
