"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  ChevronDown,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  matricule: string;
  class: string | null;
  average: number | null;
  grade: string | null;
  trend: number | null;
  status: string;
  hoursAbsent: number;
  hoursLate: number;
  attendanceRate: number | null;
};

type Analytics = {
  academicYear: { name: string } | null;
  overview: { students: number; average: number | null; passRate: number | null };
  classes: { id: string; name: string }[];
  students: Student[];
  scale: { passMark: number };
};

const STATUS_STYLES: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Good: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  Average: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  "Below average": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "Needs attention": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function TeacherPerformancePage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [classFilter, setClassFilter] = useState("all");
  const [sort, setSort] = useState<"average" | "name" | "attendance">("average");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/teacher/analytics", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load performance data.");
      }

      setAnalytics(data);
    } catch (err) {
      console.error("Teacher Performance Error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load performance data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const students = useMemo(() => {
    if (!analytics) return [];

    const filtered =
      classFilter === "all"
        ? analytics.students
        : analytics.students.filter((student) => student.class === classFilter);

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);

      if (sort === "attendance") {
        return (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1);
      }

      return (b.average ?? -1) - (a.average ?? -1);
    });
  }, [analytics, classFilter, sort]);

  if (loading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading student performance...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Student Performance
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {analytics?.academicYear
                ? `Averages, grades and trends for your students in ${analytics.academicYear.name}.`
                : "Averages, grades and trends for your students."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-700 dark:hover:text-purple-300"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {analytics && (
          <>
            {/* Overview */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  <Users size={20} />
                </div>

                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.students}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Students followed
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Award size={20} />
                </div>

                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.average !== null
                    ? `${analytics.overview.average}/20`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Overall average
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <TrendingUp size={20} />
                </div>

                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.passRate !== null
                    ? `${analytics.overview.passRate}%`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pass rate (≥ {analytics.scale.passMark}/20)
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setClassFilter("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    classFilter === "all"
                      ? "bg-purple-700 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  All classes
                </button>

                {analytics.classes.map((klass) => (
                  <button
                    key={klass.id}
                    type="button"
                    onClick={() => setClassFilter(klass.name)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      classFilter === klass.name
                        ? "bg-purple-700 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    {klass.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as "average" | "name" | "attendance")
                  }
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm font-semibold text-gray-700 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option value="average">Sort by average</option>
                  <option value="name">Sort by name</option>
                  <option value="attendance">Sort by attendance</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Student table */}
            {students.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600" />

                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  No student data for this selection yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                      <th className="px-5 py-4 font-semibold">Student</th>
                      <th className="px-4 py-4 font-semibold">Class</th>
                      <th className="px-4 py-4 font-semibold">Average</th>
                      <th className="px-4 py-4 font-semibold">Grade</th>
                      <th className="px-4 py-4 font-semibold">Trend</th>
                      <th className="px-4 py-4 font-semibold">Attendance</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {students.map((student) => (
                      <tr key={student.id} className="transition hover:bg-purple-50/50 dark:hover:bg-purple-950/10">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </p>

                          <p className="text-xs text-gray-400">{student.matricule}</p>
                        </td>

                        <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                          {student.class}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`font-bold ${
                              student.average === null
                                ? "text-gray-400"
                                : student.average >= 10
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {student.average !== null ? `${student.average}/20` : "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {student.grade && (
                            <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                              {student.grade}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {student.trend === null ? (
                            <span className="text-gray-400">—</span>
                          ) : student.trend > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <TrendingUp size={14} />
                              +{student.trend}
                            </span>
                          ) : student.trend < 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                              <TrendingDown size={14} />
                              {student.trend}
                            </span>
                          ) : (
                            <span className="text-gray-400">stable</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {student.hoursAbsent + student.hoursLate >= 5 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                              <AlertTriangle size={14} />
                              {student.hoursAbsent}h absent
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              {student.attendanceRate !== null
                                ? `${student.attendanceRate}%`
                                : "—"}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              STATUS_STYLES[student.status] ??
                              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
