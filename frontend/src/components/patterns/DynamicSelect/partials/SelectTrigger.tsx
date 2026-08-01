import React from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BaseOption, Size, Variant } from "../types";
import { sizeVariants, cnFallback } from "../utils";
import { cn } from "@/lib/utils";

const clsx = typeof cn !== "undefined" ? cn : cnFallback;

interface SelectTriggerProps {
  isOpen: boolean;
  disabled: boolean;
  loading: boolean;
  error: boolean;
  size: Size;
  variant: Variant;
  multiple: boolean;
  clearable: boolean;
  value: string | number | (string | number)[] | null;
  selectedOptions: BaseOption | BaseOption[] | undefined;
  placeholder: string;
  onToggle: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: (e: React.MouseEvent) => void;
  onRemove: (optionValue: string | number, e: React.MouseEvent) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  isOpen,
  disabled,
  loading,
  error,
  size,
  variant,
  multiple,
  clearable,
  value,
  selectedOptions,
  placeholder,
  onToggle,
  onKeyDown,
  onClear,
  onRemove,
  triggerRef
}) => {
  const hasValue = (): boolean => {
    if (multiple) {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== null && value !== undefined && value !== "";
  };

  const renderDisplayValue = (): string => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      if (value.length === 1) {
        const option = Array.isArray(selectedOptions)
          ? selectedOptions[0]
          : null;
        return option?.label || String(value[0]);
      }
      return `${value.length} selected`;
    }

    if (!multiple && selectedOptions && !Array.isArray(selectedOptions)) {
      return selectedOptions.label;
    }

    return placeholder;
  };

  return (
    <Button
      ref={triggerRef}
      type="button"
      variant={variant === "default" ? "outline" : variant}
      size="sm"
      onClick={onToggle}
      onKeyDown={onKeyDown}
      disabled={disabled || loading}
      className={clsx(
        "w-full justify-between font-normal hover:bg-accent",
        sizeVariants[size],
        error && "border-destructive focus:border-destructive",
        !hasValue() && "text-muted-foreground"
      )}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-disabled={disabled || loading}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0 overflow-hidden">
        {multiple &&
          Array.isArray(value) &&
          value.length > 0 &&
          value.length <= 2 &&
          Array.isArray(selectedOptions) && (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.slice(0, 2).map(option => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="text-xs px-1 py-0"
                >
                  {option.label}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 w-3 h-3 hover:bg-transparent"
                    onClick={e => onRemove(option.value, e)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
              {value.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{value.length - 2}
                </Badge>
              )}
            </div>
          )}

        {(!multiple ||
          !value ||
          (Array.isArray(value) && value.length === 0)) && (
          <span className="truncate">{renderDisplayValue()}</span>
        )}
      </div>

      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {clearable && hasValue() && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0.5 hover:bg-transparent"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <ChevronDown
          className={clsx(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </div>
    </Button>
  );
};
