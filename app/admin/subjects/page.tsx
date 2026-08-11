"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  MoreVertical,
  X,
} from "lucide-react";

type Subject = {
  id: number;
  name: string;
  code: string;
  description: string;
};

export default function SubjectsPage() {
  const [showForm, setShowForm] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: 1,
      name: "Mathematics",
      code: "MATH",
      description: "Mathematics and problem solving",
    },
    {
      id: 2,
      name: "English Language",
      code: "ENG",
      description: "English language and communication",
    },
    {
      id: 3,
      name: "Computer Science",
      code: "CS",
      description: "Computer science and programming",
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.code) {
      return;
    }

    const newSubject: Subject = {
      id: Date.now(),
      name: form.name,
      code: form.code.toUpperCase(),
      description: form.description,
    };

    setSubjects([...subjects, newSubject]);

    setForm({
      name: "",
      code: "",
      description: "",
    });

    setShowForm(false);
  }

  function deleteSubject(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) return;

    setSubjects(
      subjects.filter((subject) => subject.id !== id)
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
              Subjects
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Create and manage school subjects.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
          >
            <Plus size={18} />
            Add Subject
          </button>

        </div>

        {/* Add Subject Form */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add New Subject
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the subject information below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Subject Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Mathematics"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Subject Code */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject Code
                  </label>

                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value,
                      })
                    }
                    placeholder="e.g. MATH"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 uppercase outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the subject"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
                >
                  Create Subject
                </button>

              </div>

            </form>

          </div>
        )}

        {/* Subject Cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                  <BookOpen size={23} />
                </div>

                <button
                  onClick={() => deleteSubject(subject.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                >
                  <MoreVertical size={20} />
                </button>

              </div>

              <div className="mt-5">

                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {subject.name}
                  </h2>

                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {subject.code}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {subject.description || "No description provided."}
                </p>

              </div>

            </div>
          ))}

        </div>

        {subjects.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <BookOpen className="mx-auto text-gray-400" size={35} />

            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
              No subjects yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Click Add Subject to create your first subject.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}