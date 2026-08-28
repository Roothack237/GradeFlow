"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Users,
  UserRound,
  Mail,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";

const students = [
  {
    id: "1",
    name: "Manuella Efendeh",
    matricule: "STU001",
    gender: "Female",
    email: "manuella@example.com",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    matricule: "STU002",
    gender: "Female",
    email: "sarah@example.com",
  },
  {
    id: "3",
    name: "Peter Williams",
    matricule: "STU003",
    gender: "Male",
    email: "peter@example.com",
  },
  {
    id: "4",
    name: "Mary Smith",
    matricule: "STU004",
    gender: "Female",
    email: "mary@example.com",
  },
  {
    id: "5",
    name: "Daniel Brown",
    matricule: "STU005",
    gender: "Male",
    email: "daniel@example.com",
  },
];

const classNames: Record<string, string> = {
  "1": "Form 1 A",
  "2": "Form 1 B",
  "3": "Form 2 A",
  "4": "Form 2 B",
};

export default function ClassStudentsPage() {
  const params = useParams();
  const id = params.id as string;

  const [search, setSearch] = useState("");

  const classroom = classNames[id] ?? "Class";

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.matricule.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <Link
          href="/teacher/classes"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-400"
        >
          <ArrowLeft size={17} />
          Back to My Classes
        </Link>

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                <Users size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {classroom}
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {students.length} students
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/teacher/attendance"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            <ClipboardCheck size={18} />
            Mark Attendance
          </Link>
        </div>

        {/* Search */}
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

        {/* Students */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-5 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Students
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Students assigned to {classroom}
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Matricule</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Email</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          {student.name.charAt(0)}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {student.matricule}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {student.gender}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Mail size={15} />
                        {student.email}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {student.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {student.name}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.matricule}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <UserRound size={16} />
                    {student.gender}
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span className="truncate">{student.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-10 text-center">
              <Users className="mx-auto text-gray-400" size={35} />

              <p className="mt-3 font-medium text-gray-900 dark:text-white">
                No students found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try a different search term.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}