"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";

import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* SIDEBAR */}
      <TeacherSidebar />

      {/* MAIN CONTENT */}
      <main className="min-h-screen p-0">
        {/* NAVBAR */}
        

        {/* CONTENT */}
        <div className="mx-auto max-w-7xl p-6 sm:p-8">
          {/* WELCOME */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, Teacher
              </h2>
              <span className="text-2xl">👋</span>
            </div>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Here&apos;s an overview of your teaching activities.
            </p>
          </div>

          {/* STATISTICS */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Frequently used teaching actions
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* TODAY'S CLASSES */}
            <section className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Today&apos;s Classes
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your teaching schedule for today
                  </p>
                </div>

                <Link
                  href="/teacher/timetable"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 size={23} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Today&apos;s Attendance
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Attendance overview
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-500">Attendance rate</span>

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
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* PERFORMANCE */}
            <section className="rounded-2xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Class Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Monitor your students&apos; academic progress
                  </p>
                </div>

                <BarChart3 size={22} className="text-purple-600" />
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white">
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

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your latest teaching activities
                </p>
              </div>

              <Activity size={22} className="text-purple-600" />
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
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
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
  icon: ReactNode;
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

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
      <div className="shrink-0 rounded-lg bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
        {time}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">
          {className}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400">
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
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-medium text-gray-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <span className="shrink-0 text-xs text-gray-400">
        {time}
      </span>
    </div>
  );
}