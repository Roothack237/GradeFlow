"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  School,
  Users,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Term = {
  id: string;
  name: string;
  order: number;
  isCurrent: boolean;
  sequences: number;
  reportCards: number;
  timetables: number;
};

type Section = {
  id: string;
  name: "ANGLOPHONE" | "FRANCOPHONE";
  classes: number;
  students: number;
};

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  classes: number;
  terms: Term[];
};

export default function AcademicYearPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAcademicYear() {
    if (!id) {
      setError("Academic year ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      setError("");

      const response = await fetch(
        `/api/admin/academic-years/${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load the academic year.");
      }

      setAcademicYear(data.academicYear ?? null);
      setSections(data.sections ?? []);
    } catch (err) {
      console.error("Academic Year Error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load the academic year."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAcademicYear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:ml-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={academicYear?.name ?? "Academic Year"}
          subtitle="Terms, sections and classes of this academic year."
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* BACK */}
            <Link
              href="/admin/academic-years"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:text-purple-800 dark:text-purple-400"
            >
              <ArrowLeft size={16} />
              All academic years
            </Link>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Loading academic year...</span>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            ) : academicYear ? (
              <>
                {/* HEADER */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <CalendarDays size={32} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          Academic Year
                        </p>

                        {academicYear.isActive && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>

                      <h1 className="mt-1 text-2xl font-bold">
                        {academicYear.name}
                      </h1>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(academicYear.startDate)} →{" "}
                        {formatDate(academicYear.endDate)} ·{" "}
                        {academicYear.classes} classes
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={loadAcademicYear}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {/* TERMS */}
                <section className="mb-10">
                  <div className="mb-4 flex items-center gap-2">
                    <Layers size={18} className="text-purple-600 dark:text-purple-400" />

                    <h2 className="text-lg font-bold">Terms</h2>

                    <span className="text-sm text-gray-400">
                      Click a term to see its sections
                    </span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {academicYear.terms.map((term) => (
                      <Link
                        key={term.id}
                        href={`/admin/academic-years/${id}/terms/${term.id}`}
                        className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <CalendarRange size={23} />
                          </div>

                          {term.isCurrent && (
                            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              Current
                            </span>
                          )}
                        </div>

                        <h3 className="mt-5 text-lg font-bold">{term.name}</h3>

                        <div className="mt-3 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <p className="flex items-center gap-2">
                            <ClipboardList size={14} />
                            {term.sequences} sequences
                          </p>

                          <p className="flex items-center gap-2">
                            <School size={14} />
                            {term.timetables} timetable entries
                          </p>

                          <p className="flex items-center gap-2">
                            <GraduationCap size={14} />
                            {term.reportCards} report cards
                          </p>
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                          Open term
                          <ChevronRight
                            size={16}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* SECTIONS */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />

                    <h2 className="text-lg font-bold">Sections</h2>

                    <span className="text-sm text-gray-400">
                      Or jump straight to a section
                    </span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {sections.map((section) => (
                      <Link
                        key={section.id}
                        href={`/admin/academic-years/${id}/sections/${section.id}`}
                        className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            section.name === "ANGLOPHONE"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          <School size={23} />
                        </div>

                        <h3 className="mt-5 text-lg font-bold">
                          {section.name === "ANGLOPHONE"
                            ? "Anglophone Section"
                            : "Francophone Section"}
                        </h3>

                        <div className="mt-3 flex gap-5 text-sm text-gray-500 dark:text-gray-400">
                          <p className="flex items-center gap-2">
                            <Layers size={14} />
                            {section.classes} classes
                          </p>

                          <p className="flex items-center gap-2">
                            <Users size={14} />
                            {section.students} students
                          </p>
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                          View classes
                          <ChevronRight
                            size={16}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
