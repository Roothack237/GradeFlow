"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Overview = {
  classroom: {
    id: string;
    name: string;
    section: string;
    academicYear: { id: string; name: string; isActive: boolean };
    students: number;
    subjects: number;
    teachers: number;
  };
  subjects: { id: string; name: string; code: string; coefficient: number }[];
  teachers: {
    id: string;
    fullName: string;
    teacherId: string;
    email: string;
    subjects: string[];
  }[];
  students: {
    id: string;
    name: string;
    matricule: string;
    gender: string;
    parent: string | null;
    parentPhone: string | null;
    average: number | null;
    grade: string | null;
    hoursAbsent: number;
    hoursLate: number;
  }[];
  attendance: {
    records: number;
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    rate: number | null;
  };
  performance: {
    marksRecorded: number;
    average: number | null;
    passRate: number | null;
    bySubject: { subject: string; average: number; marks: number }[];
    bySequence: { sequence: string; average: number; marks: number }[];
  };
  timetable: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string | null;
    subject: string;
    teacher: string;
    term: string;
  }[];
  publications: { id: string; term: string; status: string; publishedAt: string | null }[];
  scale: { passMark: number };
};

const TABS = [
  { id: "info", label: "Class Information", icon: GraduationCap },
  { id: "subjects", label: "Subjects & Teachers", icon: BookOpen },
  { id: "students", label: "Students", icon: Users },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
] as const;

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

