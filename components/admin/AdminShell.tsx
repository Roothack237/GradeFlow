"use client";

import { ReactNode, useState } from "react";
import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

/**
 * Shared chrome for Admin pages: sidebar + navbar + content area.
 * Keeps every admin screen visually identical and responsive.
 */
export default function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
