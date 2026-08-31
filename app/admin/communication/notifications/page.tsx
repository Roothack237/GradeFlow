"use client";

import { useMemo, useState } from "react";
import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";
import {
Bell,
Search,
Send,
AlertTriangle,
Eye,
X,
type LucideIcon,
} from "lucide-react";

type NotificationCategory =
| "ACADEMIC"
| "ATTENDANCE"
| "RESULTS"
| "ANNOUNCEMENT"
| "SYSTEM";

type Priority = "HIGH" | "MEDIUM" | "LOW";

type Notification = {
id: string;
title: string;
message: string;
category: NotificationCategory;
priority: Priority;
time: string;
unread: boolean;
};

type StatItem = {
label: string;
value: number;
icon: LucideIcon;
};

const categories = [
"ALL",
"ACADEMIC",
"ATTENDANCE",
"RESULTS",
"ANNOUNCEMENT",
"SYSTEM",
] as const;

type CategoryFilter = (typeof categories)[number];

const notifications: Notification[] = [
{
id: "1",
title: "Results Published",
message:
"Term 1 results for Form 5 Science have been published successfully.",
category: "RESULTS",
priority: "MEDIUM",
time: "2 hours ago",
unread: true,
},
{
id: "2",
title: "Attendance Alert",
message:
"15 students exceeded the attendance threshold this week.",
category: "ATTENDANCE",
priority: "HIGH",
time: "Yesterday",
unread: true,
},
{
id: "3",
title: "School Announcement",
message:
"Parent-teacher meeting scheduled for Friday at 2:00 PM.",
category: "ANNOUNCEMENT",
priority: "LOW",
time: "3 days ago",
unread: false,
},
];

export default function NotificationsPage() {
const [search, setSearch] = useState("");
const [activeCategory, setActiveCategory] =
useState<CategoryFilter>("ALL");
const [showModal, setShowModal] = useState(false);
const [selectedNotification, setSelectedNotification] =
useState<Notification | null>(null);
const [sidebarOpen, setSidebarOpen] = useState(false);

const filteredNotifications = useMemo(() => {
return notifications.filter((notification) => {
const searchTerm = search.toLowerCase();
  const matchesSearch =
    notification.title.toLowerCase().includes(searchTerm) ||
    notification.message.toLowerCase().includes(searchTerm);

  const matchesCategory =
    activeCategory === "ALL" ||
    notification.category === activeCategory;

  return matchesSearch && matchesCategory;
});


}, [search, activeCategory]);

const unreadCount = notifications.filter(
(notification) => notification.unread
).length;

const highCount = notifications.filter(
(notification) => notification.priority === "HIGH"
).length;

const stats: StatItem[] = [
{
label: "Total Notifications",
value: notifications.length,
icon: Bell,
},
{
label: "Unread",
value: unreadCount,
icon: Eye,
},
{
label: "Sent Today",
value: 18,
icon: Send,
},
{
label: "High Priority",
value: highCount,
icon: AlertTriangle,
},
];

return ( <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
<Sidebar
open={sidebarOpen}
onClose={() => setSidebarOpen(false)}
/>

```
  <div className="lg:ml-72">
    <Navbar
      title="Notifications"
      subtitle="Manage school notifications and announcements"
      onMenuClick={() => setSidebarOpen(true)}
    />

    <main className="p-5 sm:p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Stay updated with school activities and system events.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Send Notification
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <Icon className="mb-3 h-5 w-5 text-blue-600" />

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border bg-white p-5 transition dark:bg-gray-900 ${
                notification.unread
                  ? "border-blue-200 dark:border-blue-900"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>

                    {notification.unread && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {notification.category}
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        notification.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : notification.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {notification.priority}
                    </span>

                    <span className="text-xs text-gray-400">
                      {notification.time}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedNotification(notification)
                  }
                  className="flex shrink-0 items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Bell className="mx-auto mb-3 h-8 w-8 text-gray-400" />

            <h3 className="font-semibold text-gray-900 dark:text-white">
              No notifications found
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try changing your search or category filter.
            </p>
          </div>
        )}
      </div>
    </main>
  </div>

  {/* Notification Details */}
  {selectedNotification && (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Notification Details
          </h2>

          <button
            onClick={() => setSelectedNotification(null)}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <X />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Title
            </p>

            <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">
              {selectedNotification.title}
            </h3>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Message
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {selectedNotification.message}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {selectedNotification.category}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {selectedNotification.priority}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {selectedNotification.time}
            </span>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Send Notification Modal */}
  {showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Send Notification
          </h2>

          <button
            onClick={() => setShowModal(false)}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Title"
          />

          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            placeholder="Message"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</div>

);
}
