import { useTranslation } from "react-i18next";
import { LoadingOverlay } from "@/components/common/LoadingSpinner";

export default function Loading() {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <LoadingOverlay label={t("common.loadingData")} />
    </div>
  );
}
