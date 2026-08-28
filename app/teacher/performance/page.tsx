"use client";

import { useState } from "react";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

const students = [
  {
    name: "Manuella Efendeh",
    matricule: "STU001",
    average: 86,
    grade: "A",
    trend: "up",
  },
  {
    name: "Sarah Johnson",
    matricule: "STU002",
    average: 78,
    grade: "B",
    trend: "up",
  },
  {
    name: "Peter Williams",
    matricule: "STU003",
    average: 72,
    grade: "B",
    trend: "down",
  },
  {
    name: "Mary Smith",
    matricule: "STU004",
    average: 68,
    grade: "C",
    trend: "up",
  },
  {
    name: "David Anderson",
    matricule: "STU005",
    average: 61,
    grade: "C",
    trend: "down",
  },
  {
    name: "Jessica Brown",
    matricule: "STU006",
    average: 54,
    grade: "D",
    trend: "down",
  },
];

const subjects = [
  {
    name: "Mathematics",
    average: 74,
    students: 32,
  },
  {
    name: "Computer Science",
    average: 82,
    students: 28,
  },
  {
    name: "English Language",
    average: 69,
    students: 35,
  },
  {
    name: "Physics",
    average: 63,
    students: 30,
  },
];

export default function TeacherPerformancePage() {
  const [selectedClass, setSelectedClass] = useState("Form 1 A");
  const [selectedTerm, setSelectedTerm] = useState("First Term");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar />

      <div className="">
        <TeacherNavbar
          title="Performance"
          subtitle="Monitor and analyze your students' academic performance."
          teacherName="Teacher"
          onMenuClick={() => {}}
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                    <BarChart3 size={22} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Student Performance
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Track academic results and identify students who need
                      support.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none focus:border-purple-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <option>Form 1 A</option>
                    <option>Form 1 B</option>
                    <option>Form 2 A</option>
                    <option>Form 2 B</option>
                    <option>Form 3 A</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none focus:border-purple-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Users size={20} />}
                label="Students"
                value="32"
                description="In selected class"
                iconClass="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
              />

              <StatCard
                icon={<BarChart3 size={20} />}
                label="Class Average"
                value="74%"
                description="+4.2% from last term"
                iconClass="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
              />

              <StatCard
                icon={<Award size={20} />}
                label="Top Average"
                value="91%"
                description="Highest student"
                iconClass="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
              />

              <StatCard
                icon={<AlertTriangle size={20} />}
                label="Needs Support"
                value="5"
                description="Students below 50%"
                iconClass="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              />
            </div>

            {/* Performance Overview */}
            <div className="mb-6 grid gap-6 lg:grid-cols-3">
              {/* Class Average */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Class Average
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Overall academic performance
                </p>

                <div className="mt-7 flex items-center justify-center">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[16px] border-purple-100 dark:border-purple-950/50">
                    <div className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-t-purple-700 border-r-purple-700 rotate-[-35deg]" />

                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">
                        74%
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Average
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <TrendingUp size={17} />
                  4.2% improvement
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Grade Distribution
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Students grouped by current grade
                </p>

                <div className="mt-7 space-y-5">
                  <GradeBar
                    grade="A"
                    label="Excellent"
                    count={6}
                    percentage={19}
                  />

                  <GradeBar
                    grade="B"
                    label="Good"
                    count={12}
                    percentage={38}
                  />

                  <GradeBar
                    grade="C"
                    label="Average"
                    count={9}
                    percentage={28}
                  />

                  <GradeBar
                    grade="D"
                    label="Needs Improvement"
                    count={5}
                    percentage={15}
                  />
                </div>
              </div>
            </div>

            {/* Subject Performance */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Subject Performance
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Average performance by subject
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                {subjects.map((subject) => (
                  <div
                    key={subject.name}
                    className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {subject.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {subject.students} students
                        </p>
                      </div>

                      <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {subject.average}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-purple-700"
                        style={{
                          width: `${subject.average}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Performance Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Student Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedClass} · {selectedTerm}
                  </p>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Student
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Matricule
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Average
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Grade
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Trend
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {students.map((student) => (
                      <tr
                        key={student.matricule}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {student.matricule}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-10 text-sm font-bold text-gray-900 dark:text-white">
                              {student.average}%
                            </span>

                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full bg-purple-700"
                                style={{
                                  width: `${student.average}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <GradeBadge grade={student.grade} />
                        </td>

                        <td className="px-6 py-4">
                          {student.trend === "up" ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                              <TrendingUp size={16} />
                              Improving
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-500">
                              <TrendingDown size={16} />
                              Declining
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
                {students.map((student) => (
                  <div key={student.matricule} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {student.matricule}
                        </p>
                      </div>

                      <GradeBadge grade={student.grade} />
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-gray-500">
                          Average
                        </span>

                        <span className="font-bold text-gray-900 dark:text-white">
                          {student.average}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-purple-700"
                          style={{
                            width: `${student.average}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      {student.trend === "up" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <TrendingUp size={15} />
                          Improving
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                          <TrendingDown size={15} />
                          Declining
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function GradeBar({
  grade,
  label,
  count,
  percentage,
}: {
  grade: string;
  label: string;
  count: number;
  percentage: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
            {grade}
          </span>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {count} students · {percentage}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-purple-700"
          style={{
            width: `${percentage * 2.5}%`,
          }}
        />
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const classes =
    grade === "A"
      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
      : grade === "B"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
        : grade === "C"
          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
          : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";

  return (
    <span
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold ${classes}`}
    >
      {grade}
    </span>
  );
}