"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Loader2,
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import NavBar from "@/components/admin/NavBar";

type Classroom = {
  id: string;
  name: string;
  section: {
    id: string;
    name: string;
  };
  _count: {
    students: number;
  };
};

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/classes");

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        const text = await response.text();

        console.error("SERVER RESPONSE:", text);

        throw new Error("Server returned an unexpected response.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load classes.");
      }

      setClasses(data.classes || []);
    } catch (error) {
      console.error("LOAD CLASSES ERROR:", error);
      setError("Unable to load classes.");
    } finally {
      setLoading(false);
    }
  }

  const filteredClasses = classes.filter((classroom) => {
    const searchTerm = search.toLowerCase();

    return (
      classroom.name.toLowerCase().includes(searchTerm) ||
      classroom.section.name.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="lg:ml-64">
        {/* NAVBAR */}
        <NavBar
          onMenuClick={() => setSidebarOpen(true)}
          title="Manage Classes"
          subtitle="View and manage all school classes"
        />

        {/* PAGE CONTENT */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">

            {/* PAGE HEADER */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <BookOpen size={24} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      All Classes
                    </h1>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      All Anglophone and Francophone classes are displayed here.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/academic-years/classes"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                <Plus size={18} />
                Add Class
              </Link>
            </div>

            {/* SEARCH */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search class or section..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-950"
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            {/* LOADING */}
            {loading ? (
              <div className="flex min-h-300px items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Loader2 size={22} className="animate-spin" />
                  Loading classes...
                </div>
              </div>
            ) : filteredClasses.length === 0 ? (
              /* EMPTY */
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                <BookOpen
                  size={40}
                  className="mx-auto mb-4 text-gray-400"
                />

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No classes found
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {search
                    ? "No classes match your search."
                    : "No classes have been created yet."}
                </p>

                {!search && (
                  <Link
                    href="/admin/classes/add"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-800"
                  >
                    <Plus size={18} />
                    Add Class
                  </Link>
                )}
              </div>
            ) : (
              /* CLASSES TABLE */
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Class
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Section
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Students
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredClasses.map((classroom) => (
                        <tr
                          key={classroom.id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          {/* CLASS */}
                          <td className="px-6 py-5">
                            <Link
                              href={`/admin/classes/${classroom.id}/students`}
                              className="group flex items-center gap-3"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 transition group-hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:group-hover:bg-purple-900/50">
                                <BookOpen size={19} />
                              </div>

                              <div>
                                <span className="font-semibold text-gray-900 group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
                                  {classroom.name}
                                </span>

                                <p className="mt-1 text-xs text-gray-400">
                                  Click to view students
                                </p>
                              </div>
                            </Link>
                          </td>

                          {/* SECTION */}
                          <td className="px-6 py-5">
                            <span
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                classroom.section.name === "ANGLOPHONE"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                              }`}
                            >
                              {classroom.section.name}
                            </span>
                          </td>

                          {/* STUDENTS */}
                          <td className="px-6 py-5">
                            <Link
                              href={`/admin/classes/${classroom.id}/students`}
                              className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-purple-700 dark:text-gray-300 dark:hover:text-purple-300"
                            >
                              <Users size={17} />

                              <span>
                                {classroom._count.students} student
                                {classroom._count.students !== 1 ? "s" : ""}
                              </span>
                            </Link>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/classes/${classroom.id}/edit`}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                title="Edit class"
                              >
                                <Pencil size={18} />
                              </Link>

                              <button
                                type="button"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                title="Delete class"
                                onClick={() =>
                                  alert(
                                    "Delete functionality will be added next."
                                  )
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}