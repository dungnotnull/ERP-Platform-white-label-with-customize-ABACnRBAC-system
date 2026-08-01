import { useMemo, useState } from "react";
import { menuItems } from "../config";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarMenuItem } from "@/shared/@types/layout.type";
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

const MenuMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const parentItems = useMemo(
    () =>
      menuItems.filter(item => isMenuVisible(item)),
    [visibleMenus]
  );

  const initialExpandedParent =
    parentItems.find(item =>
      item.subMenus?.some(subMenu => location.pathname === subMenu.href)
    )?.name ?? null;

  const [expandedParent, setExpandedParent] = useState<string | null>(
    initialExpandedParent
  );
  const [isClosing, setIsClosing] = useState(false);

  const handleMenuClick = (link: string) => {
    setIsClosing(true);
    setTimeout(() => {
      setExpandedParent(null);
      setIsClosing(false);
      navigate(link);
    }, 300);
  };

  const isLinkActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const toggleParent = (item: SidebarMenuItem) => {
    if (!item.subMenus?.length) {
      item.href && handleMenuClick(item.href);
      return;
    }

    if (expandedParent === item.name) {
      setIsClosing(true);
      setTimeout(() => {
        setExpandedParent(null);
        setIsClosing(false);
      }, 300);
    } else {
      setExpandedParent(item.name);
    }
  };

  const renderParentButton = (item: SidebarMenuItem) => {
    const isActive = item.href ? isLinkActive(item.href) : false;
    const hasActiveSubMenu = item.subMenus?.some(subMenu => isLinkActive(subMenu.href)) ?? false;
    const isParentActive = isActive || hasActiveSubMenu;

    const getIcon = () => {
      if (item.icon) return <item.icon color={isParentActive ? "#ffffff" : "#333333"} />;
      return null;
    };

    return (
      <button
        key={item.name}
        type="button"
        className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center"
        onClick={() => toggleParent(item)}
      >
        <div
          className={cn(
            "rounded-full p-2 transition-colors duration-300",
            isParentActive ? "bg-blue-700" : "bg-gray-100"
          )}
        >
          {getIcon()}
        </div>
        <span
          className={cn(
            "text-[11px] font-medium",
            isParentActive ? "text-blue-700" : "text-primary-black"
          )}
        >
          {item.label}
        </span>
      </button>
    );
  };

  const renderSubMenu = (item: SidebarMenuItem) => {
    if (!item.subMenus?.length) return null;

    const isExpanded = expandedParent === item.name && !isClosing;

    const visibleSubMenus = item.subMenus.filter(subMenu => {
      const subMenuKey = MENU_KEY_MAP[subMenu.name];
      return subMenuKey !== undefined && visibleMenus.includes(subMenuKey);
    });

    if (visibleSubMenus.length === 0) return null;

    return (
      <div
        className={cn(
          "overflow-hidden border-t border-gray-100 transition-all duration-300 ease-in-out",
          isExpanded
            ? "max-h-48 opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-1 px-3 py-2">
          {visibleSubMenus.map(subMenu => {
            const subActive = isLinkActive(subMenu.href);
            return (
              <button
                key={subMenu.name}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  subActive ? "bg-blue-50 text-blue-700" : "text-gray-600"
                )}
                onClick={() => subMenu.href && handleMenuClick(subMenu.href)}
              >
                {subMenu.icon ? <subMenu.icon className="h-4 w-4" /> : null}
                <span>{subMenu.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 z-[50] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col">
        <div className={`grid gap-1 px-2 py-2`} style={{ gridTemplateColumns: `repeat(${parentItems.length}, minmax(0, 1fr))` }}>
          {parentItems.map(item => renderParentButton(item))}
        </div>

        {parentItems.map(item => (
          <div key={item.name}>{renderSubMenu(item)}</div>
        ))}
      </div>
    </aside>
  );
};

export default MenuMobile;
