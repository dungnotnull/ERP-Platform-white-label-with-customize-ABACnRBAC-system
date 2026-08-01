import PageTopBar from "@/components/PageTopBar";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";

const MeetingMap = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col bg-background">
      <PageTopBar
        title={t("meetingPages.map.title")}
        Icon={Map}
        description={t("meetingPages.map.description")}
      />
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <div className="w-full max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
          {t("meetingPages.map.title")}
        </div>
      </div>
    </div>
  );
};

export default MeetingMap;
