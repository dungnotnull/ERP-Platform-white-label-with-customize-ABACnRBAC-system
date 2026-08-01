import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import {
  exportEmployeesToCsv,
  ExportEmployeesInProgressError,
  type ExportEmployeesProgressStep
} from "@/pages/employees/partials/exportEmployeesCsv.util";

const PROGRESS_MESSAGE_KEYS: Record<ExportEmployeesProgressStep, string> = {
  preparing: "employees.export.progressPreparing",
  fetching: "employees.export.progressFetching",
  building: "employees.export.progressBuilding",
  downloading: "employees.export.progressDownloading",
  done: "employees.export.progressDone"
};

export default function ExportEmployees() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressStep, setProgressStep] =
    useState<ExportEmployeesProgressStep>("preparing");
  const exportLockRef = useRef(false);

  const handleProgress = useCallback((step: ExportEmployeesProgressStep) => {
    setProgressStep(step);
  }, []);

  const handleExport = async () => {
    if (exportLockRef.current || isExporting) {
      return;
    }

    exportLockRef.current = true;
    setIsExporting(true);
    setProgressStep("preparing");
    setShowProgressDialog(true);

    try {
      setProgressStep("fetching");
      const { blob, fileName } = await exportEmployeesToCsv(handleProgress);

      if (!blob.size) {
        toast.error(t("employees.export.errorExporting"));
        return;
      }

      const sample = await blob.slice(0, 80).text();
      if (sample.trim().startsWith("{")) {
        toast.error(t("employees.export.errorExporting"));
        return;
      }

      setProgressStep("downloading");

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);

      setProgressStep("done");
      toast.success(t("employees.export.exportSuccess"));

      window.setTimeout(() => {
        setShowProgressDialog(false);
      }, 600);
    } catch (error) {
      if (error instanceof ExportEmployeesInProgressError) {
        return;
      }

      console.error("Error exporting employees:", error);
      toast.error(t("employees.export.errorExporting"));
      setShowProgressDialog(false);
    } finally {
      exportLockRef.current = false;
      setIsExporting(false);
    }
  };

  const progressMessage = t(PROGRESS_MESSAGE_KEYS[progressStep]);

  return (
    <>
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={isExporting}
        aria-busy={isExporting}
        className="flex items-center gap-2"
      >
        {isExporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {isExporting
          ? t("employees.export.exporting")
          : t("employees.export.exportEmployees")}
      </Button>

      <Dialog
        open={showProgressDialog}
        onOpenChange={open => {
          if (!isExporting) {
            setShowProgressDialog(open);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onPointerDownOutside={event => event.preventDefault()}
          onEscapeKeyDown={event => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("employees.export.progressTitle")}</DialogTitle>
            <DialogDescription>
              {t("employees.export.progressDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-center text-gray-700">
              {progressMessage}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
