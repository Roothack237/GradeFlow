
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Search,
  Users,
  UserRound,
  ClipboardCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  matricule: string;
  gender: string;
};

type Classroom = {
  id: string;
  name: string;
};

export default function ClassStudentsPage() {
  const params = useParams();
  const id = params.id as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadClassStudents();
    }
  }, [id]);

  async function loadClassStudents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/teacher/classes/${id}/students`,
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load students."
        );
      }

      const studentList = Array.isArray(data)
        ? data
        : data.students || [];

      setStudents(studentList);

      if (data.classroom) {
        setClassroom(data.classroom);
      } else if (data.class) {
        setClassroom(data.class);
      }
    } catch (err) {
      console.error("Class Students Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter((student) => {
    const searchTerm = search.toLowerCase().trim();

    return (
      student.fullName?.toLowerCase().includes(searchTerm) ||
      student.matricule?.toLowerCase().includes(searchTerm) ||
      student.gender?.toLowerCase().includes(searchTerm)
    );
  });

  const classroomName = classroom?.name || "Class";

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                <Users size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {classroomName}
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? "Loading students..."
                    : `${students.length} student${
                        students.length !== 1 ? "s" : ""
                      }`}
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/teacher/attendance?classId=${id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            <ClipboardCheck size={18} />
            Mark Attendance
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Unable to load students
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        {!loading && !error && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={32}
                className="animate-spin text-purple-700"
              />

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading students...
              </p>
            </div>
          </div>
        )}

        {/* Students */}
        {!loading && !error && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

            {/* Section Header */}
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Students
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Students registered in {classroomName}
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">

                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">

                    <th className="px-6 py-4">
                      Matricule
                    </th>

                    <th className="px-6 py-4">
                      Name
                    </th>

                    <th className="px-6 py-4">
                      Gender
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >

                      {/* Matricule */}
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {student.matricule || "—"}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            {student.fullName
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <p className="font-semibold text-gray-900 dark:text-white">
                            {student.fullName || "—"}
                          </p>

                        </div>
                      </td>

                      {/* Gender */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <UserRound size={16} />
                          {student.gender || "—"}
                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800 md:hidden">

              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-5"
                >
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      {student.fullName
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {student.fullName || "—"}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {student.matricule || "No matricule"}
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <UserRound size={16} />
                    {student.gender || "Gender not specified"}
                  </div>
                </div>
              ))}

            </div>

            {/* No Students / No Search Results */}
            {filteredStudents.length === 0 && (
              <div className="p-10 text-center">

                <Users
                  className="mx-auto text-gray-400"
                  size={35}
                />

                <p className="mt-3 font-medium text-gray-900 dark:text-white">
                  {students.length === 0
                    ? "No students in this class"
                    : "No students found"}
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {students.length === 0
                    ? `There are currently no students registered in ${classroomName}.`
                    : "Try a different search term."}
                </p>

              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}

