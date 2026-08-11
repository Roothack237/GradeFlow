"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  FileText,
} from "lucide-react";

type Result = {
  id: number;
  student: string;
  className: string;
  subject: string;
  ca: number;
  exam: number;
  total: number;
  status: "PENDING" | "PUBLISHED";
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([
    {
      id: 1,
      student: "John Efendeh",
      className: "Form 1 A",
      subject: "Mathematics",
      ca: 18,
      exam: 65,
      total: 83,
      status: "PUBLISHED",
    },
    {
      id: 2,
      student: "Mary Johnson",
      className: "Form 1 A",
      subject: "English Language",
      ca: 15,
      exam: 58,
      total: 73,
      status: "PENDING",
    },
    {
      id: 3,
      student: "Peter Williams",
      className: "Form 2 A",
      subject: "Computer Science",
      ca: 19,
      exam: 70,
      total: 89,
      status: "PENDING",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.student
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      result.subject
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      result.className
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      result.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function publishResult(id: number) {
    setResults(
      results.map((result) =>
        result.id === id
          ? {
              ...result,
              status: "PUBLISHED",
            }
          : result
      )
    );
  }

  function publishAll() {
    if (
      !window.confirm(
        "Are you sure you want to publish all pending results?"
      )
    ) {
      return;
    }

    setResults(
      results.map((result) => ({
        ...result,
        status: "PUBLISHED",
      }))
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Results Management
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Review and publish student results.
            </p>
          </div>

          <button
            onClick={publishAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
          >
            <Send size={18} />
            Publish All Pending
          </button>

        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <FileText size={21} />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Total Results
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {results.length}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400">
                <Clock size={21} />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Pending
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    results.filter(
                      (result) => result.status === "PENDING"
                    ).length
                  }
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                <CheckCircle2 size={21} />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Published
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    results.filter(
                      (result) => result.status === "PUBLISHED"
                    ).length
                  }
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:flex-row dark:border-gray-800 dark:bg-gray-900">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, class or subject..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">All Results</option>
            <option value="PENDING">Pending</option>
            <option value="PUBLISHED">Published</option>
          </select>

        </div>

        {/* Results Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Student
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Class
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    CA
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Exam
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Total
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

                {filteredResults.map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >

                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {result.student}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {result.className}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {result.subject}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {result.ca}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {result.exam}
                    </td>

                    <td className="px-6 py-4">

                      <span className="font-bold text-gray-900 dark:text-white">
                        {result.total}
                      </span>

                      <span className="text-gray-400">
                        /100
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      {result.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          <CheckCircle2 size={13} />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
                          <Clock size={13} />
                          Pending
                        </span>
                      )}

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-2">

                        <button
                          title="View result"
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-purple-600 dark:hover:bg-gray-800"
                        >
                          <Eye size={18} />
                        </button>

                        {result.status === "PENDING" && (
                          <button
                            onClick={() =>
                              publishResult(result.id)
                            }
                            title="Publish result"
                            className="rounded-lg p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                          >
                            <Send size={18} />
                          </button>
                        )}

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {filteredResults.length === 0 && (
            <div className="p-12 text-center">

              <FileText
                size={35}
                className="mx-auto text-gray-400"
              />

              <p className="mt-3 text-gray-500">
                No results found.
              </p>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}