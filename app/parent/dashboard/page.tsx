
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
  firstName: string;
  lastName: string;
  name: string;
  className: string;
  section: "Anglophone" | "Francophone";
  average: number;
  attendance: number;
  initials: string;
  matricule: string;
  gender: string;
  classroomId: string;
};

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "result" | "attendance" | "announcement";
};

export default function ParentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [parent, setParent] = useState<Parent | null>(null);

  const [children, setChildren] = useState<Child[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * Calculate the overall average safely.
   *
   * If the parent has no children, return 0
   * instead of NaN.
   */
  const average =
    children.length > 0
      ? children.reduce(
          (total, child) => total + child.average,
          0
        ) / children.length
      : 0;

  /*
   * Calculate the overall attendance safely.
   *
   * If the parent has no children, return 0.
   */
  const attendance =
    children.length > 0
      ? children.reduce(
          (total, child) => total + child.attendance,
          0
        ) / children.length
      : 0;

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/parent/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load dashboard"
          );
        }

        setParent(data.parent || null);
        setChildren(data.children || []);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Parent dashboard error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
          {/* Loading */}
          {loading && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading your dashboard...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Welcome */}
          <div className="mb-8">
            <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-blue-100">
                    Welcome back
                  </p>

                  <h1 className="mt-1 text-2xl font-bold">
                    {parent?.displayName || "Parent Dashboard"} 👋
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-blue-100">
                    Stay informed about your children's academic
                    performance, attendance, results, and school
                    activities.
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
            {/* My Children */}
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

            {/* Average */}
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

            {/* Attendance */}
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

            {/* Notifications */}
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
                  Monitor your children's current performance.
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

            {children.length === 0 && !loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <UserRound className="mx-auto h-10 w-10 text-gray-400" />

                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
                  No children linked
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No students are currently linked to this parent
                  account.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/parent/children/${child.id}`}
                    className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
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

                          <p className="mt-1 text-xs text-gray-400">
                            {child.matricule}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg p-2 text-gray-400">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Child Statistics */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Average
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {child.average.toFixed(1)}
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

                    {/* Attendance Progress */}
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(
                            Math.max(child.attendance, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
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

              {notifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                  <Bell className="mx-auto h-8 w-8 text-gray-400" />

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No recent notifications.
                  </p>
                </div>
              ) : (
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
              )}
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
                    <p className="text-sm font-bold">
                      Ask Ella AI
                    </p>

                    <p className="mt-1 text-xs text-blue-100">
                      Get insights about your child's performance.
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
