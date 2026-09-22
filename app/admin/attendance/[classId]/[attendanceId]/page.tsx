"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
  Users,
  XCircle,
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

interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
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
  academicYear: AcademicYear;
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

interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: string;
}

interface AttendanceStudent {
  id: string;
  status: AttendanceStatus;
  student: Student;
}

interface AttendanceSession {
  id: string;
  date: string;
  subject: Subject;
  teacher: Teacher;
  sequence: Sequence;
  classroom: Classroom;
}

interface Summary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface AttendanceResponse {
  success: boolean;
  session: AttendanceSession;
  students: AttendanceStudent[];
  summary: Summary;
  error?: string;
}

function getStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "ABSENT":
      return "Absent";
    case "LATE":
      return "Late";
    case "EXCUSED":
      return "Excused";
    default:
      return status;
  }
}

function getStatusClasses(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";

    case "ABSENT":
      return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";

    case "LATE":
      return "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";

    case "EXCUSED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";

    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
  }
}

function getStatusIcon(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return <CheckCircle2 size={15} />;

    case "ABSENT":
      return <XCircle size={15} />;

    case "LATE":
      return <Clock3 size={15} />;

    case "EXCUSED":
      return <CheckCircle2 size={15} />;

    default:
      return null;
  }
}

export default function AttendanceDetailsPage() {
  const params = useParams();

  const classId = params.classId as string;
  const attendanceId = params.attendanceId as string;

  const [data, setData] = useState<AttendanceResponse | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!attendanceId) return;

    const loadAttendanceDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/attendance/${attendanceId}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load attendance details"
          );
        }

        setData(result);
      } catch (error) {
        console.error(
          "ATTENDANCE DETAILS ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load attendance details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceDetails();
  }, [attendanceId]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];

    const query = search.trim().toLowerCase();

    if (!query) {
      return data.students;
    }

    return data.students.filter((item) => {
      const student = item.student;

      const fullName =
        `${student.firstName} ${student.lastName}`.toLowerCase();

      const reverseName =
        `${student.lastName} ${student.firstName}`.toLowerCase();

      const matricule =
        student.matricule.toLowerCase();

      const gender =
        student.gender.toLowerCase();

      const status =
        item.status.toLowerCase();

      return (
        fullName.includes(query) ||
        reverseName.includes(query) ||
        matricule.includes(query) ||
        gender.includes(query) ||
        status.includes(query)
      );
    });
  }, [data, search]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />

        <div className="flex-1">
          <Navbar />

          <main className="flex min-h-[calc(100vh-80px)] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2
                size={32}
                className="animate-spin"
              />
              <p>Loading attendance details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />

        <div className="flex-1">
          <Navbar />

          <main className="p-6">
            <Link
              href={`/admin/attendance/${classId}`}
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            >
              <ArrowLeft size={18} />
              Back to class attendance
            </Link>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <p className="font-semibold">
                Failed to load attendance
              </p>

              <p className="mt-1 text-sm">
                {error || "Attendance session not found."}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { session, summary } = data;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Navbar />

        <main className="p-4 md:p-6 lg:p-8">
          
          {/* Header */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  <BookOpen size={17} />

                  <span>
                    {session.subject.code}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {session.subject.name}
                </h1>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={17} />
                    <span>
                      {session.classroom.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={17} />
                    <span>
                      {formatDate(session.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={17} />
                    <span>
                      {formatTime(session.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users size={17} />
                    <span>
                      {session.teacher.fullName}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                    {session.sequence.term.name}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {session.sequence.name}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {session.classroom.section.name}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {session.classroom.academicYear.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <SummaryCard
              label="Total"
              value={summary.total}
              icon={<Users size={20} />}
            />

            <SummaryCard
              label="Present"
              value={summary.present}
              icon={<CheckCircle2 size={20} />}
              type="present"
            />

            <SummaryCard
              label="Absent"
              value={summary.absent}
              icon={<XCircle size={20} />}
              type="absent"
            />

            <SummaryCard
              label="Late"
              value={summary.late}
              icon={<Clock3 size={20} />}
              type="late"
            />

            <SummaryCard
              label="Excused"
              value={summary.excused}
              icon={<CheckCircle2 size={20} />}
              type="excused"
            />
          </div>

          {/* Students */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Student Attendance
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Attendance status for each student in this session.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search student..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                No students found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                      <th className="px-5 py-4">
                        #
                      </th>

                      <th className="px-5 py-4">
                        Student
                      </th>

                      <th className="px-5 py-4">
                        Matricule
                      </th>

                      <th className="px-5 py-4">
                        Gender
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map(
                      (attendance, index) => (
                        <tr
                          key={attendance.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                        >
                          <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                                {attendance.student.firstName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {getStudentName(
                                    attendance.student
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {attendance.student.matricule}
                          </td>

                          <td className="px-5 py-4 text-sm capitalize text-gray-600 dark:text-gray-400">
                            {attendance.student.gender.toLowerCase()}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                attendance.status
                              )}`}
                            >
                              {getStatusIcon(
                                attendance.status
                              )}

                              {getStatusLabel(
                                attendance.status
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  type,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  type?: "present" | "absent" | "late" | "excused";
}) {
  const styles = {
    present:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
    absent:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
    late:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
    excused:
      "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  };

  const style =
    type && styles[type]
      ? styles[type]
      : "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${style}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}