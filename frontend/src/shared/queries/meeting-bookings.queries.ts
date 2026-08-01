import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery
} from "@tanstack/react-query";
import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import {
  extractApiList,
  normalizePaginatedResponse
} from "@/shared/utils/apiResponse.util";
import { queryKeys } from "./keys";

type MeetingRoomApi = {
  id: string;
  name: string;
  jpName?: string;
  capacity: number;
};

type BookingTimelineApi = {
  id: string;
  title?: string;
  roomIds: string[];
  departmentIds: string[];
  departments?: [
    {
      id: string;
      nameVi: string;
      nameJa?: string;
    }
  ];
  participantIds: string[];
  conflictedUsers?: string[];
  startTime: string;
  endTime: string;
  note?: string;
  creatorId?: string;
  version: number;
};

type DepartmentUserApi = {
  id: string;
  name: string;
  email?: string;
  departmentId: string;
};

type BookingDepartmentApi = {
  id: string;
  nameVi: string;
  nameJa: string;
  code?: string;
  description?: string;
};

type BookingParticipantApi = {
  id: string;
  name: string;
  department: {
    nameVi: string;
    nameJa: string;
  } | null;
};

type BookingActorApi = {
  id: string;
  name: string;
  department: {
    nameVi: string;
    nameJa: string;
  } | null;
};

type BookingDetailApi = {
  id: string;
  creator: BookingActorApi;
  lastEditor: BookingActorApi | null;
  participants?: BookingParticipantApi[];
  version: number;
};

const BOOKING_PARTICIPANTS_PAGE_SIZE = 50;

const resolveDayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    dateKey: getBookingTimelineDateKey(date)
  };
};

export function getBookingTimelineDateKey(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const meetingRoomsQueryOptions = queryOptions({
  queryKey: queryKeys.meetingRooms(),
  queryFn: async () => {
    const payload = await apiClient.get(
      apiRoutes[ApiRouteNames.MEETING_ROOMS_ALL]
    );
    return extractApiList<MeetingRoomApi>(payload);
  },
  staleTime: 5 * 60_000
});

export const bookingTimelineQueryOptions = (date: Date) => {
  const { startDate, endDate, dateKey } = resolveDayRange(date);

  return queryOptions({
    queryKey: queryKeys.bookingTimeline({ dateKey }),
    queryFn: async () => {
      const payload = await apiClient.get(
        apiRoutes[ApiRouteNames.BOOKINGS] + "/timeline",
        {
          params: {
            startDate,
            endDate
          }
        }
      );

      return extractApiList<BookingTimelineApi>(payload);
    },
    staleTime: 0
  });
};

export const departmentUsersQueryOptions = (departmentId: string) =>
  queryOptions({
    queryKey: queryKeys.departmentUsers(departmentId),
    queryFn: async () => {
      const route = apiRoutes[ApiRouteNames.DEPARTMENT_USERS].replace(
        ":id",
        departmentId
      );
      const payload = await apiClient.get(route);
      return extractApiList<DepartmentUserApi>(payload);
    },
    enabled: Boolean(departmentId),
    staleTime: 60_000
  });

export const bookingDepartmentsQueryOptions = (limit = 1000) =>
  queryOptions({
    queryKey: queryKeys.bookingDepartments(limit),
    queryFn: async () => {
      const payload = await apiClient.get(
        apiRoutes[ApiRouteNames.BOOKING_DEPARTMENTS],
        { params: { limit } }
      );
      return extractApiList<BookingDepartmentApi>(payload);
    },
    staleTime: 5 * 60_000
  });

export const bookingParticipantsInfiniteQueryOptions = (params: {
  search?: string;
  departmentId?: string;
}) => {
  const search = params.search?.trim() || undefined;
  const departmentId = params.departmentId || undefined;

  return infiniteQueryOptions({
    queryKey: queryKeys.bookingParticipants({ search, departmentId }),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const payload = await apiClient.get(
        apiRoutes[ApiRouteNames.BOOKING_INTERNAL_USERS],
        {
          params: {
            search,
            departmentId,
            page: pageParam,
            limit: BOOKING_PARTICIPANTS_PAGE_SIZE
          }
        }
      );

      return normalizePaginatedResponse<BookingParticipantApi>(payload);
    },
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.pageCount ? lastPage.page + 1 : undefined,
    staleTime: 60_000
  });
};

export function useMeetingRoomsQuery() {
  return useQuery(meetingRoomsQueryOptions);
}

export function useBookingTimelineQuery(
  date: Date,
  options?: { enabled?: boolean }
) {
  return useQuery({
    ...bookingTimelineQueryOptions(date),
    enabled: options?.enabled ?? true
  });
}

export function useDepartmentUsersQuery(departmentId: string) {
  return useQuery(departmentUsersQueryOptions(departmentId));
}

export function useBookingDepartmentsQuery(limit = 1000) {
  return useQuery(bookingDepartmentsQueryOptions(limit));
}

export function useInfiniteBookingParticipantsQuery(params: {
  search?: string;
  departmentId?: string;
  enabled?: boolean;
}) {
  const search = params.search?.trim() || undefined;
  const departmentId = params.departmentId || undefined;

  return useInfiniteQuery({
    ...bookingParticipantsInfiniteQueryOptions({ search, departmentId }),
    enabled: params.enabled ?? true
  });
}

export const bookingDetailQueryOptions = (bookingId: string) =>
  queryOptions({
    queryKey: queryKeys.bookingDetail(bookingId),
    queryFn: async () => {
      const payload = await apiClient.get<BookingDetailApi>(
        `${apiRoutes[ApiRouteNames.BOOKINGS]}/${bookingId}`
      );
      return payload;
    },
    enabled: Boolean(bookingId),
    staleTime: 5 * 60_000
  });

export function useBookingDetailQuery(
  bookingId: string | undefined,
  options?: { enabled?: boolean }
) {
  const id = bookingId ?? "";

  return useQuery({
    ...bookingDetailQueryOptions(id),
    enabled: (options?.enabled ?? true) && Boolean(id)
  });
}

export type {
  MeetingRoomApi,
  BookingTimelineApi,
  DepartmentUserApi,
  BookingDepartmentApi,
  BookingParticipantApi,
  BookingActorApi,
  BookingDetailApi
};
