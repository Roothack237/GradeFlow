"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  CheckCircle2,
  X,
} from "lucide-react";

type Term = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
};

type AcademicYear = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE";
  terms: Term[];
};

export default function AcademicYearsPage() {
  const [showForm, setShowForm] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([
    {
      id: 1,
      name: "2026/2027",
      startDate: "2026-09-01",
      endDate: "2027-07-31",
      status: "ACTIVE",
      terms: [
        {
          id: 1,
          name: "First Term",
          startDate: "2026-09-01",
          endDate: "2026-12-20",
        },
        {
          id: 2,
          name: "Second Term",
          startDate: "2027-01-05",
          endDate: "2027-03-31",
        },
        {
          id: 3,
          name: "Third Term",
          startDate: "2027-04-05",
          endDate: "2027-07-31",
        },
      ],
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.startDate || !form.endDate) {
      return;
    }

    const newAcademicYear: AcademicYear = {
      id: Date.now(),
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "INACTIVE",
      terms: [],
    };

    setAcademicYears([...academicYears, newAcademicYear]);

    setForm({
      name: "",
      startDate: "",
      endDate: "",
    });

    setShowForm(false);
  }

  function setActiveYear(id: number) {
    setAcademicYears(
      academicYears.map((year) => ({
        ...year,
        status: year.id === id ? "ACTIVE" : "INACTIVE",
      }))
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
              Academic Years
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage academic years and school terms.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
          >
            <Plus size={18} />
            Add Academic Year
          </button>

        </div>

        {/* Create Academic Year */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Academic Year
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Define the academic year period.
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
              className="mt-6 grid gap-5 sm:grid-cols-3"
            >

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Academic Year
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="2027/2028"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Start Date
                </label>

                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startDate: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  End Date
                </label>

                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endDate: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 font-medium dark:border-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
                >
                  Create Academic Year
                </button>

              </div>

            </form>

          </div>
        )}

        {/* Academic Years */}
        <div className="mt-8 space-y-6">

          {academicYears.map((year) => (
            <div
              key={year.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >

              {/* Year Header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                    <CalendarDays size={23} />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">

                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {year.name}
                      </h2>

                      {year.status === "ACTIVE" && (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          <CheckCircle2 size={13} />
                          Active
                        </span>
                      )}

                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {year.startDate} → {year.endDate}
                    </p>
                  </div>

                </div>

                {year.status !== "ACTIVE" && (
                  <button
                    onClick={() => setActiveYear(year.id)}
                    className="rounded-xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-400"
                  >
                    Set as Active
                  </button>
                )}

              </div>

              {/* Terms */}
              <div className="mt-6">

                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  Terms
                </h3>

                {year.terms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500">
                      No terms have been added yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">

                    {year.terms.map((term) => (
                      <div
                        key={term.id}
                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {term.name}
                        </h4>

                        <p className="mt-2 text-sm text-gray-500">
                          {term.startDate}
                        </p>

                        <p className="text-sm text-gray-500">
                          to {term.endDate}
                        </p>
                      </div>
                    ))}

                  </div>
                )}

              </div>

            </div>
          ))}

        </div>

      </div>
    </main>
  );
}