import { LucideIcon } from "lucide-react";
import { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

export interface SidebarMenuItem {
  name: string;
  href?: string;
  icon?: LucideIcon;
  label: string;
  subMenus?: SidebarMenuItem[];
}

export type UserInfo = {
  name: string;
  mail: string;
};
