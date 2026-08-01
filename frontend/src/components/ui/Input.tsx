import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          `
          flex
          h-10
          w-full

          rounded-2xl

          border
          border-slate-200

          bg-white

          px-4
          py-2

          text-sm
          text-slate-900

          placeholder:text-slate-400

          shadow-sm

          transition-all
          duration-200

          hover:border-slate-300
          hover:shadow-md

          focus:outline-none
          focus:ring-primary/10
          focus:shadow-lg

          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:bg-slate-50

          file:border-0
          file:bg-transparent
          file:text-sm
          file:font-medium

          `,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
