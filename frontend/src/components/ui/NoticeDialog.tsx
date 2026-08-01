import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type NoticeDialogVariant = "success" | "danger";

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: NoticeDialogVariant;
  title: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export default function NoticeDialog({
  open,
  onOpenChange,
  variant,
  title,
  message,
  subMessage,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  onConfirm,
  onCancel,
  loading = false
}: NoticeDialogProps) {
  const isDanger = variant === "danger";

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[60]" />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[60] w-full max-w-[min(300px,calc(100%-2rem))] translate-x-[-50%] translate-y-[-50%] gap-0 overflow-visible rounded-xl border-0 bg-white p-0 shadow-lg duration-200 sm:max-w-[300px]"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {message}
          </DialogPrimitive.Description>
          <div
            className={cn("h-0.5", isDanger ? "bg-red-500" : "bg-emerald-500")}
          />

          <div className="px-5 py-5 text-center">
            {!isDanger ? (
              <div className="mb-4 flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check size={20} strokeWidth={3} />
                </div>
              </div>
            ) : null}

            <h3 className="text-base font-bold text-gray-900">{title}</h3>

            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {message}
            </p>
            {subMessage ? (
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {subMessage}
              </p>
            ) : null}

            <div
              className={cn(
                "mt-5",
                showCancel ? "grid grid-cols-2 gap-2.5" : ""
              )}
            >
              {showCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="h-10 rounded-full border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  onClick={handleCancel}
                >
                  {cancelText}
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={loading}
                className={cn(
                  "h-10 rounded-full px-4 text-sm font-semibold text-white",
                  showCancel ? "" : "w-full",
                  isDanger
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                )}
                onClick={handleConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
