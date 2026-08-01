enum AppRouteNames {
  HOME = "home",
  SIGN_IN = "login",
  SIGN_UP = "register",
  UNAUTHORIZED = "unauthorized",
  GOOGLE_CALLBACK = "google-callback",
  TEAM = "team",
  EMPLOYEE = "employee",
  ASSETS = "assets",
  SUPPLIERS = "suppliers",
  EMPLOYEE_DETAIL = "employee-detail",
  EMPLOYEE_DEVICE_SUMMARY = "device-summary",
  USER_DEVICE_SUMMARY = "user-device-summary",
  PURCHASE_ORDERS = "purchase-orders",
  ORDER_HISTORY = "order-history",
  DEVICE_REQUESTS = "device-requests",
  PERMISSIONS = "permissions",
  ACTIVITY_LOGS = "activity-logs",
  STATISTIC = "statistic",
  MEETING_BOOKINGS = "meeting-bookings",
  MEETING_MAP = "meeting-map"
}

enum ApiRouteNames {
  // Auth Routes
  SIGN_IN = "login",
  SIGN_OUT = "logout",
  SIGN_UP = "register",
  REFRESH_TOKEN = "refresh",
  PROFILE = "profile",
  GOOGLE_AUTH = "google-auth",
  GOOGLE_URL = "google-url",
  GOOGLE_CALLBACK = "google-callback",

  // Users Routes
  USERS = "users",
  USER_PROFILE = "user-profile",
  UPDATE_USER_PROFILE = "update-user-profile",
  USER_BY_ID = "user-by-id",
  CREATE_USER = "create-user",
  UPDATE_USER = "update-user",
  DELETE_USER = "delete-user",

  // Roles Routes
  ROLES = "roles",
  ROLES_WITH_PERMISSIONS = "roles-with-permissions",
  ROLE_BY_ID = "role-by-id",
  ROLE_PERMISSIONS = "role-permissions",

  // Permissions CRUD (manage permissions)
  PERMISSIONS_CRUD = "permissions",
  ABAC_POLICIES = "abac-policies",

  // Endpoint-permission rules (dynamic endpoint + permission)
  ENDPOINT_PERMISSIONS = "endpoint-permissions",
  EP_ROUTES = "ep-routes",
  MODULES = "modules",

  // Devices Routes
  DEVICES = "devices",
  DEVICES_BY_STATUS = "devices-by-status",
  DEVICES_BY_TYPE = "devices-by-type",
  DEVICE_STATISTICS = "device-statistics",
  DEVICE_BY_ID = "device-by-id",
  CREATE_DEVICE = "create-device",
  UPDATE_DEVICE = "update-device",
  UPDATE_DEVICE_STATUS = "update-device-status",
  DELETE_DEVICE = "delete-device",
  IMPORT_DEVICES = "import-devices",
  IMPORT_SAVE_DEVICES = "import-save-devices",
  EXPORT_DEVICES = "export-devices",
  DEVICES_FILTER = "devices-filter",

  // Device Assignments Routes
  ASSIGN_DEVICE = "assign-device",
  RETURN_DEVICE = "return-device",
  ACTIVE_ASSIGNMENTS = "active-assignments",
  ASSIGNMENTS_BY_USER = "assignments-by-user",
  ASSIGNMENTS_BY_DEVICE = "assignments-by-device",
  ASSIGNMENT_WITH_USER = "assignment-with-user",
  BASE_ASSIGNMENT_URL = "device-assignments",

  // Device Types Routes
  DEVICE_TYPES = "device-types",
  DEVICE_TYPE_BY_ID = "device-type-by-id",
  CREATE_DEVICE_TYPE = "create-device-type",
  UPDATE_DEVICE_TYPE = "update-device-type",
  DELETE_DEVICE_TYPE = "delete-device-type",

  // Device Statuses Routes
  DEVICE_STATUSES = "device-statuses",

  // Device Maintenance Routes
  DEVICE_MAINTENANCE = "device-maintenance",
  PENDING_MAINTENANCE = "pending-maintenance",
  MAINTENANCE_BY_DEVICE = "maintenance-by-device",
  MAINTENANCE_BY_ID = "maintenance-by-id",
  CREATE_MAINTENANCE = "create-maintenance",
  UPDATE_MAINTENANCE = "update-maintenance",
  DELETE_MAINTENANCE = "delete-maintenance",

  // Employees Routes
  INTERNAL_USERS = "internal-users",
  IMPORT_EMPLOYEES = "import-employees",
  EXPORT_EMPLOYEES = "export-employees",
  UPDATE_EMPLOYEES = "update",
  EMPLOYEE_DEVICE_SUMMARY = "device-summary",
  USER_DEVICE_SUMMARY = "user-device-summary",

  // Department route
  DEPARTMENTS = "departments",
  DEPARTMENTS_OVERVIEW = "departments-overview",
  GET_DEVICES_BY_DEPARTMENT = "get_devices_by_department",
  IMPORT_DEPARTMENTS = "import-departments",

  // Position route
  POSITIONS = "positions",
  IMPORT_POSITIONS = "import-positions",

