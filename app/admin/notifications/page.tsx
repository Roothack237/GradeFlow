"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
  Check,
  MailOpen,
  Users,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Textarea,
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  audience: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
  sender: { firstName: string; lastName: string } | null;
};

type Summary = {
  total: number;
  unread: number;
  read: number;
  byType: { type: string; count: number }[];
  byAudience: { audience: string; count: number }[];
};

const TYPE_TONES: Record<string, "purple" | "green" | "amber" | "red" | "blue" | "gray"> = {
  INFO: "blue",
  SUCCESS: "green",
  WARNING: "amber",
  RESULT_PUBLISHED: "purple",
  ATTENDANCE_ALERT: "red",
  MARK_UPDATE: "blue",
  ANNOUNCEMENT: "purple",
  REPORT_AVAILABLE: "green",
  SYSTEM: "gray",
};

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  ALL_TEACHERS: "All teachers",
  ALL_PARENTS: "All parents",
  CLASS: "One class",
  SELECTED_USERS: "Selected users",
  DIRECT: "Direct message",
};

const TYPES = Object.keys(TYPE_TONES);

/* =========================================================
   PAGE
========================================================= */

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "ANNOUNCEMENT",
    audience: "ALL",
    classroomId: "",
    actionUrl: "",
  });

  const [toDelete, setToDelete] = useState<NotificationRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

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
      if (typeFilter) params.set("type", typeFilter);
      if (audienceFilter) params.set("audience", audienceFilter);
      if (readFilter) params.set("isRead", readFilter);

      const response = await fetch(`/api/admin/notifications?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();

      setRows(data.notifications ?? []);
      setSummary(data.summary ?? null);
      setTotal(data.total ?? 0);
      setSelected([]);
    } catch {
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, audienceFilter, readFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const response = await fetch("/api/admin/classes", { cache: "no-store" });

        if (!response.ok) return;

        const data = await response.json();

        setClasses(data.classes ?? []);
      } catch {
        /* non critical */
      }
    }

    loadClasses();
  }, []);

  /* ---------------- actions ---------------- */

  async function send() {
    setFormError("");

    if (!form.title.trim() || !form.message.trim()) {
      setFormError("A title and a message are required.");
      return;
    }

    if (form.audience === "CLASS" && !form.classroomId) {
      setFormError("Select the class that should receive this message.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
          audience: form.audience,
          classroomId: form.classroomId || undefined,
          actionUrl: form.actionUrl.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(data.error ?? "Unable to send the notification.");
        return;
      }

      setComposeOpen(false);
      setForm({
        title: "",
        message: "",
        type: "ANNOUNCEMENT",
        audience: "ALL",
        classroomId: "",
        actionUrl: "",
      });
      setToast(data.message ?? "Notification sent.");
      await load();
    } catch {
      setFormError("Unable to send the notification. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function bulk(action: "READ" | "UNREAD", ids?: string[]) {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to update the notifications.");
        return;
      }

      setToast(data.message ?? "Notifications updated.");
      await load();
    } catch {
      setError("Unable to update the notifications.");
    }
  }

  async function toggleRead(row: NotificationRow) {
    try {
      const response = await fetch(`/api/admin/notifications/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !row.isRead }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        setError(data.error ?? "Unable to update the notification.");
        return;
      }

      setRows((current) =>
        current.map((entry) =>
          entry.id === row.id ? { ...entry, isRead: !entry.isRead } : entry
        )
      );

      setToast(row.isRead ? "Marked as unread." : "Marked as read.");
    } catch {
      setError("Unable to update the notification.");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/notifications/${toDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to delete the notification.");
        return;
      }

      setToast("Notification deleted.");
      setToDelete(null);
      await load();
    } catch {
      setError("Unable to delete the notification.");
    } finally {
      setDeleting(false);
    }
  }

  const activeFilters =
    (search ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (audienceFilter ? 1 : 0) +
    (readFilter ? 1 : 0);

  const audienceSummary = useMemo(() => summary?.byAudience ?? [], [summary]);

  return (
    <AdminShell
      title="Notifications"
      subtitle="Every notification is stored in the database and delivered to real accounts."
    >
      <PageHeader
        title="Notifications"
        subtitle="Send announcements and review what the school has already sent."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={() => setComposeOpen(true)}>
          <Send size={16} />
          New notification
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Notifications"
          value={summary?.total ?? 0}
          icon={<Bell size={20} />}
          tone="purple"
          loading={loading && !summary}
        />
        <StatCard
          label="Unread"
          value={summary?.unread ?? 0}
          icon={<BellRing size={20} />}
          tone={summary?.unread ? "amber" : "gray"}
          loading={loading && !summary}
        />
        <StatCard
          label="Read"
          value={summary?.read ?? 0}
          icon={<MailOpen size={20} />}
          tone="emerald"
          loading={loading && !summary}
        />
        <StatCard
          label="Audiences reached"
          value={audienceSummary.length}
          icon={<Users size={20} />}
          tone="blue"
          loading={loading && !summary}
        />
      </div>

      {summary && summary.byType.length ? (
        <Card title="Volume by type" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {summary.byType.map((entry) => (
              <Badge key={entry.type} tone={TYPE_TONES[entry.type] ?? "gray"}>
                {entry.type.replace(/_/g, " ").toLowerCase()}: {entry.count}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}

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
              placeholder="Search a title or a message…"
              className="pl-10"
            />
          </div>

          <Select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </Select>

          <Select
            value={audienceFilter}
            onChange={(event) => {
              setAudienceFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All audiences</option>
            {Object.entries(AUDIENCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select
            value={readFilter}
            onChange={(event) => {
              setReadFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Read and unread</option>
            <option value="false">Unread only</option>
            <option value="true">Read only</option>
          </Select>

          {activeFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setTypeFilter("");
                setAudienceFilter("");
                setReadFilter("");
                setPage(1);
              }}
            >
              <X size={16} />
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => bulk("READ")}
            disabled={!summary?.unread}
          >
            <CheckCheck size={15} />
            Mark all as read
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => bulk("READ", selected)}
            disabled={selected.length === 0}
          >
            <Check size={15} />
            Mark selected read ({selected.length})
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => bulk("UNREAD", selected)}
            disabled={selected.length === 0}
          >
            Mark selected unread
          </Button>
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading notifications…" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Bell size={20} />}
              title="No notification found"
              message={
                activeFilters
                  ? "No notification matches the current filters."
                  : "Send the first notification to the school community."
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex gap-3 p-4 transition ${
                    row.isRead
                      ? "bg-white dark:bg-gray-900"
                      : "bg-purple-50/60 dark:bg-purple-950/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, row.id]
                          : current.filter((id) => id !== row.id)
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-700 focus:ring-purple-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {row.title}
                      </p>

                      <Badge tone={TYPE_TONES[row.type] ?? "gray"}>
                        {row.type.replace(/_/g, " ").toLowerCase()}
                      </Badge>

                      {!row.isRead ? <Badge tone="amber">Unread</Badge> : null}
                    </div>

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {row.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      To {row.user.firstName} {row.user.lastName} (
                      {row.user.role.toLowerCase()} · {row.user.email}) ·{" "}
                      {AUDIENCE_LABEL[row.audience ?? "DIRECT"] ?? row.audience} ·{" "}
                      {new Date(row.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {row.sender
                        ? ` · sent by ${row.sender.firstName} ${row.sender.lastName}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRead(row)}
                    >
                      {row.isRead ? <BellRing size={15} /> : <Check size={15} />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete(row)}
                    >
                      <Trash2 size={15} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* ---------------- compose ---------------- */}

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New notification"
        subtitle="The recipients are resolved from the school database."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send} loading={sending}>
              <Send size={15} />
              Send
            </Button>
          </div>
        }
      >
        {formError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </div>
        ) : null}

        <div className="space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="e.g. Parents meeting on Friday"
            />
          </Field>

          <Field label="Message" required>
            <Textarea
              rows={4}
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Write the message the recipients will read…"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience" required>
              <Select
                value={form.audience}
                onChange={(event) =>
                  setForm({ ...form, audience: event.target.value })
                }
              >
                <option value="ALL">Everyone (teachers and parents)</option>
                <option value="ALL_TEACHERS">All teachers</option>
                <option value="ALL_PARENTS">All parents</option>
                <option value="CLASS">One class (their parents)</option>
              </Select>
            </Field>

            <Field label="Type">
              <Select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {form.audience === "CLASS" ? (
            <Field label="Class" required>
              <Select
                value={form.classroomId}
                onChange={(event) =>
                  setForm({ ...form, classroomId: event.target.value })
                }
              >
                <option value="">Select a class</option>
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field
            label="Link"
            hint="Optional internal link, e.g. /parent/children."
          >
            <Input
              value={form.actionUrl}
              onChange={(event) =>
                setForm({ ...form, actionUrl: event.target.value })
              }
            />
          </Field>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
            <Megaphone size={14} className="mr-1 inline" />
            Notifications are written to the database and appear instantly in
            the recipient accounts.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete notification"
        message={
          toDelete
            ? `"${toDelete.title}" will be removed from the recipient inbox.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
