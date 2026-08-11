"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  UserRound,
  BookOpen,
  School,
  Trash2,
  X,
} from "lucide-react";

type Assignment = {
  id: number;
  teacher: string;
  subject: string;
  className: string;
  academicYear: string;
};

export default function AssignmentsPage() {
  const [showForm, setShowForm] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 1,
      teacher: "John Smith",
      subject: "Mathematics",
      className: "Form 1 A",
      academicYear: "2026/2027",
    },
    {
      id: 2,
      teacher: "Mary Johnson",
      subject: "English Language",
      className: "Form 2 A",
      academicYear: "2026/2027",
    },
  ]);

  const [form, setForm] = useState({
    teacher: "",
    subject: "",
    className: "",
    academicYear: "2026/2027",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.teacher ||
      !form.subject ||
      !form.className ||
      !form.academicYear
    ) {
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now(),
      teacher: form.teacher,
      subject: form.subject,
      className: form.className,
      academicYear: form.academicYear,
    };

    setAssignments([...assignments, newAssignment]);

    setForm({
      teacher: "",
      subject: "",
      className: "",
      academicYear: "2026/2027",
    });

    setShowForm(false);
  }

  function removeAssignment(id: number) {
    if (!window.confirm("Remove this teacher assignment?")) {
      return;
    }

    setAssignments(
      assignments.filter((assignment) => assignment.id !== id)
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Teacher Assignments
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Assign teachers to classes and subjects.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
          >
            <Plus size={18} />
            Assign Teacher
          </button>

        </div>

        {/* Assignment Form */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Teacher Assignment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select the teacher, subject and class.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >

              {/* Teacher */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Teacher
                </label>

                <select
                  value={form.teacher}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      teacher: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select teacher</option>
                  <option value="John Smith">John Smith</option>
                  <option value="Mary Johnson">Mary Johnson</option>
                  <option value="Peter Williams">
                    Peter Williams
                  </option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subject
                </label>

                <select
                  value={form.subject}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">
                    English Language
                  </option>
                  <option value="Computer Science">
                    Computer Science
                  </option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Class
                </label>

                <select
                  value={form.className}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      className: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select class</option>
                  <option value="Form 1 A">Form 1 A</option>
                  <option value="Form 1 B">Form 1 B</option>
                  <option value="Form 2 A">Form 2 A</option>
                  <option value="Form 2 B">Form 2 B</option>
                  <option value="Form 3 A">Form 3 A</option>
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Academic Year
                </label>

                <select
                  value={form.academicYear}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      academicYear: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 sm:col-span-2">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 font-medium dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
                >
                  Create Assignment
                </button>

              </div>

            </form>

          </div>
        )}

        {/* Assignment List */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Current Assignments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {assignments.length} teacher assignment
              {assignments.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">

            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {assignment.teacher}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {assignment.academicYear}
                    </p>
                  </div>

                </div>

                <div className="flex flex-wrap gap-3">

                  <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                    <BookOpen size={16} />
                    {assignment.subject}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <School size={16} />
                    {assignment.className}
                  </span>

                </div>

                <button
                  onClick={() => removeAssignment(assignment.id)}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={17} />
                  Remove
                </button>

              </div>
            ))}

          </div>

          {assignments.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No teacher assignments yet.
            </div>
          )}

        </div>

      </div>
    </main>
  );
}