  // Suppliers route
  SUPPLIERS = "suppliers",
  CREATE_SUPPLIER = "create_supplier",
  UPDATE_SUPPLIER = "update-supplier",
  PURCHASE_ORDERS = "purchase-orders",
  IMPORT_SUPPLIER = "import-supplier",
  ORDER_HISTORY = "order-history",

  // Activity Logs route
  ACTIVITY_LOGS = "activity-logs",

  // Device request route
  DEVICE_REQUESTS = "device-requests",

  // Meeting bookings route
  BOOKINGS = "bookings",
  MEETING_ROOMS_ALL = "meeting-rooms-all",
  DEPARTMENT_USERS = "department-users",
  BOOKING_DEPARTMENTS = "booking-departments",
  BOOKING_INTERNAL_USERS = "booking-internal-users"
}

const appRoutes: Record<AppRouteNames, string> = {
  [AppRouteNames.HOME]: "/",
  [AppRouteNames.SIGN_IN]: "/login",
  [AppRouteNames.SIGN_UP]: "/register",
  [AppRouteNames.UNAUTHORIZED]: "/unauthorized",
  [AppRouteNames.GOOGLE_CALLBACK]: "/auth/callback",
  [AppRouteNames.TEAM]: "/team",
  [AppRouteNames.EMPLOYEE]: "/employee",
  [AppRouteNames.ASSETS]: "/assets",
  [AppRouteNames.SUPPLIERS]: "/suppliers",
  [AppRouteNames.EMPLOYEE_DETAIL]: "/employee-detail",
  [ApiRouteNames.EMPLOYEE_DEVICE_SUMMARY]: "/employee/device-summary",
  [AppRouteNames.USER_DEVICE_SUMMARY]: "/internal-users/user-device-summary",
  [AppRouteNames.PURCHASE_ORDERS]: "/purchase-orders",
  [AppRouteNames.ORDER_HISTORY]: "/suppliers/order-history/:id",
  [ApiRouteNames.DEVICE_REQUESTS]: "/employee/device-requests",
  [AppRouteNames.PERMISSIONS]: "/permissions",
  [AppRouteNames.ACTIVITY_LOGS]: "/activity-logs",
  [AppRouteNames.STATISTIC]: "/statistic",
  [AppRouteNames.MEETING_BOOKINGS]: "/meeting-bookings",
  [AppRouteNames.MEETING_MAP]: "/meeting-map"
};

