import type React from "react";
import { useState, useEffect } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface DropdownOption {
  value: string;
  label: string; // This can now be a translation key
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  group?: string;
  isGlobal?: boolean;
}

export interface CustomSelectProps {
  options: DropdownOption[];
  triggerIcon?: React.ReactNode;
  value?: string | string[];
  defaultValue?: string | string[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showCheck?: boolean;
  searchable?: boolean;
  multiSelect?: boolean;
  onValueChange?: (value: string | string[]) => void;
  onOpenChange?: (open: boolean) => void;
  customColors?: {
    border?: string;
    background?: string;
    hover?: string;
    text?: string;
    popoverBg?: string;
    popoverText?: string;
  };
  translateLabels?: boolean;
}

export default function CustomSelect({
  options,
  value,
  defaultValue,
  placeholder = "",
  label,
  triggerIcon,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  variant = "outline",
  size = "md",
  showCheck = false,
  searchable = false,
  multiSelect = false,
  onValueChange,
  onOpenChange,
  customColors = {
    border: "#074310",
    background: "#ffffff",
    hover: "#f0fdf4",
    text: "#074310",
    popoverBg: "#ffffff",
    popoverText: "#0F172A"
  },
  translateLabels = true
}: CustomSelectProps) {
  const [selectedValue, setSelectedValue] = useState<string | string[]>(
    multiSelect
      ? Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : []
      : value || defaultValue || ""
  );
  const [searchTerm, _setSearchTerm] = useState("");
  const { t } = useTranslation();

  const resolvedPlaceholder = placeholder || t("common.selectOption");
  const noOptionsText = t("common.noOptionsFound");
  const searchPlaceholder = t("common.searchOptions");

  useEffect(() => {
    if (multiSelect && Array.isArray(value)) {
      setSelectedValue(prev => {
        if (
          Array.isArray(prev) &&
          prev.length === value.length &&
          prev.every((item, index) => item === value[index])
        ) {
          return prev;
        }
        return value;
      });
    } else if (!multiSelect && (value || defaultValue)) {
      const next = (value || defaultValue) as string;
      setSelectedValue(prev => (prev === next ? prev : next));
    }
  }, [multiSelect, value, defaultValue]);

  const translateLabel = (label: string) => {
    return translateLabels ? t(label) : label;
  };

  const filteredOptions = options.filter(option => {
    const translatedLabel = translateLabel(option.label).toLowerCase();
    const translatedDescription = option.description
      ? translateLabel(option.description).toLowerCase()
      : "";

    return (
      translatedLabel.includes(searchTerm.toLowerCase()) ||
      translatedDescription.includes(searchTerm.toLowerCase())
    );
  });

  const handleValueChange = (optionValue: string) => {
    let newValue: string | string[];

    if (multiSelect) {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      if (currentValues.includes(optionValue)) {
        newValue = currentValues.filter(v => v !== optionValue);
      } else {
        newValue = [...currentValues, optionValue];
      }
    } else {
      newValue = optionValue;
    }

    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  const getSelectedOption = () => {
    if (multiSelect) {
      const selectedOptions = options.filter(
        opt => Array.isArray(selectedValue) && selectedValue.includes(opt.value)
      );
      return selectedOptions.length > 0
        ? `${selectedOptions.length} selected`
        : resolvedPlaceholder;
    }

    const selected = options.find(opt => opt.value === selectedValue);
    return selected ? translateLabel(selected.label) : resolvedPlaceholder;
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-auto p-4",
    lg: "h-12 px-6 text-lg"
  };

  const isSelected = (optionValue: string) => {
    if (multiSelect) {
      return (
        Array.isArray(selectedValue) && selectedValue.includes(optionValue)
      );
    }
    return selectedValue === optionValue;
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && searchTerm) {
      _setSearchTerm("");
    }
    onOpenChange?.(isOpen);
  };

  return (
    <div className={cn("w-full", className)}>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            disabled={disabled}
            className={cn(
              "w-full justify-between border-2 rounded-xl font-medium",
              sizeClasses[size],
              triggerClassName
            )}
            style={{
              borderColor: customColors?.border,
              backgroundColor: customColors?.background,
              color: customColors?.text
            }}
          >
            <div className="flex-1">
              {label && (
                <div
                  className="text-sm font-medium mb-1"
                  style={{ color: customColors?.text }}
                >
                  {translateLabel(label)}
                </div>
              )}
              <div style={{ color: customColors?.text }}>
                {getSelectedOption()}
              </div>
            </div>
            {triggerIcon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            "w-full min-w-[var(--radix-dropdown-menu-trigger-width)] border-2 rounded-xl p-0 max-h-[300px] overflow-x-hidden shadow-[var(--shadow-neo-md)]",
            contentClassName
          )}
          style={{
            borderColor: customColors?.border,
            backgroundColor: customColors?.popoverBg
          }}
          align="start"
        >
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-3 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={e => _setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 text-sm"
                />
              </div>
            </div>
          )}
          {filteredOptions.length > 0
            ? (() => {
                const groupedOptions = filteredOptions.reduce(
                  (acc, option) => {
                    const group = option.group || "__ungrouped__";
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(option);
                    return acc;
                  },
                  {} as Record<string, typeof filteredOptions>
                );

                const groups = Object.entries(groupedOptions);
                const hasGroups =
                  groups.length > 1 || groups[0]?.[0] !== "__ungrouped__";

                return (
                  <>
                    {hasGroups
                      ? groups.flatMap(([groupName, opts]) => [
                          <div
                            key={`group-${groupName}`}
                            className={cn(
                              "px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-900 text-white -mx-2",
                              opts[0]?.isGlobal &&
                                "bg-purple-900 text-white -mx-2 px-2"
                            )}
                          >
                            {groupName === "__ungrouped__"
                              ? ""
                              : translateLabel(groupName)}
                          </div>,
                          ...opts.map(option => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() =>
                                !option.disabled &&
                                handleValueChange(option.value)
                              }
                              disabled={option.disabled}
                              className={cn(
                                "rounded-[20px] p-1.5 cursor-pointer focus:outline-none flex items-center justify-between",
                                option.disabled &&
                                  "opacity-50 cursor-not-allowed",
                                option.isGlobal && "bg-emerald-50/50"
                              )}
                              style={{
                                color: customColors?.popoverText,
                                backgroundColor: isSelected(option.value)
                                  ? customColors?.hover
                                  : "transparent"
                              }}
                              onMouseEnter={e => {
                                if (
                                  !option.disabled &&
                                  !isSelected(option.value)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    customColors?.hover || "#f0fdf4";
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isSelected(option.value)) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {option.icon && (
                                  <span className="flex-shrink-0">
                                    {option.icon}
                                  </span>
                                )}
                                <div>
                                  <div className="font-medium">
                                    {translateLabel(option.label)}
                                  </div>
                                  {option.description && (
                                    <div className="text-sm opacity-70">
                                      {translateLabel(option.description)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {showCheck && isSelected(option.value) && (
                                <Check
                                  className="h-4 w-4"
                                  style={{ color: customColors?.text }}
                                />
                              )}
                            </DropdownMenuItem>
                          ))
                        ])
                      : filteredOptions.map(option => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() =>
                              !option.disabled &&
                              handleValueChange(option.value)
                            }
                            disabled={option.disabled}
                            className={cn(
                              "rounded-[20px] p-1.5 cursor-pointer focus:outline-none flex items-center justify-between",
                              option.disabled &&
                                "opacity-50 cursor-not-allowed",
                              option.isGlobal && "bg-emerald-50/50"
                            )}
                            style={{
                              color: customColors?.popoverText,
                              backgroundColor: isSelected(option.value)
                                ? customColors?.hover
                                : "transparent"
                            }}
                            onMouseEnter={e => {
                              if (
                                !option.disabled &&
                                !isSelected(option.value)
                              ) {
                                e.currentTarget.style.backgroundColor =
                                  customColors?.hover || "#f0fdf4";
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected(option.value)) {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {option.icon && (
                                <span className="flex-shrink-0">
                                  {option.icon}
                                </span>
                              )}
                              <div>
                                <div className="font-medium">
                                  {translateLabel(option.label)}
                                </div>
                                {option.description && (
                                  <div className="text-sm opacity-70">
                                    {translateLabel(option.description)}
                                  </div>
                                )}
                              </div>
                            </div>
                            {showCheck && isSelected(option.value) && (
                              <Check
                                className="h-4 w-4"
                                style={{ color: customColors?.text }}
                              />
                            )}
                          </DropdownMenuItem>
                        ))}
                  </>
                );
              })()
            : filteredOptions.length === 0 && (
                <div
                  className="p-3 text-center opacity-70"
                  style={{ color: customColors?.text }}
                >
                  {noOptionsText}
                </div>
              )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
