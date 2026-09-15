"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/parent/dashboard",
    icon: Home,
  },
  {
    label: "My Children",
    href: "/parent/children",
    icon: Users,
  },
  {
    label: "Results",
    href: "/parent/results",
    icon: ClipboardList,
  },
  {
    label: "Attendance",
    href: "/parent/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Timetable",
    href: "/parent/timetable",
    icon: CalendarDays,
  },
  {
    label: "Report Cards",
    href: "/parent/report-cards",
    icon: FileText,
  },
  {
    label: "Notifications",
    href: "/parent/notifications",
    icon: Bell,
  },
  {
    label: "Communication",
    href: "/parent/communication",
    icon: MessageSquare,
  },
  {
    label: "Ella AI",
    href: "/parent/ella-ai",
    icon: Sparkles,
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const [unread, setUnread] = useState(0);

  /* Live unread notification badge (existing notification system). */
  useEffect(() => {
    let cancelled = false;

    async function loadUnread() {
      try {
        const response = await fetch("/api/parent/notifications", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled) setUnread(data.unread ?? 0);
      } catch {
        /* the badge is non-critical */
      }
    }

    loadUnread();

    const interval = setInterval(loadUnread, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
          <Link
            href="/parent/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-lg font-bold text-white">
              G
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                GradeFlow
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Parent Portal
              </p>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-purple-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  <span>{item.label}</span>

                  {item.label === "Notifications" && unread > 0 && (
                    <span
                      className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        isActive
                          ? "bg-white text-purple-700"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                      }`}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <Link
            href="/parent/profile"
            onClick={onClose}
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <UserRound className="h-5 w-5" />
            Profile
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
