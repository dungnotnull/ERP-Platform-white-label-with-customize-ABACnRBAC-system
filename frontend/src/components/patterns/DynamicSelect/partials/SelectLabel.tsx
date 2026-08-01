import React from "react";

interface SelectLabelProps {
  label?: string;
  required?: boolean;
}

export const SelectLabel: React.FC<SelectLabelProps> = ({
  label,
  required
}) => {
  if (!label) return null;

  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
};
