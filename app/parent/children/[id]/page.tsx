
"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Loader2,
  TrendingUp,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";

type Mark = {
  id: string;
  subjectId?: string;
  ca1: number;
  ca2: number;
  exam: number;
  average: number;
  grade: string | null;
  remark: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
  };
  sequence: {
    id: string;
    name: string;
    order: number;
    term: {
      id: string;
      name: string;
      order: number;
      academicYear: {
        id: string;
        name: string;
      };
    };
  };
};

type ReportCard = {
  id: string;
  pdfUrl?: string | null;
  average: number;
  rank: number | null;
  decision: string | null;
  principalRemark: string | null;
  term: {
    id: string;
    name: string;
    order: number;
    academicYear: {
      id: string;
      name: string;
    };
  };
};

type Attendance = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  subject: {
    id: string;
    name: string;
  };
  sequence: {
    id: string;
    name: string;
    term: {
      id: string;
      name: string;
    };
  };
};

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  matricule: string;
  gender: string;
  dateOfBirth: string;
  status: string;

  classroom: {
    id: string;
    name: string;
    sectionId: string;
  } | null;

  marks: Mark[];
  reportCards: ReportCard[];
  attendances: Attendance[];
};

type Parent = {
  id: string;
  fullName: string;
  lastName: string;
  gender: string | null;
};

export default function ChildResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChild = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/parent/children/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load child's results."
          );
        }

        setChild(data.child);
        setParent(data.parent);
      } catch (error) {
        console.error("CHILD PAGE ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load child's results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [id]);

  const average = useMemo(() => {
    if (!child || child.marks.length === 0) return 0;

    const total = child.marks.reduce(
      (sum, mark) => sum + mark.average,
      0
    );

    return total / child.marks.length;
  }, [child]);

  const attendanceRate = useMemo(() => {
    if (!child || child.attendances.length === 0) return 0;

    const present = child.attendances.filter(
      (attendance) =>
        attendance.status === "PRESENT" ||
        attendance.status === "LATE"
    ).length;

    return (present / child.attendances.length) * 100;
  }, [child]);

  const initials = child
    ? `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-72">
        <Navbar
          title="Child Results"
          subtitle="View your child's academic performance and attendance"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-5 sm:p-8">
          {/* Back button */}
          <div className="mb-6">
           
          </div>

          {loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">
                  Loading child's results...
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <h2 className="font-semibold">Unable to load results</h2>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && child && (
            <>
              {/* Child Header */}
              <section className="mb-8">
                <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
                        {initials}
                      </div>

                      <div>
                        <p className="text-sm text-blue-100">
                          {parent
                            ? `${parent.gender === "Male" ? "Mr" : "Mme"} ${
                                parent.fullName
                              }`
                            : "Parent"}
                        </p>

                        <h1 className="mt-1 text-2xl font-bold">
                          {child.fullName}
                        </h1>

                        <p className="mt-1 text-sm text-blue-100">
                          Matricule: {child.matricule}
                        </p>

                        {child.classroom && (
                          <p className="text-sm text-blue-100">
                            Class: {child.classroom.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="hidden rounded-2xl bg-white/10 p-4 sm:block">
                      <UserRound className="h-10 w-10" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Overview */}
              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <div className="rounded-xl bg-blue-100 p-3 w-fit dark:bg-blue-900/30">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>

                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Subjects
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(
                      child.marks.map((mark) => mark.subjectId)
                    ).size}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <div className="rounded-xl bg-green-100 p-3 w-fit dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>

                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Average
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {average.toFixed(1)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <div className="rounded-xl bg-purple-100 p-3 w-fit dark:bg-purple-900/30">
                    <CalendarCheck className="h-5 w-5 text-purple-600" />
                  </div>

                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Attendance
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {attendanceRate.toFixed(0)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <div className="rounded-xl bg-orange-100 p-3 w-fit dark:bg-orange-900/30">
                    <ClipboardList className="h-5 w-5 text-orange-600" />
                  </div>

                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Report Cards
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {child.reportCards.length}
                  </p>
                </div>
              </section>

              {/* Marks */}
              <section className="mb-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Academic Results
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {child.fullName}'s marks by subject and sequence.
                  </p>
                </div>

                {child.marks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No results have been entered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Subject
                          </th>
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Sequence
                          </th>
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            CA 1
                          </th>
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            CA 2
                          </th>
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Exam
                          </th>
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Average
                          </th>
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Grade
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {child.marks.map((mark) => (
                          <tr
                            key={mark.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                              {mark.subject.name}
                            </td>

                            <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                              {mark.sequence.name}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {mark.ca1}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {mark.ca2}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {mark.exam}
                            </td>

                            <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                              {mark.average.toFixed(1)}
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {mark.grade || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Report Cards */}
              <section className="mb-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Report Cards
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Published report cards for {child.firstName}.
                  </p>
                </div>

                {child.reportCards.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No report cards have been published yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {child.reportCards.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {report.term.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Academic Year:{" "}
                            {report.term.academicYear.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-400">
                              Average
                            </p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {report.average.toFixed(1)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">
                              Rank
                            </p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {report.rank ?? "-"}
                            </p>
                          </div>

                          {report.pdfUrl && (
                            <a
                              href={report.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              View PDF
                              <ChevronRight className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Attendance */}
              <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Attendance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Attendance records for {child.firstName}.
                  </p>
                </div>

                {child.attendances.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No attendance records available.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Date
                          </th>

                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Subject
                          </th>

                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Sequence
                          </th>

                          <th className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {child.attendances.map((attendance) => (
                          <tr
                            key={attendance.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {new Date(
                                attendance.date
                              ).toLocaleDateString()}
                            </td>

                            <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                              {attendance.subject.name}
                            </td>

                            <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                              {attendance.sequence.name}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  attendance.status === "PRESENT"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : attendance.status === "ABSENT"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    : attendance.status === "LATE"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {attendance.status}
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
        </main>
      </div>
    </div>
  );
}
