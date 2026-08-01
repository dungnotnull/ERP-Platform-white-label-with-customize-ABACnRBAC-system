import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ShieldX } from "lucide-react";
import {
  fePermissionGuard,
  PermissionDeniedReason
} from "@/shared/services/fe-permission-guard";

const COOLDOWN_MS = 2000;

export default function PermissionDeniedDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const lastDeniedAt = useRef(0);

  useEffect(() => {
    const unsubscribe = fePermissionGuard.onPermissionDenied(event => {
      if (event.reason === PermissionDeniedReason.NO_PERMISSION) {
        const now = Date.now();
        if (now - lastDeniedAt.current < COOLDOWN_MS) return;
        lastDeniedAt.current = now;
        setOpen(true);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-red-500" />
            {t("common.permissionDenied") ?? "Permission Denied"}
          </DialogTitle>
          <DialogDescription className="hidden">
            {t("common.permissionDeniedMessage") ??
              "You do not have permission to access or perform this action."}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-600 py-4">
          {t("common.permissionDeniedMessage") ??
            "You do not have permission to access or perform this action. Please contact the administrator for assistance if needed."}
        </p>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>
            {t("common.close") ?? "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
