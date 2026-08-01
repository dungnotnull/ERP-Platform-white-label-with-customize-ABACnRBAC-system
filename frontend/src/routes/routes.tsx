import { lazy } from "react";
import {
  AppRouteNames,
  appRoutes
} from "@/shared/constants/routes.constant.ts";
import type { VisibleMenuValue } from "@/shared/constants/menu.constants";

const Dashboard = lazy(() => import("@/pages/dashboard/index"));
const Login = lazy(() => import("@/pages/auth/Login.tsx"));
const Register = lazy(() => import("@/pages/auth/Register.tsx"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Unauthorized = lazy(() => import("@/pages/errors/Unauthorized.tsx"));
const GoogleAuthCallback = lazy(
  () => import("@/pages/auth/GoogleAuthCallback.tsx")
);
const Department = lazy(() => import("@/pages/departments"));
const AssetsManagement = lazy(() => import("@/pages/assets/"));
const EmployeesManagement = lazy(() => import("@/pages/employees/"));
const EmployeeDetail = lazy(() => import("@/pages/employees/EmployeeDetail"));
const EmployeeDeviceSummary = lazy(
  () => import("@/pages/employees/EmployeeDeviceSummary")
);
const Suppliers = lazy(() => import("@/pages/suppliers/"));
const PurchaseOrders = lazy(() => import("@/pages/suppliers/purchaseOrders"));
const OrderHistory = lazy(() => import("@/pages/suppliers/orderHistory"));
const DeviceRequestList = lazy(
  () => import("@/pages/employees/DeviceRequestList")
);
const PermissionsManagement = lazy(() => import("@/pages/permissions"));
const ActivityLogs = lazy(() => import("@/pages/activity-logs"));
const Statistic = lazy(() => import("@/pages/statistic"));
const MeetingBookings = lazy(() => import("@/pages/meeting-bookings"));
const MeetingMap = lazy(() => import("@/pages/meeting-map"));

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  children?: RouteConfig[];
  auth?: boolean;
  roles?: string[];
  permissions?: string[];
  requiredMenu?: VisibleMenuValue;
}

export const routes: RouteConfig[] = [
  {
    path: appRoutes[AppRouteNames.HOME],
    element: Dashboard,
    auth: true
  },
  {
    path: appRoutes[AppRouteNames.SIGN_IN],
    element: Login,
    auth: false
  },
  {
    path: appRoutes[AppRouteNames.SIGN_UP],
    element: Register,
    auth: false
  },
  {
    path: appRoutes[AppRouteNames.GOOGLE_CALLBACK],
    element: GoogleAuthCallback,
    auth: false
  },
  {
    path: appRoutes[AppRouteNames.UNAUTHORIZED],
    element: Unauthorized,
    auth: false
  },
  {
    path: appRoutes[AppRouteNames.TEAM],
    element: Department,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.EMPLOYEE],
    element: EmployeesManagement,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: `${appRoutes[AppRouteNames.EMPLOYEE_DETAIL]}/:id`,
    element: EmployeeDetail,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.EMPLOYEE_DEVICE_SUMMARY],
    element: EmployeeDeviceSummary,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.ASSETS],
    element: AssetsManagement,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.SUPPLIERS],
    element: Suppliers,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.PURCHASE_ORDERS],
    element: PurchaseOrders,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.ORDER_HISTORY],
    element: OrderHistory,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.DEVICE_REQUESTS],
    element: DeviceRequestList,
    auth: true,
    roles: ["ADMIN", "MANAGER", "LEADER"]
  },
  {
    path: appRoutes[AppRouteNames.PERMISSIONS],
    element: PermissionsManagement,
    auth: true,
    roles: ["SUPERADMIN"],
    permissions: ["MANAGE_PERMISSIONS"]
  },
  {
    path: appRoutes[AppRouteNames.ACTIVITY_LOGS],
    element: ActivityLogs,
    auth: true,
    roles: ["SUPERADMIN"]
  },
  {
    path: appRoutes[AppRouteNames.STATISTIC],
    element: Statistic,
    auth: true
  },
  {
    path: appRoutes[AppRouteNames.MEETING_BOOKINGS],
    element: MeetingBookings,
    auth: true,
    requiredMenu: "meetingBookings"
  },
  {
    path: appRoutes[AppRouteNames.MEETING_MAP],
    element: MeetingMap,
    auth: true,
    requiredMenu: "meetingMap"
  },
  {
    path: "*",
    element: NotFound,
    auth: false
  }
];
