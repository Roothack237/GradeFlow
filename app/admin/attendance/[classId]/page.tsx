"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Search,
  User,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
  ChevronRight,
} from "lucide-react";

import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";

interface Section {
  id: string;
  name: "ANGLOPHONE" | "FRANCOPHONE";
}

interface AcademicYear {
  id: string;
  name: string;
}

interface Classroom {
  id: string;
  name: string;
  section: Section;
  academicYear: AcademicYear;
}

interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface Term {
  id: string;
  name: string;
  order: number;
}

interface Sequence {
  id: string;
  name: string;
  order: number;
  term: Term;
}

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED";

interface AttendanceStudent {
  id: string;
  student: Student;
  status: AttendanceStatus;
}

interface AttendanceSession {
  id: string;
  date: string;
  subject: Subject;
  teacher: Teacher;
  sequence: Sequence;

  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;

  students: AttendanceStudent[];
}

export default function ClassAttendancePage() {
  const params = useParams();

  const classId = params.classId as string;

  const [classroom, setClassroom] =
    useState<Classroom | null>(null);

  const [sessions, setSessions] = useState<
    AttendanceSession[]
  >([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (classId) {
      loadAttendance();
    }
  }, [classId]);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/attendance/classes/${classId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to load class attendance"
        );
      }

      setClassroom(data.classroom);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error(
        "LOAD CLASS ATTENDANCE ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  const filteredSessions = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return sessions;
    }

    return sessions.filter((session) => {
      const teacherName =
        session.teacher.fullName ||
        `${session.teacher.firstName} ${session.teacher.lastName}`;

      const studentMatches =
        session.students.some((attendance) => {
          const studentName =
            `${attendance.student.firstName} ${attendance.student.lastName}`;

          return (
            studentName
              .toLowerCase()
              .includes(value) ||
            attendance.student.matricule
              .toLowerCase()
              .includes(value)
          );
        });

      const dateText = formatDate(
        session.date
      ).toLowerCase();

      const timeText = formatTime(
        session.date
      ).toLowerCase();

      return (
        session.subject.name
          .toLowerCase()
          .includes(value) ||
        session.subject.code
          .toLowerCase()
          .includes(value) ||
        teacherName
          .toLowerCase()
          .includes(value) ||
        dateText.includes(value) ||
        timeText.includes(value) ||
        studentMatches
      );
    });
  }, [sessions, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />

        <div className="lg:pl-64">
          <Navbar />

          <main className="flex min-h-[70vh] items-center justify-center p-6">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <Loader2
                size={22}
                className="animate-spin"
              />
              Loading attendance...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />

        <div className="lg:pl-64">
          <Navbar />

          <main className="p-6 lg:p-8">
            <Link
              href="/admin/attendance"
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
            >
              <ArrowLeft size={17} />
              Back to Attendance
            </Link>

            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}

              <button
                type="button"
                onClick={loadAttendance}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="lg:pl-64">
        <Navbar />

        <main className="p-4 sm:p-6 lg:p-8">
         

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <Users size={22} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {classroom?.name}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {classroom?.section.name ===
                      "ANGLOPHONE"
                        ? "Anglophone Section"
                        : "Francophone Section"}{" "}
                      •{" "}
                      {classroom?.academicYear.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="relative mt-6 max-w-3xl">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by teacher, subject, date, or student..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* SESSION COUNT */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Sessions
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredSessions.length}{" "}
                {filteredSessions.length === 1
                  ? "session"
                  : "sessions"}{" "}
                found
              </p>
            </div>
          </div>

          {/* EMPTY */}
          {filteredSessions.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
              <Calendar
                size={35}
                className="mx-auto text-gray-400"
              />

              <h3 className="mt-4 font-medium text-gray-900 dark:text-white">
                No attendance found
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try changing your search.
              </p>
            </div>
          )}

          {/* DESKTOP TABLE */}
          {filteredSessions.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Time
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Subject
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Teacher
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Present
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSessions.map(
                      (session) => (
                        <tr
                          key={session.id}
                          className="group border-b border-gray-100 transition hover:bg-purple-50/50 dark:border-gray-800 dark:hover:bg-purple-950/20"
                        >
                          {/* DATE */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar
                                size={16}
                                className="text-gray-400"
                              />

                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(
                                  session.date
                                )}
                              </span>
                            </div>
                          </td>

                          {/* TIME */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock
                                size={16}
                              />

                              {formatTime(
                                session.date
                              )}
                            </div>
                          </td>

                          {/* SUBJECT */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <BookOpen
                                size={16}
                                className="text-purple-500"
                              />

                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {
                                    session
                                      .subject
                                      .name
                                  }
                                </p>

                                <p className="text-xs text-gray-500">
                                  {
                                    session
                                      .subject
                                      .code
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* TEACHER */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <User
                                size={16}
                                className="text-gray-400"
                              />

                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {
                                  session
                                    .teacher
                                    .fullName
                                }
                              </span>
                            </div>
                          </td>

                          {/* PRESENT */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.present}/
                              {
                                session.totalStudents
                              }
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2
                                  size={14}
                                />
                                {session.present}
                              </span>

                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle
                                  size={14}
                                />
                                {session.absent}
                              </span>

                              <span className="flex items-center gap-1 text-yellow-600">
                                <Clock3
                                  size={14}
                                />
                                {session.late}
                              </span>
                            </div>
                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/attendance/${classId}/${session.id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
                            >
                              View
                              <ChevronRight
                                size={16}
                              />
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}