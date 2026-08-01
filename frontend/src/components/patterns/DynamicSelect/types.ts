import { ReactNode } from "react";

export interface BaseOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: string;
  description?: string;
  disabled?: boolean;
  [key: string]: any;
}

export type StringOption = string;
export type OptionType = BaseOption | StringOption;

export interface OptionRenderProps {
  isSelected: boolean;
  isFocused: boolean;
  isDisabled: boolean;
}

export type CustomOptionRenderer = (
  option: BaseOption,
  props: OptionRenderProps
) => ReactNode;

export type Size = "sm" | "md" | "lg";
export type Variant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost";

export interface DynamicSelectProps {
  options?: OptionType[];
  value?: string | number | (string | number)[] | null;
  onChange?: (value: string | number | null, option: BaseOption | null) => void;
  onMultiChange?: (values: (string | number)[], options: BaseOption[]) => void;
  className?: string;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  size?: Size;
  variant?: Variant;
  customOptionRenderer?: CustomOptionRenderer | null;
  groupBy?: string | null;
  loading?: boolean;
  loadingText?: string;
  noOptionsText?: string;
  maxHeight?: string;
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}