const apiRoutes: Record<ApiRouteNames, string> = {
  // Auth Routes
  [ApiRouteNames.SIGN_IN]: "/auth/login",
  [ApiRouteNames.SIGN_OUT]: "/auth/logout",
  [ApiRouteNames.SIGN_UP]: "/auth/register",
  [ApiRouteNames.REFRESH_TOKEN]: "/auth/refresh",
  [ApiRouteNames.PROFILE]: "/users/profile",
  [ApiRouteNames.GOOGLE_AUTH]: "/auth/google",
  [ApiRouteNames.GOOGLE_URL]: "/auth/google-url",
  [ApiRouteNames.GOOGLE_CALLBACK]: "/auth/google/callback",

  // Users Routes
  [ApiRouteNames.USERS]: "/users",
  [ApiRouteNames.USER_PROFILE]: "/users/profile",
  [ApiRouteNames.UPDATE_USER_PROFILE]: "/users/profile",
  [ApiRouteNames.USER_BY_ID]: "/users/:id",
  [ApiRouteNames.CREATE_USER]: "/users",
  [ApiRouteNames.UPDATE_USER]: "/users/:id",
  [ApiRouteNames.DELETE_USER]: "/users/:id",

  // Roles Routes
  [ApiRouteNames.ROLES]: "/roles",
  [ApiRouteNames.ROLES_WITH_PERMISSIONS]: "/roles",
  [ApiRouteNames.ROLE_BY_ID]: "/roles/:id",
  [ApiRouteNames.ROLE_PERMISSIONS]: "/roles/:id",
  [ApiRouteNames.PERMISSIONS_CRUD]: "/permissions",
  [ApiRouteNames.ABAC_POLICIES]: "/abac-policies",
  [ApiRouteNames.ENDPOINT_PERMISSIONS]: "/endpoint-permissions",
  [ApiRouteNames.EP_ROUTES]: "/endpoint-permissions/routes",
  [ApiRouteNames.MODULES]: "/modules",

  // Devices Routes
  [ApiRouteNames.DEVICES]: "/devices",
  [ApiRouteNames.DEVICES_BY_STATUS]: "/devices/status/:statusId",
  [ApiRouteNames.DEVICES_BY_TYPE]: "/devices/type/:typeId",
  [ApiRouteNames.DEVICE_STATISTICS]: "/devices/statistics",
  [ApiRouteNames.DEVICE_BY_ID]: "/devices/:id",
  [ApiRouteNames.CREATE_DEVICE]: "/devices",
  [ApiRouteNames.UPDATE_DEVICE]: "/devices/",
  [ApiRouteNames.UPDATE_DEVICE_STATUS]: "/devices/:id/status",
  [ApiRouteNames.DELETE_DEVICE]: "/devices/:id",
  [ApiRouteNames.IMPORT_DEVICES]: "/devices/import",
  [ApiRouteNames.IMPORT_SAVE_DEVICES]: "/devices/import_save",
  [ApiRouteNames.EXPORT_DEVICES]: "/devices/export",
  [ApiRouteNames.DEVICES_FILTER]: "/devices/filter",

  // Device Assignments Routes
  [ApiRouteNames.BASE_ASSIGNMENT_URL]: "/device-assignments",
  [ApiRouteNames.ASSIGN_DEVICE]: "/device-assignments",
  [ApiRouteNames.RETURN_DEVICE]: "/device-assignments/:id/return",
  [ApiRouteNames.ACTIVE_ASSIGNMENTS]: "/device-assignments/active",
  [ApiRouteNames.ASSIGNMENTS_BY_USER]: "/device-assignments/user/:userId",
  [ApiRouteNames.ASSIGNMENTS_BY_DEVICE]: "/device-assignments/device/:deviceId",
  [ApiRouteNames.ASSIGNMENT_WITH_USER]: "/device-assignments/:id/with-user",

  // Device Types Routes
  [ApiRouteNames.DEVICE_TYPES]: "/device-types",
  [ApiRouteNames.DEVICE_TYPE_BY_ID]: "/device-types/:id",
  [ApiRouteNames.CREATE_DEVICE_TYPE]: "/device-types",
  [ApiRouteNames.UPDATE_DEVICE_TYPE]: "/device-types/:id",
  [ApiRouteNames.DELETE_DEVICE_TYPE]: "/device-types/:id",

  // Device Statuses Routes
  [ApiRouteNames.DEVICE_STATUSES]: "/device-statuses",

  // Device Maintenance Routes
  [ApiRouteNames.DEVICE_MAINTENANCE]: "/device-maintenance",
  [ApiRouteNames.PENDING_MAINTENANCE]: "/device-maintenance/pending",
  [ApiRouteNames.MAINTENANCE_BY_DEVICE]: "/device-maintenance/device/:deviceId",
  [ApiRouteNames.MAINTENANCE_BY_ID]: "/device-maintenance/:id",
  [ApiRouteNames.CREATE_MAINTENANCE]: "/device-maintenance",
  [ApiRouteNames.UPDATE_MAINTENANCE]: "/device-maintenance/:id",
  [ApiRouteNames.DELETE_MAINTENANCE]: "/device-maintenance/:id",

  // Employees Routes
  [ApiRouteNames.INTERNAL_USERS]: "/internal-users",
  [ApiRouteNames.IMPORT_EMPLOYEES]: "/internal-users/import",
  [ApiRouteNames.EXPORT_EMPLOYEES]: "/internal-users/export",
  [ApiRouteNames.UPDATE_EMPLOYEES]: "/internal-users/update",
  [ApiRouteNames.EMPLOYEE_DEVICE_SUMMARY]: "/internal-users/device-summary",
  [AppRouteNames.USER_DEVICE_SUMMARY]: "/internal-users/user-device-summary",

  // Department Route
  [ApiRouteNames.DEPARTMENTS]: "/departments",
  [ApiRouteNames.DEPARTMENTS_OVERVIEW]: "/departments/overview",
  [ApiRouteNames.GET_DEVICES_BY_DEPARTMENT]:
    "/departments/get-devices-by-department",
  [ApiRouteNames.IMPORT_DEPARTMENTS]: "/departments/import",

  // Position Route
  [ApiRouteNames.POSITIONS]: "/positions",
  [ApiRouteNames.IMPORT_POSITIONS]: "/positions/import",

  // suppliers Route
  [ApiRouteNames.SUPPLIERS]: "/suppliers",
  [ApiRouteNames.CREATE_SUPPLIER]: "/create_supplier",
  [ApiRouteNames.UPDATE_SUPPLIER]: "/update-supplier",
  [ApiRouteNames.PURCHASE_ORDERS]: "/purchase-orders",
  [ApiRouteNames.IMPORT_SUPPLIER]: "/suppliers/import",
  [ApiRouteNames.ORDER_HISTORY]: "/suppliers/order-history",

  // Activity Logs Route
  [ApiRouteNames.ACTIVITY_LOGS]: "/activity-logs",

  // device request Route
  [ApiRouteNames.DEVICE_REQUESTS]: "/device-requests",

  // meeting bookings Route
  [ApiRouteNames.BOOKINGS]: "/bookings",
  [ApiRouteNames.MEETING_ROOMS_ALL]: "/rooms/all",
  [ApiRouteNames.DEPARTMENT_USERS]: "/departments/:id/users",
  [ApiRouteNames.BOOKING_DEPARTMENTS]: "/bookings/departments",
  [ApiRouteNames.BOOKING_INTERNAL_USERS]: "/bookings/internal-users"
};

export { AppRouteNames, ApiRouteNames, appRoutes, apiRoutes };
