"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Save,
  Users,
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

  const [classroom, setClassroom] = useState("Form 1 A");
  const [subject, setSubject] = useState("Mathematics");
  const [sequence, setSequence] = useState("First Term");
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
          ? {
              ...student,
              status,
            }
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
      sequence,
      date,
      students,
    });

    alert("Attendance saved successfully!");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div>
          <Link
            href="/teacher/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Attendance
          </h1>

          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Record attendance for your students.
          </p>
        </div>

        {/* Selection */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* Classroom */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Classroom
              </label>

              <select
                value={classroom}
                onChange={(e) =>
                  setClassroom(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>Form 1 A</option>
                <option>Form 1 B</option>
                <option>Form 2 A</option>
                <option>Form 2 B</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>Mathematics</option>
                <option>English Language</option>
                <option>Computer Science</option>
                <option>Physics</option>
              </select>
            </div>

            {/* Sequence */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Term
              </label>

              <select
                value={sequence}
                onChange={(e) =>
                  setSequence(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

          </div>
        </div>

        {/* Students */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Users size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {classroom}
                </h2>

                <p className="text-sm text-gray-500">
                  {students.length} students
                </p>
              </div>

            </div>

            <button
              onClick={markAllPresent}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400"
            >
              <Check size={16} />
              Mark All Present
            </button>

          </div>

          {/* Student rows */}
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

                  <p className="text-sm text-gray-500">
                    {student.matricule}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "PRESENT"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      student.status === "PRESENT"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "ABSENT"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      student.status === "ABSENT"
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Absent
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "LATE"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      student.status === "LATE"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        student.id,
                        "EXCUSED"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      student.status === "EXCUSED"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Excused
                  </button>

                </div>

              </div>
            ))}

          </div>

          {/* Save */}
          <div className="flex justify-end border-t border-gray-200 p-6 dark:border-gray-800">

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800"
            >
              <Save size={18} />
              Save Attendance
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}