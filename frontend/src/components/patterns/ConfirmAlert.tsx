import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from "@/components/ui/AlertDialog.tsx";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useTranslation } from "react-i18next";

interface ConfirmAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  confirmClassName?: string;
  cancelClassName?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const ConfirmAlert: React.FC<ConfirmAlertProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmVariant: _ = "default",
  confirmClassName = "",
  cancelClassName = "",
  icon,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const resolvedConfirmText = confirmText ?? t("common.confirm");
  const resolvedCancelText = cancelText ?? t("common.cancel");

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-4 items-center min-w-0">
          {icon && (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <AlertDialogTitle className="break-words text-left">
              {title}
            </AlertDialogTitle>
            {description ? (
              <AlertDialogDescription className="break-words text-left">
                {description}
              </AlertDialogDescription>
            ) : null}
          </div>
        </div>
        <AlertDialogFooter className="mt-6 flex-row justify-center gap-3 sm:justify-center pb-0">
          <AlertDialogCancel
            onClick={handleCancel}
            className={cancelClassName}
            disabled={isLoading}
          >
            {resolvedCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`${confirmClassName} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                {resolvedConfirmText}
              </div>
            ) : (
              resolvedConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
