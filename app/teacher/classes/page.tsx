"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Assignment = {
  id: string;
  section?: {
    id: string;
    name: string;
  } | null;
  classroom?: {
    id: string;
    name: string;
  } | null;
  subject?: {
    id: string;
    name: string;
  } | null;
};

type ClassData = {
  id: string;
  name: string;
  section: string;
  subjects: string[];
};

export default function TeacherClassesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teacher/assignments", {
        cache: "no-store",
      });

      const text = await response.text();

      let data: unknown;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        const errorData = data as { error?: string };

        throw new Error(
          errorData.error || "Failed to load your assignments."
        );
      }

      const responseData = data as
        | Assignment[]
        | { assignments?: Assignment[] };

      const assignmentList = Array.isArray(responseData)
        ? responseData
        : responseData.assignments || [];

      setAssignments(assignmentList);
    } catch (err) {
      console.error("Teacher Classes Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your classes."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Group the teacher's assignments by classroom.
   *
   * Example:
   *
   * Form 1 A → Mathematics
   * Form 1 A → English
   * Form 1 A → Computer Science
   *
   * becomes one class:
   *
   * Form 1 A
   * Mathematics
   * English
   * Computer Science
   */
  const classes = useMemo<ClassData[]>(() => {
    const classMap = new Map<string, ClassData>();

    assignments.forEach((assignment) => {
      if (!assignment.classroom) return;

      const classroomId = assignment.classroom.id;

      if (!classMap.has(classroomId)) {
        classMap.set(classroomId, {
          id: classroomId,
          name: assignment.classroom.name,
          section: assignment.section?.name || "No section",
          subjects: [],
        });
      }

      const currentClass = classMap.get(classroomId)!;

      if (
        assignment.subject?.name &&
        !currentClass.subjects.includes(assignment.subject.name)
      ) {
        currentClass.subjects.push(assignment.subject.name);
      }
    });

    return Array.from(classMap.values());
  }, [assignments]);

  /*
   * Count unique subjects assigned to this teacher.
   */
  const totalSubjects = useMemo(() => {
    const subjectIds = new Set<string>();

    assignments.forEach((assignment) => {
      if (assignment.subject?.id) {
        subjectIds.add(assignment.subject.id);
      }
    });

    return subjectIds.size;
  }, [assignments]);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2
              size={24}
              className="animate-spin"
            />

            <span>Loading your classes...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Classes
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View the classes and subjects assigned to you.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="mt-0.5 text-red-600 dark:text-red-400"
              />

              <div>
                <h2 className="font-semibold text-red-800 dark:text-red-300">
                  Unable to load classes
                </h2>

                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadAssignments}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* Summary Cards */}
            <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <SummaryCard
                icon={<GraduationCap size={22} />}
                title="Assigned Classes"
                value={classes.length}
                description="Classes assigned to you"
              />

              <SummaryCard
                icon={<BookOpen size={22} />}
                title="Subjects"
                value={totalSubjects}
                description="Subjects assigned to you"
              />

              <SummaryCard
                icon={<Users size={22} />}
                title="Teaching Assignments"
                value={assignments.length}
                description="Class and subject assignments"
              />

            </div>

            {/* No classes */}
            {classes.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  <GraduationCap size={28} />
                </div>

                <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                  No classes assigned
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  You currently do not have any classes assigned to you.
                </p>

              </div>
            )}

            {/* Class Cards */}
            {classes.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">

                {classes.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >

                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          <GraduationCap size={24} />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {classroom.name}
                          </h2>

                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {classroom.section}
                          </p>
                        </div>

                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        Active
                      </span>

                    </div>

                    {/* Statistics */}
                    <div className="mt-6 grid grid-cols-2 gap-4">

                      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <GraduationCap size={17} />

                          <span className="text-sm">
                            Class
                          </span>
                        </div>

                        <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                          {classroom.name}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <BookOpen size={17} />

                          <span className="text-sm">
                            Subjects
                          </span>
                        </div>

                        <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                          {classroom.subjects.length}
                        </p>
                      </div>

                    </div>

                    {/* Assigned Subjects */}
                    <div className="mt-5">

                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Assigned Subjects
                      </p>

                      {classroom.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">

                          {classroom.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            >
                              {subject}
                            </span>
                          ))}

                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          No subjects assigned
                        </p>
                      )}

                    </div>

                    {/* View Class */}
                    <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">

                      <Link
                        href={`/teacher/classes/${classroom.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                      >
                        View Class

                        <ArrowRight size={17} />
                      </Link>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </>
        )}

      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

      <div className="flex items-center gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          {icon}
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {description}
      </p>

    </div>
  );
}