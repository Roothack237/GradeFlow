"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
Bell,
BookOpen,
CalendarCheck,
ChevronRight,
ClipboardList,
MessageSquare,
Sparkles,
TrendingUp,
UserRound,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";

type Child = {
id: string;
name: string;
className: string;
section: "Anglophone" | "Francophone";
average: number;
attendance: number;
initials: string;
};

type Notification = {
id: string;
title: string;
message: string;
time: string;
type: "result" | "attendance" | "announcement";
};

const children: Child[] = [
{
id: "1",
name: "Sarah Tagnie",
className: "Form 5 Science",
section: "Anglophone",
average: 14.8,
attendance: 94,
initials: "ST",
},
{
id: "2",
name: "David Tagnie",
className: "Form 2",
section: "Francophone",
average: 13.2,
attendance: 88,
initials: "DT",
},
];

const notifications: Notification[] = [
{
id: "1",
title: "Results Published",
message: "Term 1 results are now available.",
time: "2 hours ago",
type: "result",
},
{
id: "2",
title: "Attendance Alert",
message: "Sarah has 3 absences this month.",
time: "Yesterday",
type: "attendance",
},
{
id: "3",
title: "Parent-Teacher Meeting",
message: "Meeting scheduled for Friday at 2:00 PM.",
time: "2 days ago",
type: "announcement",
},
];

export default function ParentDashboard() {
const [sidebarOpen, setSidebarOpen] = useState(false);
const [parent, setParent] = useState<any>(null);
const [children, setChildren] = useState<any[]>([]);
const [notifications, setNotifications] = useState<any[]>([]);

const average =
children.reduce((total, child) => total + child.average, 0) /
children.length;

const attendance =
children.reduce((total, child) => total + child.attendance, 0) /
children.length;

useEffect(() => {
  const fetchParentData = async () => {
    try {
      const response = await fetch("/api/parent/dashboard");

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const data = await response.json();

      setParent(data.parent);
      setChildren(data.children || []);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    }
  };

  fetchParentData();
}, []);

return ( <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
<Sidebar
open={sidebarOpen}
onClose={() => setSidebarOpen(false)}
/>

  <div className="lg:ml-72">
    <Navbar
      title="Parent Dashboard"
      subtitle="Monitor your children's academic progress and school activities"
      onMenuClick={() => setSidebarOpen(true)}
    />

    <main className="p-5 sm:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Welcome back
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                {parent
                  ? `${parent.gender === "Male" ? "Mr" : "Mme"} ${parent.fullName}`
                  : "Parent Dashboard"} 👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Stay informed about your childrens academic performance,
                attendance, results, and school activities.
              </p>
            </div>

            <div className="hidden rounded-2xl bg-white/10 p-4 sm:block">
              <UserRound className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
              <UserRound className="h-5 w-5 text-blue-600" />
            </div>

            <span className="text-xs font-medium text-gray-400">
              Enrolled
            </span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            My Children
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {children.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>

            <span className="text-xs font-medium text-green-600">
              Current
            </span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Average Performance
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {average.toFixed(1)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
              <CalendarCheck className="h-5 w-5 text-purple-600" />
            </div>

            <span className="text-xs font-medium text-purple-600">
              Overall
            </span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Attendance Rate
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {attendance.toFixed(0)}%
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-orange-100 p-3 dark:bg-orange-900/30">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>

            <span className="text-xs font-medium text-orange-600">
              Unread
            </span>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Notifications
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {notifications.length}
          </p>
        </div>
      </div>

      {/* Children */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              My Children
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor your childrens current performance.
            </p>
          </div>

          <Link
            href="/parent/children"
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {child.initials}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {child.firstName} {child.lastName}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {child.className}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {child.section} Section
                    </p>
                  </div>
                </div>

                <Link
                  href={`/parent/children/${child.id}`}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Average
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {child.average}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Attendance
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {child.attendance}%
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${child.attendance}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent Notifications */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Recent Notifications
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Important updates from the school.
              </p>
            </div>

            <Link
              href="/parent/notifications"
              className="text-sm font-semibold text-blue-600"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800"
              >
                <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/30">
                  {notification.type === "result" && (
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  )}

                  {notification.type === "attendance" && (
                    <CalendarCheck className="h-4 w-4 text-blue-600" />
                  )}

                  {notification.type === "announcement" && (
                    <Bell className="h-4 w-4 text-blue-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>

                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {notification.time}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Frequently used parent tools.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/parent/results"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  View Results
                </p>

                <p className="text-xs text-gray-500">
                  Check academic performance
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              href="/parent/attendance"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <CalendarCheck className="h-4 w-4 text-purple-600" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Check Attendance
                </p>

                <p className="text-xs text-gray-500">
                  Monitor absences and lateness
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              href="/parent/communication"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <MessageSquare className="h-4 w-4 text-green-600" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Contact Teachers
                </p>

                <p className="text-xs text-gray-500">
                  Communicate with teachers
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>

          {/* Ella AI */}
          <Link
            href="/parent/ella-ai"
            className="mt-5 block rounded-xl bg-blue-600 p-4 text-white transition hover:bg-blue-700"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold">Ask Ella AI</p>

                <p className="mt-1 text-xs text-blue-100">
                  Get insights about your childs performance.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  </div>
</div>

);
}
