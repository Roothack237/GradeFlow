"use client";

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";

const students = [
  {
    name: "Manuella Efendeh",
    matricule: "STU001",
    average: 86,
    attendance: 96,
    status: "Excellent",
  },
  {
    name: "Sarah Johnson",
    matricule: "STU002",
    average: 78,
    attendance: 91,
    status: "Good",
  },
  {
    name: "Peter Williams",
    matricule: "STU003",
    average: 64,
    attendance: 84,
    status: "Average",
  },
  {
    name: "Mary Smith",
    matricule: "STU004",
    average: 48,
    attendance: 72,
    status: "Needs Attention",
  },
  {
    name: "John Anderson",
    matricule: "STU005",
    average: 71,
    attendance: 88,
    status: "Good",
  },
];

const subjects = [
  {
    subject: "Mathematics",
    average: 72,
    highest: 94,
    lowest: 43,
  },
  {
    subject: "English Language",
    average: 78,
    highest: 96,
    lowest: 51,
  },
  {
    subject: "Computer Science",
    average: 84,
    highest: 98,
    lowest: 62,
  },
  {
    subject: "Physics",
    average: 67,
    highest: 91,
    lowest: 39,
  },
];

export default function TeacherAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar />

      <div className="">
        <TeacherNavbar
          title="Class Analytics"
          subtitle="Analyze class performance, attendance and student progress."
          teacherName="Teacher"
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">

            {/* Header */}
            <div className="mb-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Activity size={24} />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Class Analytics
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get insights into your students&apos; academic performance
                and attendance.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Class
                  </label>

                  <select className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option>Form 1 A</option>
                    <option>Form 1 B</option>
                    <option>Form 2 A</option>
                    <option>Form 2 B</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Term
                  </label>

                  <select className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </label>

                  <select className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option>All Subjects</option>
                    <option>Mathematics</option>
                    <option>English Language</option>
                    <option>Computer Science</option>
                    <option>Physics</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <AnalyticsCard
                icon={<Users size={21} />}
                title="Total Students"
                value="32"
                description="Students enrolled"
              />

              <AnalyticsCard
                icon={<Award size={21} />}
                title="Class Average"
                value="72.4%"
                description="Overall performance"
                trend="+5.2%"
                positive
              />

              <AnalyticsCard
                icon={<TrendingUp size={21} />}
                title="Pass Rate"
                value="81%"
                description="Students passing"
                trend="+7.4%"
                positive
              />

              <AnalyticsCard
                icon={<AlertTriangle size={21} />}
                title="Needs Attention"
                value="6"
                description="Students below 50%"
                trend="-2"
                positive
              />

            </div>

            {/* Performance Overview */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">

              {/* Performance Distribution */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      Performance Distribution
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Student performance by grade range
                    </p>
                  </div>

                  <BarChart3
                    size={21}
                    className="text-purple-600"
                  />
                </div>

                <div className="space-y-5">
                  <PerformanceBar
                    label="80 - 100%"
                    value={25}
                    students="8 students"
                  />

                  <PerformanceBar
                    label="70 - 79%"
                    value={31}
                    students="10 students"
                  />

                  <PerformanceBar
                    label="60 - 69%"
                    value={22}
                    students="7 students"
                  />

                  <PerformanceBar
                    label="50 - 59%"
                    value={16}
                    students="5 students"
                  />

                  <PerformanceBar
                    label="Below 50%"
                    value={6}
                    students="2 students"
                  />
                </div>
              </div>

              {/* Attendance */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-6">
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Attendance Overview
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Current class attendance statistics
                  </p>
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[18px] border-purple-600">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">
                        89%
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Attendance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <AttendanceStat
                    label="Present"
                    value="89%"
                  />

                  <AttendanceStat
                    label="Late"
                    value="6%"
                  />

                  <AttendanceStat
                    label="Absent"
                    value="5%"
                  />
                </div>
              </div>
            </div>

            {/* Subject Performance */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Subject Performance
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Compare class performance across subjects.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Subject
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Class Average
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Highest
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Lowest
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {subjects.map((subject) => (
                      <tr
                        key={subject.subject}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white">
                          {subject.subject}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-700 to-indigo-600"
                                style={{
                                  width: `${subject.average}%`,
                                }}
                              />
                            </div>

                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {subject.average}%
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 font-semibold text-green-600">
                          {subject.highest}%
                        </td>

                        <td className="px-6 py-5 font-semibold text-red-500">
                          {subject.lowest}%
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              subject.average >= 75
                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                : subject.average >= 60
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            }`}
                          >
                            {subject.average >= 75
                              ? "Strong"
                              : subject.average >= 60
                              ? "Average"
                              : "Needs Improvement"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Performance */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      Student Performance
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Individual student performance overview.
                    </p>
                  </div>

                  <Activity
                    size={21}
                    className="text-purple-600"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {students.map((student) => (
                  <div
                    key={student.matricule}
                    className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:p-6 lg:flex-row lg:items-center"
                  >
                    {/* Student */}
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                        {student.name.charAt(0)}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student.matricule}
                        </p>
                      </div>
                    </div>

                    {/* Average */}
                    <div className="w-full lg:w-44">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-500">
                          Average
                        </span>

                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {student.average}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-700 to-indigo-600"
                          style={{
                            width: `${student.average}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Attendance */}
                    <div className="w-full lg:w-36">
                      <p className="text-xs text-gray-500">
                        Attendance
                      </p>

                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {student.attendance}%
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          student.status === "Excellent"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : student.status === "Good"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                            : student.status === "Average"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        }`}
                      >
                        {student.status}
                      </span>
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

function AnalyticsCard({
  icon,
  title,
  value,
  description,
  trend,
  positive,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
          {icon}
        </div>

        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              positive ? "text-green-600" : "text-red-500"
            }`}
          >
            {positive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {trend}
          </span>
        )}
      </div>

      <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function PerformanceBar({
  label,
  value,
  students,
}: {
  label: string;
  value: number;
  students: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {students}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AttendanceStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
  );
}