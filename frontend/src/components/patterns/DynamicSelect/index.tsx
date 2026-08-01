import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseOption, DynamicSelectProps } from "./types";
import {
  cnFallback,
  filterOptions,
  groupOptions,
  normalizeOptions
} from "./utils";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { SelectLabel } from "@/components/patterns/DynamicSelect/partials/SelectLabel";
import { SelectTrigger } from "@/components/patterns/DynamicSelect/partials/SelectTrigger";
import { DropdownContent } from "@/components/patterns/DynamicSelect/partials/DropdownContent";
import { HelperText } from "@/components/patterns/DynamicSelect/partials/HelperText";
import { cn } from "@/lib/utils";

const clsx = typeof cn !== "undefined" ? cn : cnFallback;

export default function DynamicSelect({
  options = [],
  value = null,
  onChange = () => {},
  onMultiChange = () => {},
  className = "",
  placeholder = "",
  searchable = false,
  multiple = false,
  clearable = false,
  disabled = false,
  size = "md",
  variant = "default",
  customOptionRenderer = null,
  groupBy = null,
  loading = false,
  loadingText = "",
  noOptionsText = "",
  maxHeight = "300px",
  error = false,
  helperText = "",
  label = "",
  required = false
}: DynamicSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const resolvedPlaceholder = placeholder || t("common.selectOption");
  const resolvedLoadingText = loadingText || t("common.loadingData");
  const resolvedNoOptionsText = noOptionsText || t("common.noOptionsFound");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const normalizedOptions: BaseOption[] = normalizeOptions(options);
  const filteredOptions: BaseOption[] = filterOptions(
    normalizedOptions,
    searchTerm
  );
  const groupedOptions: Record<string, BaseOption[]> = groupOptions(
    filteredOptions,
    groupBy
  );

  const selectedOptions = multiple
    ? normalizedOptions.filter(
        opt => Array.isArray(value) && value.includes(opt.value)
      )
    : normalizedOptions.find(opt => opt.value === value);

  const handleToggle = (): void => {
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  const handleSelect = (option: BaseOption): void => {
    if (option.disabled) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onMultiChange(
        newValues,
        normalizedOptions.filter(opt => newValues.includes(opt.value))
      );
    } else {
      onChange(option.value, option);
      setIsOpen(false);
    }
    setSearchTerm("");
  };

  const handleSelectByIndex = (index: number): void => {
    if (filteredOptions[index]) {
      handleSelect(filteredOptions[index]);
    }
  };

  const handleRemove = (
    optionValue: string | number,
    e: React.MouseEvent
  ): void => {
    e.stopPropagation();
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.filter(v => v !== optionValue);
      onMultiChange(
        newValues,
        normalizedOptions.filter(opt => newValues.includes(opt.value))
      );
    } else {
      onChange(null, null);
    }
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (multiple) {
      onMultiChange([], []);
    } else {
      onChange(null, null);
    }
    setSearchTerm("");
  };

  const { handleKeyDown } = useKeyboardNavigation({
    isOpen,
    setIsOpen,
    filteredOptionsLength: filteredOptions.length,
    focusedIndex,
    setFocusedIndex,
    onSelect: handleSelectByIndex,
    triggerRef,
    onToggle: handleToggle
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [isOpen, searchable]);

  return (
    <div className={clsx("space-y-2", className)}>
      <SelectLabel label={label} required={required} />

      <div className="relative" ref={dropdownRef}>
        <SelectTrigger
          isOpen={isOpen}
          disabled={disabled}
          loading={loading}
          error={error}
          size={size}
          variant={variant}
          multiple={multiple}
          clearable={clearable}
          value={value}
          selectedOptions={selectedOptions}
          placeholder={resolvedPlaceholder}
          onToggle={handleToggle}
          onKeyDown={handleKeyDown}
          onClear={handleClear}
          onRemove={handleRemove}
          triggerRef={triggerRef}
        />

        <DropdownContent
          isOpen={isOpen}
          searchable={searchable}
          loading={loading}
          loadingText={resolvedLoadingText}
          noOptionsText={resolvedNoOptionsText}
          maxHeight={maxHeight}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchRef={searchRef}
          groupedOptions={groupedOptions}
          filteredOptions={filteredOptions}
          focusedIndex={focusedIndex}
          value={value}
          multiple={multiple}
          groupBy={groupBy}
          customOptionRenderer={customOptionRenderer}
          onSelect={handleSelect}
        />
      </div>

      <HelperText helperText={helperText} error={error} />
    </div>
  );
}
