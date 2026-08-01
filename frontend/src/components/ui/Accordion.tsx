import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-title", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    hiddenIcon?: boolean;
  }
>(({ className, children, hiddenIcon, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-bold transition-all hover:underline tablet:text-14 mobile:text-12 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 [&[data-state=open]_svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      {!hiddenIcon && <ChevronDown className="h-4 w-4 shrink-0" />}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/** Header row — dùng khi cần nút action cạnh trigger (tránh button trong button) */
const AccordionItemHeader = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Header>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Header>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Header
    ref={ref}
    className={cn("flex w-full items-center", className)}
    {...props}
  />
));
AccordionItemHeader.displayName = "AccordionItemHeader";

/** Trigger không bọc Header — ghép với AccordionItemHeader */
const AccordionTriggerOnly = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    hiddenIcon?: boolean;
  }
>(({ className, children, hiddenIcon, ...props }, ref) => (
  <AccordionPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-bold transition-all hover:underline [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 [&[data-state=open]_svg]:rotate-180 tablet:text-14 mobile:text-12",
      className
    )}
    {...props}
  >
    {children}
    {!hiddenIcon && <ChevronDown className="h-4 w-4 shrink-0" />}
  </AccordionPrimitive.Trigger>
));
AccordionTriggerOnly.displayName = "AccordionTriggerOnly";

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content ref={ref} className="overflow-hidden" {...props}>
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "pb-4 pt-0 text-sm tablet:text-sm tablet:leading-[1.75rem] mobile:text-xs mobile:leading-[1.375rem]",
        className
      )}
    >
      {children}
    </motion.div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export {
  Accordion,
  AccordionItem,
  AccordionItemHeader,
  AccordionTrigger,
  AccordionTriggerOnly,
  AccordionContent
};
