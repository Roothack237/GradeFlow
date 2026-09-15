"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  CalendarX,
  GraduationCap,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";

type ClassComparison = {
  class: string;
  section: string;
  academicYear: string;
  students: number;
  average: number | null;
  passRate: number | null;
  attendanceRate: number | null;
};

type Analytics = {
  school: {
    academicYear: string | null;
    term: string | null;
    counts: {
      students: number;
      teachers: number;
      parents: number;
      classes: number;
      subjects: number;
    };
  };
  performance: {
    marksRecorded: number;
    average: number | null;
    passRate: number | null;
  };
  attendance: {
    records: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number | null;
  };
  classComparisons: ClassComparison[];
  sectionComparisons: {
    section: string;
    classes: number;
    students: number;
    averageClassPerformance: number | null;
  }[];
  yearComparisons: { academicYear: string; average: number; marks: number }[];
  teacherWorkload: {
    teacher: string;
    assignments: number;
    classes: number;
    subjects: number;
    timetableHoursPerWeek: number;
    marksRecorded: number;
    attendanceRecords: number;
  }[];
  attendanceIssues: { student: string; class: string | null; hoursAbsent: number }[];
};

function AverageBar({ value }: { value: number | null }) {
  const percent = value === null ? 0 : Math.min(100, (value / 20) * 100);
  const color =
    value === null
      ? "bg-gray-300 dark:bg-gray-700"
      : value >= 14
        ? "bg-emerald-500"
        : value >= 10
          ? "bg-purple-600"
          : "bg-red-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/admin/analytics", { cache: "no-store" });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load analytics.");
      }

      setData(payload);
    } catch (err) {
      console.error("Admin Analytics Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <AdminShell
      title="Analytics"
      subtitle="School performance, comparisons and teacher workload — computed from the database."
    >
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">School Analytics</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data?.school?.term
              ? `${data.school.term}${data.school.academicYear ? ` · ${data.school.academicYear}` : ""}`
              : "Real figures from Prisma — no estimates."}
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
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Computing school analytics...</span>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                <BarChart3 size={20} />
              </div>

              <p className="mt-4 text-2xl font-bold">
                {data.performance.average !== null
                  ? `${data.performance.average}/20`
                  : "—"}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                School average ({data.performance.marksRecorded} marks)
              </p>

              <div className="mt-3">
                <AverageBar value={data.performance.average} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Award size={20} />
              </div>

              <p className="mt-4 text-2xl font-bold">
                {data.performance.passRate !== null
                  ? `${data.performance.passRate}%`
                  : "—"}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Pass rate (≥ 10/20)
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Activity size={20} />
              </div>

              <p className="mt-4 text-2xl font-bold">
                {data.attendance.rate !== null ? `${data.attendance.rate}%` : "—"}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Attendance rate ({data.attendance.absent} h absent)
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Users size={20} />
              </div>

              <p className="mt-4 text-2xl font-bold">
                {data.school.counts.students}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Students · {data.school.counts.teachers} teachers ·{" "}
                {data.school.counts.classes} classes
              </p>
            </div>
          </div>

          {/* Section comparisons */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Building2 size={16} className="text-purple-600 dark:text-purple-400" />
              Section comparisons
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {data.sectionComparisons.map((section) => (
                <div
                  key={section.section}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold">{section.section}</p>

                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                      {section.averageClassPerformance !== null
                        ? `${section.averageClassPerformance}/20`
                        : "No marks"}
                    </span>
                  </div>

                  <AverageBar value={section.averageClassPerformance} />

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {section.classes} classes · {section.students} students
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Class comparisons */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <GraduationCap size={16} className="text-purple-600 dark:text-purple-400" />
              Class comparisons
            </h2>

            {data.classComparisons.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No class data yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                      <th className="pb-3 pr-4 font-semibold">Class</th>
                      <th className="pb-3 pr-4 font-semibold">Section</th>
                      <th className="pb-3 pr-4 font-semibold">Year</th>
                      <th className="pb-3 pr-4 font-semibold">Students</th>
                      <th className="pb-3 pr-4 font-semibold">Average</th>
                      <th className="pb-3 pr-4 font-semibold">Pass rate</th>
                      <th className="pb-3 font-semibold">Attendance</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.classComparisons.map((klass) => (
                      <tr key={`${klass.class}-${klass.academicYear}`}>
                        <td className="py-3 pr-4 font-semibold">{klass.class}</td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {klass.section}
                        </td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {klass.academicYear}
                        </td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {klass.students}
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`font-bold ${
                              klass.average === null
                                ? "text-gray-400"
                                : klass.average >= 10
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {klass.average !== null ? `${klass.average}/20` : "—"}
                          </span>
                        </td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {klass.passRate !== null ? `${klass.passRate}%` : "—"}
                        </td>

                        <td className="py-3 text-gray-500 dark:text-gray-400">
                          {klass.attendanceRate !== null ? `${klass.attendanceRate}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Year comparisons */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                Academic year comparisons
              </h2>

              {data.yearComparisons.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No marks recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.yearComparisons.map((year) => (
                    <div key={year.academicYear}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {year.academicYear}
                        </span>

                        <span className="font-bold">
                          {year.average}/20
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            {year.marks} marks
                          </span>
                        </span>
                      </div>

                      <AverageBar value={year.average} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Attendance issues */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <CalendarX size={16} className="text-red-600 dark:text-red-400" />
                Attendance issues (most absent students)
              </h2>

              {data.attendanceIssues.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No absence recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.attendanceIssues.map((issue) => (
                    <li key={`${issue.student}-${issue.class}`} className="flex items-center gap-3 py-2.5">
                      <AlertTriangle size={15} className="shrink-0 text-red-500" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{issue.student}</p>

                        <p className="text-xs text-gray-400">{issue.class ?? "No class"}</p>
                      </div>

                      <span className="rounded-lg bg-red-50 px-2.5 py-1 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                        {issue.hoursAbsent} h
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Teacher workload */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Users size={16} className="text-purple-600 dark:text-purple-400" />
              Teacher workload
            </h2>

            {data.teacherWorkload.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No teacher registered yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                      <th className="pb-3 pr-4 font-semibold">Teacher</th>
                      <th className="pb-3 pr-4 font-semibold">Assignments</th>
                      <th className="pb-3 pr-4 font-semibold">Classes</th>
                      <th className="pb-3 pr-4 font-semibold">Subjects</th>
                      <th className="pb-3 pr-4 font-semibold">Timetable h/week</th>
                      <th className="pb-3 pr-4 font-semibold">Marks recorded</th>
                      <th className="pb-3 font-semibold">Attendance records</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.teacherWorkload.map((teacher) => (
                      <tr key={teacher.teacher}>
                        <td className="py-3 pr-4 font-semibold">{teacher.teacher}</td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {teacher.assignments}
                        </td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {teacher.classes}
                        </td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {teacher.subjects}
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`font-bold ${
                              teacher.timetableHoursPerWeek > 20
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {teacher.timetableHoursPerWeek} h
                          </span>
                        </td>

                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                          {teacher.marksRecorded}
                        </td>

                        <td className="py-3 text-gray-500 dark:text-gray-400">
                          {teacher.attendanceRecords}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
