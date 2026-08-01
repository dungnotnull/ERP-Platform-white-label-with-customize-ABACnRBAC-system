import { cn } from "@/lib/utils";
import {
  AppRouteNames,
  appRoutes
} from "@/shared/constants/routes.constant.ts";
import { useNavigate } from "react-router-dom";
import LogoLight from "@/assets/images/logo-light-temp.png";
import SidebarMenu from "./index";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  className?: string;
}

const SCROLLBAR_CSS = `
  .sidebar-scroll::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.12);
    border-radius: 2px;
  }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.25);
  }
  .sidebar-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.12) transparent;
  }
`;

const MenuDesktop = ({ className }: SidebarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleMenuClick = (link: string) => {
    navigate(link);
  };
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_CSS }} />
      <aside className={cn("w-64 flex flex-col h-full", className)}>
        <div className="px-9 pb-[73px]">
          <a
            onClick={() => handleMenuClick(appRoutes[AppRouteNames.HOME])}
            className="w-full cursor-pointer hidden md:block"
          >
            <img
              src={LogoLight}
              alt="DYM VietNam Logo"
              className="h-auto w-full"
            />
          </a>
        </div>
        <nav className="flex-1 sidebar-scroll overflow-y-auto px-9 -mx-px">
          <SidebarMenu />
        </nav>
        <div className="text-xs font-semibold text-gray-400 text-center px-9 mt-4 pb-4">
          {t("footer.copyright", { year: new Date().getFullYear() })} <br />{" "}
          {t("footer.createdBy")}
        </div>
      </aside>
    </>
  );
};

export default MenuDesktop;
