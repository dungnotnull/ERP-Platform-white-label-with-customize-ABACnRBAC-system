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
import { parseEmployeeCsvFile } from "@/shared/utils/parseClientCsv.util";

interface ImportErrorRow {
  rowNumber?: number;
  row: Record<string, unknown>;
  error: string;
  errorCode?: string;
  params?: Record<string, string>;
}

interface ImportResponse {
  imported: number;
  created?: number;
  updated?: number;
  failed: number;
  errors?: ImportErrorRow[];
}

interface ImportEmployeesProps {
  onImportSuccess: () => void;
}

const EMPTY_IMPORT_RESULT: ImportResponse = {
  imported: 0,
  created: 0,
  updated: 0,
  failed: 0,
  errors: []
};

function formatImportRowLabel(err: ImportErrorRow, t: TFunction): string {
  const name = String(err.row.name ?? "—");
  const email = String(err.row.email ?? "—");
  const code = String(err.row.employeeCode ?? "—");
  const rowInfo = `${name} · ${email} · ${code}`;

  if (err.rowNumber != null) {
    return t("employees.import.rowLabel", {
      rowNumber: err.rowNumber,
      row: rowInfo
    });
  }

  return rowInfo;
}

function resolveImportErrorDisplay(err: ImportErrorRow, t: TFunction): string {
  if (err.error?.trim()) {
    return err.error;
  }

  return t("employees.errors.importRowFailed");
}

function mergeEmployeeImportResults(
  acc: ImportResponse,
  batchResult: ImportResponse,
  batchStartIndex: number
): ImportResponse {
  const offsetErrors = (batchResult.errors ?? []).map(err => ({
    ...err,
    rowNumber:
      err.rowNumber != null ? err.rowNumber + batchStartIndex : err.rowNumber
  }));

  return {
    imported: acc.imported + batchResult.imported,
    created: (acc.created ?? 0) + (batchResult.created ?? 0),
    updated: (acc.updated ?? 0) + (batchResult.updated ?? 0),
    failed: acc.failed + batchResult.failed,
    errors: [...(acc.errors ?? []), ...offsetErrors]
  };
}

export default function ImportEmployees({
  onImportSuccess
}: ImportEmployeesProps) {
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
      toast.error(t("employees.import.invalidFileType"));
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);
    setProgressProcessed(0);
    setProgressTotal(0);
    setShowProgressDialog(true);

    try {
      const rows = await parseEmployeeCsvFile(file);

      if (rows.length === 0) {
        await apiClient.post<ImportResponse>(
          apiRoutes[ApiRouteNames.IMPORT_EMPLOYEES],
          { data: [] }
        );
      }

      setProgressTotal(rows.length);

      const response = await importInBatches({
        rows,
        getInitialResult: () => ({ ...EMPTY_IMPORT_RESULT, errors: [] }),
        importBatch: async batch =>
          apiClient.post<ImportResponse>(
            apiRoutes[ApiRouteNames.IMPORT_EMPLOYEES],
            { data: batch }
          ),
        mergeResults: mergeEmployeeImportResults,
        onProgress: ({ percent, processed, total }) => {
          setProgressPercent(percent);
          setProgressProcessed(processed);
          setProgressTotal(total);
        }
      });

      setShowProgressDialog(false);
      setImportResult(response);
      setShowResultDialog(true);

      if (response.imported > 0 || response.failed > 0) {
        const message = t("employees.import.resultSummary", {
          success: response.imported,
          failed: response.failed
        });

        if (response.failed > 0 && response.imported === 0) {
          toast.warning(message);
        } else {
          toast.success(message);
        }

        if (response.imported > 0) {
          onImportSuccess();
        }
      }
    } catch (error: unknown) {
      console.error("Error importing employees:", error);
      setShowProgressDialog(false);

      toast.error(
        resolveApiErrorMessage(error, t, "employees.import.errorImporting")
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasErrors = (importResult?.errors?.length ?? 0) > 0;

  return (
    <>
      <div className="flex items-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
          id="import-employees-file"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload size={16} />
          {isUploading
            ? t("employees.import.uploading")
            : t("employees.import.importEmployees")}
        </Button>
      </div>

      <ImportProgressDialog
        open={showProgressDialog}
        percent={progressPercent}
        processed={progressProcessed}
        total={progressTotal}
        title={t("employees.import.progressTitle")}
        description={t("employees.import.progressDescription")}
        progressLabel={t("employees.import.progressLabel", {
          processed: progressProcessed,
          total: progressTotal
        })}
      />

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[min(90vh,640px)] flex flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>{t("employees.import.importResult")}</DialogTitle>
            <DialogDescription>
              {t("employees.import.importResultDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p>
                <span className="text-gray-600">
                  {t("employees.import.successCount")}:
                </span>{" "}
                <strong>{importResult?.imported ?? 0}</strong>
              </p>
              <p>
                <span className="text-gray-600">
                  {t("employees.import.createdCount")}:
                </span>{" "}
                <strong>{importResult?.created ?? 0}</strong>
              </p>
              <p>
                <span className="text-gray-600">
                  {t("employees.import.updatedCount")}:
                </span>{" "}
                <strong>{importResult?.updated ?? 0}</strong>
              </p>
              <p>
                <span className="text-gray-600">
                  {t("employees.import.failedCount")}:
                </span>{" "}
                <strong className="text-red-600">
                  {importResult?.failed ?? 0}
                </strong>
              </p>
            </div>

            {hasErrors ? (
              <details className="mt-3 rounded-md border border-red-200 bg-red-50 text-red-800 open:pb-2">
                <summary className="cursor-pointer px-3 py-2 font-semibold text-sm select-none">
                  {t("employees.import.errorDetails", {
                    count: importResult?.errors?.length ?? 0
                  })}
                </summary>
                <ul className="px-3 pb-2 space-y-3 max-h-52 overflow-y-auto overflow-x-hidden">
                  {importResult?.errors?.map((err, index) => (
                    <li
                      key={index}
                      className="border-b border-red-100 pb-2 last:border-0 last:pb-0 break-words"
                    >
                      <p className="font-medium text-red-900 text-xs leading-snug">
                        {formatImportRowLabel(err, t)}
                      </p>
                      <p className="mt-1 text-xs text-red-700 leading-relaxed whitespace-pre-wrap break-words">
                        {resolveImportErrorDisplay(err, t)}
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
