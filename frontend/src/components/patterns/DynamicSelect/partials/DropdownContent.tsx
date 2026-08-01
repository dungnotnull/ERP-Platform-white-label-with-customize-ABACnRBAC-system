import React from "react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { BaseOption, CustomOptionRenderer } from "../types";
import { SearchInput } from "./SearchInput";
import { OptionItem } from "./OptionItem";

interface DropdownContentProps {
  isOpen: boolean;
  searchable: boolean;
  loading: boolean;
  loadingText: string;
  noOptionsText: string;
  maxHeight: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  groupedOptions: Record<string, BaseOption[]>;
  filteredOptions: BaseOption[];
  focusedIndex: number;
  value: string | number | (string | number)[] | null;
  multiple: boolean;
  groupBy: string | null;
  customOptionRenderer?: CustomOptionRenderer | null;
  onSelect: (option: BaseOption) => void;
}

export const DropdownContent: React.FC<DropdownContentProps> = ({
  isOpen,
  searchable,
  loading,
  loadingText,
  noOptionsText,
  maxHeight,
  searchTerm,
  onSearchChange,
  searchRef,
  groupedOptions,
  filteredOptions,
  focusedIndex,
  value,
  multiple,
  groupBy,
  customOptionRenderer,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md animate-in fade-in-0 zoom-in-95 duration-100">
      {/* Search input */}
      {searchable && (
        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          searchRef={searchRef}
        />
      )}

      {/* Options list */}
      <ScrollArea className="max-h-60" style={{ maxHeight }}>
        <div className="p-1">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {loadingText}
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {noOptionsText}
            </div>
          ) : (
            Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {groupBy && Object.keys(groupedOptions).length > 1 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {groupName}
                    </div>
                    <Separator className="mb-1" />
                  </>
                )}
                {groupOptions.map(option => {
                  const globalIndex = filteredOptions.indexOf(option);
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value;
                  const isFocused = globalIndex === focusedIndex;

                  return (
                    <OptionItem
                      key={option.value}
                      option={option}
                      index={globalIndex}
                      isSelected={isSelected}
                      isFocused={isFocused}
                      onSelect={onSelect}
                      customRenderer={customOptionRenderer}
                    />
                  );
                })}
                {groupBy &&
                  Object.keys(groupedOptions).length > 1 &&
                  Object.entries(groupedOptions).indexOf([
                    groupName,
                    groupOptions
                  ]) <
                    Object.entries(groupedOptions).length - 1 && (
                    <Separator className="my-1" />
                  )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
