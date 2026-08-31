"use client";

import Link from "next/link";
import { useState } from "react";
import {
  X,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  UserRound,
  CalendarDays,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  Menu,
} from "lucide-react";

export default function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  /* =========================
     SIDEBAR STATE
  ========================= */

  const [sidebarOpen, setSidebarOpen] = useState(open ?? false);

  const isControlled = open !== undefined;

  const closeSidebar = () => {
    setSidebarOpen(false);
    if (isControlled) {
      onClose?.();
    }
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };
  /* =========================
     DROPDOWN STATES
  ========================= */

  const [mainMenuOpen, setMainMenuOpen] = useState(true);
  const [communicationOpen, setCommunicationOpen] = useState(true);

  const [systemOpen, setSystemOpen] = useState(true);

  const isOpen = isControlled ? open : sidebarOpen;


  return (
    <>
      {/* =====================================================
          MOBILE MENU BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => {
            if (isControlled) {
              onClose?.();
            } else {
              setSidebarOpen(true);
            }
          }}
        className="
          fixed
          left-4
          top-4
          z-[60]
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-white
          text-gray-700
          shadow-md
          transition
          hover:bg-gray-100

          dark:bg-gray-900
          dark:text-gray-200
          dark:hover:bg-gray-800

          lg:hidden
        "
        aria-label="Open sidebar"
      >
        <Menu size={23} />
      </button>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="
            fixed
            inset-0
            z-40
            bg-black/50
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-72
          border-r
          border-gray-200
          bg-white
          shadow-xl
          transition-transform
          duration-300

          dark:border-gray-800
          dark:bg-gray-900

          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex h-full flex-col">

          {/* =================================================
              HEADER
          ================================================== */}

          <div
            className="
              flex
              h-20
              items-center
              justify-between
              border-b
              border-gray-200
              px-6

              dark:border-gray-800
            "
          >
            {/* LOGO */}

            <Link
              href="/admin/dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-3"
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-purple-700
                  text-white
                "
              >
                <GraduationCap size={26} />
              </div>

              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">
                  GradeFlow
                </h1>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  School Administration
                </p>
              </div>
            </Link>

            {/* MOBILE CLOSE BUTTON */}

            <button
              type="button"
              onClick={closeSidebar}
              className="
                rounded-lg
                p-2
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-900

                dark:text-gray-400
                dark:hover:bg-gray-800
                dark:hover:text-white

                lg:hidden
              "
              aria-label="Close sidebar"
            >
              <X size={21} />
            </button>
          </div>

          {/* =================================================
              NAVIGATION
          ================================================== */}

          <nav className="flex-1 overflow-y-auto px-4 py-5">

            {/* =================================================
                MAIN MENU
            ================================================== */}

            <div className="mb-2">

              <button
                type="button"
                onClick={() => setMainMenuOpen(!mainMenuOpen)}
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider

                  text-purple-900

                  transition
                  hover:bg-purple-50

                  dark:text-purple-300
                  dark:hover:bg-purple-950/30
                "
              >
                <span>Main Menu</span>

                <ChevronDown
                  size={16}
                  className={`
                    transition-transform
                    duration-200
                    ${mainMenuOpen ? "rotate-180" : ""}
                  `}
                />
              </button>

              {mainMenuOpen && (
                <div className="mt-1 space-y-1">

                  <SidebarLink
                    href="/admin/dashboard"
                    icon={<LayoutDashboard size={19} />}
                    label="Dashboard"
                    onClick={closeSidebar}
                  />

                  <SidebarLink
                    href="/admin/accounts"
                    icon={<Users size={19} />}
                    label="Manage Accounts"
                    onClick={closeSidebar}
                  />

                  <SidebarLink
                    href="/admin/academic-management"
                    icon={<BookOpen size={19} />}
                    label="Academic Management"
                    onClick={closeSidebar}
                  />

                 

                  <SidebarLink
                    href="/admin/timetable"
                    icon={<CalendarDays size={19} />}
                    label="Timetable"
                    onClick={closeSidebar}
                  />

                </div>
              )}
            </div>

            {/* =================================================
                COMMUNICATION
            ================================================== */}

            <div className="mb-2 mt-7">

              <button
                type="button"
                onClick={() =>
                  setCommunicationOpen(!communicationOpen)
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider

                  text-purple-900

                  transition
                  hover:bg-purple-50

                  dark:text-purple-300
                  dark:hover:bg-purple-950/30
                "
              >
                <span>Communication</span>

                <ChevronDown
                  size={16}
                  className={`
                    transition-transform
                    duration-200
                    ${
                      communicationOpen
                        ? "rotate-180"
                        : ""
                    }
                  `}
                />
              </button>

              {communicationOpen && (
                <div className="mt-1 space-y-1">

                  <SidebarLink
                    href="/admin/communication/chat"
                    icon={<MessageSquare size={19} />}
                    label="Chat"
                    onClick={closeSidebar}
                  />
                  <SidebarLink
                    href="/admin/communication/forums"
                    icon={<MessageSquare size={19} />}
                    label="Forums"
                    onClick={closeSidebar}
                  />

                  <SidebarLink
                    href="/admin/communication/notifications"
                    icon={<Bell size={19} />}
                    label="Notifications"
                    onClick={closeSidebar}
                  />

                </div>
              )}
            </div>

            {/* =================================================
                SYSTEM
            ================================================== */}

            <div className="mb-2 mt-7">

              <button
                type="button"
                onClick={() => setSystemOpen(!systemOpen)}
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider

                  text-purple-900

                  transition
                  hover:bg-purple-50

                  dark:text-purple-300
                  dark:hover:bg-purple-950/30
                "
              >
                <span>System</span>

                <ChevronDown
                  size={16}
                  className={`
                    transition-transform
                    duration-200
                    ${systemOpen ? "rotate-180" : ""}
                  `}
                />
              </button>

              {systemOpen && (
                <div className="mt-1 space-y-1">

                  <SidebarLink
                    href="/admin/reports"
                    icon={<BarChart3 size={19} />}
                    label="Reports"
                    onClick={closeSidebar}
                  />

                  <SidebarLink
                    href="/admin/predictions"
                    icon={<Settings size={19} />}
                    label="Predictions"
                    onClick={closeSidebar}
                  />
                                    <SidebarLink
                    href="/admin/settings"
                    icon={<Settings size={19} />}
                    label="Settings"
                    onClick={closeSidebar}
                  />

                </div>
              )}
            </div>

          </nav>

        </div>
      </aside>
    </>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="
        group
        mb-1
        flex
        items-center
        gap-3
        rounded-xl
        px-3
        py-3
        text-sm
        font-medium

        text-gray-600

        transition-all
        duration-300

        hover:bg-gradient-to-r
        hover:from-purple-700
        hover:via-violet-600
        hover:to-indigo-600
        hover:text-white
        hover:shadow-md

        dark:text-gray-300

        dark:hover:bg-gradient-to-r
        dark:hover:from-purple-700
        dark:hover:via-violet-600
        dark:hover:to-indigo-600
        dark:hover:text-white
      "
    >
      <span className="transition-colors duration-300 group-hover:text-white">
        {icon}
      </span>

      <span className="transition-colors duration-300 group-hover:text-white">
        {label}
      </span>
    </Link>
  );
}