import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInfiniteBookingParticipantsQuery } from "@/shared/queries/meeting-bookings.queries";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { BookingParticipantApi } from "@/shared/queries/meeting-bookings.queries";
import type { DepartmentOption } from "./TaskFormSchema";

interface ParticipantsFieldProps {
  value: string[];
  onChange: (ids: string[]) => void;
  conflictIds?: string[];
  departmentOptions: DepartmentOption[];
  invalid?: boolean;
  reloadKey?: string;
  initialParticipants?: BookingParticipantApi[];
}

interface ParticipantView {
  id: string;
  name: string;
  department: string;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function ConflictWarningMark({
  className,
  title
}: {
  className?: string;
  title?: string;
}) {
  const { t } = useTranslation();

  return (
    <span
      className={cn("shrink-0 text-amber-500", className)}
      title={title ?? t("meetingPages.form.conflictWarning")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 004 21h16a2 2 0 001.89-3.14l-8.18-14a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function handleScrollAreaWheel(event: React.WheelEvent<HTMLDivElement>) {
  const target = event.currentTarget;
  const canScrollY = target.scrollHeight > target.clientHeight;
  if (!canScrollY) return;

  const atTop = target.scrollTop <= 0;
  const atBottom =
    target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

  if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
    return;
  }

  event.stopPropagation();
}

function stopTouchScrollPropagation(event: React.TouchEvent<HTMLDivElement>) {
  event.stopPropagation();
}

const PARTICIPANT_LIST_SCROLL_CLASS =
  "max-h-56 overflow-y-auto overscroll-contain touch-pan-y py-1 [-webkit-overflow-scrolling:touch]";

const SELECTED_LIST_SCROLL_CLASS =
  "max-h-48 overflow-y-auto overscroll-contain touch-pan-y pr-1 mobile:max-h-[15.25rem] [-webkit-overflow-scrolling:touch]";

function isLikelyObjectId(value: string) {
  return /^[a-f0-9]{24}$/i.test(value);
}

function buildKnownFromParticipants(
  participants: BookingParticipantApi[] | undefined,
  language: string
): Record<string, ParticipantView> {
  if (!participants?.length) {
    return {};
  }

  return Object.fromEntries(
    participants.map(participant => [
      participant.id,
      {
        id: participant.id,
        name: participant.name,
        department:
          (language === "ja"
            ? participant.department?.nameJa
            : participant.department?.nameVi) ?? ""
      }
    ])
  );
}

const SCROLL_LOAD_THRESHOLD_PX = 48;
export default function ParticipantsField({
  value,
  onChange,
  conflictIds = [],
  departmentOptions,
  invalid = false,
  reloadKey,
  initialParticipants
}: ParticipantsFieldProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterDeptId, setFilterDeptId] = useState("");
  const [known, setKnown] = useState<Record<string, ParticipantView>>({});

  useEffect(() => {
    setOpen(false);
    setSearchInput("");
    setSearch("");
    setFilterDeptId("");
    setKnown(buildKnownFromParticipants(initialParticipants, i18n.language));
  }, [reloadKey, initialParticipants, i18n.language]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const shouldLoadParticipants = open || value.length > 0;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteBookingParticipantsQuery({
    search,
    departmentId: filterDeptId,
    enabled: shouldLoadParticipants
  });

  const users = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  );

  const options: ParticipantView[] = useMemo(
    () =>
      users.map(user => ({
        id: user.id,
        name: user.name,
        department:
          (i18n.language === "ja"
            ? user.department?.nameJa
            : user.department?.nameVi) ?? ""
      })),
    [users, i18n.language]
  );

  const handleParticipantsScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasNextPage || isFetchingNextPage) return;

      const target = event.currentTarget;
      const remaining =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (remaining <= SCROLL_LOAD_THRESHOLD_PX) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );
  // Ghi nhớ thông tin user đã tải để hiển thị được tên khi đã chọn nhưng bị lọc khỏi danh sách.
  useEffect(() => {
    if (options.length === 0) return;
    setKnown(prev => {
      let changed = false;
      const next = { ...prev };
      for (const option of options) {
        const current = next[option.id];
        if (
          !current ||
          current.name !== option.name ||
          current.department !== option.department
        ) {
          next[option.id] = option;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [options]);

  const selected = value.map(
    id => known[id] ?? { id, name: id, department: "" }
  );

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter(existing => existing !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter(existing => existing !== id));
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
              selected.length > 0
                ? "text-gray-900"
                : "font-normal text-gray-900",
              invalid &&
                "border-red-400 focus:border-red-400 focus:ring-red-300"
            )}
          >
            <span>
              {selected.length > 0
                ? t("meetingPages.form.participantsSelected", {
                    count: selected.length
                  })
                : t("meetingPages.form.addParticipant")}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="z-[100] w-[var(--radix-popover-trigger-width)] max-w-none rounded-md border border-gray-200 p-0 shadow-lg"
          onOpenAutoFocus={event => event.preventDefault()}
        >
          <div className="space-y-2 border-b border-gray-100 p-2">
            <input
              type="text"
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder={t("meetingPages.form.searchParticipant")}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterDeptId}
              onChange={event => setFilterDeptId(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {t("meetingPages.form.selectDepartment")}
              </option>
              {departmentOptions.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div
            className={PARTICIPANT_LIST_SCROLL_CLASS}
            onWheel={handleScrollAreaWheel}
            onTouchMove={stopTouchScrollPropagation}
            onScroll={handleParticipantsScroll}
          >
            {isLoading ? (
              <p className="px-3 py-2 text-sm text-gray-400">
                {t("common.handling")}
              </p>
            ) : options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">
                {t("common.noData")}
              </p>
            ) : (
              <>
                {options.map(option => {
                  const checked = value.includes(option.id);
                  const isConflicted = conflictIds.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(option.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-semibold text-white">
                        {initials(option.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1">
                          <span className="truncate text-gray-800">
                            {option.name}
                          </span>
                          {isConflicted ? <ConflictWarningMark /> : null}
                        </span>
                        {option.department && (
                          <span className="block truncate text-xs text-gray-400">
                            {option.department}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
                {isFetchingNextPage ? (
                  <p className="px-3 py-2 text-sm text-gray-400">
                    {t("common.handling")}
                  </p>
                ) : null}
              </>
            )}
          </div>        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div
          className={cn(
            "mt-2 space-y-1.5",
            selected.length > 5 && SELECTED_LIST_SCROLL_CLASS
          )}
          onWheel={selected.length > 5 ? handleScrollAreaWheel : undefined}
          onTouchMove={selected.length > 5 ? stopTouchScrollPropagation : undefined}
        >
          {selected.map(participant => {
            const isConflicted = conflictIds.includes(participant.id);
            const displayName =
              participant.name !== participant.id ||
              !isLikelyObjectId(participant.name)
                ? participant.name
                : t("common.handling");

            return (
              <div
                key={participant.id}
                className="group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-gray-100"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-semibold text-white">
                  {initials(participant.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-1 text-sm font-medium text-gray-800">
                    <span className="truncate">{displayName}</span>
                    {isConflicted ? <ConflictWarningMark /> : null}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {participant.department}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(participant.id)}
                  aria-label={t("common.remove")}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 mobile:flex sm:hidden sm:group-hover:flex"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
