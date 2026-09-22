"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  GraduationCap,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

interface Student {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  gender?: string | null;
}

interface Section {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface Classroom {
  id: string;
  name: string;
  section: Section | null;
  academicYear: AcademicYear;
  students: Student[];
}

const getStudentName = (student: Student) => {
  if (student.name) {
    return student.name;
  }

  return (
    `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
    "Unnamed Student"
  );
};

export default function ClassStudentsPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] =
    useState<Classroom | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (classroomId) {
      loadClassroom();
    }
  }, [classroomId]);

  const loadClassroom = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/classes/${classroomId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load classroom"
        );
      }

      setClassroom(data.classroom);
    } catch (error) {
      console.error("LOAD CLASSROOM ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load classroom"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* EXISTING SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="lg:pl-64">
        {/* EXISTING NAVBAR */}
        <Navbar />

        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-7xl">


            {/* LOADING */}
            {loading && (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2
                    size={24}
                    className="animate-spin"
                  />

                  <span>
                    Loading students...
                  </span>
                </div>
              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                <h2 className="font-semibold">
                  Failed to load classroom
                </h2>

                <p className="mt-1 text-sm">
                  {error}
                </p>

                <button
                  onClick={loadClassroom}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* CLASS */}
            {!loading &&
              !error &&
              classroom && (
                <>
                  {/* CLASS HEADER */}
                  <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                          <GraduationCap size={28} />
                        </div>

                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {classroom.name}
                          </h1>

                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {classroom.section?.name ||
                              "No Section"}{" "}
                            •{" "}
                            {classroom.academicYear.name}
                          </p>
                        </div>
                      </div>

                      {/* STUDENT COUNT */}
                      <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-5 py-3 dark:bg-gray-800">
                        <Users
                          size={20}
                          className="text-purple-600"
                        />

                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {classroom.students.length}
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {classroom.students.length === 1
                              ? "Student"
                              : "Students"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STUDENTS */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                    {/* HEADER */}
                    <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <Users
                          size={21}
                          className="text-purple-600"
                        />

                        <div>
                          <h2 className="font-bold text-gray-900 dark:text-white">
                            Students
                          </h2>

                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Students registered in{" "}
                            {classroom.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* EMPTY */}
                    {classroom.students.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                          <Users size={25} />
                        </div>

                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          No students found
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          There are currently no
                          students assigned to this
                          class.
                        </p>
                      </div>
                    ) : (
                      /* TABLE */
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                #
                              </th>

                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Student
                              </th>

                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Gender
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {classroom.students.map(
                              (student, index) => (
                                <tr
                                  key={student.id}
                                  className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                >
                                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {index + 1}
                                  </td>

                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                        {getStudentName(student).charAt(0).toUpperCase()}
                                      </div>

                                      <span className="font-medium text-gray-900 dark:text-white">
                                      {getStudentName(student)}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {student.gender ||
                                      "Not specified"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}