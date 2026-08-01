import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DataListPaginationProps {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function DataListPagination({
  pageIndex,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  className
}: DataListPaginationProps) {
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);
  const { t } = useTranslation();

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);

      if (pageIndex > 1) {
        if (pageIndex > 2) {
          pages.push(-1);
        }

        if (pageIndex > 0) pages.push(pageIndex - 1);
        pages.push(pageIndex);
        if (pageIndex < totalPages - 1) pages.push(pageIndex + 1);
      } else {
        pages.push(1, 2);
      }

      if (pageIndex < totalPages - 3) {
        pages.push(-1);
      }

      if (!pages.includes(totalPages - 1)) {
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between py-4 ${className || ""}`}
    >
      <div className="text-sm text-muted-foreground">
        {t("common.show")} {startItem}-{endItem} {t("common.of")} {totalItems}{" "}
        {t("common.record")}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center space-x-1">
          <span className="text-sm mr-2">{t("common.show")}:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={value => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers().map((pageNumber, index) =>
            pageNumber === -1 ? (
              <Button key={`ellipsis-${index}`}>...</Button>
            ) : (
              <Button
                key={pageNumber}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pageNumber)}
                disabled={pageIndex === pageNumber}
              >
                {pageNumber + 1}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex + 1 === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
