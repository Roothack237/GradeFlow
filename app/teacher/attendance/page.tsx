"use client";

import { useState } from "react";
import {
  Check,
  Save,
  Users,
  CalendarDays,
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  matricule: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
};

const initialStudents: Student[] = [
  {
    id: "1",
    name: "Manuella Efendeh",
    matricule: "STU001",
    status: "PRESENT",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    matricule: "STU002",
    status: "PRESENT",
  },
  {
    id: "3",
    name: "Peter Williams",
    matricule: "STU003",
    status: "PRESENT",
  },
  {
    id: "4",
    name: "Mary Smith",
    matricule: "STU004",
    status: "PRESENT",
  },
];

export default function TeacherAttendancePage() {
  const [students, setStudents] =
    useState<Student[]>(initialStudents);

  const [classroom, setClassroom] =
    useState("Form 1 A");

  const [subject, setSubject] =
    useState("Mathematics");

  const [term, setTerm] =
    useState("First Term");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  function updateStatus(
    studentId: string,
    status: Student["status"]
  ) {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? { ...student, status }
          : student
      )
    );
  }

  function markAllPresent() {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        status: "PRESENT",
      }))
    );
  }

  function handleSave() {
    console.log({
      classroom,
      subject,
      term,
      date,
      students,
    });

    alert("Attendance saved successfully!");
  }

  const presentCount = students.filter(
    (student) => student.status === "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) => student.status === "ABSENT"
  ).length;

  const lateCount = students.filter(
    (student) => student.status === "LATE"
  ).length;

  const excusedCount = students.filter(
    (student) => student.status === "EXCUSED"
  ).length;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 p-5 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <Users size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Record and manage student attendance.
              </p>
            </div>
          </div>
        </div>

        {/* Selection Card */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-5 flex items-center gap-3">
            <CalendarDays
              size={20}
              className="text-purple-600"
            />

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Attendance Details
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select the class, subject and date.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* Classroom */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Classroom
              </label>

              <select
                value={classroom}
                onChange={(e) =>
                  setClassroom(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>Form 1 A</option>
                <option>Form 1 B</option>
                <option>Form 2 A</option>
                <option>Form 2 B</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>Mathematics</option>
                <option>English Language</option>
                <option>Computer Science</option>
                <option>Physics</option>
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Term
              </label>

              <select
                value={term}
                onChange={(e) =>
                  setTerm(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Present"
            value={presentCount}
            className="text-green-600"
          />

          <SummaryCard
            label="Absent"
            value={absentCount}
            className="text-red-600"
          />

          <SummaryCard
            label="Late"
            value={lateCount}
            className="text-yellow-600"
          />

          <SummaryCard
            label="Excused"
            value={excusedCount}
            className="text-blue-600"
          />

        </div>

        {/* Students */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Users size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {classroom}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {students.length} students
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={markAllPresent}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              <Check size={16} />
              Mark All Present
            </button>

          </div>

          {/* Student Rows */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">

            {students.map((student) => (
              <div
                key={student.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {student.name}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {student.matricule}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  <StatusButton
                    label="Present"
                    active={
                      student.status === "PRESENT"
                    }
                    activeClass="bg-green-600 text-white"
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "PRESENT"
                      )
                    }
                  />

                  <StatusButton
                    label="Absent"
                    active={
                      student.status === "ABSENT"
                    }
                    activeClass="bg-red-600 text-white"
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "ABSENT"
                      )
                    }
                  />

                  <StatusButton
                    label="Late"
                    active={
                      student.status === "LATE"
                    }
                    activeClass="bg-yellow-500 text-white"
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "LATE"
                      )
                    }
                  />

                  <StatusButton
                    label="Excused"
                    active={
                      student.status === "EXCUSED"
                    }
                    activeClass="bg-blue-600 text-white"
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "EXCUSED"
                      )
                    }
                  />

                </div>
              </div>
            ))}

          </div>

          {/* Save */}
          <div className="flex justify-end border-t border-gray-200 p-6 dark:border-gray-800">

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800"
            >
              <Save size={18} />
              Save Attendance
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${className}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS BUTTON
========================================================= */

function StatusButton({
  label,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? activeClass
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}