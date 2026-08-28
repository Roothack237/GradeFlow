"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

const classes = [
  {
    id: "1",
    name: "Form 1 A",
    section: "Anglophone",
    students: 32,
    subjects: ["Mathematics", "Computer Science"],
  },
  {
    id: "2",
    name: "Form 1 B",
    section: "Anglophone",
    students: 29,
    subjects: ["Mathematics", "Computer Science"],
  },
  {
    id: "3",
    name: "Form 2 A",
    section: "Anglophone",
    students: 35,
    subjects: ["Mathematics", "Physics"],
  },
  {
    id: "4",
    name: "Form 2 B",
    section: "Anglophone",
    students: 31,
    subjects: ["Mathematics", "Physics"],
  },
];

export default function TeacherClassesPage() {
  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Classes
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View the classes and subjects assigned to you.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            icon={<GraduationCap size={22} />}
            title="Assigned Classes"
            value={classes.length}
            description="Active classes"
          />

          <SummaryCard
            icon={<Users size={22} />}
            title="Total Students"
            value={classes.reduce(
              (total, classroom) => total + classroom.students,
              0
            )}
            description="Across all classes"
          />

          <SummaryCard
            icon={<BookOpen size={22} />}
            title="Subjects"
            value="4"
            description="Subjects assigned"
          />
        </div>

        {/* Classes */}
        <div className="grid gap-6 md:grid-cols-2">
          {classes.map((classroom) => (
            <div
              key={classroom.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    <GraduationCap size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {classroom.name}
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {classroom.section}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                  Active
                </span>
              </div>

              {/* Statistics */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Users size={17} />
                    <span className="text-sm">Students</span>
                  </div>

                  <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                    {classroom.students}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <BookOpen size={17} />
                    <span className="text-sm">Subjects</span>
                  </div>

                  <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                    {classroom.subjects.length}
                  </p>
                </div>
              </div>

              {/* Subjects */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Assigned Subjects
                </p>

                <div className="flex flex-wrap gap-2">
                  {classroom.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
                <Link
                  href={`/teacher/classes/${classroom.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                >
                  View Class
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          {icon}
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {description}
      </p>
    </div>
  );
}