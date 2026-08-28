"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Plus,
  School,
  RefreshCw,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Section = {
  id: string;
  name: "ANGLOPHONE" | "FRANCOPHONE";
};

type AcademicYear = {
  id: string;
  name: string;
};

export default function AcademicYearSectionsPage() {
  // ============================================================
  // URL PARAMETER
  // ============================================================

  const params = useParams<{ id: string }>();
  const id = params?.id;

  // ============================================================
  // STATE
  // ============================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [academicYear, setAcademicYear] =
    useState<AcademicYear | null>(null);

  const [sections, setSections] = useState<Section[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD ACADEMIC YEAR
  // ============================================================

  useEffect(() => {
    if (!id) {
      setError("Academic year ID is missing.");
      setLoading(false);
      return;
    }

    loadAcademicYear();
  }, [id]);

  async function loadAcademicYear() {
    if (!id) {
      setError("Academic year ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log(
        "Loading academic year:",
        id
      );

      const url = `/api/admin/academic-years/${encodeURIComponent(id)}`;

      console.log(
        "Fetching:",
        url
      );

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      console.log(
        "Academic year API status:",
        response.status
      );

      console.log(
        "Academic year API response:",
        text
      );

      let data: {
        academicYear?: AcademicYear;
        sections?: Section[];
        error?: string;
      } = {};

      // ==========================================================
      // PARSE RESPONSE
      // ==========================================================

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(
            "JSON PARSE ERROR:",
            parseError
          );

          throw new Error(
            "The server returned an invalid response."
          );
        }
      }

      // ==========================================================
      // HANDLE API ERROR
      // ==========================================================

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to load academic year. Server returned ${response.status}.`
        );
      }

      // ==========================================================
      // VALIDATE ACADEMIC YEAR
      // ==========================================================

      if (!data.academicYear) {
        console.error(
          "Missing academicYear in API response:",
          data
        );

        throw new Error(
          "Academic year information was not returned by the server."
        );
      }

      // ==========================================================
      // SET DATA
      // ==========================================================

      setAcademicYear(data.academicYear);

      setSections(
        Array.isArray(data.sections)
          ? data.sections
          : []
      );

    } catch (error) {
      console.error(
        "LOAD ACADEMIC YEAR ERROR:",
        error
      );

      setAcademicYear(null);
      setSections([]);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load academic year."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FILTER SECTIONS
  // ============================================================

  const anglophoneSections = sections.filter(
    (section) =>
      section.name === "ANGLOPHONE"
  );

  const francophoneSections = sections.filter(
    (section) =>
      section.name === "FRANCOPHONE"
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="min-h-screen lg:ml-72">

        {/* ====================================================
            NAVBAR
        ==================================================== */}

        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          title="Sections"
          subtitle={
            academicYear
              ? `${academicYear.name} • Manage sections`
              : "Manage sections"
          }
        />

        {/* ====================================================
            PAGE
        ==================================================== */}

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">

          <div className="mx-auto max-w-7xl">

            {/* ==================================================
                BACK BUTTON
            ================================================== */}

            <div className="mb-6">


            </div>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Academic Year
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  {academicYear?.name ||
                    "Sections"}
                </h1>

                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Select a section to manage
                  its classes and students.
                </p>

              </div>

              <button
                type="button"
                disabled
                title="Section creation will be added soon"
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white opacity-70"
              >
                <Plus size={18} />

                Add Section
              </button>

            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="font-semibold text-red-700 dark:text-red-400">
                      Unable to load academic year
                    </p>

                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={loadAcademicYear}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <RefreshCw size={16} />

                    Retry
                  </button>

                </div>

              </div>

            )}

            {/* ==================================================
                LOADING
            ================================================== */}

            {loading ? (

              <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700 dark:border-purple-900 dark:border-t-purple-400" />

                <p className="mt-5 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Loading sections...
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Please wait while we retrieve
                  the academic year information.
                </p>

              </div>

            ) : error ? (

              /* =================================================
                 ERROR STATE
              ================================================= */

              <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">

                  <School size={26} />

                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  Could not load sections
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  There was a problem retrieving
                  this academic year. Please try
                  again.
                </p>

                <button
                  type="button"
                  onClick={loadAcademicYear}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                >
                  <RefreshCw size={17} />

                  Try Again
                </button>

              </div>

            ) : (

              /* =================================================
                 SECTIONS
              ================================================= */

              <div className="grid gap-8 lg:grid-cols-2">

                {/* ==============================================
                    ANGLOPHONE
                ============================================== */}

                <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                  {/* Header */}

                  <div className="border-b border-gray-200 bg-purple-50 p-6 dark:border-gray-800 dark:bg-purple-950/20">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">

                        <School size={23} />

                      </div>

                      <div>

                        <h2 className="text-xl font-bold">
                          Anglophone
                        </h2>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          English-speaking sections
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Sections */}

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">

                    {anglophoneSections.length >
                    0 ? (

                      anglophoneSections.map(
                        (section) => (

                          <Link
                            key={section.id}
                            href={`/admin/academic-years/${id}/sections/${section.id}`}
                            className="group flex items-center justify-between p-5 transition hover:bg-purple-50 dark:hover:bg-purple-950/20"
                          >

                            <div className="flex items-center gap-4">

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">

                                <BookOpen
                                  size={18}
                                />

                              </div>

                              <div>

                                <span className="font-semibold">
                                  {section.name}
                                </span>

                                <p className="mt-0.5 text-xs text-gray-400">
                                  English section
                                </p>

                              </div>

                            </div>

                            <ChevronRight
                              size={19}
                              className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-purple-600"
                            />

                          </Link>

                        )
                      )

                    ) : (

                      <div className="p-10 text-center">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">

                          <School size={22} />

                        </div>

                        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                          No Anglophone sections
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          No English-speaking
                          sections have been
                          created yet.
                        </p>

                      </div>

                    )}

                  </div>

                </section>

                {/* ==============================================
                    FRANCOPHONE
                ============================================== */}

                <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                  {/* Header */}

                  <div className="border-b border-gray-200 bg-blue-50 p-6 dark:border-gray-800 dark:bg-blue-950/20">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">

                        <School size={23} />

                      </div>

                      <div>

                        <h2 className="text-xl font-bold">
                          Francophone
                        </h2>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          French-speaking sections
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Sections */}

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">

                    {francophoneSections.length >
                    0 ? (

                      francophoneSections.map(
                        (section) => (

                          <Link
                            key={section.id}
                            href={`/admin/academic-years/${id}/sections/${section.id}`}
                            className="group flex items-center justify-between p-5 transition hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          >

                            <div className="flex items-center gap-4">

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">

                                <BookOpen
                                  size={18}
                                />

                              </div>

                              <div>

                                <span className="font-semibold">
                                  {section.name}
                                </span>

                                <p className="mt-0.5 text-xs text-gray-400">
                                  French section
                                </p>

                              </div>

                            </div>

                            <ChevronRight
                              size={19}
                              className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                            />

                          </Link>

                        )
                      )

                    ) : (

                      <div className="p-10 text-center">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">

                          <School size={22} />

                        </div>

                        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                          No Francophone sections
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          No French-speaking
                          sections have been
                          created yet.
                        </p>

                      </div>

                    )}

                  </div>

                </section>

              </div>

            )}

          </div>

        </main>

      </div>
    </div>
  );
}