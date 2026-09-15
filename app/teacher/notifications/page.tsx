"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  CalendarDays,
  Sparkles,
  Trash2,
  RefreshCw,
  Info,
  Megaphone,
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
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: Check,
  RESULT_PUBLISHED: Sparkles,
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
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/teacher/notifications", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load notifications.");
      }

      setNotifications(data.notifications ?? []);
    } catch (err) {
      console.error("Teacher Notifications Error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /* Near-real-time: refresh every 20 seconds. */
  useEffect(() => {
    const interval = setInterval(loadNotifications, 20000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unread = notifications.filter((notification) => !notification.read).length;

  const filtered = useMemo(() => {
    return filter === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;
  }, [notifications, filter]);

  async function toggleRead(notification: Notification) {
    try {
      setBusyId(notification.id);

      const response = await fetch("/api/teacher/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id }),
      });

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((entry) =>
          entry.id === notification.id ? { ...entry, read: !entry.read } : entry
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function markAll() {
    const response = await fetch("/api/teacher/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });

    if (response.ok) {
      setNotifications((current) =>
        current.map((entry) => ({ ...entry, read: true }))
      );
    }
  }

  async function remove(notification: Notification) {
    try {
      setBusyId(notification.id);

      const response = await fetch("/api/teacher/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id }),
      });

      if (response.ok) {
        setNotifications((current) =>
          current.filter((entry) => entry.id !== notification.id)
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {unread > 0
                ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.`
                : "You are all caught up."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadNotifications}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-700 dark:hover:text-purple-300"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
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

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === value
                  ? "bg-purple-700 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              {value === "all"
                ? `All (${notifications.length})`
                : `Unread (${unread})`}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
            <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600" />

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No notifications yet. Absence alerts, marks and timetable updates
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? Bell;
              const color =
                TYPE_COLORS[notification.type] ??
                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

              return (
                <article
                  key={notification.id}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                    notification.read
                      ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                      : "border-purple-200 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/20"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                        {notification.title}
                      </h2>

                      {!notification.read && (
                        <span className="rounded-full bg-purple-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(notification.createdAt)}
                      {notification.sender ? ` · from ${notification.sender}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleRead(notification)}
                      disabled={busyId === notification.id}
                      title={notification.read ? "Mark as unread" : "Mark as read"}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-purple-700 dark:hover:bg-gray-800 dark:hover:text-purple-300"
                    >
                      <Check size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(notification)}
                      disabled={busyId === notification.id}
                      title="Delete"
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
    </main>
  );
}
