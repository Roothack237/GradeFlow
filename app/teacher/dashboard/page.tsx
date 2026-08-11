
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-5 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
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

        <button className="relative text-gray-500">
          <Bell size={21} />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </header>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">

          {/* LOGO */}
          <div className="flex h-20 items-center justify-between border-b px-6 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-700 text-white">
                <GraduationCap size={26} />
              </div>

              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">
                  GradeFlow
                </h1>

                <p className="text-xs text-gray-400">
                  Teacher Portal
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

          {/* NAVIGATION */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">

            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Main Menu
            </p>

            <SidebarLink
              href="/teacher/dashboard"
              icon={<LayoutDashboard size={19} />}
              label="Dashboard"
              active
            />

            <SidebarLink
              href="/teacher/classes"
              icon={<Users size={19} />}
              label="My Classes"
            />

            <SidebarLink
              href="/teacher/attendance"
              icon={<ClipboardCheck size={19} />}
              label="Attendance"
            />

            <SidebarLink
              href="/teacher/marks"
              icon={<BookOpen size={19} />}
              label="Marks"
            />

            <SidebarLink
              href="/teacher/timetable"
              icon={<CalendarDays size={19} />}
              label="Timetable"
            />

            <p className="mb-3 mt-7 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Academic
            </p>

            <SidebarLink
              href="/teacher/performance"
              icon={<BarChart3 size={19} />}
              label="Performance"
            />

            <SidebarLink
              href="/teacher/analytics"
              icon={<Activity size={19} />}
              label="Class Analytics"
            />

            <SidebarLink
              href="/teacher/ai-assistant"
              icon={<Sparkles size={19} />}
              label="AI Assistant"
            />

            <p className="mb-3 mt-7 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Communication
            </p>

            <SidebarLink
              href="/teacher/messages"
              icon={<MessageSquare size={19} />}
              label="Parent Messages"
            />

            <SidebarLink
              href="/teacher/notifications"
              icon={<Bell size={19} />}
              label="Notifications"
            />

            <p className="mb-3 mt-7 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Account
            </p>

            <SidebarLink
              href="/teacher/profile"
              icon={<UserRound size={19} />}
              label="My Profile"
            />

          </nav>

          {/* TEACHER PROFILE */}
          <div className="border-t p-4 dark:border-gray-800">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                T
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  Teacher
                </p>

                <p className="text-xs text-gray-500">
                  Teacher Account
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

      {/* MAIN */}
      <main className="lg:ml-72">

        {/* DESKTOP HEADER */}
        <header className="hidden h-20 items-center justify-between border-b bg-white px-8 dark:border-gray-800 dark:bg-gray-900 lg:flex">

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Teacher Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your classes, students and academic activities.
            </p>
          </div>

          <div className="flex items-center gap-5">

            <button className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell size={21} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                T
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Teacher
                </p>

                <p className="text-xs text-gray-500">
                  Teacher Account
                </p>
              </div>

            </div>

          </div>
        </header>

        {/* CONTENT */}
        <div className="p-5 sm:p-8">

          {/* WELCOME */}
          <div className="mb-8">

            <div className="flex items-center gap-2">

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, Teacher
              </h2>

              <span className="text-2xl">
                👋
              </span>

            </div>

            <p className="mt-2 text-gray-500">
              Heres an overview of your teaching activities.
            </p>

          </div>

          {/* STATISTICS */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="My Classes"
              value="0"
              description="Assigned classes"
              icon={<Users size={23} />}
            />

            <StatCard
              title="My Students"
              value="0"
              description="Students in your classes"
              icon={<GraduationCap size={23} />}
            />

            <StatCard
              title="My Subjects"
              value="0"
              description="Assigned subjects"
              icon={<BookOpen size={23} />}
            />

            <StatCard
              title="Attendance"
              value="0%"
              description="Today's attendance"
              icon={<ClipboardCheck size={23} />}
            />

          </div>

          {/* QUICK ACTIONS */}
          <section className="mt-8">

            <div className="mb-4">

              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Actions
              </h2>

              <p className="text-sm text-gray-500">
                Frequently used teaching actions
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <QuickAction
                href="/teacher/attendance"
                icon={<ClipboardCheck size={22} />}
                title="Mark Attendance"
                description="Record today's attendance"
              />

              <QuickAction
                href="/teacher/marks"
                icon={<BookOpen size={22} />}
                title="Enter Marks"
                description="Enter CA and examination marks"
              />

              <QuickAction
                href="/teacher/classes"
                icon={<Users size={22} />}
                title="My Classes"
                description="View your students"
              />

              <QuickAction
                href="/teacher/performance"
                icon={<BarChart3 size={22} />}
                title="View Performance"
                description="Analyze student performance"
              />

            </div>

          </section>

          {/* MIDDLE SECTION */}
          <div className="mt-8 grid gap-6 xl:grid-cols-3">

            {/* TODAY'S CLASSES */}
            <section className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Todays Classes
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your teaching schedule for today
                  </p>
                </div>

                <Link
                  href="/teacher/timetable"
                  className="text-sm font-semibold text-purple-600"
                >
                  View timetable
                </Link>

              </div>

              <div className="mt-5 space-y-3">

                <ClassItem
                  time="08:00 AM"
                  className="No classes scheduled"
                  subject="Your timetable will appear here"
                />

              </div>

            </section>

            {/* ATTENDANCE */}
            <section className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 size={23} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Todays Attendance
                  </h2>

                  <p className="text-sm text-gray-500">
                    Attendance overview
                  </p>
                </div>

              </div>

              <div className="mt-6">

                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-500">
                    Attendance rate
                  </span>

                  <span className="font-bold text-gray-900 dark:text-white">
                    0%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full w-0 rounded-full bg-purple-600" />
                </div>

              </div>

              <Link
                href="/teacher/attendance"
                className="mt-6 flex items-center justify-center rounded-xl bg-purple-700 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                Mark Attendance
              </Link>

            </section>

          </div>

          {/* PERFORMANCE + AI */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {/* PERFORMANCE */}
            <section className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Class Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Monitor your students academic progress
                  </p>
                </div>

                <BarChart3
                  size={22}
                  className="text-purple-600"
                />

              </div>

              <div className="mt-6 flex h-40 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">

                <div className="text-center">

                  <BarChart3
                    size={38}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    Performance data will appear here
                  </p>

                </div>

              </div>

            </section>

            {/* AI */}
            <section className="rounded-2xl border border-purple-100 bg-purple-50 p-6 dark:border-purple-900 dark:bg-purple-950/30">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-700 text-white">
                  <Sparkles size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-purple-900 dark:text-purple-200">
                    AI Teaching Assistant
                  </h2>

                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    Smart recommendations for your classes
                  </p>
                </div>

              </div>

              <p className="mt-5 text-sm leading-6 text-purple-800 dark:text-purple-200">
                Get AI-powered suggestions based on student performance,
                attendance and academic results.
              </p>

              <Link
                href="/teacher/ai-assistant"
                className="mt-5 inline-flex rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                Open AI Assistant
              </Link>

            </section>

          </div>

          {/* RECENT ACTIVITY */}
          <section className="mt-6 rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your latest teaching activities
                </p>
              </div>

              <Activity
                size={22}
                className="text-purple-600"
              />

            </div>

            <div className="mt-5 divide-y dark:divide-gray-800">

              <ActivityItem
                title="No recent activity"
                description="Your teaching activities will appear here."
                time="—"
              />

            </div>

          </section>

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
    <div className="rounded-2xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
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

      <p className="mt-4 text-xs text-gray-400">
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
      className="group rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-900"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-300">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

    </Link>
  );
}


/* =========================================================
   CLASS ITEM
========================================================= */

function ClassItem({
  time,
  className,
  subject,
}: {
  time: string;
  className: string;
  subject: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">

      <div className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
        {time}
      </div>

      <div>
        <p className="font-semibold text-gray-900 dark:text-white">
          {className}
        </p>

        <p className="text-sm text-gray-500">
          {subject}
        </p>
      </div>

    </div>
  );
}


/* =========================================================
   ACTIVITY ITEM
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
    <div className="flex items-center justify-between py-4">

      <div>

        <p className="font-medium text-gray-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>

      </div>

      <span className="text-xs text-gray-400">
        {time}
      </span>

    </div>
  );
}

