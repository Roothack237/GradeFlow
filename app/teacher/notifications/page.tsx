
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  Info,
  MailOpen,
  Megaphone,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  sender: string | null;
  createdAt: string;
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  ATTENDANCE_ALERT: AlertTriangle,
  MARK_UPDATE: ClipboardCheck,
  ANNOUNCEMENT: Megaphone,
  REPORT_AVAILABLE: ClipboardCheck,
  RESULT_PUBLISHED: Sparkles,
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: Check,
  SYSTEM: Info,
};

const TYPE_COLORS: Record<string, string> = {
  ATTENDANCE_ALERT:
    "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",

  MARK_UPDATE:
    "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",

  ANNOUNCEMENT:
    "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",

  REPORT_AVAILABLE:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",

  RESULT_PUBLISHED:
    "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",

  INFO:
    "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",

  WARNING:
    "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",

  SUCCESS:
    "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400",

  SYSTEM:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

const TYPE_LABELS: Record<string, string> = {
  ATTENDANCE_ALERT: "Attendance alert",
  MARK_UPDATE: "Mark update",
  ANNOUNCEMENT: "Announcement",
  REPORT_AVAILABLE: "Report available",
  RESULT_PUBLISHED: "Result published",
  INFO: "Information",
  WARNING: "Warning",
  SUCCESS: "Success",
  SYSTEM: "System",
};

function formatType(type: string) {
  return (
    TYPE_LABELS[type] ??
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (char) => char.toUpperCase())
  );
}

