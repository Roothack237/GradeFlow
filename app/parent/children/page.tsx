
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Loader2,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  matricule: string;
  gender: string;
  classroom: {
    id: string;
    name: string;
  } | null;
};

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadChildren() {
      try {
        const response = await fetch("/api/parent/dashboard", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load children"
          );
        }

        setChildren(data.children || []);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load children"
        );
      } finally {
        setLoading(false);
      }
    }

    loadChildren();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-72">
        <Navbar
          title="My Children"
          subtitle="View all children linked to your account"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-5 sm:p-8">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={30}
                className="animate-spin text-purple-700"
              />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* No children */}
          {!loading && !error && children.length === 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
              <UserRound
                size={45}
                className="mx-auto mb-4 text-gray-400"
              />

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                No children found
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No students are currently linked to your parent account.
              </p>
            </div>
          )}

          {/* Children */}
          {!loading && !error && children.length > 0 && (
            <>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/parent/children/${child.id}`}
                    className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    {/* Avatar */}
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                      <UserRound size={27} />
                    </div>

                    {/* Child Name */}
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-400">
                      {child.fullName ||
                        `${child.firstName} ${child.lastName}`}
                    </h2>

                    {/* Matricule */}
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Matricule:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {child.matricule}
                      </span>
                    </p>

                    {/* Class */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <BookOpen size={17} className="text-purple-600" />

                      <span>
                        Class:{" "}
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {child.classroom?.name ||
                            "Class not assigned"}
                        </span>
                      </span>
                    </div>

                    {/* Gender */}
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Gender:{" "}
                      <span className="font-medium">
                        {child.gender}
                      </span>
                    </div>

                    {/* View Results */}
                    <div className="mt-6 border-t border-gray-100 pt-4 text-sm font-semibold text-purple-700 dark:border-gray-800 dark:text-purple-400">
                      View Results →
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}




