
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Moon, Sun } from "lucide-react";
import Link from "next/link";

interface TeacherNavbarProps {
  title: string;
  subtitle: string;
  teacherName?: string;
  /**
   * Accepted for compatibility with pages that render the navbar inside a
   * layout. The teacher sidebar manages its own open state.
   */
  onMenuClick?: () => void;
}

export default function TeacherNavbar({
  title,
  subtitle,
  teacherName = "Teacher",
}: TeacherNavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);  

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const initials = teacherName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex h-full items-center justify-between px-5 sm:px-8">

        {/* PAGE TITLE */}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>

          <p className="mt-1 hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
            {subtitle}
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* THEME */}
         <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun size={21} />
              ) : (
                <Moon size={21} />
              )
            ) : (
              <div className="h-21px w-21px" />
            )}
          </button>

          {/* NOTIFICATIONS */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Notifications"
          >
            <Bell size={21} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* DIVIDER */}
          <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

          {/* TEACHER PROFILE */}
          <Link
            href="/teacher/profile"
            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            title="View Profile"
          >
            {/* PROFILE INITIAL */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {initials}
            </div>

            {/* TEACHER NAME */}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {teacherName}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Teacher
              </p>
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
}

