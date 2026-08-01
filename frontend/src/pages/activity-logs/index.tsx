import { useState, useMemo } from "react";
import {
  ScrollText,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Timer,
  Globe,
  Monitor,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Clock,
  Users,
  AlertTriangle,
  Terminal,
  Hash,
  ArrowRightLeft,
  Shield,
  Mail,
  FileJson
} from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useUserProfile } from "@/shared/hooks/useUserProfile";
import { cn } from "@/lib/utils";
import CustomLoader from "@/components/ui/CustomLoader";
import { useActivityLogsQuery } from "@/shared/queries/activityLog.queries";

interface ActivityLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isSuperadmin: boolean | null;
  action: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestBody: Record<string, unknown> | null;
  responseTimeMs: number;
  timestamp: string;
}

const ALL_VALUE = "__all__";

const ACTIONS = [
  { value: ALL_VALUE, label: "All Actions" },
  { value: "LOGIN", label: "Login" },
  { value: "REGISTER", label: "Register" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" }
];

const METHODS = [
  { value: ALL_VALUE, label: "All Methods" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" }
];

const STATUSES = [
  { value: ALL_VALUE, label: "All Statuses" },
  { value: "200", label: "200 OK" },
  { value: "201", label: "201 Created" },
  { value: "400", label: "400 Bad Request" },
  { value: "401", label: "401 Unauthorized" },
  { value: "403", label: "403 Forbidden" },
  { value: "404", label: "404 Not Found" },
  { value: "409", label: "409 Conflict" },
  { value: "500", label: "500 Server Error" }
];

const PAGE_SIZES = [10, 20];

const statusColorClasses: Record<
  number,
  { bar: string; badge: string; label: string }
> = {
  2: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    label: "text-emerald-600"
  },
  3: {
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    label: "text-blue-600"
  },
  4: {
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "text-amber-600"
  },
  5: {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    label: "text-red-600"
  }
};

function statusClasses(code: number) {
  const prefix = Math.floor(code / 100);
  return (
    statusColorClasses[prefix] ?? {
      bar: "bg-slate-400",
      badge: "bg-slate-100 text-slate-700",
      label: "text-slate-600"
    }
  );
}

const methodClassMap: Record<string, { row: string; dot: string }> = {
  GET: {
    row: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dot: "bg-emerald-500"
  },
  POST: {
    row: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dot: "bg-blue-500"
  },
  PUT: {
    row: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dot: "bg-amber-500"
  },
  PATCH: {
    row: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    dot: "bg-yellow-500"
  },
  DELETE: {
    row: "bg-red-500/10 text-red-600 border-red-500/20",
    dot: "bg-red-500"
  }
};

function methodClasses(method: string) {
  return (
    methodClassMap[method] ?? {
      row: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      dot: "bg-slate-500"
    }
  );
}

const actionClassMap: Record<string, string> = {
  LOGIN: "bg-indigo-100 text-indigo-700 border-indigo-200",
  REGISTER: "bg-teal-100 text-teal-700 border-teal-200",
  CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-red-100 text-red-700 border-red-200"
};

function actionBadgeClasses(action: string) {
  return (
    actionClassMap[action] ?? "bg-slate-100 text-slate-700 border-slate-200"
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatMs(ms: number): string {
  if (ms < 1000) return ms + "ms";
  return (ms / 1000).toFixed(2) + "s";
}

interface Stats {
  totalRequests: number;
  errorRate: number;
  avgResponseMs: number;
  uniqueUsers: number;
  errorCount: number;
}

function computeStats(items: ActivityLogItem[], total: number): Stats {
  const errorCount = items.filter(i => i.statusCode >= 400).length;
  return {
    totalRequests: total,
    errorRate:
      items.length > 0 ? Math.round((errorCount / items.length) * 100) : 0,
    avgResponseMs:
      items.length > 0
        ? Math.round(
            items.reduce((sum, i) => sum + i.responseTimeMs, 0) / items.length
          )
        : 0,
    uniqueUsers: new Set(
      items.map(i => i.userEmail || i.userId).filter(Boolean)
    ).size,
    errorCount
  };
}

export default function ActivityLogs() {
  const { user, isLoading: profileLoading } = useUserProfile();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState(ALL_VALUE);
  const [methodFilter, setMethodFilter] = useState(ALL_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_VALUE);
  const [emailFilter, setEmailFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const isSuperadmin = user?.isSuperadmin === true;

  const filters = {
    page,
    limit,
    search: search.trim() || undefined,
    action: actionFilter !== ALL_VALUE ? actionFilter : undefined,
    method: methodFilter !== ALL_VALUE ? methodFilter : undefined,
    statusCode:
      statusFilter !== ALL_VALUE ? parseInt(statusFilter, 10) : undefined,
    userEmail: emailFilter.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  };

  const {
    data,
    isLoading: loading,
    refetch
  } = useActivityLogsQuery(filters, !profileLoading && isSuperadmin);

  const handleApplyFilters = () => {
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setActionFilter(ALL_VALUE);
    setMethodFilter(ALL_VALUE);
    setStatusFilter(ALL_VALUE);
    setEmailFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    actionFilter !== ALL_VALUE ||
    methodFilter !== ALL_VALUE ||
    statusFilter !== ALL_VALUE ||
    emailFilter ||
    startDate ||
    endDate;

  const stats = useMemo(() => {
    if (!data) return null;
    return computeStats(data.items, data.total);
  }, [data]);

  const toggleRow = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  if (profileLoading) {
    return <CustomLoader />;
  }

  if (!isSuperadmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-500">
        <ScrollText size={64} strokeWidth={1} />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only superadmins can view activity logs.</p>
      </div>
    );
  }

  return (
    <div className="pr-5 md:pr-[50px] md:pl-0">
      <PageTopBar
        title="Activity Logs"
        description="Track all non-GET API requests across the system"
        Icon={ScrollText}
      />

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">
                {stats.totalRequests.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Total Requests
              </p>
            </div>
          </div>
          <div
            className={cn(
              "bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3",
              stats.errorRate > 0 && "border-red-200"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-lg",
                stats.errorRate > 0 ? "bg-red-50" : "bg-emerald-50"
              )}
            >
              {stats.errorRate > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Zap className="h-5 w-5 text-emerald-500" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  stats.errorRate > 0 ? "text-red-600" : "text-emerald-600"
                )}
              >
                {stats.errorRate}%
              </p>
              <p className="text-xs text-slate-500 font-medium">Error Rate</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">
                {formatMs(stats.avgResponseMs)}
              </p>
              <p className="text-xs text-slate-500 font-medium">Avg Response</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">
                {stats.uniqueUsers}
              </p>
              <p className="text-xs text-slate-500 font-medium">Unique Users</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Filters */}
      <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" />
            Filters
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                !
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs text-slate-400">
                {data.total.toLocaleString()} records
              </span>
            )}
            {filtersOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </button>
        {filtersOpen && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search endpoint, email, name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  onKeyDown={e => e.key === "Enter" && handleApplyFilters()}
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="User email"
                value={emailFilter}
                onChange={e => setEmailFilter(e.target.value)}
                className="h-10 text-sm"
              />
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-10 text-sm"
              />
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-10 text-sm"
              />
              <div className="flex gap-2 items-end">
                <Button
                  onClick={handleApplyFilters}
                  className="h-10 text-sm px-4"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-10 text-sm px-4"
                >
                  <X size={16} className="mr-1" /> Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={loading}
                  className="h-10 text-sm px-4"
                >
                  <RefreshCw
                    size={16}
                    className={cn("mr-1", loading && "animate-spin")}
                  />{" "}
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Size + Info Bar */}
      <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-xs">Show</span>
          <Select
            value={String(limit)}
            onValueChange={v => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[68px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map(s => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs">per page</span>
        </div>
        {data && (
          <span className="text-xs text-slate-400">
            {data.items.length > 0 ? (data.page - 1) * data.limit + 1 : 0}
            &ndash;{Math.min(data.page * data.limit, data.total)} of{" "}
            {data.total}
          </span>
        )}
      </div>

      {/* Log Stream */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <CustomLoader />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Terminal className="h-12 w-12" strokeWidth={1} />
            <p className="text-sm font-medium">No log entries found</p>
            <p className="text-xs">Try adjusting your filters or date range</p>
          </div>
        ) : (
          data.items.map(item => {
            const sc = statusClasses(item.statusCode);
            const mc = methodClasses(item.method);
            const expanded = expandedRow === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white border border-slate-200 rounded-lg shadow-sm",
                  "hover:shadow-md hover:border-slate-300 transition-all duration-150",
                  "overflow-hidden cursor-pointer",
                  expanded && "shadow-md border-slate-300"
                )}
                onClick={() => toggleRow(item.id)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 overflow-x-auto",
                    expanded && "pb-2"
                  )}
                >
                  {/* Status Color Bar */}
                  <div
                    className={cn(
                      "w-1 self-stretch rounded-full flex-shrink-0",
                      sc.bar
                    )}
                  />

                  {/* Timestamp */}
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap w-[85px] flex-shrink-0">
                    {formatTime(item.timestamp)}
                  </span>

                  {/* Method Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border flex-shrink-0",
                      mc.row
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", mc.dot)} />
                    {item.method}
                  </span>

                  {/* Endpoint */}
                  <span
                    className="text-sm font-mono text-slate-700 flex-1 min-w-0 truncate"
                    title={item.endpoint}
                  >
                    {item.endpoint}
                  </span>

                  <span className="text-xs font-mono text-blue-800 flex-shrink-0 truncate">
                    {item?.isSuperadmin ? "🔑" : "👤"}{" "}
                    {item?.userEmail || "Unknown"} |
                  </span>

                  {/* Action Badge */}
                  <Badge
                    className={cn(
                      "border text-[11px] font-semibold flex-shrink-0 hidden sm:inline-flex",
                      actionBadgeClasses(item.action)
                    )}
                  >
                    {item.action}
                  </Badge>

                  {/* Superadmin Badge */}
                  {item.isSuperadmin && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold flex-shrink-0 hidden sm:inline-flex bg-purple-100 text-purple-700 border border-purple-200"
                      title="Superadmin"
                    >
                      <Shield className="h-3 w-3" />
                      SA
                    </span>
                  )}

                  {/* Status Code */}
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0",
                      sc.badge
                    )}
                  >
                    {item.statusCode}
                  </span>

                  {/* Response Time */}
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 hidden md:inline-flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {formatMs(item.responseTimeMs)}
                  </span>

                  {/* Expand Icon */}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-300 flex-shrink-0 transition-transform duration-200",
                      expanded && "rotate-180"
                    )}
                  />
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 animate-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Request ID
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {item.id}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Full Timestamp
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3" /> Endpoint
                        </span>
                        <span className="text-xs font-mono text-slate-600 break-all">
                          {item.endpoint}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" /> User
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {item.userName || item.userId || (
                            <span className="text-slate-400 italic">
                              Anonymous
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {item.userEmail || (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Superadmin
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {item.isSuperadmin ? (
                            <span className="text-purple-600 font-semibold">
                              Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No</span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Globe className="h-3 w-3" /> IP Address
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {item.ipAddress || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Timer className="h-3 w-3" /> Response Time
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {formatMs(item.responseTimeMs)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 md:col-span-2 lg:col-span-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                          <Monitor className="h-3 w-3" /> User Agent
                        </span>
                        <span className="text-xs font-mono text-slate-500 break-all">
                          {item.userAgent || "N/A"}
                        </span>
                      </div>
                      {item.requestBody && (
                        <div className="flex flex-col gap-0.5 md:col-span-2 lg:col-span-3">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                            <FileJson className="h-3 w-3" /> Request Body
                          </span>
                          <pre className="text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded-md p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(item.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span className="text-xs text-slate-400">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="h-8 text-xs"
            >
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-8 text-xs"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
