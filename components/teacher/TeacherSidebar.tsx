"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  X,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  MessageSquare,
  Bell,
  BarChart3,
  Activity,
  Sparkles,
  UserRound,
  Menu,
  LogOut,
} from "lucide-react";

export default function TeacherSidebar() {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [mainMenuOpen, setMainMenuOpen] = useState(true);
  const [academicOpen, setAcademicOpen] = useState(true);
  const [communicationOpen, setCommunicationOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={23} />
      </button>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          border-r border-gray-200 bg-white shadow-xl
          transition-transform duration-300
          dark:border-gray-800 dark:bg-gray-900
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex h-full flex-col">

          {/* HEADER */}
          <div className="flex h-20 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
            <Link
              href="/teacher/dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-700 text-white">
                <GraduationCap size={26} />
              </div>

              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">
                  GradeFlow
                </h1>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Teacher Portal
                </p>
              </div>
            </Link>

            {/* MOBILE CLOSE */}
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={21} />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">

            {/* MAIN MENU */}
            <SidebarSection
              title="Main Menu"
              open={mainMenuOpen}
              onToggle={() => setMainMenuOpen(!mainMenuOpen)}
            >
              <SidebarLink
                href="/teacher/dashboard"
                icon={<LayoutDashboard size={19} />}
                label="Dashboard"
                active={pathname === "/teacher/dashboard"}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/classes"
                icon={<Users size={19} />}
                label="My Classes"
                active={pathname.startsWith("/teacher/classes")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/attendance"
                icon={<ClipboardCheck size={19} />}
                label="Attendance"
                active={pathname.startsWith("/teacher/attendance")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/marks"
                icon={<BookOpen size={19} />}
                label="Marks"
                active={pathname.startsWith("/teacher/marks")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/timetable"
                icon={<CalendarDays size={19} />}
                label="Timetable"
                active={pathname.startsWith("/teacher/timetable")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/availability"
                icon={<Clock3 size={19} />}
                label="My Availability"
                active={pathname.startsWith("/teacher/availability")}
                onClick={closeSidebar}
              />
            </SidebarSection>

            {/* ACADEMIC */}
            <SidebarSection
              title="Academic"
              open={academicOpen}
              onToggle={() => setAcademicOpen(!academicOpen)}
            >
              <SidebarLink
                href="/teacher/performance"
                icon={<BarChart3 size={19} />}
                label="Performance"
                active={pathname.startsWith("/teacher/performance")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/analytics"
                icon={<Activity size={19} />}
                label="Class Analytics"
                active={pathname.startsWith("/teacher/analytics")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/ai-assistant"
                icon={<Sparkles size={19} />}
                label="AI Assistant"
                active={pathname.startsWith("/teacher/ai-assistant")}
                onClick={closeSidebar}
              />
            </SidebarSection>

            {/* COMMUNICATION */}
            <SidebarSection
              title="Communication"
              open={communicationOpen}
              onToggle={() =>
                setCommunicationOpen(!communicationOpen)
              }
            >
              <SidebarLink
                href="/teacher/messages"
                icon={<MessageSquare size={19} />}
                label="Parent Messages"
                active={pathname.startsWith("/teacher/messages")}
                onClick={closeSidebar}
              />

              <SidebarLink
                href="/teacher/notifications"
                icon={<Bell size={19} />}
                label="Notifications"
                active={pathname.startsWith("/teacher/notifications")}
                onClick={closeSidebar}
              />
            </SidebarSection>

            {/* ACCOUNT */}
            <SidebarSection
              title="Account"
              open={accountOpen}
              onToggle={() => setAccountOpen(!accountOpen)}
            >
              <SidebarLink
                href="/teacher/profile"
                icon={<UserRound size={19} />}
                label="My Profile"
                active={pathname.startsWith("/teacher/profile")}
                onClick={closeSidebar}
              />
            </SidebarSection>
          </nav>

          {/* TEACHER PROFILE */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                T
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  Teacher
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Teacher Account
                </p>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   SIDEBAR SECTION
========================================================= */

function SidebarSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-purple-900 transition hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/30"
      >
        <span>{title}</span>

        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-1 space-y-1">
          {children}
        </div>
      )}
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
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group mb-1 flex items-center gap-3 rounded-xl
        px-3 py-3 text-sm font-medium
        transition-all duration-300

        ${
          active
            ? "bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 text-white shadow-md"
            : "text-gray-600 hover:bg-gradient-to-r hover:from-purple-700 hover:via-violet-600 hover:to-indigo-600 hover:text-white hover:shadow-md dark:text-gray-300"
        }
      `}
    >
      <span
        className={`transition-colors duration-300 ${
          active ? "text-white" : "group-hover:text-white"
        }`}
      >
        {icon}
      </span>

      <span
        className={`transition-colors duration-300 ${
          active ? "text-white" : "group-hover:text-white"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}