import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/Popover";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/shared/hooks/useUserProfile.ts";
import LanguageSelector from "@/components/patterns/LanguageSelector.tsx";
import { cn } from "@/lib/utils";
import LogoLightTemp from "@/assets/images/logo-light-temp.png";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const { logout } = useAuth();
  const { user } = useUserProfile();
  const { t } = useTranslation();

  return (
    <header className={cn("header h-16 min-h-[64px] max-h-[64px]", className)}>
      <div className="flex flex-1 items-center justify-between md:justify-end p-4 md:p-2 md:pr-[60px] md:gap-4">
        <Link to="/" className="block md:hidden">
          <img
            src={LogoLightTemp}
            alt="DYM VietNam Logo"
            className="h-[32px] w-auto"
          />
        </Link>
        <LanguageSelector labelShowType="nativeName" />
        <Popover>
          <PopoverTrigger asChild>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage src={user?.profilePicture || undefined} />
              <AvatarFallback className="text-lg font-bold text-white bg-slate-400">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-fit rounded-2xl bg-[#E2E8F0]"
            sideOffset={8}
          >
            <div className="flex items-center p-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 hidden md:block">
                  <AvatarImage src={user?.profilePicture || undefined} />
                  <AvatarFallback className="text-lg font-bold text-white bg-slate-400">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-xl text-primary">
                    DYM VIETNAM
                  </span>
                  <span className="text-sm text-popover">
                    {t("auth.personal")}
                  </span>
                  <span className="text-sm text-popover">{user?.email}</span>
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span
                    className="text-sm text-popover cursor-pointer underline hover:text-primary transition-all mt-2"
                    onClick={logout}
                  >
                    {t("auth.logout")}
                  </span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};

export default Header;
