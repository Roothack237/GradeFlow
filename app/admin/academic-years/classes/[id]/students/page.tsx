"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  UserRound,
  Users,
  RefreshCw,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Student = {
  id: string;
  name: string;
  email?: string | null;
  matricule?: string | null;
  gender?: string | null;
};

type Classroom = {
  id: string;
  name: string;
  section: {
    name: "ANGLOPHONE" | "FRANCOPHONE";
  };
};

export default function ClassStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [students, setStudents] = useState<Student[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [id]);

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/classes/${id}/students`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load students"
        );
      }

      setClassroom(data.classroom);
      setStudents(data.students || []);
    } catch (error) {
      console.error("LOAD STUDENTS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter((student) => {
    const value = search.toLowerCase().trim();

    if (!value) return true;

    return (
      student.name?.toLowerCase().includes(value) ||
      student.matricule?.toLowerCase().includes(value) ||
      student.email?.toLowerCase().includes(value) ||
      student.gender?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN CONTENT */}
      <div className="min-h-screen lg:ml-72">
        {/* NAVBAR */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Class Students"
          subtitle="View students enrolled in this class"
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">

            {/* BACK BUTTON */}
            <Link
              href="/academic-years/classes"
              className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Classes
            </Link>

            {/* CLASS HEADER */}
            {classroom && (
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Users size={28} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {classroom.name}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {classroom.section.name} Section
                    </p>
                  </div>
                </div>

                {/* REFRESH */}
                <button
                  onClick={loadStudents}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-700 dark:hover:text-purple-400"
                >
                  <RefreshCw
                    size={17}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                <span>{error}</span>

                <button
                  onClick={loadStudents}
                  className="font-semibold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* SEARCH */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students by name, matricule, email or gender..."
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* STUDENTS TABLE */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

              {/* TABLE HEADER */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Students
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {loading
                      ? "Loading..."
                      : `${filteredStudents.length} student${
                          filteredStudents.length !== 1 ? "s" : ""
                        }`}
                  </p>
                </div>

                {!loading && students.length > 0 && (
                  <div className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {students.length} Total
                  </div>
                )}
              </div>

              {/* LOADING */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <RefreshCw
                      size={22}
                      className="animate-spin text-purple-600"
                    />
                  </div>

                  <p className="text-gray-500 dark:text-gray-400">
                    Loading students...
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                /* EMPTY */
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                    <UserRound size={25} />
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                    {search
                      ? "No students found"
                      : "No students in this class"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {search
                      ? "Try a different search term."
                      : "There are no students registered in this class yet."}
                  </p>
                </div>
              ) : (
                /* TABLE */
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                      <tr>
                        <th className="px-6 py-4">
                          Student
                        </th>

                        <th className="px-6 py-4">
                          Matricule
                        </th>

                        <th className="px-6 py-4">
                          Gender
                        </th>

                        <th className="px-6 py-4">
                          Email
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        >
                          {/* STUDENT */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                {student.name
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </div>

                              <span className="font-medium text-gray-900 dark:text-white">
                                {student.name}
                              </span>
                            </div>
                          </td>

                          {/* MATRICULE */}
                          <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                            {student.matricule || "—"}
                          </td>

                          {/* GENDER */}
                          <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                            {student.gender || "—"}
                          </td>

                          {/* EMAIL */}
                          <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                            {student.email || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}