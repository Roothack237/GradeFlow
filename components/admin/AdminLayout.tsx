"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./SideBar";
import Navbar from "./NavBar";

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;           
};

export default function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-[#030712]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-287px">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        <main className="min-h-[calc(100vh-82px)] bg-[#030712] p-5 text-white sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}