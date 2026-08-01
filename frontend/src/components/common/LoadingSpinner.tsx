import { cn } from "@/lib/utils";
import CustomLoader from "../ui/CustomLoader";

interface LoadingOverlayProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner() {
  return <CustomLoader />;
}

export function LoadingOverlay({ label, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <CustomLoader />
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