function timeAgo(iso: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );

  if (seconds < 60) return "just now";

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h ago`;
  }

  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)} d ago`;
  }

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/teacher/notifications", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load notifications."
        );
      }

      setNotifications(data.notifications ?? []);
    } catch (err) {
      console.error("Teacher Notifications Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 20000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Automatically hide toast
  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toast]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const unread = notifications.filter(
    (notification) => !notification.read
  ).length;

  const read = notifications.length - unread;

  const notificationTypes = useMemo(() => {
    return Array.from(
      new Set(
        notifications.map(
          (notification) => notification.type
        )
      )
    );
  }, [notifications]);

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        notification.title
          .toLowerCase()
          .includes(query) ||
        notification.message
          .toLowerCase()
          .includes(query) ||
        (notification.sender ?? "")
          .toLowerCase()
          .includes(query);

      const matchesType =
        !typeFilter ||
        notification.type === typeFilter;

      const matchesRead =
        !readFilter ||
        (readFilter === "unread" &&
          !notification.read) ||
        (readFilter === "read" &&
          notification.read);

      return (
        matchesSearch &&
        matchesType &&
        matchesRead
      );
    });
  }, [
    notifications,
    search,
    typeFilter,
    readFilter,
  ]);

  const activeFilters =
    (search ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (readFilter ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setTypeFilter("");
    setReadFilter("");
  }

  // =========================================================
  // MARK INDIVIDUAL AS READ / UNREAD
  // =========================================================

  async function toggleRead(notification: Notification) {
    try {
      setBusyId(notification.id);
      setError("");

      const response = await fetch(
        "/api/teacher/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: notification.id,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to update the notification."
        );
        return;
      }

      setNotifications((current) =>
        current.map((entry) =>
          entry.id === notification.id
            ? {
                ...entry,
                read: !entry.read,
              }
            : entry
        )
      );

      setToast(
        notification.read
          ? "Notification marked as unread."
          : "Notification marked as read."
      );
    } catch {
      setError(
        "Unable to update the notification."
      );
    } finally {
      setBusyId(null);
    }
  }

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async function markAll() {
    try {
      setError("");

      const response = await fetch(
        "/api/teacher/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            markAll: true,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to mark notifications as read."
        );
        return;
      }

      setNotifications((current) =>
        current.map((entry) => ({
          ...entry,
          read: true,
        }))
      );

      setToast(
        "All notifications marked as read."
      );
    } catch {
      setError(
        "Unable to mark notifications as read."
      );
    }
  }

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  async function remove(notification: Notification) {
    try {
      setBusyId(notification.id);
      setError("");

      const response = await fetch(
        "/api/teacher/notifications",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: notification.id,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to delete the notification."
        );
        return;
      }

      setNotifications((current) =>
        current.filter(
          (entry) =>
            entry.id !== notification.id
        )
      );

      setToast("Notification deleted.");
    } catch {
      setError(
        "Unable to delete the notification."
      );
    } finally {
      setBusyId(null);
    }
  }

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={32}
                className="mx-auto animate-spin text-purple-600"
              />

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Loading notifications...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950 sm:p-8">
      <div className="mx-auto max-w-6xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {unread > 0
                ? `You have ${unread} unread notification${
                    unread > 1 ? "s" : ""
                  }.`
                : "You are all caught up."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* Refresh */}
            <button
              type="button"
              onClick={loadNotifications}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-700 dark:hover:text-purple-300"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* Mark all */}
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ================================================= */}
        {/* STATISTICS */}
        {/* ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          {/* Total */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                <Bell size={20} />
              </div>
            </div>
          </div>

          {/* Unread */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Unread
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {unread}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <MailOpen size={20} />
              </div>
            </div>
          </div>

          {/* Read */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Read
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {read}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-950/40"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================================================= */}
        {/* FILTERS */}
        {/* ================================================= */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
            >
              <option value="">
                All types
              </option>

              {notificationTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {formatType(type)}
                </option>
              ))}
            </select>

            {/* Read status */}
            <select
              value={readFilter}
              onChange={(event) =>
                setReadFilter(event.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
            >
              <option value="">
                All status
              </option>

              <option value="unread">
                Unread
              </option>

              <option value="read">
                Read
              </option>
            </select>

            {/* Clear */}
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-700 dark:hover:text-red-400"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </div>

          {/* Filter count */}
          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Showing {filteredNotifications.length} of{" "}
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ================================================= */}
        {/* NOTIFICATION LIST */}
        {/* ================================================= */}

        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Bell size={26} />
            </div>

            <h2 className="mt-5 text-base font-bold text-gray-900 dark:text-white">
              {notifications.length === 0
                ? "No notifications yet"
                : "No matching notifications"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {notifications.length === 0
                ? "Absence alerts, mark updates, timetable updates and other important messages will appear here."
                : "Try changing your search or filters to find the notification you are looking for."}
            </p>

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                <X size={15} />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

            <div className="divide-y divide-gray-100 dark:divide-gray-800">

              {filteredNotifications.map(
                (notification) => {
                  const Icon =
                    TYPE_ICONS[
                      notification.type
                    ] ?? Bell;

                  const color =
                    TYPE_COLORS[
                      notification.type
                    ] ??
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

                  return (
                    <article
                      key={notification.id}
                      className={`flex items-start gap-4 p-5 transition ${
                        notification.read
                          ? "bg-white dark:bg-gray-900"
                          : "bg-purple-50/50 dark:bg-purple-950/10"
                      }`}
                    >

                      {/* Icon */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
                      >
                        <Icon size={19} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                            {notification.title}
                          </h2>

                          {/* Type badge */}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color}`}
                          >
                            {formatType(
                              notification.type
                            )}
                          </span>

                          {/* New badge */}
                          {!notification.read && (
                            <span className="rounded-full bg-purple-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {notification.message}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 dark:text-gray-500">

                          <span>
                            {timeAgo(
                              notification.createdAt
                            )}
                          </span>

                          {notification.sender && (
                            <>
                              <span>·</span>

                              <span>
                                From{" "}
                                {notification.sender}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            toggleRead(
                              notification
                            )
                          }
                          disabled={
                            busyId ===
                            notification.id
                          }
                          title={
                            notification.read
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-purple-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-purple-300"
                        >
                          {notification.read ? (
                            <MailOpen
                              size={16}
                            />
                          ) : (
                            <Check
                              size={16}
                            />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            remove(
                              notification
                            )
                          }
                          disabled={
                            busyId ===
                            notification.id
                          }
                          title="Delete"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
              {filteredNotifications.length} notification
              {filteredNotifications.length !== 1
                ? "s"
                : ""}{" "}
              displayed
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* TOAST */}
        {/* ================================================= */}

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-gray-900">
            <Check
              size={17}
              className="text-green-400 dark:text-green-600"
            />

            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
