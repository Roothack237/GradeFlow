"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  XCircle,
  AlertCircle,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";

type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY";

type AvailabilityStatus = "PENDING" | "APPROVED" | "REJECTED";

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  terms: Term[];
};

type Term = {
  id: string;
  name: string;
  order: number;
};

type AvailabilitySlot = {
  id: string;
  day: WeekDay;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  note: string | null;
};

type TeacherAssignment = {
  id: string;
  section: {
    id: string;
    name: string;
  };
  classroom: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
  };
};

type AvailabilitySummary = {
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  email: string;
  phone: string | null;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  status: "READY" | "PENDING" | "MISSING" | "REJECTED";
  availability: AvailabilitySlot[];
  assignments: TeacherAssignment[];
};

type AvailabilityCounts = {
  totalTeachers: number;
  missing: number;
  pending: number;
  ready: number;
  rejected: number;
};

type TimetableEntry = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    fullName: string;
    teacherId: string;
  };
};

type UnscheduledAssignment = {
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  classroomName: string;
  subjectName: string;
  subjectCode: string;
  reason: string;
};

const DAYS: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
];

function formatDay(day: string) {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function getStatusStyle(
  status: AvailabilitySummary["status"] | AvailabilityStatus
) {
  switch (status) {
    case "READY":
    case "APPROVED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

    case "REJECTED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStatusIcon(
  status: AvailabilitySummary["status"] | AvailabilityStatus
) {
  switch (status) {
    case "READY":
    case "APPROVED":
      return <CheckCircle2 size={15} />;

    case "PENDING":
      return <Clock3 size={15} />;

    case "REJECTED":
      return <XCircle size={15} />;

    default:
      return <AlertCircle size={15} />;
  }
}

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new Error(
      `The server returned an empty response (${response.status}).`
    );
  }

  if (!contentType.includes("application/json")) {
    console.error("NON-JSON API RESPONSE:", responseText);

    throw new Error(
      `The server returned a non-JSON response (${response.status}).`
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    console.error("INVALID API RESPONSE:", responseText);

    throw new Error(
      `The server returned invalid JSON (${response.status}).`
    );
  }
}

export default function TimetablePage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [availabilitySummary, setAvailabilitySummary] = useState<
    AvailabilitySummary[]
  >([]);

  const [availabilityCounts, setAvailabilityCounts] =
    useState<AvailabilityCounts>({
      totalTeachers: 0,
      missing: 0,
      pending: 0,
      ready: 0,
      rejected: 0,
    });

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [unscheduled, setUnscheduled] = useState<
    UnscheduledAssignment[]
  >([]);

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTeacher, setSelectedTeacher] =
    useState<AvailabilitySummary | null>(null);

  const currentYear = academicYears.find(
    (year) => year.id === academicYearId
  );

  async function loadTimetableData() {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();

      if (academicYearId) {
        query.set("academicYearId", academicYearId);
      }

      if (termId) {
        query.set("termId", termId);
      }

      const response = await fetch(
        `/api/admin/timetable?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await readApiResponse(response);

     if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Failed to load timetable data (${response.status})`
        );
      }

      setAcademicYears(data?.academicYears ?? []);
      setAvailabilitySummary(data?.availabilitySummary ?? []);

      setAvailabilityCounts(
        data?.availabilityCounts ?? {
          totalTeachers: data?.availabilitySummary?.length ?? 0,
          missing: 0,
          pending: 0,
          ready: 0,
          rejected: 0,
        }
      );

      setTimetable(data?.timetable ?? []);
      setUnscheduled(data?.unscheduled ?? []);

      if (!academicYearId && data?.academicYears?.length) {
        const firstYear = data.academicYears[0];

        setAcademicYearId(firstYear.id);

        if (firstYear.terms?.length) {
          setTermId(firstYear.terms[0].id);
        }
      }
    } catch (err) {
      console.error("TIMETABLE LOAD ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimetableData();
  }, []);

  useEffect(() => {
    if (!academicYearId) return;

    const year = academicYears.find(
      (item) => item.id === academicYearId
    );

    if (!year?.terms?.length) {
      setTermId("");
      return;
    }

    const termExists = year.terms.some(
      (term) => term.id === termId
    );

    if (!termExists) {
      setTermId(year.terms[0].id);
    }
  }, [academicYearId, academicYears, termId]);

  useEffect(() => {
    if (!academicYearId || !termId) return;

    loadTimetableData();
  }, [academicYearId, termId]);

  async function generateTimetable() {
    if (!academicYearId || !termId) {
      setError("Please select an academic year and term.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");
      setUnscheduled([]);

      const response = await fetch("/api/admin/timetable", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academicYearId,
          termId,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to generate timetable (${response.status})`
        );
      }

      setSuccess(
        data?.message ||
          `Timetable generated successfully. ${
            data?.createdCount ?? 0
          } periods created.`
      );

      setUnscheduled(data?.unscheduled ?? []);

      await loadTimetableData();
    } catch (err) {
      console.error("TIMETABLE GENERATION ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate timetable"
      );
    } finally {
      setGenerating(false);
    }
  }

  function getTimetableEntry(
    day: string,
    startTime: string
  ) {
    return timetable.find(
      (entry) =>
        entry.day === day &&
        entry.startTime === startTime
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />

      <div className="md:ml-64">
        <AdminNavbar />

        <main className="p-4 md:p-6 lg:p-8">
          {/* HEADER */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <CalendarDays size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Timetable Management
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage teacher availability and generate the
                  school timetable.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadTimetableData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                onClick={generateTimetable}
                disabled={
                  generating ||
                  !academicYearId ||
                  !termId
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles size={17} />
                )}

                {generating
                  ? "Generating..."
                  : "Generate Timetable"}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm">
                  {error}
                </p>

                {error
                  .toLowerCase()
                  .includes("unauthorized") && (
                  <Link
                    href="/login"
                    className="mt-2 inline-block text-sm font-semibold underline"
                  >
                    Sign in again
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="text-sm font-medium">
                {success}
              </p>
            </div>
          )}

          {/* FILTERS */}
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Academic Year
                </label>

                <select
                  value={academicYearId}
                  onChange={(e) =>
                    setAcademicYearId(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">
                    Select academic year
                  </option>

                  {academicYears.map((year) => (
                    <option
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Term
                </label>

                <select
                  value={termId}
                  onChange={(e) =>
                    setTermId(e.target.value)
                  }
                  disabled={!currentYear}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">
                    Select term
                  </option>

                  {currentYear?.terms?.map((term) => (
                    <option
                      key={term.id}
                      value={term.id}
                    >
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* STATISTICS */}
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* TEACHERS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Teachers
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {availabilityCounts.totalTeachers}
                  </p>
                </div>

                <Users
                  className="text-blue-500"
                  size={25}
                />
              </div>
            </div>

            {/* READY */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ready
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {availabilityCounts.ready}
                  </p>
                </div>

                <CheckCircle2
                  className="text-green-500"
                  size={25}
                />
              </div>
            </div>

            {/* PENDING */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending
                  </p>

                  <p className="mt-1 text-2xl font-bold text-yellow-600">
                    {availabilityCounts.pending}
                  </p>
                </div>

                <Clock3
                  className="text-yellow-500"
                  size={25}
                />
              </div>
            </div>

            {/* MISSING */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Missing
                  </p>

                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {availabilityCounts.missing}
                  </p>
                </div>

                <XCircle
                  className="text-red-500"
                  size={25}
                />
              </div>
            </div>
          </section>

          {/* TEACHER AVAILABILITY */}
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Teacher Availability
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Click Inspect to view the availability submitted
                by a teacher.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={28}
                  className="animate-spin text-blue-600"
                />
              </div>
            ) : availabilitySummary.length === 0 ? (
              <div className="py-12 text-center">
                <Users
                  size={40}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p className="font-medium text-gray-700 dark:text-gray-300">
                  No teacher availability found.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Teachers need to submit their availability
                  first.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
                      <th className="px-5 py-3">
                        Teacher
                      </th>

                      <th className="px-5 py-3">
                        Assignments
                      </th>

                      <th className="px-5 py-3">
                        Approved
                      </th>

                      <th className="px-5 py-3">
                        Pending
                      </th>

                      <th className="px-5 py-3">
                        Rejected
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {availabilitySummary.map((teacher) => (
                      <tr
                        key={teacher.teacherId}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {teacher.teacherName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {teacher.teacherCode}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {teacher.assignments?.length ?? 0}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-green-600">
                          {teacher.approvedCount}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-yellow-600">
                          {teacher.pendingCount}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-red-600">
                          {teacher.rejectedCount}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              teacher.status
                            )}`}
                          >
                            {getStatusIcon(teacher.status)}
                            {teacher.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() =>
                              setSelectedTeacher(teacher)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <Eye size={14} />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* UNSCHEDULED */}
          {unscheduled.length > 0 && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900/40 dark:bg-gray-900">
              <div className="border-b border-red-200 bg-red-50 px-5 py-4 dark:border-red-900/40 dark:bg-red-900/10">
                <h2 className="font-bold text-red-700 dark:text-red-400">
                  Unscheduled Assignments
                </h2>

                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Some assignments could not be placed in the
                  timetable yet.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                      <th className="px-5 py-3">
                        Teacher
                      </th>

                      <th className="px-5 py-3">
                        Subject
                      </th>

                      <th className="px-5 py-3">
                        Class
                      </th>

                      <th className="px-5 py-3">
                        Reason
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {unscheduled.map((item, index) => (
                      <tr
                        key={`${item.teacherId}-${item.subjectCode}-${index}`}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {item.teacherName}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.subjectName}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.classroomName}
                        </td>

                        <td className="px-5 py-4 text-sm text-red-600 dark:text-red-400">
                          {item.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TIMETABLE */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Generated Weekly Timetable
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {currentYear?.name || "Academic year"}{" "}
                {termId
                  ? `• ${
                      currentYear?.terms.find(
                        (term) => term.id === termId
                      )?.name || ""
                    }`
                  : ""}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={28}
                  className="animate-spin text-blue-600"
                />
              </div>
            ) : timetable.length === 0 ? (
              <div className="py-14 text-center">
                <CalendarDays
                  size={45}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  No timetable generated yet.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Approve teacher availability and click
                  &quot;Generate Timetable&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr>
                      <th className="w-24 border border-gray-200 bg-gray-50 p-3 text-left text-xs font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-950">
                        Time
                      </th>

                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="border border-gray-200 bg-gray-50 p-3 text-center text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                        >
                          {formatDay(day)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {TIME_SLOTS.map((startTime) => (
                      <tr key={startTime}>
                        <td className="border border-gray-200 bg-gray-50 p-3 text-center text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                          {startTime}
                        </td>

                        {DAYS.map((day) => {
                          const entry = getTimetableEntry(
                            day,
                            startTime
                          );

                          return (
                            <td
                              key={`${day}-${startTime}`}
                              className="h-24 border border-gray-200 p-2 align-top dark:border-gray-800"
                            >
                              {entry ? (
                                <div className="h-full rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-900/50 dark:bg-blue-900/20">
                                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                    {entry.subject.name}
                                  </p>

                                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                    {entry.subject.code}
                                  </p>

                                  <div className="mt-2 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                                    <p>
                                      👨‍🏫{" "}
                                      {entry.teacher.fullName}
                                    </p>

                                    <p>
                                      🏫{" "}
                                      {entry.classroom.name}
                                    </p>

                                    <p>
                                      🕐{" "}
                                      {entry.startTime} -{" "}
                                      {entry.endTime}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-300 dark:text-gray-700">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* =====================================================
          SMALL BEAUTIFUL TEACHER DETAILS MODAL
          ===================================================== */}
      {selectedTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Users size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">
                    {selectedTeacher.teacherName}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedTeacher.teacherCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">

              {/* TEACHER INFO */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Teacher Information
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                    <p className="text-[10px] font-medium uppercase text-gray-400">
                      Teacher ID
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedTeacher.teacherCode}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                    <p className="text-[10px] font-medium uppercase text-gray-400">
                      Name
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedTeacher.teacherName}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                    <p className="text-[10px] font-medium uppercase text-gray-400">
                      Email
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedTeacher.email}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                    <p className="text-[10px] font-medium uppercase text-gray-400">
                      Phone
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedTeacher.phone ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Availability Status
                </h4>

                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/70">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Current status
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {selectedTeacher.status ===
                      "PENDING"
                        ? "Awaiting administrator approval."
                        : selectedTeacher.status ===
                          "READY"
                        ? "Availability has been approved."
                        : selectedTeacher.status ===
                          "REJECTED"
                        ? "Submitted availability was rejected."
                        : "No availability submitted."}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                      selectedTeacher.status
                    )}`}
                  >
                    {getStatusIcon(
                      selectedTeacher.status
                    )}

                    {selectedTeacher.status}
                  </span>
                </div>
              </div>

              {/* SUBMITTED AVAILABILITY */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Submitted Availability
                    </h4>

                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {selectedTeacher.availability
                        ?.length ?? 0}{" "}
                      slot(s)
                    </p>
                  </div>
                </div>

                {selectedTeacher.availability &&
                selectedTeacher.availability.length >
                  0 ? (
                  <div className="space-y-2">
                    {selectedTeacher.availability.map(
                      (slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-800/70"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400">
                              <Clock3 size={17} />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatDay(slot.day)}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {slot.startTime} -{" "}
                                {slot.endTime}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyle(
                              slot.status
                            )}`}
                          >
                            {getStatusIcon(slot.status)}
                            {slot.status}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-700">
                    <AlertCircle
                      size={25}
                      className="mx-auto mb-2 text-gray-400"
                    />

                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No availability submitted
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      This teacher has not submitted any
                      availability slots.
                    </p>
                  </div>
                )}
              </div>

              {/* ASSIGNMENTS */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Teaching Assignments
                </h4>

                {selectedTeacher.assignments &&
                selectedTeacher.assignments.length >
                  0 ? (
                  <div className="space-y-2">
                    {selectedTeacher.assignments.map(
                      (assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-gray-800/70"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {assignment.subject.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {assignment.subject.code} •{" "}
                              {assignment.classroom.name}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {assignment.section.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/70">
                    <p className="text-xs text-gray-500">
                      No teaching assignments found.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="border-t border-gray-200 bg-gray-50/70 px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}