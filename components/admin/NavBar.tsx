"use client";

import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Menu} from "lucide-react";
import { useEffect, useState } from "react";


interface NavbarProps {
  onMenuClick: () => void;
  title: string;
  subtitle: string;
}

export default function Navbar({
  onMenuClick,
  title,
  subtitle,
}: NavbarProps) {
 
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

  const { resolvedTheme, setTheme } = useTheme();

function toggleTheme() {
  setTheme(resolvedTheme === "dark" ? "light" : "dark");
}

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex h-full items-center justify-between px-5 sm:px-8">
       
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

        </div>
        {/* TITLE */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-xl">
            Administrator Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage your school from one place.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
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

          {/* NOTIFICATION */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Bell size={21} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* DIVIDER */}
          <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

          {/* ADMIN */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-900/60 font-bold text-purple-300">
              A
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Administrator
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                School Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}