"use client";

import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Menu  } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface NavbarProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
}

type AdminIdentity = {
  fullName: string;
  email: string;
  image: string | null;
  unreadNotifications: number;
  currentTerm: { name: string; academicYear: string } | null;
};

export default function Navbar({
  onMenuClick,
  title = "Administrator Dashboard",
  subtitle = "Monitor and manage your school from one place.",
}: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadIdentity = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/me", { cache: "no-store" });

      if (!response.ok) return;

      setIdentity(await response.json());
    } catch {
      /* navbar identity is non-critical */
    }
  }, []);

  useEffect(() => {
    loadIdentity();
  }, [loadIdentity]);

  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  const initials = (identity?.fullName ?? "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex h-full items-center justify-between gap-3 px-5 sm:px-8">

        <div className="flex min-w-0 items-center gap-3">

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              {title}
            </h1>

            <p className="hidden truncate text-sm text-gray-500 dark:text-gray-400 sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">

          {/* CURRENT TERM */}
          {identity?.currentTerm ? (
            <span className="hidden rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 xl:inline-block dark:bg-purple-950/50 dark:text-purple-300">
              {identity.currentTerm.academicYear} · {identity.currentTerm.name}
            </span>
          ) : null}

          {/* THEME */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-purple-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-purple-300"
            title="Toggle theme"
          >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun size={21} />
            ) : (
              <Moon size={21} />
            )
          ) : (
            <Moon size={21} />
          )}
          </button>

          {/* NOTIFICATIONS */}
          <Link
            href="/admin/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Notifications"
          >
            <Bell size={21} />

            {identity && identity.unreadNotifications > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {identity.unreadNotifications > 99
                  ? "99+"
                  : identity.unreadNotifications}
              </span>
            ) : null}
          </Link>

          {/* DIVIDER */}
          <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

          {/* ADMIN PROFILE */}
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Administrator settings"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-purple-900/60 font-bold text-purple-300">
              {identity?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={identity.image}
                  alt={identity.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "A"
              )}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                {identity?.fullName ?? "Administrator"}
              </p>

              <p className="max-w-[140px] truncate text-xs text-gray-500 dark:text-gray-400">
                {identity?.email ?? "School Admin"}
              </p>
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
}
