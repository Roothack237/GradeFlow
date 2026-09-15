"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Clock3,
  Loader2,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";
import ChildSelector from "@/components/parent/ChildSelector";

type AttendanceData = {
  student: { id: string; name: string; class: string | null };
  summary: {
    hoursPresent: number;
    hoursAbsent: number;
    hoursLate: number;
    hoursExcused: number;
    records: number;
    rate: number | null;
  };
  bySubject: {
    subject: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  }[];
  records: {
    id: string;
    date: string;
    status: string;
    subject: string;
    teacher: string;
    sequence: string;
  }[];
};

const STATUS_STYLES: Record<string, string> = {
  PRESENT:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  ABSENT: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  EXCUSED: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
};

export default function ParentAttendancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(async (studentId: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/parent/attendance?studentId=${encodeURIComponent(studentId)}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load the attendance.");
      }

      setData(payload);
    } catch (err) {
      console.error("Parent Attendance Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load the attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (childId) loadAttendance(childId);
  }, [childId, loadAttendance]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Attendance"
          subtitle="Attendance hours and alerts for your children."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Each record is one lesson hour. You are alerted automatically
                when your child reaches 5 hours absent or late in a subject.
              </p>
            </div>

            <ChildSelector selectedId={childId} onSelect={setChildId} />

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm">Loading attendance...</span>
                </div>
              </div>
            )}

            {!loading && data && childId && (
              <>
                {/* Summary */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CalendarCheck size={18} />
                    </div>

                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                      {data.summary.hoursPresent}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Hours present
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      <AlertTriangle size={18} />
                    </div>

                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                      {data.summary.hoursAbsent}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Hours absent
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      <Clock3 size={18} />
                    </div>

                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                      {data.summary.hoursLate}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Hours late
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      <CalendarDays size={18} />
                    </div>

                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                      {data.summary.rate !== null ? `${data.summary.rate}%` : "—"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Attendance rate
                    </p>
                  </div>
                </div>

                {/* Per subject */}
                {data.bySubject.length > 0 && (
                  <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Hours by subject
                    </h2>

                    <div className="space-y-4">
                      {data.bySubject.map((subject) => {
                        const risky = subject.absent >= 5 || subject.late >= 5;

                        return (
                          <div
                            key={subject.subject}
                            className={`rounded-xl border p-4 ${
                              risky
                                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                                : "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {subject.subject}
                              </p>

                              {risky && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                  <AlertTriangle size={12} />
                                  Alert threshold reached
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {subject.present} h present
                              </span>

                              <span className="text-red-600 dark:text-red-400">
                                {subject.absent} h absent
                              </span>

                              <span className="text-amber-600 dark:text-amber-400">
                                {subject.late} h late
                              </span>

                              {subject.excused > 0 && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {subject.excused} h excused
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Recent records */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Recent records
                  </h2>

                  {data.records.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No attendance has been recorded yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                            <th className="pb-2.5 pr-4 font-semibold">Date</th>
                            <th className="pb-2.5 pr-4 font-semibold">Subject</th>
                            <th className="pb-2.5 pr-4 font-semibold">Teacher</th>
                            <th className="pb-2.5 pr-4 font-semibold">Sequence</th>
                            <th className="pb-2.5 font-semibold">Status</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {data.records.map((record) => (
                            <tr key={record.id}>
                              <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">
                                {new Date(record.date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>

                              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                {record.subject}
                              </td>

                              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                {record.teacher}
                              </td>

                              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                {record.sequence}
                              </td>

                              <td className="py-2.5">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                    STATUS_STYLES[record.status] ??
                                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {record.status}
                                </span>
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
      </div>
    </div>
  );
}
