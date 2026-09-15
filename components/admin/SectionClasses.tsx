"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  Users,
  UserRound,
} from "lucide-react";

type ClassCard = {
  id: string;
  name: string;
  section: { name: string };
  _count: { students: number };
  assignments: {
    id: string;
    subject: { name: string };
    teacher: { fullName: string };
  }[];
};

/**
 * The classes of one section inside one academic year (Phase 8).
 * Everything is loaded from /api/admin/classes — no hardcoded class list.
 */
export default function SectionClasses({
  academicYearId,
  sectionId,
  basePath,
  termId,
}: {
  academicYearId: string;
  sectionId: string;
  basePath: string;
  termId?: string;
}) {
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const params = new URLSearchParams({
        sectionId,
        academicYearId,
      });

      const response = await fetch(`/api/admin/classes?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load the classes.");
      }

      setClasses(data.classes ?? []);
    } catch (err) {
      console.error("Section Classes Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load the classes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sectionId, academicYearId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading classes...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {classes.length} class{classes.length === 1 ? "" : "es"} in this
          section for the selected academic year.
        </p>

        <button
          type="button"
          onClick={loadClasses}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <GraduationCap size={40} className="mx-auto text-gray-300 dark:text-gray-600" />

          <h2 className="mt-4 text-lg font-bold">No class yet</h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No class of this section exists for this academic year. Create
            classes from the Classes page.
          </p>

          <Link
            href="/admin/classes/add"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            Create a class
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => {
            const subjects = new Set(klass.assignments.map((a) => a.subject.name));
            const teachers = new Set(klass.assignments.map((a) => a.teacher.fullName));

            const detailHref = termId
              ? `${basePath}/classes/${klass.id}?termId=${termId}`
              : `${basePath}/classes/${klass.id}`;

            return (
              <Link
                key={klass.id}
                href={detailHref}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    <GraduationCap size={21} />
                  </div>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {klass.section.name === "ANGLOPHONE" ? "Anglophone" : "Francophone"}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold">{klass.name}</h3>

                <div className="mt-3 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <p className="flex items-center gap-2">
                    <Users size={14} />
                    {klass._count.students} students
                  </p>

                  <p className="flex items-center gap-2">
                    <BookOpen size={14} />
                    {subjects.size} subjects
                  </p>

                  <p className="flex items-center gap-2">
                    <UserRound size={14} />
                    {teachers.size} teachers
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                  View class details
                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
