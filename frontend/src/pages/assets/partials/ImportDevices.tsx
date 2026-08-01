import { useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/api/apiClient.service.ts";
import {
  ApiRouteNames,
  apiRoutes
} from "@/shared/constants/routes.constant.ts";
import { Button } from "@/components/ui/Button";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import ImportProgressDialog from "@/components/patterns/ImportProgressDialog";
import { importInBatches } from "@/shared/utils/importCsvInBatches.util";
import { parseDeviceCsvFile } from "@/shared/utils/parseClientCsv.util";

type ImportSkipReason =
  | "duplicate"
  | "handed_over"
  | "invalid_status"
  | "invalid_device_type";

interface ImportSkippedItem {
  serialNumber: string;
  name: string;
  reason: ImportSkipReason;
}

interface ImportResponse {
  importedCount: number;
  updatedCount: number;
  skippedCount?: number;
  skippedSerialNumbers?: string[];
  skippedItems?: ImportSkippedItem[];
}

interface Props {
  onSuccess?: () => void;
}

const EMPTY_IMPORT_RESULT: ImportResponse = {
  importedCount: 0,
  updatedCount: 0,
  skippedCount: 0,
  skippedSerialNumbers: [],
  skippedItems: []
};

function formatDeviceSkipLabel(item: ImportSkippedItem): string {
  return `${item.name || "—"} · ${item.serialNumber}`;
}

function resolveDeviceSkipMessage(
  item: ImportSkippedItem,
  t: TFunction
): string {
  if (item.reason === "handed_over") {
    return t("assets.import.skipReasonHandedOver");
  }
  if (item.reason === "invalid_status") {
    return t("assets.import.skipReasonInvalidStatus");
  }
  if (item.reason === "invalid_device_type") {
    return t("assets.import.skipReasonInvalidDeviceType");
  }
  return t("assets.import.skipReasonDuplicate");
}

function mergeDeviceImportResults(
  acc: ImportResponse,
  batchResult: ImportResponse
): ImportResponse {
  const batchSkipped =
    batchResult.skippedItems ??
    (batchResult.skippedSerialNumbers ?? []).map(serialNumber => ({
      serialNumber,
      name: "",
      reason: "duplicate" as const
    }));

  const accSkipped = acc.skippedItems ?? [];

  return {
    importedCount: acc.importedCount + (batchResult.importedCount ?? 0),
    updatedCount: acc.updatedCount + (batchResult.updatedCount ?? 0),
    skippedCount:
      (acc.skippedCount ?? 0) +
      (batchResult.skippedCount ?? batchSkipped.length),
    skippedSerialNumbers: [
      ...(acc.skippedSerialNumbers ?? []),
      ...(batchResult.skippedSerialNumbers ?? [])
    ],
    skippedItems: [...accSkipped, ...batchSkipped]
  };
}

export default function ImportDevices({ onSuccess }: Props) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressProcessed, setProgressProcessed] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
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
    setProgressPercent(0);
    setProgressProcessed(0);
    setProgressTotal(0);
    setShowProgressDialog(true);

    try {
      const rows = await parseDeviceCsvFile(file);

      if (rows.length === 0) {
        await apiClient.post<ImportResponse>(
          apiRoutes[ApiRouteNames.IMPORT_DEVICES],
          { rows: [] }
        );
      }

      setProgressTotal(rows.length);

      const response = await importInBatches({
        rows,
        getInitialResult: () => ({ ...EMPTY_IMPORT_RESULT }),
        importBatch: async batch =>
          apiClient.post<ImportResponse>(
            apiRoutes[ApiRouteNames.IMPORT_DEVICES],
            { rows: batch }
          ),
        mergeResults: (acc, batchResult) =>
          mergeDeviceImportResults(acc, batchResult),
        onProgress: ({ percent, processed, total }) => {
          setProgressPercent(percent);
          setProgressProcessed(processed);
          setProgressTotal(total);
        }
      });

      setShowProgressDialog(false);
      setImportResult(response);
      setShowResultDialog(true);

      const successCount =
        (response.importedCount ?? 0) + (response.updatedCount ?? 0);
      const failedCount =
        response.skippedCount ?? response.skippedItems?.length ?? 0;

      if (successCount > 0 || failedCount > 0) {
        const message = t("assets.import.resultSummary", {
          success: successCount,
          failed: failedCount
        });

        if (failedCount > 0 && successCount === 0) {
          toast.warning(message);
        } else {
          toast.success(message);
        }

        if (successCount > 0) {
          onSuccess?.();
        }
      }
    } catch (error: unknown) {
      console.error("Error importing file:", error);
      setShowProgressDialog(false);

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

  const skippedItems =
    importResult?.skippedItems ??
    (importResult?.skippedSerialNumbers ?? []).map(serialNumber => ({
      serialNumber,
      name: "",
      reason: "duplicate" as const
    }));

  const hasSkipped = skippedItems.length > 0;

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

      <ImportProgressDialog
        open={showProgressDialog}
        percent={progressPercent}
        processed={progressProcessed}
        total={progressTotal}
        title={t("assets.import.progressTitle")}
        description={t("assets.import.progressDescription")}
        progressLabel={t("assets.import.progressLabel", {
          processed: progressProcessed,
          total: progressTotal
        })}
      />

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[min(90vh,640px)] flex flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>{t("assets.import.importResult")}</DialogTitle>
            <DialogDescription>
              {t("assets.import.importResultDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p>
                <span className="text-gray-600">{t("common.addNew")}:</span>{" "}
                <strong>{importResult?.importedCount ?? 0}</strong>
              </p>

              <p>
                <span className="text-gray-600">{t("common.update")}:</span>{" "}
                <strong>{importResult?.updatedCount ?? 0}</strong>
              </p>

              <p>
                <span className="text-gray-600">
                  {t("common.successTotal")}:
                </span>{" "}
                <strong className="text-green-600">
                  {(importResult?.importedCount ?? 0) +
                    (importResult?.updatedCount ?? 0)}
                </strong>
              </p>

              <p>
                <span className="text-gray-600">{t("common.skipped")}:</span>{" "}
                <strong className="text-red-600">
                  {importResult?.skippedCount ?? skippedItems.length}
                </strong>
              </p>
            </div>

            {hasSkipped ? (
              <details className="mt-3 rounded-md border border-amber-200 bg-amber-50 text-amber-900 open:pb-2">
                <summary className="cursor-pointer px-3 py-2 font-semibold text-sm select-none">
                  {t("assets.import.skipDetails", {
                    count: skippedItems.length
                  })}
                </summary>
                <ul className="px-3 pb-2 space-y-3 max-h-52 overflow-y-auto overflow-x-hidden">
                  {skippedItems.map((item, index) => (
                    <li
                      key={`${item.serialNumber}-${index}`}
                      className="border-b border-amber-100 pb-2 last:border-0 last:pb-0 break-words"
                    >
                      <p className="font-medium text-amber-950 text-xs leading-snug break-all">
                        {formatDeviceSkipLabel(item)}
                      </p>
                      <p className="mt-1 text-xs text-amber-800 leading-relaxed whitespace-pre-wrap break-words">
                        {resolveDeviceSkipMessage(item, t)}
                      </p>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button onClick={() => setShowResultDialog(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
