import React, { useMemo } from "react";

import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/DropdownMenu.tsx";
import { cn } from "@/lib/utils.ts";
import { VietnamFlag } from "@/components/icons/flags/VietnamFlag.tsx";
import { JapanFlag } from "@/components/icons/flags/JapanFlag.tsx";
import { LanguageKey, useLanguage } from "@/context/LanguageContext.tsx";

type Language = {
  code: LanguageKey;
  name: string;
  nativeName: string;
  flag: React.ReactNode;
};

interface LanguageSelectorProps {
  labelShowType?: "nativeName" | "name";
}

const languages: Language[] = [
  {
    code: LanguageKey.VI,
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: <VietnamFlag />
  },
  {
    code: LanguageKey.JA,
    name: "Japanese",
    nativeName: "日本語",
    flag: <JapanFlag />
  }
];

export default function LanguageSelector({
  labelShowType
}: LanguageSelectorProps) {
  const { changeLanguage, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const selectedLanguage = useMemo(
    () => languages.find(lang => lang.code === currentLanguage) ?? languages[0],
    [currentLanguage]
  );

  useEffect(() => {
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage === "ja" || savedLanguage === "vi") {
      const language = languages.find(lang => lang.code === savedLanguage);
      if (language) {
        changeLanguage(language.code);
      }
    }
  }, []);

  const handleLanguageChange = (language: Language) => {
    changeLanguage(language.code);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className={cn(
            "h-9 gap-2 px-3 bg-white hover:bg-gray-50 transition-all duration-200",
            isOpen && "bg-gray-50"
          )}
        >
          <div className="flex items-center gap-2">
            {selectedLanguage.flag}
            <span className="font-medium text-primary-black hidden md:block">
              {labelShowType
                ? selectedLanguage[labelShowType]
                : selectedLanguage.code.toUpperCase()}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-primary-black transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] bg-white p-2 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 shadow-lg"
      >
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            className={cn(
              "flex items-center px-3 py-2.5 cursor-pointer rounded-md transition-colors mb-1 last:mb-0",
              selectedLanguage.code === language.code
                ? "!bg-gray-300 text-primary-black"
                : "hover:!bg-gray-300 text-primary-black"
            )}
            onClick={() => handleLanguageChange(language)}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">{language.flag}</div>
              <div className="flex flex-col">
                <span className="font-medium">{language.name}</span>
                <span className="text-xs text-popover">
                  {language.nativeName}
                </span>
              </div>
            </div>
            {selectedLanguage.code === language.code && (
              <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
