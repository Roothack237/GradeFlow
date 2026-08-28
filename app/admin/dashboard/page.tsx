"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  UserRound,
  BookOpen,
  BarChart3,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

export default function AdminDashboardPage() {
  /* SIDEBAR STATE */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* DASHBOARD STATISTICS */
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    classes: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  /* FETCH DASHBOARD STATISTICS */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);

        const response = await fetch(
          "/api/admin/dashboard/stats",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch dashboard statistics"
          );
        }

        const data = await response.json();

        setStats({
          students: Number(data.students ?? 0),
          teachers: Number(data.teachers ?? 0),
          parents: Number(data.parents ?? 0),
          classes: Number(data.classes ?? 0),
        });
      } catch (error) {
        console.error(
          "Failed to load dashboard statistics:",
          error
        );
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">

      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN */}
      <div className="min-h-screen lg:ml-72">

        {/* NAVBAR */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Administrator Dashboard"
          subtitle="Monitor and manage your school from one place."
        />

        {/* CONTENT */}
        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-7xl">

            {/* WELCOME */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Good morning, Administrator 👋
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Here&apos;s an overview of your school&apos;s activities.
              </p>
            </section>

            {/* STATISTICS */}
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total Students"
                value={
                  loadingStats
                    ? "..."
                    : stats.students.toString()
                }
                description="Currently enrolled"
                icon={<GraduationCap size={23} />}
              />

              <StatCard
                title="Total Teachers"
                value={
                  loadingStats
                    ? "..."
                    : stats.teachers.toString()
                }
                description="Active teachers"
                icon={<Users size={23} />}
              />

              <StatCard
                title="Total Parents"
                value={
                  loadingStats
                    ? "..."
                    : stats.parents.toString()
                }
                description="Registered parents"
                icon={<UserRound size={23} />}
              />

              <StatCard
                title="Total Classes"
                value={
                  loadingStats
                    ? "..."
                    : stats.classes.toString()
                }
                description="Across 2 sections"
                icon={<BookOpen size={23} />}
              />

            </section>

            {/* QUICK ACTIONS HEADER */}
            <section className="mt-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Frequently used administrative actions
              </p>
            </section>

            {/* QUICK ACTIONS */}
            <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <ActionCard
                href="/admin/accounts/teachers/add"
                title="Add Teacher"
                description="Create a teacher account"
                icon={<Users size={22} />}
              />

              <ActionCard
                href="/admin/accounts/parents/add"
                title="Add Parent"
                description="Create a parent account"
                icon={<UserRound size={22} />}
              />

              <ActionCard
                href="/admin/classes"
                title="Manage Classes"
                description="Manage school structure"
                icon={<BookOpen size={22} />}
              />

              <ActionCard
                href="/admin/results"
                title="View Results"
                description="Monitor academic results"
                icon={<BarChart3 size={22} />}
              />

            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */

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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-[#111827]">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
          {icon}
        </div>

      </div>

      <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
        {description}
      </p>

    </div>
  );
}

/* =========================
   ACTION CARD
========================= */

/* =========================
   ACTION CARD
========================= */

function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        group
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-transparent
        hover:bg-linear-to-r
        hover:from-purple-700
        hover:via-violet-600
        hover:to-indigo-600
        hover:text-white
        hover:shadow-lg

        dark:border-gray-800
        dark:bg-[#111827]
        dark:hover:border-transparent
        dark:hover:bg-linear-to-r
        dark:hover:from-purple-700
        dark:hover:via-violet-600
        dark:hover:to-indigo-600
      "
    >

      {/* ICON */}
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl

          bg-purple-100
          text-purple-700

          transition-all
          duration-300

          group-hover:bg-white/20
          group-hover:text-white

          dark:bg-purple-900/50
          dark:text-purple-300
          dark:group-hover:bg-white/20
          dark:group-hover:text-white
        "
      >
        {icon}
      </div>

      {/* TITLE */}
      <h3
        className="
          mt-5
          font-bold
          text-gray-900
          transition-colors
          duration-300

          group-hover:text-white

          dark:text-white
          dark:group-hover:text-white
        "
      >
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p
        className="
          mt-2
          text-sm
          text-gray-500
          transition-colors
          duration-300

          group-hover:text-white

          dark:text-gray-400
          dark:group-hover:text-white
        "
      >
        {description}
      </p>

    </Link>
  );
}