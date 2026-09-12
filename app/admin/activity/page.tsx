"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Database,
  History,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  StatCard,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
  actor: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
};

type ActivityPayload = {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total: number;
    actions: { action: string; count: number }[];
    entities: { entityType: string; count: number }[];
    actors: {
      actorName: string | null;
      actor: { id: string; firstName: string; lastName: string; role: string } | null;
    }[];
  };
};

/* =========================================================
   HELPERS
========================================================= */

function iconFor(action: string) {
  if (action.startsWith("STUDENT")) return <Users size={16} />;
  if (action.startsWith("TEACHER")) return <UserCog size={16} />;
  if (action.startsWith("PARENT")) return <Users size={16} />;
  if (action.startsWith("CLASS") || action.startsWith("SUBJECT"))
    return <BookOpen size={16} />;
  if (action.startsWith("ATTENDANCE")) return <CalendarCheck size={16} />;
  if (action.startsWith("RESULT") || action.startsWith("REPORT"))
    return <CheckCircle2 size={16} />;
  if (action.startsWith("NOTIFICATION")) return <Send size={16} />;
  if (action.startsWith("FORUM")) return <MessageSquare size={16} />;
  if (action.startsWith("AI")) return <Database size={16} />;
  if (action.includes("DELETED")) return <Trash2 size={16} />;

  return <Settings2 size={16} />;
}

function toneFor(action: string): "green" | "red" | "amber" | "purple" | "blue" | "gray" {
  if (action.includes("DELETED") || action.includes("UNPUBLISHED")) return "red";
  if (action.includes("CREATED") || action.includes("GENERATED")) return "green";
  if (action.includes("UPDATED") || action.includes("CHANGED")) return "amber";
  if (action.startsWith("RESULT") || action.startsWith("AI")) return "purple";
  if (action.startsWith("NOTIFICATION") || action.startsWith("FORUM")) return "blue";

  return "gray";
}

/* =========================================================
   PAGE
========================================================= */

export default function ActivityPage() {
  const [data, setData] = useState<ActivityPayload | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  /* ---------------- debounce ---------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- load ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);
      if (actorFilter) params.set("actorId", actorFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/admin/activity?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      setData(await response.json());
    } catch {
      setError("Unable to load the activity log. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, actionFilter, entityFilter, actorFilter, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilters =
    (search ? 1 : 0) +
    (actionFilter ? 1 : 0) +
    (entityFilter ? 1 : 0) +
    (actorFilter ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  return (
    <AdminShell
      title="Activity Log"
      subtitle="Every administrative action is recorded in the database audit trail."
    >
      <PageHeader
        title="Activity Log"
        subtitle="Who changed what, and when."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recorded actions"
          value={data?.summary.total ?? 0}
          icon={<History size={20} />}
          tone="purple"
          loading={loading && !data}
          hint={activeFilters ? "matching the filters" : undefined}
        />
        <StatCard
          label="Distinct actions"
          value={data?.summary.actions.length ?? 0}
          icon={<Activity size={20} />}
          tone="blue"
          loading={loading && !data}
        />
        <StatCard
          label="Entities touched"
          value={data?.summary.entities.length ?? 0}
          icon={<Database size={20} />}
          tone="emerald"
          loading={loading && !data}
        />
        <StatCard
          label="Administrators"
          value={data?.summary.actors.filter((entry) => entry.actor).length ?? 0}
          icon={<UserCog size={20} />}
          tone="amber"
          loading={loading && !data}
        />
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      <Card bodyClassName="p-4" className="mb-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the description, the action or the administrator…"
              className="pl-10"
            />
          </div>

          <Field label="Action">
            <Select
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All actions</option>
              {(data?.summary.actions ?? []).map((entry) => (
                <option key={entry.action} value={entry.action}>
                  {entry.action.replace(/_/g, " ").toLowerCase()} ({entry.count})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Entity">
            <Select
              value={entityFilter}
              onChange={(event) => {
                setEntityFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All entities</option>
              {(data?.summary.entities ?? []).map((entry) => (
                <option key={entry.entityType} value={entry.entityType}>
                  {entry.entityType} ({entry.count})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Administrator">
            <Select
              value={actorFilter}
              onChange={(event) => {
                setActorFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All administrators</option>
              {data?.summary.actors
                .filter((entry) => entry.actor)
                .map((entry) => (
                  <option key={entry.actor!.id} value={entry.actor!.id}>
                    {entry.actor!.firstName} {entry.actor!.lastName}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="From">
            <Input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
          </Field>

          <Field label="To">
            <Input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
          </Field>

          {activeFilters ? (
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setActionFilter("");
                  setEntityFilter("");
                  setActorFilter("");
                  setFrom("");
                  setTo("");
                  setPage(1);
                }}
              >
                <X size={16} />
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading the activity log…" />
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<History size={20} />}
              title="No activity found"
              message={
                activeFilters
                  ? "No action matches the current filters."
                  : "Administrative actions will be recorded here as they happen."
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.logs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      {iconFor(log.action)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={toneFor(log.action)}>
                          {log.action.replace(/_/g, " ").toLowerCase()}
                        </Badge>

                        <span className="text-xs text-gray-400">
                          {log.entityType}
                          {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm text-gray-800 dark:text-gray-200">
                        {log.description}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {log.actor
                          ? `${log.actor.firstName} ${log.actor.lastName} (${log.actor.role.toLowerCase()})`
                          : (log.actorName ?? "System")}{" "}
                        ·{" "}
                        {new Date(log.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {log.metadata &&
                      Object.keys(log.metadata).length > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(expanded === log.id ? null : log.id)
                          }
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300"
                        >
                          <ChevronDown
                            size={13}
                            className={`transition ${
                              expanded === log.id ? "rotate-180" : ""
                            }`}
                          />
                          Details
                        </button>
                      ) : null}

                      {expanded === log.id && log.metadata ? (
                        <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-gray-50 p-3 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </AdminShell>
  );
}
