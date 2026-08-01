import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { Progress } from "@/components/ui/Progress";

interface ImportProgressDialogProps {
  open: boolean;
  percent: number;
  processed: number;
  total: number;
  title: string;
  description: string;
  progressLabel: string;
}

export default function ImportProgressDialog({
  open,
  percent,
  processed,
  total,
  title,
  description,
  progressLabel
}: ImportProgressDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Progress dialog is controlled by parent; block dismiss while importing.
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onPointerDownOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{progressLabel}</span>
            <span className="font-semibold tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="tabular-nums">
              {processed}/{total}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
