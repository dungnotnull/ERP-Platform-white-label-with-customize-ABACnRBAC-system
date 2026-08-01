import { useNavigate } from "react-router-dom";
import {
  AppRouteNames,
  appRoutes
} from "@/shared/constants/routes.constant.ts";

export function useTypedNavigate() {
  const navigate = useNavigate();

  return {
    goToHome: () => navigate(appRoutes[AppRouteNames.HOME]),
    goToDashboard: () => navigate(appRoutes[AppRouteNames.HOME]),
    goBack: () => navigate(-1)
  };
}
