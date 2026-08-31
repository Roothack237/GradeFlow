"use client";

import { useState } from "react";
import {
Bell,
Menu,
Search,
UserRound,
} from "lucide-react";

type NavbarProps = {
title: string;
subtitle?: string;
onMenuClick: () => void;
};

export default function Navbar({
title,
subtitle,
onMenuClick,
}: NavbarProps) {
const [showNotifications, setShowNotifications] =
useState(false);

return ( <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"> <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8">
{/* Left */} <div className="flex min-w-0 items-center gap-4"> <button
         type="button"
         onClick={onMenuClick}
         className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
       > <Menu className="h-6 w-6" /> </button>

```
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="hidden truncate text-sm text-gray-500 sm:block dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    {/* Right */}
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

        <input
          type="text"
          placeholder="Search..."
          className="w-48 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 lg:w-64 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800"
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setShowNotifications(!showNotifications)
          }
          className="relative rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>

              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                3 new
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Results Published
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Term 1 results are now available.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Attendance Alert
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your child has recent absences.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Parent-Teacher Meeting
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Meeting scheduled for Friday.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          PT
        </div>

        <div className="hidden text-left lg:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Parent
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Account
          </p>
        </div>

        <UserRound className="hidden h-4 w-4 text-gray-400 lg:block" />
      </button>
    </div>
  </div>
</header>


);
}
