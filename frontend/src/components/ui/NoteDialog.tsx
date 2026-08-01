import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface NoteDialogProps {
  title: string;
  content: string;
  triggerLabel?: string;
  className?: string;
}

export default function NoteDialog({
  title,
  content,
  triggerLabel,
  className
}: NoteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger
        className={`inline-flex items-center gap-2 text-sm hover:text-red-700 underline-offset-4 hover:underline transition-colors mb-4 ${className || ""}`}
      >
        <Info size={16} />
        {t(triggerLabel || "common.notes")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(title)}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div
            className="text-sm leading-relaxed space-y-3"
            dangerouslySetInnerHTML={{ __html: t(content) }}
          />
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              className="rounded-lg hover:bg-green-700"
              size="sm"
            >
              {t("common.understood") ?? "Understood"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
