"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";
import ForumBrowser from "@/components/forum/ForumBrowser";

export default function ParentCommunicationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Communication"
          subtitle="School forums reserved for parents and families."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                Communication
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Discuss with the school community in the general forums. Staff
                forums are reserved for teachers and administrators.
              </p>
            </div>

            <ForumBrowser portal="parent" />

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-400 dark:text-gray-500">
              <MessagesSquare size={13} />
              Posts and replies are stored in the school database and refresh in
              near real time.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
