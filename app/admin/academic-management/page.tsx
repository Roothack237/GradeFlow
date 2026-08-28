"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";
import { useState } from "react";

export default function AcademicManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-72">

        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-7xl">

            <div className="mb-8">
              

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Academic Management
              </h1>

              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Manage academic years, classes and subjects.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              <ManagementCard
                href="/admin/academic-years"
                icon={<CalendarDays size={28} />}
                title="Academic Years"
                description="Create and manage academic years and set the current academic year."
              />

              <ManagementCard
                href="/admin/classes"
                icon={<GraduationCap size={28} />}
                title="Classes"
                description="View and create classes according to the Anglophone or Francophone section."
              />

              <ManagementCard
                href="/admin/subjects"
                icon={<BookOpen size={28} />}
                title="Subjects"
                description="View existing subjects and create new subjects with their coefficients."
              />

            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

function ManagementCard({
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
      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-800 dark:bg-[#111827] dark:hover:border-purple-700"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white dark:bg-purple-900/40 dark:text-purple-300 dark:group-hover:bg-purple-700 dark:group-hover:text-white">
        {icon}
      </div>

      <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
        {description}
      </p>

      <div className="mt-5 text-sm font-semibold text-purple-600 dark:text-purple-400">
        Manage →
      </div>
    </Link>
  );
}