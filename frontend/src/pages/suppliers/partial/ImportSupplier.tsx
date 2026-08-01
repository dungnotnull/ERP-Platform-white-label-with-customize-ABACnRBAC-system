import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/api/apiClient.service.ts";
import {
  ApiRouteNames,
  apiRoutes
} from "@/shared/constants/routes.constant.ts";
import { Button } from "@/components/ui/Button";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";

interface ImportResponse {
  imported: number;
  failed: number;
  created: string[];
}

export default function ImportSupplier() {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error(t("assets.import.invalidFileType"));
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<ImportResponse>(
        apiRoutes[ApiRouteNames.IMPORT_SUPPLIER],
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setImportResult(response);

      if (response.imported > 0) {
        toast.success(
          t("assets.import.importSuccess", {
            imported: response.imported
          })
        );
      }

      if (response.failed > 0) {
        toast.warning(
          t("assets.import.importWarning", {
            failed: response.failed
          })
        );
      }

      if (response.created && response.created.length > 0) {
        setShowResultDialog(true);
      }
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error(
        resolveApiErrorMessage(error, t, "assets.import.errorImporting")
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="flex items-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
          id="import-file"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload size={16} />
          {isUploading
            ? t("assets.import.uploading")
            : t("assets.import.importDevices")}
        </Button>
      </div>

      {/* Dialog to show created types and statuses */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("assets.import.importResult")}</DialogTitle>
            <DialogDescription>
              {t("supplier.importResultDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {(importResult?.created ?? []).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  {t("supplier.addSupplier")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {importResult?.created.map((name, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