function AverageBar({ value, max = 20 }: { value: number | null; max?: number }) {
  const percent = value === null ? 0 : Math.min(100, (value / max) * 100);
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

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const classId = params?.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("info");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    if (!classId) return;

    try {
      setRefreshing(true);
      setError("");

      const response = await fetch(
        `/api/admin/classes/${encodeURIComponent(classId)}/overview`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load the class.");
      }

      setData(payload);
    } catch (err) {
      console.error("Class Overview Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load the class.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  /* Deep link: ?tab=students */
  useEffect(() => {
    const requested = searchParams.get("tab");

    if (requested && TABS.some((entry) => entry.id === requested)) {
      setTab(requested as (typeof TABS)[number]["id"]);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:ml-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={data?.classroom.name ?? "Class"}
          subtitle={
            data
              ? `${data.classroom.section === "ANGLOPHONE" ? "Anglophone" : "Francophone"} · ${data.classroom.academicYear.name}`
              : "Class details"
          }
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* BACK */}
            <Link
              href="/admin/classes"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:text-purple-800 dark:text-purple-400"
            >
              <ArrowLeft size={16} />
              All classes
            </Link>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Loading class details...</span>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            ) : data ? (
              <>
                {/* HEADER */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <GraduationCap size={32} />
                    </div>

                    <div>
                      <h1 className="text-2xl font-bold">{data.classroom.name}</h1>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {data.classroom.students} students · {data.classroom.subjects}{" "}
                        subjects · {data.classroom.teachers} teachers
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={loadOverview}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {/* TABS */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {TABS.map((entry) => {
                    const Icon = entry.icon;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setTab(entry.id)}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          tab === entry.id
                            ? "bg-purple-700 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        <Icon size={15} />
                        {entry.label}
                      </button>
                    );
                  })}
                </div>

                {/* ---- CLASS INFORMATION ---- */}
                {tab === "info" && (
                  <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">
                        Class Information
                      </h2>

                      <dl className="space-y-4">
                        <div className="flex justify-between gap-4">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Class</dt>
                          <dd className="text-sm font-bold">{data.classroom.name}</dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Section</dt>
                          <dd className="text-sm font-bold">
                            {data.classroom.section === "ANGLOPHONE"
                              ? "Anglophone"
                              : "Francophone"}
                          </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">
                            Academic year
                          </dt>
                          <dd className="text-sm font-bold">
                            {data.classroom.academicYear.name}
                            {data.classroom.academicYear.isActive && (
                              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Active
                              </span>
                            )}
                          </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Students</dt>
                          <dd className="text-sm font-bold">{data.classroom.students}</dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Subjects</dt>
                          <dd className="text-sm font-bold">{data.classroom.subjects}</dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Teachers</dt>
                          <dd className="text-sm font-bold">{data.classroom.teachers}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">
                        Quick statistics
                      </h2>

                      <div className="space-y-5">
                        <div>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              Class average
                            </span>

                            <span className="font-bold">
                              {data.performance.average !== null
                                ? `${data.performance.average}/20`
                                : "No marks"}
                            </span>
                          </div>

                          <AverageBar value={data.performance.average} />
                        </div>

                        <div>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              Pass rate (≥ {data.scale.passMark}/20)
                            </span>

                            <span className="font-bold">
                              {data.performance.passRate !== null
                                ? `${data.performance.passRate}%`
                                : "—"}
                            </span>
                          </div>

                          <AverageBar
                            value={data.performance.passRate}
                            max={100}
                          />
                        </div>

                        <div>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              Attendance rate
                            </span>

                            <span className="font-bold">
                              {data.attendance.rate !== null
                                ? `${data.attendance.rate}%`
                                : "—"}
                            </span>
                          </div>

                          <AverageBar value={data.attendance.rate} max={100} />
                        </div>

                        <p className="text-xs text-gray-400">
                          {data.performance.marksRecorded} marks and{" "}
                          {data.attendance.records} attendance hours recorded.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ---- SUBJECTS & TEACHERS ---- */}
                {tab === "subjects" && (
                  <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
                        Subjects
                      </h2>

                      {data.subjects.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No subject is assigned to this class yet.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {data.subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950"
                            >
                              <div>
                                <p className="text-sm font-bold">{subject.name}</p>

                                <p className="text-xs text-gray-400">{subject.code}</p>
                              </div>

                              <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                coef {subject.coefficient}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <UserRound size={16} className="text-purple-600 dark:text-purple-400" />
                        Teachers
                      </h2>

                      {data.teachers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No teacher is assigned to this class yet.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {data.teachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold">{teacher.fullName}</p>

                                <span className="text-xs text-gray-400">
                                  {teacher.teacherId}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {teacher.subjects.join(", ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ---- STUDENTS ---- */}
                {tab === "students" && (
                  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-100 p-5 dark:border-gray-800">
                      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <Users size={16} className="text-purple-600 dark:text-purple-400" />
                        Students ({data.students.length})
                      </h2>
                    </div>

                    {data.students.length === 0 ? (
                      <p className="p-5 text-sm text-gray-500 dark:text-gray-400">
                        No student is enrolled in this class yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                              <th className="px-5 py-3.5 font-semibold">Student</th>
                              <th className="px-4 py-3.5 font-semibold">Matricule</th>
                              <th className="px-4 py-3.5 font-semibold">Parent</th>
                              <th className="px-4 py-3.5 font-semibold">Average</th>
                              <th className="px-4 py-3.5 font-semibold">Grade</th>
                              <th className="px-4 py-3.5 font-semibold">Absences</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.students.map((student) => (
                              <tr key={student.id} className="transition hover:bg-purple-50/50 dark:hover:bg-purple-950/10">
                                <td className="px-5 py-3 font-semibold">{student.name}</td>

                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                  {student.matricule}
                                </td>

                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                  {student.parent ?? "—"}
                                </td>

                                <td className="px-4 py-3">
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

                                <td className="px-4 py-3">
                                  {student.grade && (
                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                      {student.grade}
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  {student.hoursAbsent + student.hoursLate >= 5 ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                                      <AlertTriangle size={13} />
                                      {student.hoursAbsent}h absent / {student.hoursLate}h late
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {student.hoursAbsent}h / {student.hoursLate}h
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}

                {/* ---- ATTENDANCE ---- */}
                {tab === "attendance" && (
                  <section className="space-y-5">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                      {[
                        {
                          label: "Hours recorded",
                          value: data.attendance.records,
                          className: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
                          icon: CalendarCheck,
                        },
                        {
                          label: "Present",
                          value: data.attendance.PRESENT,
                          className: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                          icon: CheckCircle2,
                        },
                        {
                          label: "Absent",
                          value: data.attendance.ABSENT,
                          className: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
                          icon: AlertTriangle,
                        },
                        {
                          label: "Late",
                          value: data.attendance.LATE,
                          className: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
                          icon: CalendarCheck,
                        },
                        {
                          label: "Rate",
                          value:
                            data.attendance.rate !== null ? `${data.attendance.rate}%` : "—",
                          className: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
                          icon: TrendingUp,
                        },
                      ].map((stat) => {
                        const Icon = stat.icon;

                        return (
                          <div
                            key={stat.label}
                            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                          >
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.className}`}
                            >
                              <Icon size={18} />
                            </div>

                            <p className="mt-3 text-2xl font-bold">{stat.value}</p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {stat.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">
                        Students to follow up (5+ hours absent or late)
                      </h2>

                      {(() => {
                        const atRisk = data.students.filter(
                          (student) => student.hoursAbsent + student.hoursLate >= 5
                        );

                        if (atRisk.length === 0) {
                          return (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No student has reached the absence alert threshold in this
                              class.
                            </p>
                          );
                        }

                        return (
                          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                            {atRisk.map((student) => (
                              <li
                                key={student.id}
                                className="flex items-center gap-3 py-2.5"
                              >
                                <AlertTriangle
                                  size={15}
                                  className="shrink-0 text-red-500"
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    {student.name}
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {student.hoursAbsent} h absent · {student.hoursLate} h late
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                  </section>
                )}

                {/* ---- PERFORMANCE ---- */}
                {tab === "performance" && (
                  <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <Award size={16} className="text-purple-600 dark:text-purple-400" />
                        Subject averages
                      </h2>

                      {data.performance.bySubject.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No mark recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {data.performance.bySubject.map((subject) => (
                            <div key={subject.subject}>
                              <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                  {subject.subject}
                                </span>

                                <span className="font-bold">
                                  {subject.average}/20
                                  <span className="ml-2 text-xs font-normal text-gray-400">
                                    {subject.marks} marks
                                  </span>
                                </span>
                              </div>

                              <AverageBar value={subject.average} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                        Performance by sequence
                      </h2>

                      {data.performance.bySequence.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No mark recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {data.performance.bySequence.map((sequence) => (
                            <div key={sequence.sequence}>
                              <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                  {sequence.sequence}
                                </span>

                                <span className="font-bold">
                                  {sequence.average}/20
                                  <span className="ml-2 text-xs font-normal text-gray-400">
                                    {sequence.marks} marks
                                  </span>
                                </span>
                              </div>

                              <AverageBar value={sequence.average} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ---- TIMETABLE ---- */}
                {tab === "timetable" && (
                  <section>
                    {data.publications.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {data.publications.map((publication) => (
                          <span
                            key={publication.id}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                              publication.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {publication.term}: {publication.status}
                          </span>
                        ))}
                      </div>
                    )}

                    {data.timetable.length === 0 ? (
                      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                        <CalendarDays
                          size={40}
                          className="mx-auto text-gray-300 dark:text-gray-600"
                        />

                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                          No timetable entry exists for this class yet. Generate and
                          publish the timetable from the Timetable page.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                        {DAYS.map((day) => {
                          const entries = data.timetable.filter(
                            (entry) => entry.day === day
                          );

                          return (
                            <div
                              key={day}
                              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                            >
                              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                {day.charAt(0) + day.slice(1).toLowerCase()}
                              </h3>

                              {entries.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400 dark:border-gray-800">
                                  No lessons
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {entries.map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 to-white p-3 dark:border-gray-800 dark:from-purple-950/30 dark:to-gray-900"
                                    >
                                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                        {entry.startTime} – {entry.endTime}
                                      </p>

                                      <p className="mt-1 text-sm font-bold">
                                        {entry.subject}
                                      </p>

                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {entry.teacher}
                                      </p>

                                      {entry.room && (
                                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                          <MapPin size={11} />
                                          {entry.room}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
