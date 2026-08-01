export const queryKeys = {
  profile: ["user-profile"] as const,

  departments: (limit?: number) => ["departments", { limit }] as const,
  positions: ["positions"] as const,

  employees: (filters?: Record<string, unknown>) =>
    filters ? ["employees", filters] : (["employees"] as const),
  internalUsers: ["internal-users"] as const,
  employeeDetail: (id: string) => ["employee", id] as const,

  devices: (filters?: Record<string, unknown>) =>
    filters ? ["devices", filters] : (["devices"] as const),
  deviceTypes: ["device-types"] as const,
  deviceStatuses: ["device-statuses"] as const,
  deviceStatistics: ["device-statistics"] as const,
  devicesByDepartment: ["devices-by-department"] as const,

  suppliers: (filters?: Record<string, unknown>) =>
    filters ? ["suppliers", filters] : (["suppliers"] as const),
  purchaseOrders: (filters?: Record<string, unknown>) =>
    filters ? ["purchase-orders", filters] : (["purchase-orders"] as const),
  orderHistory: (id: string) => ["order-history", id] as const,

  permissions: ["permissions"] as const,
  abacPolicies: ["abac-policies"] as const,
  endpointPermissions: ["endpoint-permissions"] as const,
  roles: ["roles"] as const,

  activityLogs: (filters?: Record<string, unknown>) =>
    filters ? ["activity-logs", filters] : (["activity-logs"] as const),

  deviceRequests: (filters?: Record<string, unknown>) =>
    filters ? ["device-requests", filters] : (["device-requests"] as const),

  meetingRooms: (search?: string) =>
    search ? ["meeting-rooms", { search }] : (["meeting-rooms"] as const),
  bookingTimeline: (filters: Record<string, unknown>) =>
    ["booking-timeline", filters] as const,
  departmentUsers: (departmentId: string) =>
    ["department-users", departmentId] as const,
  bookingDepartments: (limit?: number) =>
    ["booking-departments", { limit }] as const,
  bookingParticipants: (params: { search?: string; departmentId?: string }) =>
    ["booking-participants", params] as const,
  bookingDetail: (id: string) => ["booking-detail", id] as const
} as const;
