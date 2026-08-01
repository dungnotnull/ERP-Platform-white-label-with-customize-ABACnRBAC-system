import { LucideIcon, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/Button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FormEvent, useState, useRef, type ReactNode } from "react";
import useDebounce from "@/hooks/useDebounce";
import CustomSelectBox from "./CustomSelectBox";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { toast } from "react-toastify";

export enum ListFilter {
  FILTER = "FILTER",
  ROLE = "ROLE",
  TEAM = "TEAM",
  CREATE = "CREATE"
}
interface PageTopBarProps {
  title?: string;
  description?: string;
  Icon?: LucideIcon;
  searchToolbar?: boolean;
  onSearch?: (query: string) => void;
  listFilter?: ListFilter[];
  roleOptions?: { value: string; label: string }[];
  teamOptions?: { value: string; label: string }[];
  onSelectRole?: (value: string | null) => void;
  onSelectTeam?: (value: string | null) => void;
  onImportSuccess?: () => void;
  headerActions?: ReactNode;
  className?: string;
}

const PageTopBar = ({
  title,
  description,
  Icon,
  searchToolbar = false,
  listFilter,
  onSearch,
  roleOptions = [],
  teamOptions = [],
  onSelectRole,
  onSelectTeam,
  onImportSuccess,
  headerActions,
  className
}: PageTopBarProps) => {
  const [importType, setImportType] = useState<
    "department" | "position" | null
  >(null);

  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClickImport = (type: "department" | "position") => {
    setImportType(type);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (selectedFile) uploadFile(selectedFile);
  };

  const uploadFile = async (file: File) => {
    if (!importType) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Vui lòng chọn file CSV");
      setImportType(null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        importType === "department"
          ? apiRoutes[ApiRouteNames.IMPORT_DEPARTMENTS]
          : apiRoutes[ApiRouteNames.IMPORT_POSITIONS];

      const result = await apiClient.post(endpoint, formData);

      const importedCount = Array.isArray(result) ? result.length : 0;
      toast.success(
        importType === "department"
          ? `Import phòng ban thành công (${importedCount} bản ghi)`
          : `Import chức vụ thành công (${importedCount} bản ghi)`
      );
      onImportSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          (importType === "department"
            ? "Import phòng ban thất bại"
            : "Import chức vụ thất bại")
      );
    } finally {
      setImportType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const debouncedSearch = useDebounce((query: string) => {
    if (onSearch) {
      onSearch(query);
    }
  }, 300);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    debouncedSearch(value);
  };

  return (
    <div className={cn("mb-9", className)}>
      <div className="grid grid-cols-1 md:flex md:justify-between md:items-center">
        <div
          className={cn("mobile:pb-5 flex gap-4 items-end", {
            "mobile:border-b-[1px] mobile:border-primary": searchToolbar
          })}
        >
          {Icon && <Icon size={50} color="#1F2C5C" strokeWidth={3} />}
          <h1 className="flex flex-col gap-2 ">
            <span className="text-2xl md:text-[30px] font-extrabold text-primary">
              {title}
            </span>
            <span className="text-sm md:text-base text-popover">
              {description}
            </span>
          </h1>
        </div>

        {(searchToolbar || headerActions) && (
          <div className="grid grid-cols-1 mobile:pt-5 md:flex items-center gap-5 md:justify-end">
            {searchToolbar && (
              <form className="relative" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder={t("assets.search")}
                  className="w-full md:w-[400px] h-[50px] border border-[#1F2C5C] rounded-[50px] pl-4 pr-14 text-sm md:text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSearch?.(searchQuery);
                    }
                  }}
                />
                <Search
                  size={35}
                  className="absolute right-5 top-1/2 -translate-y-1/2 bg-white cursor-pointer"
                  onClick={() => onSearch && onSearch(searchQuery)}
                />
              </form>
            )}
            <div className="grid grid-cols-2 gap-5 md:flex items-center">
              {searchToolbar && listFilter?.includes(ListFilter.FILTER) && (
                <Button className="w-full md:w-[200px] h-[50px] text-sm md:text-base flex items-center gap-3 rounded-[50px]">
                  {t("assets.filter.title")} <SlidersHorizontal size={35} />
                </Button>
              )}

              {searchToolbar && listFilter?.includes(ListFilter.ROLE) && (
                <CustomSelectBox
                  data={roleOptions}
                  title={t("employees.position.label")}
                  onChange={value =>
                    onSelectRole?.(value === "ALL" ? "" : value)
                  }
                />
              )}

              {searchToolbar && listFilter?.includes(ListFilter.TEAM) && (
                <CustomSelectBox
                  data={teamOptions}
                  title={t("employees.department.label")}
                  onChange={value =>
                    onSelectTeam?.(value === "ALL" ? "" : value)
                  }
                />
              )}

              {searchToolbar && listFilter?.includes(ListFilter.CREATE) && (
                <>
                  <Button
                    className="w-full md:w-[200px] h-[50px] text-sm md:text-base flex items-center gap-3 rounded-[50px]"
                    onClick={() => handleClickImport("department")}
                  >
                    <Plus size={35} /> {t("employees.department.label")}
                  </Button>

                  <Button
                    className="w-full md:w-[200px] h-[50px] text-sm md:text-base flex items-center gap-3 rounded-[50px]"
                    onClick={() => handleClickImport("position")}
                  >
                    <Plus size={35} /> {t("employees.position.label")}
                  </Button>

                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
              {headerActions}
            </div>
          </div>
        )}
      </div>
      <hr className="w-full h-[2px] md:h-[1px] bg-primary md:bg-[#E2E8F0] mt-3" />
    </div>
  );
};

export default PageTopBar;
