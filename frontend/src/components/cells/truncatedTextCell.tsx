import { cn } from "@/lib/utils";

export function renderTruncatedTextCell(value: unknown, className?: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    return <span className={cn("text-sm", className)}>—</span>;
  }

  return (
    <span
      className={cn(
        "block min-w-0 w-full max-w-full truncate text-sm",
        className
      )}
      title={text}
    >
      {text}
    </span>
  );
}
