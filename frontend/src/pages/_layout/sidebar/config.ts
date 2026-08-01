import { SidebarMenuItem } from "@/shared/@types/layout.type";
import { AppRouteNames, appRoutes } from "@/shared/constants/routes.constant";
import {
  Building2,
  MonitorSmartphone,
  // ScrollText,
  Settings,
  // Shield,
  UserRoundPlus,
  Users,
  Home,
  BarChart3,
  LayoutGrid,
  CalendarDays,
  DoorClosed
} from "lucide-react";

export const menuItems: SidebarMenuItem[] = [
  {
    name: "menu.sidebar.home",
    icon: Home,
    href: appRoutes[AppRouteNames.HOME],
    label: "Home"
  },
  {
    name: "menu.sidebar.statistic",
    icon: BarChart3,
    href: appRoutes[AppRouteNames.STATISTIC],
    label: "Statistic"
  },
  {
    name: "menu.sidebar.management",
    icon: Settings,
    label: "Management",
    subMenus: [
      {
        name: "menu.sidebar.team",
        href: appRoutes[AppRouteNames.TEAM],
        label: "Team",
        icon: Users
      },
      {
        name: "menu.sidebar.employee",
        href: appRoutes[AppRouteNames.EMPLOYEE],
        label: "Employee",
        icon: UserRoundPlus
      },
      {
        name: "menu.sidebar.assets",
        href: appRoutes[AppRouteNames.ASSETS],
        label: "Assets",
        icon: MonitorSmartphone
      },
      {
        name: "menu.sidebar.suppliers",
        href: appRoutes[AppRouteNames.SUPPLIERS],
        label: "Suppliers",
        icon: Building2
      }
      // {
      //   name: "menu.sidebar.permissions",
      //   href: appRoutes[AppRouteNames.PERMISSIONS],
      //   label: "Permissions",
      //   icon: Shield
      // },
      // {
      //   name: "menu.sidebar.activityLogs",
      //   href: appRoutes[AppRouteNames.ACTIVITY_LOGS],
      //   label: "Activity Logs",
      //   icon: ScrollText
      // }
    ]
  },
  {
    name: "menu.sidebar.meetingRoom",
    icon: DoorClosed,
    label: "Meeting Room",
    subMenus: [
      {
        name: "menu.sidebar.meetingMap",
        href: appRoutes[AppRouteNames.MEETING_MAP],
        label: "Meeting Map",
        icon: LayoutGrid
      },
      {
        name: "menu.sidebar.meetingBookings",
        href: appRoutes[AppRouteNames.MEETING_BOOKINGS],
        label: "Meeting Bookings",
        icon: CalendarDays
      }
    ]
  }
];
