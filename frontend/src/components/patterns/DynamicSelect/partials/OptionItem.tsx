import React, { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BaseOption, CustomOptionRenderer } from "../types";
import { cnFallback } from "../utils";
import { cn } from "@/lib/utils";

const clsx = typeof cn !== "undefined" ? cn : cnFallback;

interface OptionItemProps {
  option: BaseOption;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (option: BaseOption) => void;
  customRenderer?: CustomOptionRenderer | null;
}

export const OptionItem: React.FC<OptionItemProps> = ({
  option,
  isSelected,
  isFocused,
  onSelect,
  customRenderer
}) => {
  const isDisabled = option.disabled || false;

  const renderOptionContent = (): ReactNode => {
    if (customRenderer) {
      return customRenderer(option, {
        isSelected,
        isFocused,
        isDisabled
      });
    }

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {option.icon && (
            <span className="flex-shrink-0 w-4 h-4">{option.icon}</span>
          )}
          {option.color && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 border border-border"
              style={{ backgroundColor: option.color }}
            />
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span
              className={clsx(
                "truncate",
                isDisabled && "text-muted-foreground"
              )}
            >
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs text-muted-foreground truncate">
                {option.description}
              </span>
            )}
          </div>
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
      </div>
    );
  };

  return (
    <Button
      key={option.value}
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onSelect(option)}
      disabled={isDisabled}
      className={clsx(
        "w-full justify-start font-normal h-auto p-2 mb-0.5",
        isFocused && "bg-accent",
        isSelected && "bg-accent font-medium",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled}
    >
      {renderOptionContent()}
    </Button>
  );
};
