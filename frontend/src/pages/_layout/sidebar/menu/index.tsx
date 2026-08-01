import { useLocation, useNavigate } from "react-router-dom";
import { menuItems } from "../config";
import { SidebarMenuItem } from "@/shared/@types/layout.type";
import { cn } from "@/lib/utils";
import { JSX } from "react";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/shared/hooks/useUserProfile";
import { DEFAULT_VISIBLE_MENUS, ALL_VISIBLE_MENUS } from "@/shared/constants/menu.constants";

const MENU_KEY_MAP: Record<string, string> = {
  "menu.sidebar.home": "home",
  "menu.sidebar.statistic": "statistic",
  "menu.sidebar.team": "team",
  "menu.sidebar.employee": "employee",
  "menu.sidebar.assets": "assets",
  "menu.sidebar.suppliers": "suppliers",
  "menu.sidebar.meetingMap": "meetingMap",
  "menu.sidebar.meetingBookings": "meetingBookings"
};

const SidebarMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user: currentUser } = useUserProfile();

  const getVisibleMenus = (): string[] => {
    if (currentUser?.isSuperadmin) {
      return ALL_VISIBLE_MENUS;
    }
    const existedRole = currentUser?.existedRole;
    if (!existedRole || existedRole === 'TTS') {
      return ['home'];
    }
    return currentUser?.visibleMenus ?? DEFAULT_VISIBLE_MENUS;
  };

  const visibleMenus = getVisibleMenus();

  const isActive = (menuItem: SidebarMenuItem): boolean => {
    if (!menuItem.href) return false;

    if (location.pathname === menuItem.href) return true;

    if (menuItem.subMenus && menuItem.subMenus.length > 0) {
      return menuItem.subMenus.some(subMenuItem => isActive(subMenuItem));
    }

    return false;
  };

  const handleMenuClick = (menuItem: SidebarMenuItem) => {
    if (menuItem.href) {
      navigate(menuItem.href);
    }
  };

  const getPaddingClass = (level: number): string => {
    switch (level) {
      case 0:
        return "";
      case 1:
        return "pl-5";
      case 2:
        return "pl-8";
      case 3:
        return "pl-12";
      default:
        return `pl-${4 + level * 4}`;
    }
  };

  const renderMenuItem = (
    menuItem: SidebarMenuItem,
    level = 0,
    isLast = false
  ) => {
    const active = isActive(menuItem);
    const paddingClass = getPaddingClass(level);

    return (
      <li key={menuItem.name} className="w-full">
        <div
          className={cn(
            `flex items-center gap-2 ${level !== 0 ? "py-4" : "pb-4"} group cursor-pointer text-sm sm:text-sm lg:text-base font-bold ${level !== 0 ? "border-t-[1px]" : ""} ${isLast && level !== 0 ? "" : isLast && level === 0 ? "mt-2" : ""}`,
            paddingClass,
            active && "bg-primary/10"
          )}
          onClick={() => handleMenuClick(menuItem)}
        >
          {menuItem.icon && (
            <menuItem.icon
              className={`h-5 w-5 transition-all ${active ? "text-accent-hover" : ""}`}
            />
          )}
          <span
            className={`flex-grow group-hover:text-accent-hover transition-all ${active ? "text-accent-hover" : ""}`}
          >
            {t(menuItem.name)}
          </span>
        </div>
      </li>
    );
  };

  const renderAllMenuItems = () => {
    const allItems: JSX.Element[] = [];

    const isMenuVisible = (item: SidebarMenuItem): boolean => {
      if (item.subMenus && item.subMenus.length > 0) {
        return item.subMenus.some(subMenu => {
          const subMenuKey = MENU_KEY_MAP[subMenu.name];
          return subMenuKey !== undefined && visibleMenus.includes(subMenuKey);
        });
      }
      const menuKey = MENU_KEY_MAP[item.name];
      return menuKey !== undefined && visibleMenus.includes(menuKey);
    };

    const processMenuItems = (items: SidebarMenuItem[], level: number) => {
      items.forEach((item, index) => {
        const isLast = index === items.length - 1;

        if (!isMenuVisible(item)) return;

        allItems.push(renderMenuItem(item, level, isLast));

        if (item.subMenus && item.subMenus.length > 0) {
          item.subMenus.forEach((subItem, subIndex) => {
            const subMenuKey = MENU_KEY_MAP[subItem.name];
            const subVisible = subMenuKey !== undefined && visibleMenus.includes(subMenuKey);

            if (subVisible) {
              allItems.push(renderMenuItem(subItem, level + 1, subIndex === item.subMenus!.length - 1));
            }
          });
        }
      });
    };

    processMenuItems(menuItems, 0);
    return allItems;
  };

  return <ul className="w-full flex flex-col mt-4 gap-0">{renderAllMenuItems()}</ul>;
};

export default SidebarMenu;
