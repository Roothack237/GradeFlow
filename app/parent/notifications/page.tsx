
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ClipboardCheck,
  Info,
  MailOpen,
  Megaphone,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";

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
  RESULT_PUBLISHED: ClipboardCheck,
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
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",

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
    type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase())
  );
}

function timeAgo(iso: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ParentNotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/parent/notifications", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load notifications.");
      }

      setNotifications(data.notifications ?? []);
    } catch (err) {
      console.error("Parent Notifications Error:", err);

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

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications every 20 seconds.
  useEffect(() => {
    const interval = setInterval(loadNotifications, 20000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unread = notifications.filter(
    (notification) => !notification.read
  ).length;

  const read = notifications.length - unread;

  const notificationTypes = useMemo(() => {
    return Array.from(
      new Set(notifications.map((notification) => notification.type))
    );
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        (notification.sender ?? "").toLowerCase().includes(query);

      const matchesType =
        !typeFilter || notification.type === typeFilter;

      const matchesRead =
        !readFilter ||
        (readFilter === "unread" && !notification.read) ||
        (readFilter === "read" && notification.read);

      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, search, typeFilter, readFilter]);

  const activeFilters =
    (search ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (readFilter ? 1 : 0);

  async function toggleRead(notification: Notification) {
    try {
      setBusyId(notification.id);
      setError("");

      const response = await fetch("/api/parent/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notification.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to update the notification.");
        return;
      }

      setNotifications((current) =>
        current.map((entry) =>
          entry.id === notification.id
            ? { ...entry, read: !entry.read }
            : entry
        )
      );

      setToast(
        notification.read
          ? "Notification marked as unread."
          : "Notification marked as read."
      );
    } catch {
      setError("Unable to update the notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAll() {
    try {
      setError("");

      const response = await fetch("/api/parent/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to mark notifications as read.");
        return;
      }

      setNotifications((current) =>
        current.map((entry) => ({
          ...entry,
          read: true,
        }))
      );

      setToast("All notifications marked as read.");
    } catch {
      setError("Unable to mark notifications as read.");
    }
  }

  async function remove(notification: Notification) {
    try {
      setBusyId(notification.id);
      setError("");

      const response = await fetch("/api/parent/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notification.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to delete the notification.");
        return;
      }

      setNotifications((current) =>
        current.filter((entry) => entry.id !== notification.id)
      );

      setToast("Notification deleted.");
    } catch {
      setError("Unable to delete the notification.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Notifications"
          subtitle="Alerts and announcements for your family."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-6xl">

            {/* PAGE HEADER */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadNotifications}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

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

            {/* STATISTICS */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Notifications
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {notifications.length}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    <Bell size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Unread
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {unread}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <BellRing size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Read
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {read}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <MailOpen size={20} />
                  </div>
                </div>
              </div>

            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* FILTERS */}
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">

              <div className="grid gap-3 md:grid-cols-4">

                {/* SEARCH */}
                <div className="relative md:col-span-2">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search notifications..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                {/* TYPE */}
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                >
                  <option value="">All types</option>

                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatType(type)}
                    </option>
                  ))}
                </select>

                {/* READ STATUS */}
                <select
                  value={readFilter}
                  onChange={(event) => setReadFilter(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                >
                  <option value="">Read and unread</option>
                  <option value="unread">Unread only</option>
                  <option value="read">Read only</option>
                </select>

              </div>

              {/* CLEAR FILTERS */}
              {activeFilters > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("");
                      setReadFilter("");
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <X size={15} />
                    Clear filters
                  </button>
                </div>
              )}

            </div>

            {/* NOTIFICATIONS */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <RefreshCw
                      size={20}
                      className="animate-spin text-purple-600"
                    />
                    Loading notifications...
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    <Bell size={25} />
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                    No notifications found
                  </h3>

                  <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    {activeFilters
                      ? "No notification matches the current filters."
                      : "Results, attendance alerts and school announcements will appear here."}
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">

                  {filteredNotifications.map((notification) => {
                    const Icon =
                      TYPE_ICONS[notification.type] ?? Bell;

                    const color =
                      TYPE_COLORS[notification.type] ??
                      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

                    return (
                      <article
                        key={notification.id}
                        className={`flex gap-4 p-5 transition ${
                          notification.read
                            ? "bg-white dark:bg-gray-900"
                            : "bg-purple-50/50 dark:bg-purple-950/20"
                        }`}
                      >

                        {/* ICON */}
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
                        >
                          <Icon size={19} />
                        </div>

                        {/* CONTENT */}
                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h2 className="font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h2>

                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color}`}
                            >
                              {formatType(notification.type)}
                            </span>

                            {!notification.read && (
                              <span className="rounded-full bg-purple-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                New
                              </span>
                            )}

                          </div>

                          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                            {timeAgo(notification.createdAt)}

                            {notification.sender
                              ? ` · from ${notification.sender}`
                              : ""}
                          </p>

                        </div>

                        {/* ACTIONS */}
                        <div className="flex shrink-0 items-start gap-1">

                          <button
                            type="button"
                            onClick={() => toggleRead(notification)}
                            disabled={busyId === notification.id}
                            title={
                              notification.read
                                ? "Mark as unread"
                                : "Mark as read"
                            }
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-purple-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-purple-300"
                          >
                            {notification.read ? (
                              <BellRing size={16} />
                            ) : (
                              <Check size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => remove(notification)}
                            disabled={busyId === notification.id}
                            title="Delete"
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </article>
                    );
                  })}

                </div>
              )}

            </div>

            {/* RESULT COUNT */}
            {!loading && notifications.length > 0 && (
              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                Showing {filteredNotifications.length} of{" "}
                {notifications.length} notification
                {notifications.length !== 1 ? "s" : ""}
              </p>
            )}

          </div>
        </main>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white">
          <div className="flex items-center gap-3">
            <Check className="text-green-500" size={17} />
            {toast}

            <button
              type="button"
              onClick={() => setToast("")}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
