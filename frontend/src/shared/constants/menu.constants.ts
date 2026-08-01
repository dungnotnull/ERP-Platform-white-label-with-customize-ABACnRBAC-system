export const DEFAULT_VISIBLE_MENUS = ["home", "meetingMap", "meetingBookings"];
export const ALL_VISIBLE_MENUS = ["home", "statistic", "team", "employee", "assets", "suppliers", "meetingMap", "meetingBookings"];

export const MENU_OPTIONS = [
  { value: "home", label: "permissions.menuOptions.home" },
  { value: "statistic", label: "permissions.menuOptions.statistic" },
  { value: "team", label: "permissions.menuOptions.team" },
  { value: "employee", label: "permissions.menuOptions.employee" },
  { value: "assets", label: "permissions.menuOptions.assets" },
  { value: "suppliers", label: "permissions.menuOptions.suppliers" },
  { value: "meetingMap", label: "permissions.menuOptions.meetingMap" },
  { value: "meetingBookings", label: "permissions.menuOptions.meetingBookings" }
];

export type VisibleMenuValue = typeof MENU_OPTIONS[number]["value"];
