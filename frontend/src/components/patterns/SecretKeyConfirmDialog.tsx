import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";

interface SecretKeyConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (secretKey: string) => Promise<void> | void;
  loading?: boolean;
}

export function SecretKeyConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading
}: SecretKeyConfirmDialogProps) {
  const { t } = useTranslation();
  const [secretKey, setSecretKey] = useState("");

  const handleConfirm = async () => {
    if (!secretKey.trim()) return;
    await onConfirm(secretKey.trim());
    setSecretKey("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSecretKey("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description || title}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("permissions.secretKey") || "Secret Key"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              placeholder={
                t("permissions.enterSecretKey") || "Enter secret key..."
              }
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !secretKey.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading
              ? t("common.saving") || "Loading..."
              : t("common.confirm") || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
