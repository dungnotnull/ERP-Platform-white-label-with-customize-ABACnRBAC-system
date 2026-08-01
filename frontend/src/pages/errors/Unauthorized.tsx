import { Button } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";
import {
  AppRouteNames,
  appRoutes
} from "@/shared/constants/routes.constant.ts";
import { useTranslation } from "react-i18next";

export default function Unauthorized() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center p-4 min-h-[100vh]">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-[#d83f35]/10 p-4 rounded-full">
            <ShieldAlert className="h-16 w-16 text-[#d83f35]" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-[#1f2c5c] mt-4">
          {t("errors.unauthorized.title")}
        </h2>
        <p className="text-gray-500 mt-4 mb-8">
          {t("errors.unauthorized.description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* <Button asChild className="bg-[#1f2c5c] hover:bg-[#3f4c7c]">
            <a href={appRoutes[AppRouteNames.SIGN_IN]}>{t("errors.unauthorized.login")}</a>
          </Button> */}
          <Button
            asChild
            variant="outline"
            className="border-[#1f2c5c] text-[#1f2c5c]"
          >
            <a href={appRoutes[AppRouteNames.HOME]}>
              {t("errors.unauthorized.backToDashboard")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
