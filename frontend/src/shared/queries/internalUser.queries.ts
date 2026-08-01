import type { QueryClient } from "@tanstack/react-query";

/** Prefix khớp queryKey trong EmployeesDataList */
export const internalUsersQueryKey = ["internal-users"] as const;

export function invalidateInternalUsersQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: [...internalUsersQueryKey]
    }),
    queryClient.invalidateQueries({
      queryKey: ["employee-device-summary"]
    })
  ]);
}
