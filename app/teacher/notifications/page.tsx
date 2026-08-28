"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  CalendarDays,
  BookOpen,
  Trash2,
  Filter,
} from "lucide-react";

type NotificationType =
  | "attendance"
  | "message"
  | "academic"
  | "timetable"
  | "system";

type Notification = {
  id: number;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Attendance reminder",
    description:
      "You have not submitted attendance for Form 1 A Mathematics.",
    time: "10 minutes ago",
    type: "attendance",
    read: false,
  },
  {
    id: 2,
    title: "New parent message",
    description:
      "Mrs. Johnson sent you a message concerning Sarah's Mathematics performance.",
    time: "35 minutes ago",
    type: "message",
    read: false,
  },
  {
    id: 3,
    title: "AI performance insight available",
    description:
      "GradeFlow AI has identified several students who may need additional academic support.",
    time: "1 hour ago",
    type: "academic",
    read: false,
  },
  {
    id: 4,
    title: "Timetable updated",
    description:
      "Your Wednesday timetable has been updated by the administrator.",
    time: "3 hours ago",
    type: "timetable",
    read: true,
  },
  {
    id: 5,
    title: "Marks submission deadline",
    description:
      "Remember to submit your First Term Mathematics marks before the deadline.",
    time: "Yesterday",
    type: "academic",
    read: true,
  },
  {
    id: 6,
    title: "System maintenance",
    description:
      "GradeFlow will undergo scheduled maintenance this weekend.",
    time: "2 days ago",
    type: "system",
    read: true,
  },
];

const filters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Academic", value: "academic" },
  { label: "Attendance", value: "attendance" },
  { label: "Messages", value: "message" },
];

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState(
    initialNotifications
  );

  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter(
          (notification) => !notification.read
        );

      case "academic":
        return notifications.filter(
          (notification) => notification.type === "academic"
        );

      case "attendance":
        return notifications.filter(
          (notification) => notification.type === "attendance"
        );

      case "message":
        return notifications.filter(
          (notification) => notification.type === "message"
        );

      default:
        return notifications;
    }
  }, [notifications, filter]);

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  function deleteNotification(id: number) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                <Bell size={21} />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Communication
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Stay updated with important information from GradeFlow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <CheckCheck size={17} />
                Mark all as read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 size={17} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                <Bell size={19} />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.length}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total notifications
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <Sparkles size={19} />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unreadCount}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Unread
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                <CheckCheck size={19} />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.length - unreadCount}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Read
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Card */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Filters */}
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Recent Notifications
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Important updates and alerts
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter
                size={16}
                className="shrink-0 text-gray-400"
              />

              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    filter === item.value
                      ? "bg-purple-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          {filteredNotifications.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <Bell size={28} />
              </div>

              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                No notifications
              </h3>

              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                You're all caught up. New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`group flex gap-4 p-5 transition hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                      !notification.read
                        ? "bg-purple-50/40 dark:bg-purple-950/10"
                        : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getNotificationStyle(
                        notification.type
                      )}`}
                    >
                      <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-purple-600" />
                          )}
                        </div>

                        <span className="text-xs text-gray-400">
                          {notification.time}
                        </span>
                      </div>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                        {notification.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
                          >
                            <Check size={14} />
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            deleteNotification(notification.id)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   NOTIFICATION HELPERS
========================================================= */

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "attendance":
      return ClipboardCheck;

    case "message":
      return MessageSquare;

    case "academic":
      return BookOpen;

    case "timetable":
      return CalendarDays;

    case "system":
      return Sparkles;

    default:
      return Bell;
  }
}

function getNotificationStyle(type: NotificationType) {
  switch (type) {
    case "attendance":
      return "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400";

    case "message":
      return "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400";

    case "academic":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400";

    case "timetable":
      return "bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400";

    case "system":
      return "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400";

    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}