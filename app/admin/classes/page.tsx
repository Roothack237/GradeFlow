"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ChevronRight,
  Users,
  Plus,
} from "lucide-react";

import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";

interface Section {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface Classroom {
  id: string;
  name: string;
  section: Section | null;
  academicYear: AcademicYear;
  _count: {
    students: number;
  };
}

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [academicYear, setAcademicYear] = useState("2026/2027");

  useEffect(() => {
    loadClasses();
  }, [academicYear]);

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/classes?academicYear=${encodeURIComponent(
          academicYear
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load classes");
      }

      setClasses(data.classes || []);
    } catch (error) {
      console.error("LOAD CLASSES ERROR:", error);
      setError("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }

  const anglophoneClasses = classes.filter((classroom) => {
    const section = classroom.section?.name?.toLowerCase() || "";

    return (
      section.includes("anglo") ||
      section.includes("english")
    );
  });

  const francophoneClasses = classes.filter((classroom) => {
    const section = classroom.section?.name?.toLowerCase() || "";

    return (
      section.includes("franco") ||
      section.includes("french")
    );
  });

  const otherClasses = classes.filter((classroom) => {
    const section = classroom.section?.name?.toLowerCase() || "";

    return (
      !section.includes("anglo") &&
      !section.includes("english") &&
      !section.includes("franco") &&
      !section.includes("french")
    );
  });

  const renderClassCards = (sectionClasses: Classroom[]) => {
    if (sectionClasses.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No classes found in this section.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sectionClasses.map((classroom) => (
          <Link
            key={classroom.id}
            href={`/admin/classes/${classroom.id}`}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {classroom.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {classroom.section?.name || "No section"}
                </p>
              </div>

              <ChevronRight
                size={20}
                className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-purple-600"
              />
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users size={17} />

              <span>
                {classroom._count.students}{" "}
                {classroom._count.students === 1
                  ? "student"
                  : "students"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="lg:pl-64">
        <Navbar />

        <main className="p-4 sm:p-6 lg:p-8">
          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Classes
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage school classes and view their students.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {/* Academic Year */}
              <div>
                <label
                  htmlFor="academicYear"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Academic Year
                </label>

                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) =>
                    setAcademicYear(e.target.value)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="2025/2026">
                    2025/2026
                  </option>

                  <option value="2026/2027">
                    2026/2027
                  </option>
                </select>
              </div>

              {/* Add Class */}
              <Link
                href="/admin/classes/add"
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
              >
                <Plus size={18} />
                Add Class
              </Link>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <Loader2
                  size={22}
                  className="animate-spin"
                />
                Loading classes...
              </div>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <p>{error}</p>

              <button
                onClick={loadClasses}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* CONTENT */}
          {!loading && !error && (
            <div className="space-y-10">
              {/* ANGLOPHONE */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-purple-600" />

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Anglophone Section
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      English-speaking section
                    </p>
                  </div>
                </div>

                {renderClassCards(anglophoneClasses)}
              </section>

              {/* FRANCOPHONE */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-purple-600" />

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Francophone Section
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      French-speaking section
                    </p>
                  </div>
                </div>

                {renderClassCards(francophoneClasses)}
              </section>

              {/* OTHER */}
              {otherClasses.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-gray-500" />

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Other Classes
                      </h2>
                    </div>
                  </div>

                  {renderClassCards(otherClasses)}
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}