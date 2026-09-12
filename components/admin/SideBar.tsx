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
  UserRound,
  CalendarDays,
  CalendarRange,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  Menu,
  ClipboardList,
  NotebookPen,
  TrendingUp,
  Sparkles,
  MessagesSquare,
  History,
  School,
} from "lucide-react";

/* =========================================================
   NAVIGATION MODEL
========================================================= */

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    title: "Main Menu",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={19} />,
      },
      { href: "/admin/students", label: "Students", icon: <Users size={19} /> },
      {
        href: "/admin/teachers",
        label: "Teachers",
        icon: <UserRound size={19} />,
      },
      {
        href: "/admin/parents",
        label: "Parents",
        icon: <Users size={19} />,
      },
    ],
  },
  {
    id: "academic",
    title: "Academic",
    items: [
      { href: "/admin/classes", label: "Classes", icon: <School size={19} /> },
      {
        href: "/admin/subjects",
        label: "Subjects",
        icon: <BookOpen size={19} />,
      },
      {
        href: "/admin/academic-years",
        label: "Academic Years",
        icon: <CalendarDays size={19} />,
      },
      {
        href: "/admin/terms",
        label: "Terms & Sequences",
        icon: <CalendarRange size={19} />,
      },
      {
        href: "/admin/assignments",
        label: "Teacher Assignments",
        icon: <ClipboardList size={19} />,
      },
      {
        href: "/admin/timetable",
        label: "Timetable",
        icon: <CalendarDays size={19} />,
      },
    ],
  },
  {
    id: "records",
    title: "Records & Analysis",
    items: [
      {
        href: "/admin/attendance",
        label: "Attendance",
        icon: <ClipboardList size={19} />,
      },
      {
        href: "/admin/results",
        label: "Results",
        icon: <NotebookPen size={19} />,
      },
      {
        href: "/admin/reports",
        label: "Reports",
        icon: <BarChart3 size={19} />,
      },
      {
        href: "/admin/predictions",
        label: "Predictions",
        icon: <TrendingUp size={19} />,
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    items: [
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: <Bell size={19} />,
      },
      {
        href: "/admin/forum",
        label: "Forum",
        icon: <MessagesSquare size={19} />,
      },
      {
        href: "/admin/communication/chat",
        label: "Chat",
        icon: <MessageSquare size={19} />,
      },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      {
        href: "/admin/ai",
        label: "AI Assistant",
        icon: <Sparkles size={19} />,
      },
      {
        href: "/admin/activity",
        label: "Activity Log",
        icon: <History size={19} />,
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: <Settings size={19} />,
      },
    ],
  },
];

/* =========================================================
   SIDEBAR
========================================================= */

export default function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(open ?? false);

  const isControlled = open !== undefined;

  const closeSidebar = () => {
    setSidebarOpen(false);
    if (isControlled) {
      onClose?.();
    }
  };

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isOpen = isControlled ? open : sidebarOpen;

  const toggleGroup = (id: string) =>
    setCollapsed((previous) => ({ ...previous, [id]: !previous[id] }));

  return (
    <>
      {/* MOBILE MENU BUTTON */}

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
          fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center
          rounded-xl bg-white text-gray-700 shadow-md transition hover:bg-gray-100
          dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 lg:hidden
        "
        aria-label="Open sidebar"
      >
        <Menu size={23} />
      </button>

      {/* MOBILE OVERLAY */}

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white
          shadow-xl transition-transform duration-300
          dark:border-gray-800 dark:bg-gray-900
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col">

          {/* HEADER */}

          <div className="flex h-20 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
            <Link href="/admin/dashboard" onClick={closeSidebar} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-700 text-white">
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
            {NAV_GROUPS.map((group) => {
              const isCollapsed = collapsed[group.id] === true;

              return (
                <div key={group.id} className="mb-2 mt-5 first:mt-0">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="
                      flex w-full items-center justify-between rounded-xl px-3 py-3
                      text-left text-[11px] font-bold uppercase tracking-wider
                      text-purple-900 transition hover:bg-purple-50
                      dark:text-purple-300 dark:hover:bg-purple-950/30
                    "
                  >
                    <span>{group.title}</span>

                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isCollapsed ? "" : "rotate-180"
                      }`}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => (
                        <SidebarLink
                          key={item.href}
                          {...item}
                          active={isActive(pathname, item.href)}
                          onClick={closeSidebar}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </div>
      </aside>
    </>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;

  return pathname.startsWith(`${href}/`);
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`
        group mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium
        transition-all duration-300
        ${
          active
            ? "bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 text-white shadow-md"
            : "text-gray-600 hover:bg-gradient-to-r hover:from-purple-700 hover:via-violet-600 hover:to-indigo-600 hover:text-white hover:shadow-md dark:text-gray-300"
        }
      `}
    >
      <span className={active ? "text-white" : "transition-colors duration-300 group-hover:text-white"}>
        {icon}
      </span>

      <span className={active ? "text-white" : "transition-colors duration-300 group-hover:text-white"}>
        {label}
      </span>
    </Link>
  );
}
