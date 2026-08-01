import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  searchTerm,
  onSearchChange,
  searchRef
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-2 border-b border-border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchRef}
          type="text"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t("common.searchOptions")}
          className="pl-9 h-8"
        />
      </div>
    </div>
  );
};
