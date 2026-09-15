"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

type Analytics = {
  academicYear: { id: string; name: string } | null;
  overview: {
    classes: number;
    subjects: number;
    students: number;
    marksRecorded: number;
    average: number | null;
    passRate: number | null;
    attendance: {
      records: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      rate: number | null;
    };
  };
  classes: {
    id: string;
    name: string;
    section: string;
    students: number;
    subjects: string[];
    average: number | null;
    passRate: number | null;
    marks: number;
  }[];
  subjectAverages: {
    subject: string;
    class: string;
    average: number;
    passRate: number;
    highest: number | null;
    lowest: number | null;
    marks: number;
  }[];
  bestStudents: {
    name: string;
    class: string | null;
    average: number | null;
    grade: string | null;
  }[];
  atRiskStudents: {
    name: string;
    class: string | null;
    average: number | null;
    grade: string | null;
    hoursAbsent: number;
    hoursLate: number;
    attendanceRate: number | null;
    reasons: string[];
  }[];
  trends: {
    marks: { sequence: string; average: number; marks: number }[];
    attendance: {
      sequence: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
      rate: number | null;
    }[];
  };
  scale: { maxMark: number; passMark: number };
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

export default function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [classFilter, setClassFilter] = useState("all");
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
        throw new Error(data.error || "Failed to load analytics.");
      }

      setAnalytics(data);
    } catch (err) {
      console.error("Teacher Analytics Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredSubjects = useMemo(() => {
    if (!analytics) return [];

    return classFilter === "all"
      ? analytics.subjectAverages
      : analytics.subjectAverages.filter((subject) => subject.class === classFilter);
  }, [analytics, classFilter]);

  const filteredStudents = useMemo(() => {
    if (!analytics) return { best: [], atRisk: [] };

    const best =
      classFilter === "all"
        ? analytics.bestStudents
        : analytics.bestStudents.filter((student) => student.class === classFilter);

    const atRisk =
      classFilter === "all"
        ? analytics.atRiskStudents
        : analytics.atRiskStudents.filter((student) => student.class === classFilter);

    return { best, atRisk };
  }, [analytics, classFilter]);

  if (loading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Computing your analytics...</span>
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
              Analytics
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {analytics?.academicYear
                ? `Performance of your classes in ${analytics.academicYear.name} — computed from recorded marks and attendance.`
                : "Performance of your classes — computed from recorded marks and attendance."}
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
            <div className="mb-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  <BarChart3 size={20} />
                </div>

                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.average !== null
                    ? `${analytics.overview.average}/20`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Overall average ({analytics.overview.marksRecorded} marks)
                </p>

                <div className="mt-3">
                  <AverageBar value={analytics.overview.average} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Award size={20} />
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

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Users size={20} />
                </div>

                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.students}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Students in {analytics.overview.classes} classes
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <CalendarCheck size={20} />
                </div>

                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.attendance.rate !== null
                    ? `${analytics.overview.attendance.rate}%`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Attendance rate ({analytics.overview.attendance.absent} h absent)
                </p>
              </div>
            </div>

            {/* Class filter */}
            <div className="mb-6 flex flex-wrap gap-2">
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Class averages */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  <BarChart3 size={16} className="text-purple-600 dark:text-purple-400" />
                  Class averages
                </h2>

                <div className="space-y-4">
                  {analytics.classes.map((klass) => (
                    <div key={klass.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {klass.name}
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            {klass.students} students
                          </span>
                        </span>

                        <span className="font-bold text-gray-900 dark:text-white">
                          {klass.average !== null ? `${klass.average}/20` : "No marks"}
                        </span>
                      </div>

                      <AverageBar value={klass.average} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Mark trends */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                  Mark trends by sequence
                </h2>

                {analytics.trends.marks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No marks recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.trends.marks.map((trend) => (
                      <div key={trend.sequence}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {trend.sequence}
                          </span>

                          <span className="font-bold text-gray-900 dark:text-white">
                            {trend.average}/20
                            <span className="ml-2 text-xs font-normal text-gray-400">
                              {trend.marks} marks
                            </span>
                          </span>
                        </div>

                        <AverageBar value={trend.average} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Best students */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  <Award size={16} className="text-emerald-600 dark:text-emerald-400" />
                  Best students
                </h2>

                {filteredStudents.best.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No marks recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredStudents.best.map((student, index) => (
                      <li key={student.name} className="flex items-center gap-3 py-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </p>

                          <p className="text-xs text-gray-400">{student.class}</p>
                        </div>

                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          {student.average}/20
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* At-risk students */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                  Students needing attention
                </h2>

                {filteredStudents.atRisk.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No student is currently below the pass mark or over the
                    absence threshold.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredStudents.atRisk.map((student) => (
                      <li key={student.name} className="py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {student.name}
                            </p>

                            <p className="text-xs text-gray-400">{student.class}</p>
                          </div>

                          {student.average !== null && (
                            <span className="rounded-lg bg-red-50 px-2.5 py-1 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                              {student.average}/20
                            </span>
                          )}
                        </div>

                        {student.reasons.length > 0 && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {student.reasons.join(" · ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Subject averages */}
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                <ClipboardList size={16} className="text-purple-600 dark:text-purple-400" />
                Subject averages
              </h2>

              {filteredSubjects.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No marks recorded yet for this selection.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                        <th className="pb-3 pr-4 font-semibold">Subject</th>
                        <th className="pb-3 pr-4 font-semibold">Class</th>
                        <th className="pb-3 pr-4 font-semibold">Average</th>
                        <th className="pb-3 pr-4 font-semibold">Pass rate</th>
                        <th className="pb-3 pr-4 font-semibold">Highest</th>
                        <th className="pb-3 font-semibold">Lowest</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredSubjects.map((subject) => (
                        <tr key={`${subject.class}-${subject.subject}`}>
                          <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white">
                            {subject.subject}
                          </td>

                          <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                            {subject.class}
                          </td>

                          <td className="py-3 pr-4">
                            <span
                              className={`font-bold ${
                                subject.average >= 10
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {subject.average}/20
                            </span>
                          </td>

                          <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                            {subject.passRate}%
                          </td>

                          <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                            {subject.highest ?? "—"}/20
                          </td>

                          <td className="py-3 text-gray-500 dark:text-gray-400">
                            {subject.lowest ?? "—"}/20
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Attendance trends */}
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                <Activity size={16} className="text-blue-600 dark:text-blue-400" />
                Attendance trends by sequence
              </h2>

              {analytics.trends.attendance.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No attendance recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                        <th className="pb-3 pr-4 font-semibold">Sequence</th>
                        <th className="pb-3 pr-4 font-semibold">Present</th>
                        <th className="pb-3 pr-4 font-semibold">Absent</th>
                        <th className="pb-3 pr-4 font-semibold">Late</th>
                        <th className="pb-3 font-semibold">Rate</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {analytics.trends.attendance.map((trend) => (
                        <tr key={trend.sequence}>
                          <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white">
                            {trend.sequence}
                          </td>

                          <td className="py-3 pr-4 text-emerald-600 dark:text-emerald-400">
                            {trend.present} h
                          </td>

                          <td className="py-3 pr-4 text-red-600 dark:text-red-400">
                            {trend.absent} h
                          </td>

                          <td className="py-3 pr-4 text-amber-600 dark:text-amber-400">
                            {trend.late} h
                          </td>

                          <td className="py-3 font-bold text-gray-900 dark:text-white">
                            {trend.rate !== null ? `${trend.rate}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
