"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  ArrowRight,
  X,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export default function AcademicYearsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadAcademicYears();
  }, []);

  // ============================================================
  // SORT HELPER — active year first, then most recent
  // ============================================================

  function sortYears(years: AcademicYear[]) {
    return [...years].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      return (
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    });
  }

  // ============================================================
  // LOAD ACADEMIC YEARS
  // ============================================================

  async function loadAcademicYears() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/academic-years", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load academic years");
      }

      const years: AcademicYear[] = data.academicYears || [];

      setAcademicYears(sortYears(years));
    } catch (error) {
      console.error("LOAD ACADEMIC YEARS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load academic years."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CREATE ACADEMIC YEAR
  // ============================================================

  async function createAcademicYear(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.startDate || !form.endDate) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create academic year");
      }

      setAcademicYears((previous) =>
        sortYears([...previous, data.academicYear])
      );

      setForm({
        name: "",
        startDate: "",
        endDate: "",
      });

      setShowModal(false);
    } catch (error) {
      console.error("CREATE ACADEMIC YEAR ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create academic year."
      );
    } finally {
      setCreating(false);
    }
  }

  // ============================================================
  // SET ACTIVE ACADEMIC YEAR
  // ============================================================

  async function setActiveAcademicYear(id: string) {
    try {
      setActivatingId(id);
      setError("");

      const response = await fetch("/api/admin/academic-years", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, isActive: true }),
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate academic year.");
      }

      setAcademicYears((previous) =>
        sortYears(
          previous.map((year) => ({
            ...year,
            isActive: year.id === id,
          }))
        )
      );
    } catch (error) {
      console.error("SET ACTIVE ACADEMIC YEAR ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to activate academic year."
      );
    } finally {
      setActivatingId(null);
    }
  }

  // ============================================================
  // DELETE ACADEMIC YEAR
  // ============================================================

  async function deleteAcademicYear(id: string, name: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the academic year "${name}"?\n\nThis may also delete the sections, classes and other data connected to this academic year.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(`/api/admin/academic-years/${id}`, {
        method: "DELETE",
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete academic year.");
      }

      // Remove it immediately from the page
      setAcademicYears((previous) => previous.filter((year) => year.id !== id));
    } catch (error) {
      console.error("DELETE ACADEMIC YEAR ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete academic year."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* SIDEBAR */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN */}
      <div className="min-h-screen lg:ml-72">
        {/* NAVBAR */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Academic Years"
          subtitle="Create and manage academic years"
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* HEADER */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-bold">Academic Years</h1>

                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Manage your school academic years. The active year scopes
                  everything else in the admin dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800"
              >
                <Plus size={19} />
                Create Academic Year
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* LOADING */}
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />

                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Loading academic years...
                </p>
              </div>
            ) : academicYears.length === 0 ? (
              /* EMPTY */
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center dark:border-gray-700 dark:bg-gray-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <CalendarDays size={30} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  No academic years yet
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Create your first academic year to get started.
                </p>

                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-6 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-800"
                >
                  Create Academic Year
                </button>
              </div>
            ) : (
              /* YEARS */
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {academicYears.map((year) => {
                  const isDeleting = deletingId === year.id;
                  const isActivating = activatingId === year.id;

                  return (
                    <div
                      key={year.id}
                      className={`group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900 ${
                        year.isActive
                          ? "border-purple-300 ring-2 ring-purple-100 dark:border-purple-700 dark:ring-purple-950"
                          : "border-gray-200 dark:border-gray-800 dark:hover:border-purple-700"
                      }`}
                    >
                      {/* CURRENT BADGE */}
                      {year.isActive && (
                        <div className="absolute right-4 top-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          Active
                        </div>
                      )}

                      {/* CLICKABLE CARD CONTENT */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition duration-300 group-hover:scale-105 dark:bg-purple-900/30 dark:text-purple-300">
                            <CalendarDays size={27} />
                          </div>
                        </div>

                        <h2 className="mt-6 text-xl font-bold">{year.name}</h2>

                        <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <p>
                            Start: {new Date(year.startDate).toLocaleDateString()}
                          </p>

                          <p>End: {new Date(year.endDate).toLocaleDateString()}</p>
                        </div>

                        <Link
                          href={`/admin/academic-years/${year.id}`}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition hover:gap-3 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Open year
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </Link>
                      </div>

                      {/* ACTIONS */}
                      <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                        <button
                          type="button"
                          disabled={year.isActive || isActivating}
                          onClick={() => setActiveAcademicYear(year.id)}
                          className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-purple-600 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent dark:text-purple-300 dark:hover:bg-purple-950/30 dark:disabled:text-gray-600"
                        >
                          {isActivating ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
                              Activating...
                            </>
                          ) : year.isActive ? (
                            <>
                              <CheckCircle2 size={16} />
                              Active
                            </>
                          ) : (
                            "Set as Active"
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            deleteAcademicYear(year.id, year.name);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30"
                        >
                          {isDeleting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 size={17} />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-gray-900">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create Academic Year</h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add a new school academic year.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={createAcademicYear} className="mt-6 space-y-5">
              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Academic Year
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. 2027/2028"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-purple-950"
                />
              </div>

              {/* START DATE */}
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
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              {/* END DATE */}
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
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-purple-700 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
