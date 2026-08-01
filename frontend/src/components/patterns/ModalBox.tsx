import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { cva } from "class-variance-authority";

const modalVariants = cva(
  "bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] rounded-[30px]",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface ModalBoxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlay?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive";
  title?: string;
  subtitle?: string;
}

export default function ModalBox({
  open,
  onOpenChange,
  children,
  variant,
  className,
  title,
  subtitle
}: ModalBoxProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={modalVariants({ variant, className })}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
