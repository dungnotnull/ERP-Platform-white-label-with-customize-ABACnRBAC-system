import React from "react";
import { cnFallback } from "../utils";
import { cn } from "@/lib/utils";

const clsx = typeof cn !== "undefined" ? cn : cnFallback;

interface HelperTextProps {
  helperText?: string;
  error?: boolean;
}

export const HelperText: React.FC<HelperTextProps> = ({
  helperText,
  error
}) => {
  if (!helperText) return null;

  return (
    <p
      className={clsx(
        "text-xs",
        error ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {helperText}
    </p>
  );
};
