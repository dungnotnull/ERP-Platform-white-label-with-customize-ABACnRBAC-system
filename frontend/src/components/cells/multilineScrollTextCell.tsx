import { cn } from "@/lib/utils";

const LINE_HEIGHT_REM = 1.25;

interface MultilineScrollTextProps {
  value: unknown;
  className?: string;
  maxLines?: number;
  emptyPlaceholder?: string;
}

export function MultilineScrollText({
  value,
  className,
  maxLines = 2,
  emptyPlaceholder = "—"
}: MultilineScrollTextProps) {
  const text = String(value ?? "").trim();

  if (!text) {
    return <span className={cn("text-sm", className)}>{emptyPlaceholder}</span>;
  }

  return (
    <div
      className={cn(
        "block min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden thin-scrollbar text-sm leading-5 break-words whitespace-normal",
        className
      )}
      style={{ maxHeight: `${maxLines * LINE_HEIGHT_REM}rem` }}
      title={text}
    >
      {text}
    </div>
  );
}

export function renderMultilineScrollTextCell(
  value: unknown,
  className?: string
) {
  return <MultilineScrollText value={value} className={className} />;
}
