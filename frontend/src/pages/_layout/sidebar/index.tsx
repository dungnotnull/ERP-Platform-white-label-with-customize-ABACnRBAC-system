import MenuDesktop from "./menu/MenuDesktop";
import MenuMobile from "./menu/MenuMobile";
import useResponsive from "@/hooks/useResponsive";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { isMobile } = useResponsive();

  return isMobile ? <MenuMobile /> : <MenuDesktop className={className} />;
};

export default Sidebar;
