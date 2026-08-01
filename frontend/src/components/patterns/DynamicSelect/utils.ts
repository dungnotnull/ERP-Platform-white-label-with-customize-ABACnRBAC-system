import { BaseOption, OptionType } from "./types";

export const cnFallback = (
  ...classes: (string | undefined | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

export const normalizeOptions = (options: OptionType[]): BaseOption[] => {
  return options.map((option): BaseOption => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return { ...option };
  });
};

export const filterOptions = (
  options: BaseOption[],
  searchTerm: string
): BaseOption[] => {
  return options.filter(
    option =>
      !option.disabled &&
      (option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );
};

export const groupOptions = (
  options: BaseOption[],
  groupBy: string | null
): Record<string, BaseOption[]> => {
  if (!groupBy) {
    return { All: options };
  }

  return options.reduce(
    (groups, option) => {
      const group = (option[groupBy] as string) || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(option);
      return groups;
    },
    {} as Record<string, BaseOption[]>
  );
};

export const sizeVariants = {
  sm: "h-8 px-2 text-xs",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-base"
};
