import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { DataListUIProps } from "@/shared/@types/dataTable.type.ts";

interface DataListMobileUIProps<T> extends DataListUIProps<T> {
  onClick?: (row: T) => void;
  triggerConfig: {
    accessor: keyof T;
    accessorSecondary?: keyof T;
  };
  enableExpand?: boolean;
  /** Hide the header label in the trigger row on mobile to save horizontal space */
  hideTriggerLabel?: boolean;
  renderSubtitle?: string;
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export default function DataListMobile<T>({
  data,
  columns,
  onClick,
  className,
  triggerConfig,
  enableExpand,
  emptyMessage,
  hideTriggerLabel,
  renderSubtitle = ""
}: DataListMobileUIProps<T>) {
  const [expandedItems, setExpandedItems] = useState<number[]>(() =>
    enableExpand ? Array.from({ length: data.length }, (_, i) => i) : []
  );

  const accessorTriggerColumns = useMemo(() => {
    const columnDefault = columns.find(
      column => column.accessor === triggerConfig.accessor
    );

    const columnSecondary = triggerConfig.accessorSecondary
      ? columns.find(
          column => column.accessor === triggerConfig.accessorSecondary
        )
      : undefined;

    return { default: columnDefault, secondary: columnSecondary };
  }, [triggerConfig, columns]);

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center py-10 text-primary font-medium">
        {emptyMessage}
      </div>
    );
  }

  const onToggle = (id: number) => {
    return () => {
      setExpandedItems(prev =>
        prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      );
    };
  };

  const onClickCurry = (value: T) => {
    return () => {
      if (onClick) onClick(value);
    };
  };

  return (
    <>
      {data.map((item, index) => {
        const isExpanded = expandedItems.includes(index);

        const triggerValue = item[triggerConfig.accessor];

        let triggerContentData: any = triggerValue;
        if (accessorTriggerColumns.default?.cell) {
          triggerContentData = accessorTriggerColumns.default.cell(
            triggerValue,
            item
          );
        }

        let triggerSecondaryContentData: any = null;

        if (triggerConfig?.accessorSecondary) {
          const triggerSecondaryValue = item[triggerConfig.accessorSecondary];

          if (accessorTriggerColumns.secondary?.cell) {
            triggerSecondaryContentData = accessorTriggerColumns.secondary.cell(
              triggerSecondaryValue,
              item
            );
          } else {
            triggerSecondaryContentData = triggerSecondaryValue;
          }
        }

        return (
          <div key={index} className={className} onClick={onClickCurry(item)}>
            <div className={cn("flex flex-col", isExpanded ? "mb-10" : "mb-5")}>
              <div
                className={cn(
                  "grid gap-1 items-center py-3 border-t-2 border-b-2 border-primary",
                  hideTriggerLabel
                    ? "grid-cols-[auto_1fr_1fr]"
                    : "grid-cols-[130px_1fr_max-content]"
                )}
                onClick={onToggle(index)}
              >
                <div className="flex items-center gap-2">
                  <Play
                    fill="#172554"
                    className={cn(
                      "transform transition-transform duration-300 cursor-pointer shrink-0",
                      isExpanded ? "rotate-[270deg]" : "rotate-90"
                    )}
                    size={25}
                  />
                  {!hideTriggerLabel && (
                    <div className="text-xs md:text-base text-primary font-bold">
                      {accessorTriggerColumns.default?.header ??
                        String(triggerConfig.accessor)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 max-w-full overflow-x-auto text-base text-primary font-bold break-words whitespace-normal">
                  {triggerContentData} {renderSubtitle ? <span className="text-sm font-semibold text-gray-400">{getNestedValue(item, renderSubtitle)}</span> : null}
                </div>
                {triggerSecondaryContentData && (
                  <div className="flex gap-2 items-center min-w-0 max-w-full">
                    <span className="break-words whitespace-normal overflow-hidden text-sm text-primary">
                      {triggerSecondaryContentData}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {columns.map((column, idx) => {
                  const value =
                    typeof column.accessor === "function"
                      ? column.accessor(item)
                      : item[column.accessor as keyof T];

                  const contentData = column.cell
                    ? column.cell(value, item)
                    : value;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[130px_1fr] items-center pl-8 py-3"
                    >
                      <span className="text-sm font-bold text-primary">
                        {column.header}
                      </span>
                      <span className="text-primary text-sm break-words whitespace-normal min-w-0">
                        {contentData}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
