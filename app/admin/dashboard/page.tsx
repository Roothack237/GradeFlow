
"use client";

//import { auth } from "@/auth";
import ThemeToggle from "@/components/ui/ThemeToggle";
//import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-gray-900 lg:hidden">

        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-700 text-white">
            <GraduationCap size={21} />
          </div>

          <span className="font-bold text-gray-900 dark:text-white">
            GradeFlow
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button className="relative rounded-lg p-2 text-gray-500 dark:text-gray-300">
            <Bell size={21} />

            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">

          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-700 text-white">
                <GraduationCap size={26} />
              </div>

              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">
                  GradeFlow
                </h1>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  School Administration
                </p>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 lg:hidden"
            >
              <X size={21} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">

            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Main Menu
            </p>

            <SidebarLink
              href="/admin/dashboard"
              icon={<LayoutDashboard size={19} />}
              label="Dashboard"
              active
            />

            <SidebarLink
              href="/admin/accounts"
              icon={<Users size={19} />}
              label="Manage Accounts"
            />

            <SidebarLink
              href="/admin/academic-years"
              icon={<BookOpen size={19} />}
              label="Academic Management"
            />

            <SidebarLink
              href="/admin/assignments"
              icon={<UserRound size={19} />}
              label="Teacher Assignments"
            />

            <SidebarLink
              href="/admin/timetable"
              icon={<CalendarDays size={19} />}
              label="Timetable"
            />

            <p className="mb-3 mt-7 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Academic Monitoring
            </p>

            <SidebarLink
              href="/admin/attendance"
              icon={<ClipboardCheck size={19} />}
              label="Attendance"
            />

            <SidebarLink
              href="/admin/results"
              icon={<BarChart3 size={19} />}
              label="Results"
            />

            <SidebarLink
              href="/admin/analytics"
              icon={<Activity size={19} />}
              label="AI Analytics"
            />

            <p className="mb-3 mt-7 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Communication
            </p>

            <SidebarLink
              href="/admin/forums"
              icon={<MessageSquare size={19} />}
              label="Forums"
            />

            <SidebarLink
              href="/admin/notifications"
              icon={<Bell size={19} />}
              label="Notifications"
            />

            <p className="mb-3 mt-7 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              System
            </p>

            <SidebarLink
              href="/admin/reports"
              icon={<BarChart3 size={19} />}
              label="Reports"
            />

            <SidebarLink
              href="/admin/settings"
              icon={<Settings size={19} />}
              label="Settings"
            />
          </nav>

          {/* Admin Profile */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  Administrator
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  School Admin
                </p>
              </div>
            </div>

            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-72">

        {/* Desktop Header */}
        <header className="hidden h-20 items-center justify-between border-b border-gray-200 bg-white px-8 dark:border-gray-800 dark:bg-gray-900 lg:flex">

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Administrator Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor and manage your school from one place.
            </p>
          </div>

          <div className="flex items-center gap-5">

            {/* Dark Mode */}
            <ThemeToggle />

            {/* Notifications */}
            <button className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              <Bell size={21} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

            {/* Admin */}
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                A
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Administrator
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  School Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-5 sm:p-8">

          {/* Welcome */}
          <div className="mb-8">

            <div className="flex items-center gap-2">

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Good morning, Administrator
              </h2>

              <span className="text-2xl">
                👋
              </span>
            </div>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Heres an overview of your schools activities.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Students"
              value="0"
              description="Currently enrolled"
              icon={<GraduationCap size={23} />}
            />

            <StatCard
              title="Total Teachers"
              value="0"
              description="Active teachers"
              icon={<Users size={23} />}
            />

            <StatCard
              title="Total Parents"
              value="0"
              description="Registered parents"
              icon={<UserRound size={23} />}
            />

            <StatCard
              title="Total Classes"
              value="0"
              description="Across 2 sections"
              icon={<BookOpen size={23} />}
            />

          </div>

          {/* Quick Actions */}
          <section className="mt-8">

            <div className="mb-4">

              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Quick Actions
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Frequently used administrative actions
                </p>
              </div>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <QuickAction
                href="/admin/accounts/teachers/add"
                icon={<Users size={22} />}
                title="Add Teacher"
                description="Create a teacher account"
              />

              <QuickAction
                href="/admin/accounts/parents/add"
                icon={<UserRound size={22} />}
                title="Add Parent"
                description="Create a parent account"
              />

              <QuickAction
                href="/admin/academic"
                icon={<BookOpen size={22} />}
                title="Manage Classes"
                description="Manage school structure"
              />

              <QuickAction
                href="/admin/results"
                icon={<BarChart3 size={22} />}
                title="View Results"
                description="Monitor academic results"
              />

            </div>
          </section>

          {/* Middle Section */}
          <div className="mt-8 grid gap-6 xl:grid-cols-3">

            {/* Attendance */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Todays Attendance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Overall attendance across the school
                  </p>
                </div>

                <Link
                  href="/admin/attendance"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  View details
                </Link>

              </div>

              <div className="mt-7 flex flex-col items-center gap-8 sm:flex-row">

                {/* Circle */}
                <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-16px border-purple-100 dark:border-purple-950">

                  <div className="text-center">

                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      0%
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Attendance
                    </p>

                  </div>
                </div>

                {/* Stats */}
                <div className="grid w-full grid-cols-2 gap-4">

                  <AttendanceStat
                    label="Present"
                    value="0"
                    icon={<CheckCircle2 size={17} />}
                  />

                  <AttendanceStat
                    label="Absent"
                    value="0"
                    icon={<X size={17} />}
                  />

                  <AttendanceStat
                    label="Late"
                    value="0"
                    icon={<Activity size={17} />}
                  />

                  <AttendanceStat
                    label="Classes Today"
                    value="0"
                    icon={<CalendarDays size={17} />}
                  />

                </div>
              </div>
            </section>

            {/* System Status */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    System Status
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    GradeFlow services
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">

                <StatusItem
                  name="Database"
                  status="Operational"
                />

                <StatusItem
                  name="Authentication"
                  status="Operational"
                />

                <StatusItem
                  name="Email Service"
                  status="Operational"
                />

                <StatusItem
                  name="AI Assistant"
                  status="Operational"
                />

              </div>
            </section>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* Academic Performance */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Academic Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Current school performance
                  </p>
                </div>

                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-1 text-sm font-semibold text-purple-600"
                >
                  Analytics
                  <ChevronRight size={16} />
                </Link>

              </div>

              <div className="mt-6 space-y-5">

                <Performance
                  subject="Mathematics"
                  percentage={0}
                />

                <Performance
                  subject="English"
                  percentage={0}
                />

                <Performance
                  subject="French"
                  percentage={0}
                />

                <Performance
                  subject="Science"
                  percentage={0}
                />

              </div>
            </section>

            {/* Recent Activity */}
            <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Latest system activities
                  </p>
                </div>

                <Link
                  href="/admin/reports"
                  className="text-sm font-semibold text-purple-600"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">

                <ActivityItem
                  title="New teacher account created"
                  description="Teacher account added by administrator"
                  time="10 min ago"
                />

                <ActivityItem
                  title="Results published"
                  description="Second sequence results published"
                  time="1 hour ago"
                />

                <ActivityItem
                  title="Attendance alert sent"
                  description="Parent notification sent automatically"
                  time="2 hours ago"
                />

                <ActivityItem
                  title="Timetable updated"
                  description="Form 5 Science timetable modified"
                  time="Yesterday"
                />

              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
        active
          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-300">
        {icon}
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   ATTENDANCE STAT
========================================================= */

function AttendanceStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">

      <div className="flex items-center gap-2 text-purple-600">

        {icon}

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </span>

      </div>

      <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SYSTEM STATUS
========================================================= */

function StatusItem({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

        <span className="text-sm text-gray-700 dark:text-gray-300">
          {name}
        </span>

      </div>

      <span className="text-xs font-medium text-green-600">
        {status}
      </span>
    </div>
  );
}

/* =========================================================
   PERFORMANCE
========================================================= */

function Performance({
  subject,
  percentage,
}: {
  subject: string;
  percentage: number;
}) {
  return (
    <div>

      <div className="mb-2 flex justify-between">

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {subject}
        </span>

        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {percentage}%
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

        <div
          className="h-full rounded-full bg-purple-600"
          style={{ width: `${percentage}%` }}
        />

      </div>
    </div>
  );
}

/* =========================================================
   ACTIVITY
========================================================= */

function ActivityItem({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-4 px-6 py-4">

      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
        <Activity size={16} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>

      </div>

      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
        {time}
      </span>

    </div>
  );
}
