import ScrollVideo from "./Agenthotspots";
import { useTranslation } from "react-i18next";

export default function AgentHotspotWrapper() {
  const { t } = useTranslation();
  return (
    <main className="app-shell">
      <p
        className="
    text-md  
    md:text-2xl
    mb-12 md:mb-20
    font-extrabold
    leading-tight
    tracking-tight
    bg-gradient-to-r
    from-sky-500
    via-blue-600
    to-violet-600
    bg-clip-text
    text-transparent
  "
      >
        {t("dashboard.consistencyData")} <span className="text-red-400">.</span>{" "}
        {t("dashboard.precisionDecision")}
      </p>
      <div className="app-player">
        <ScrollVideo />
      </div>
    </main>
  );
}
