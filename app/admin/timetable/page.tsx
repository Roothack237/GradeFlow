"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  XCircle,
  AlertCircle,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";

// =========================================================
// TYPES
// =========================================================

type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY";

type AvailabilityStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  terms: Term[];
};

type Term = {
  id: string;
  name: string;
  order: number;
  academicYearId?: string;
  academicYear?: {
    id: string;
    name: string;
  };
};

type AvailabilitySlot = {
  id: string;
  day: WeekDay;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  note: string | null;
};

type TeacherAssignment = {
  id: string;
  section: {
    id: string;
    name: string;
  };
  classroom: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
  };
};

type AvailabilitySummary = {
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  email: string;
  phone: string | null;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  status: "READY" | "PENDING" | "MISSING" | "REJECTED";
  availability: AvailabilitySlot[];
  assignments: TeacherAssignment[];
};

type AvailabilityCounts = {
  totalTeachers: number;
  missing: number;
  pending: number;
  ready: number;
  rejected: number;
};

type Publication = {
  id: string;
  termId: string;
  classroomId: string;
  class: string;
  term: string;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  publishedAt: string | null;
  notes: string | null;
};

type TimetableEntry = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    fullName: string;
    teacherId: string;
  };
};

type UnscheduledAssignment = {
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  classroomName: string;
  subjectName: string;
  subjectCode: string;
  reason: string;
};

// =========================================================
// CONSTANTS
// =========================================================

const DAYS: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
];

// =========================================================
// HELPERS
// =========================================================

function formatDay(day: string) {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function getStatusStyle(status: string) {
  switch (status) {
    case "READY":
    case "APPROVED":
    case "PUBLISHED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

    case "PENDING":
    case "DRAFT":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

    case "REJECTED":
    case "UNPUBLISHED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

    case "MISSING":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "READY":
    case "APPROVED":
    case "PUBLISHED":
      return <CheckCircle2 size={15} />;

    case "PENDING":
    case "DRAFT":
      return <Clock3 size={15} />;

    case "REJECTED":
    case "UNPUBLISHED":
      return <XCircle size={15} />;

    default:
      return <AlertCircle size={15} />;
  }
}

// =========================================================
// PAGE
// =========================================================

export default function TimetablePage() {
  // -------------------------------------------------------
  // DATA
  // -------------------------------------------------------

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(
    []
  );

  const [availabilitySummary, setAvailabilitySummary] = useState<
    AvailabilitySummary[]
  >([]);

  const [availabilityCounts, setAvailabilityCounts] =
    useState<AvailabilityCounts>({
      totalTeachers: 0,
      missing: 0,
      pending: 0,
      ready: 0,
      rejected: 0,
    });

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  const [publications, setPublications] = useState<Publication[]>(
    []
  );

  const [unscheduled, setUnscheduled] = useState<
    UnscheduledAssignment[]
  >([]);

  // -------------------------------------------------------
  // FILTERS
  // -------------------------------------------------------

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");

  // -------------------------------------------------------
  // UI STATE
  // -------------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTeacher, setSelectedTeacher] =
    useState<AvailabilitySummary | null>(null);

  // =========================================================
  // API RESPONSE HELPER
  // =========================================================

  async function readApiResponse(response: Response) {
    const contentType =
      response.headers.get("content-type") || "";

    const text = await response.text();

    if (!text.trim()) {
      return {
        data: {},
        raw: "",
      };
    }

    if (contentType.includes("application/json")) {
      try {
        return {
          data: JSON.parse(text),
          raw: text,
        };
      } catch {
        return {
          data: {},
          raw: text,
        };
      }
    }

    return {
      data: {},
      raw: text,
    };
  }

  // =========================================================
  // LOAD ACADEMIC YEARS
  // =========================================================

  async function loadAcademicYears() {
    const response = await fetch(
      "/api/admin/academic-years",
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const { data, raw } = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          raw ||
          `Failed to load academic years (${response.status})`
      );
    }

    let years: AcademicYear[] = [];

    if (Array.isArray(data?.academicYears)) {
      years = data.academicYears;
    } else if (Array.isArray(data)) {
      years = data;
    }

    // -------------------------------------------------------
    // If academic years do not contain terms, load terms
    // separately.
    // -------------------------------------------------------

    const needsTerms = years.some(
      (year) =>
        !Array.isArray(year.terms) ||
        year.terms.length === 0
    );

    if (needsTerms) {
      try {
        const termsResponse = await fetch(
          "/api/admin/terms",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const {
          data: termsData,
        } = await readApiResponse(termsResponse);

        if (termsResponse.ok && Array.isArray(termsData?.terms)) {
          const allTerms: Term[] = termsData.terms;

          years = years.map((year) => ({
            ...year,
            terms: allTerms
              .filter(
                (term) =>
                  term.academicYearId === year.id ||
                  term.academicYear?.id === year.id
              )
              .sort(
                (a, b) =>
                  Number(a.order) - Number(b.order)
              ),
          }));
        }
      } catch (termError) {
        console.error(
          "FAILED TO LOAD TERMS:",
          termError
        );
      }
    }

    console.log("ACADEMIC YEARS:", years);

    setAcademicYears(years);

    return years;
  }

  // =========================================================
  // LOAD TIMETABLE
  // =========================================================

  async function loadTimetableData(
    selectedAcademicYearId = academicYearId,
    selectedTermId = termId
  ) {
    try {
      // -----------------------------------------------------
      // NEVER CALL THE TIMETABLE API WITHOUT BOTH FILTERS
      // -----------------------------------------------------

      if (
        !selectedAcademicYearId ||
        !selectedTermId
      ) {
        console.log(
          "Skipping timetable load because year or term is missing."
        );

        return;
      }

      setLoading(true);
      setError("");

      const query = new URLSearchParams();

      query.set(
        "academicYearId",
        selectedAcademicYearId
      );

      query.set("termId", selectedTermId);

      const url = `/api/admin/timetable?${query.toString()}`;

      console.log("TIMETABLE REQUEST:", url);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const { data, raw } =
        await readApiResponse(response);

      if (!response.ok) {
        console.error(
          "TIMETABLE API ERROR:",
          response.status,
          data,
          raw
        );

        throw new Error(
          data?.message ||
            data?.error ||
            (raw
              ? raw.slice(0, 300)
              : `Failed to load timetable data (${response.status})`)
        );
      }

      // -----------------------------------------------------
      // Update timetable information
      // -----------------------------------------------------

      setAvailabilitySummary(
        Array.isArray(data?.availabilitySummary)
          ? data.availabilitySummary
          : []
      );

      setAvailabilityCounts(
        data?.availabilityCounts ?? {
          totalTeachers:
            data?.availabilitySummary?.length ?? 0,
          missing: 0,
          pending: 0,
          ready: 0,
          rejected: 0,
        }
      );

      setTimetable(
        Array.isArray(data?.timetable)
          ? data.timetable
          : []
      );

      setPublications(
        Array.isArray(data?.publications)
          ? data.publications
          : []
      );

      setUnscheduled(
        Array.isArray(data?.unscheduled)
          ? data.unscheduled
          : []
      );

      // -----------------------------------------------------
      // If API returns academic years, keep them
      // -----------------------------------------------------

      if (
        Array.isArray(data?.academicYears) &&
        data.academicYears.length > 0
      ) {
        setAcademicYears(data.academicYears);
      }

      console.log(
        "TIMETABLE DATA LOADED:",
        data
      );
    } catch (err) {
      console.error(
        "TIMETABLE LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setLoading(true);
        setError("");

        const years =
          await loadAcademicYears();

        if (cancelled) return;

        if (!years.length) {
          setError(
            "No academic years were found."
          );
          setLoading(false);
          return;
        }

        // ---------------------------------------------------
        // Select first academic year
        // ---------------------------------------------------

        const firstYear = years[0];

        const firstTerm =
          firstYear.terms?.length
            ? firstYear.terms[0]
            : null;

        console.log(
          "INITIAL ACADEMIC YEAR:",
          firstYear
        );

        console.log(
          "INITIAL TERM:",
          firstTerm
        );

        setAcademicYearId(firstYear.id);

        if (firstTerm) {
          setTermId(firstTerm.id);
        } else {
          setTermId("");

          setError(
            `No terms were found for ${firstYear.name}.`
          );
        }
      } catch (err) {
        console.error(
          "INITIAL TIMETABLE LOAD ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize timetable"
          );

          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // LOAD TIMETABLE WHEN YEAR OR TERM CHANGES
  // =========================================================

  useEffect(() => {
    if (!academicYearId || !termId) {
      return;
    }

    console.log(
      "LOADING TIMETABLE FOR:",
      {
        academicYearId,
        termId,
      }
    );

    loadTimetableData(
      academicYearId,
      termId
    );
  }, [academicYearId, termId]);

  // =========================================================
  // ACADEMIC YEAR CHANGE
  // =========================================================

  function handleAcademicYearChange(
    yearId: string
  ) {
    console.log(
      "SELECTED ACADEMIC YEAR:",
      yearId
    );

    const selectedYear =
      academicYears.find(
        (year) => year.id === yearId
      );

    setAcademicYearId(yearId);

    // -------------------------------------------------------
    // Automatically select first term of selected year
    // -------------------------------------------------------

    if (
      selectedYear &&
      selectedYear.terms &&
      selectedYear.terms.length > 0
    ) {
      const firstTerm =
        [...selectedYear.terms].sort(
          (a, b) =>
            Number(a.order) -
            Number(b.order)
        )[0];

      console.log(
        "AUTO SELECTED TERM:",
        firstTerm
      );

      setTermId(firstTerm.id);
    } else {
      console.log(
        "NO TERMS FOUND FOR SELECTED YEAR"
      );

      setTermId("");
    }
  }

  // =========================================================
  // TERM CHANGE
  // =========================================================

  function handleTermChange(
    selectedTermId: string
  ) {
    console.log(
      "SELECTED TERM:",
      selectedTermId
    );

    setTermId(selectedTermId);
  }

  // =========================================================
  // GENERATE TIMETABLE
  // =========================================================

  async function generateTimetable() {
    if (!academicYearId || !termId) {
      setError(
        "Please select an academic year and term first."
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/timetable",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            academicYearId,
            termId,
          }),
        }
      );

      const { data, raw } =
        await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            raw ||
            `Failed to generate timetable (${response.status})`
        );
      }

      setSuccess(
        data?.message ||
          "Timetable generated successfully."
      );

      await loadTimetableData(
        academicYearId,
        termId
      );
    } catch (err) {
      console.error(
        "GENERATE TIMETABLE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate timetable"
      );
    } finally {
      setGenerating(false);
    }
  }

  // =========================================================
  // PUBLISH / UNPUBLISH
  // =========================================================

  async function publishTimetable(
    classroomId: string,
    action: "publish" | "unpublish"
  ) {
    if (!termId) {
      setError(
        "Please select a term first."
      );
      return;
    }

    try {
      setPublishing(
        `${classroomId}-${action}`
      );

      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/timetable/publish",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            termId,
            classroomId,
            action,
          }),
        }
      );

      const { data, raw } =
        await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            raw ||
            `Failed to ${action} timetable`
        );
      }

      setSuccess(
        data?.message ||
          `Timetable ${
            action === "publish"
              ? "published"
              : "unpublished"
          } successfully.`
      );

      await loadTimetableData(
        academicYearId,
        termId
      );
    } catch (err) {
      console.error(
        "PUBLISH ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} timetable`
      );
    } finally {
      setPublishing(null);
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function getTimetableEntry(
    day: string,
    startTime: string
  ) {
    return timetable.find(
      (entry) =>
        entry.day === day &&
        entry.startTime === startTime
    );
  }

  const currentYear =
    academicYears.find(
      (year) =>
        year.id === academicYearId
    );

  const currentTerm =
    currentYear?.terms?.find(
      (term) => term.id === termId
    );

  // Group publications by classroom
  const publicationGroups =
    publications.reduce(
      (
        groups,
        publication
      ) => {
        if (
          !groups[publication.classroomId]
        ) {
          groups[
            publication.classroomId
          ] = [];
        }

        groups[
          publication.classroomId
        ].push(publication);

        return groups;
      },
      {} as Record<
        string,
        Publication[]
      >
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminNavbar />

        <main className="p-4 sm:p-6 lg:p-8">
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
                  <CalendarDays
                    className="text-purple-600 dark:text-purple-400"
                    size={26}
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Timetable
                  </h1>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage teacher availability
                    and generate school timetables.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  loadTimetableData(
                    academicYearId,
                    termId
                  )
                }
                disabled={
                  loading ||
                  !academicYearId ||
                  !termId
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={
                  generateTimetable
                }
                disabled={
                  generating ||
                  loading ||
                  !academicYearId ||
                  !termId
                }
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles size={17} />
                )}

                {generating
                  ? "Generating..."
                  : "Generate Timetable"}
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">
                <p className="font-medium">
                  {error}
                </p>

                {error
                  .toLowerCase()
                  .includes("unauthorized") && (
                  <Link
                    href="/login"
                    className="mt-2 inline-block text-sm font-medium underline"
                  >
                    Sign in again
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <XCircle size={18} />
              </button>
            </div>
          )}

          {/* ================================================= */}
          {/* SUCCESS */}
          {/* ================================================= */}

          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle2 size={20} />

              <p className="flex-1 font-medium">
                {success}
              </p>

              <button
                type="button"
                onClick={() =>
                  setSuccess("")
                }
              >
                <XCircle size={18} />
              </button>
            </div>
          )}

          {/* ================================================= */}
          {/* FILTERS */}
          {/* ================================================= */}

          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Timetable Filters
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the academic year and term
                you want to manage.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Academic Year */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Academic Year
                </label>

                <select
                  value={academicYearId}
                  onChange={(e) =>
                    handleAcademicYearChange(
                      e.target.value
                    )
                  }
                  disabled={
                    loading &&
                    academicYears.length === 0
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">
                    {academicYears.length ===
                    0
                      ? "Loading academic years..."
                      : "Select academic year"}
                  </option>

                  {academicYears.map(
                    (year) => (
                      <option
                        key={year.id}
                        value={year.id}
                      >
                        {year.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Term */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Term
                </label>

                <select
                  value={termId}
                  onChange={(e) =>
                    handleTermChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !academicYearId
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">
                    {!academicYearId
                      ? "Select academic year first"
                      : "Select term"}
                  </option>

                  {currentYear?.terms
                    ?.slice()
                    .sort(
                      (a, b) =>
                        Number(a.order) -
                        Number(b.order)
                    )
                    .map((term) => (
                      <option
                        key={term.id}
                        value={term.id}
                      >
                        {term.name}
                      </option>
                    ))}
                </select>

                {academicYearId &&
                  currentYear &&
                  (!currentYear.terms ||
                    currentYear.terms
                      .length === 0) && (
                    <p className="mt-2 text-xs text-red-500">
                      No terms found for{" "}
                      {currentYear.name}.
                    </p>
                  )}
              </div>
            </div>

            {/* Current selection */}
            {academicYearId &&
              termId && (
                <div className="mt-5 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    <span className="font-semibold">
                      Selected:
                    </span>{" "}
                    {currentYear?.name} —{" "}
                    {currentTerm?.name}
                  </p>
                </div>
              )}
          </section>

          {/* ================================================= */}
          {/* LOADING */}
          {/* ================================================= */}

          {loading &&
            academicYearId &&
            termId && (
              <div className="mb-8 flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                  <Loader2
                    size={30}
                    className="animate-spin text-purple-600"
                  />

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading timetable data...
                  </p>
                </div>
              </div>
            )}

          {/* ================================================= */}
          {/* STATISTICS */}
          {/* ================================================= */}

          {!loading && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Teachers */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Teachers
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {
                        availabilityCounts.totalTeachers
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Users size={22} />
                  </div>
                </div>
              </div>

              {/* Ready */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ready
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {
                        availabilityCounts.ready
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pending
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {
                        availabilityCounts.pending
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Clock3 size={22} />
                  </div>
                </div>
              </div>

              {/* Missing */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Missing
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {
                        availabilityCounts.missing
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle size={22} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* TEACHER AVAILABILITY */}
          {/* ================================================= */}

          {!loading && (
            <section className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Teacher Availability
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Check teacher availability before
                  generating the timetable.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-950/50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Teacher
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Assignments
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Availability
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {availabilitySummary.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-sm text-gray-500"
                        >
                          No teacher availability
                          data found.
                        </td>
                      </tr>
                    ) : (
                      availabilitySummary.map(
                        (teacher) => (
                          <tr
                            key={
                              teacher.teacherId
                            }
                            className="hover:bg-gray-50 dark:hover:bg-gray-950/40"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {
                                  teacher.teacherName
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {teacher.email}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                              {
                                teacher.teacherCode
                              }
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                              {
                                teacher
                                  .assignments
                                  ?.length ?? 0
                              }
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-lg bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  {
                                    teacher.approvedCount
                                  }{" "}
                                  approved
                                </span>

                                <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                  {
                                    teacher.pendingCount
                                  }{" "}
                                  pending
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                                  teacher.status
                                )}`}
                              >
                                {getStatusIcon(
                                  teacher.status
                                )}

                                {teacher.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTeacher(
                                    teacher
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                              >
                                <Eye
                                  size={15}
                                />
                                Inspect
                              </button>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ================================================= */}
          {/* UNSCHEDULED ASSIGNMENTS */}
          {/* ================================================= */}

          {!loading &&
            unscheduled.length > 0 && (
              <section className="mb-8 rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900/40 dark:bg-gray-900">
                <div className="border-b border-red-200 p-5 dark:border-red-900/40">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      <AlertCircle
                        size={20}
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Unscheduled Assignments
                      </h2>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        These assignments could not
                        be placed in the timetable.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-950/50">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Teacher
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Class
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Subject
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Reason
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {unscheduled.map(
                        (item, index) => (
                          <tr key={index}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {
                                  item.teacherName
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  item.teacherCode
                                }
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                              {
                                item.classroomName
                              }
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                              {
                                item.subjectName
                              }{" "}
                              (
                              {
                                item.subjectCode
                              }
                              )
                            </td>

                            <td className="px-5 py-4 text-sm text-red-600 dark:text-red-400">
                              {item.reason}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          {/* ================================================= */}
          {/* PUBLICATION */}
          {/* ================================================= */}

          {!loading && (
            <section className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Publish Timetables
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Publish a generated timetable for
                  each class.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                {Object.keys(
                  publicationGroups
                ).length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500">
                      No classroom timetables are
                      available for publication.
                    </p>
                  </div>
                ) : (
                  Object.entries(
                    publicationGroups
                  ).map(
                    ([
                      classroomId,
                      items,
                    ]) => {
                      const latest =
                        items[
                          items.length - 1
                        ];

                      const isPublished =
                        latest?.status ===
                        "PUBLISHED";

                      return (
                        <div
                          key={classroomId}
                          className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {
                                  latest.class
                                }
                              </h3>

                              <p className="text-xs text-gray-500">
                                {
                                  latest.term
                                }
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                                latest.status
                              )}`}
                            >
                              {getStatusIcon(
                                latest.status
                              )}

                              {
                                latest.status
                              }
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={
                                publishing !==
                                null
                              }
                              onClick={() =>
                                publishTimetable(
                                  classroomId,
                                  isPublished
                                    ? "unpublish"
                                    : "publish"
                                )
                              }
                              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                                isPublished
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {publishing ===
                              `${classroomId}-${
                                isPublished
                                  ? "unpublish"
                                  : "publish"
                              }` ? (
                                <Loader2
                                  size={16}
                                  className="mx-auto animate-spin"
                                />
                              ) : isPublished ? (
                                "Unpublish"
                              ) : (
                                "Publish"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </section>
          )}

          {/* ================================================= */}
          {/* GENERATED WEEKLY TIMETABLE */}
          {/* ================================================= */}

          {!loading && (
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Generated Weekly Timetable
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {currentYear?.name ||
                        "Academic Year"}{" "}
                      {currentTerm
                        ? `— ${currentTerm.name}`
                        : ""}
                    </p>
                  </div>

                  {timetable.length > 0 && (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {timetable.length}{" "}
                      entries
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-24 border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950/50">
                        Time
                      </th>

                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0 dark:border-gray-800 dark:bg-gray-950/50"
                        >
                          {formatDay(day)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {TIME_SLOTS.map(
                      (time) => (
                        <tr key={time}>
                          <td className="border-b border-r border-gray-200 bg-gray-50 px-4 py-4 align-top text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
                            {time}
                          </td>

                          {DAYS.map(
                            (day) => {
                              const entry =
                                getTimetableEntry(
                                  day,
                                  time
                                );

                              return (
                                <td
                                  key={`${day}-${time}`}
                                  className="h-28 border-b border-r border-gray-200 p-2 align-top last:border-r-0 dark:border-gray-800"
                                >
                                  {entry ? (
                                    <div className="h-full rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-900/50 dark:bg-purple-900/20">
                                      <p className="font-semibold text-purple-900 dark:text-purple-300">
                                        {
                                          entry
                                            .subject
                                            .name
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-purple-700 dark:text-purple-400">
                                        {
                                          entry
                                            .subject
                                            .code
                                        }
                                      </p>

                                      <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        <p>
                                          Teacher:{" "}
                                          <span className="font-medium">
                                            {
                                              entry
                                                .teacher
                                                .fullName
                                            }
                                          </span>
                                        </p>

                                        <p>
                                          Class:{" "}
                                          <span className="font-medium">
                                            {
                                              entry
                                                .classroom
                                                .name
                                            }
                                          </span>
                                        </p>

                                        <p>
                                          {
                                            entry.startTime
                                          }{" "}
                                          -{" "}
                                          {
                                            entry.endTime
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex h-full min-h-[90px] items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                      <span className="text-xs text-gray-400">
                                        Free
                                      </span>
                                    </div>
                                  )}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {timetable.length === 0 && (
                <div className="border-t border-gray-200 px-5 py-10 text-center dark:border-gray-800">
                  <CalendarDays
                    size={36}
                    className="mx-auto mb-3 text-gray-400"
                  />

                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    No timetable generated
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Select an academic year and
                    term, then click Generate
                    Timetable.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* =================================================== */}
      {/* TEACHER DETAILS MODAL */}
      {/* =================================================== */}

      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {
                    selectedTeacher.teacherName
                  }
                </h2>

                <p className="text-sm text-gray-500">
                  {
                    selectedTeacher.teacherCode
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTeacher(null)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {/* Contact */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-950">
                  <p className="text-xs text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {
                      selectedTeacher.email
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-950">
                  <p className="text-xs text-gray-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {
                      selectedTeacher.phone ||
                      "Not provided"
                    }
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  Availability Status
                </h3>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {
                      selectedTeacher.approvedCount
                    }{" "}
                    approved
                  </span>

                  <span className="rounded-lg bg-yellow-100 px-3 py-2 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {
                      selectedTeacher.pendingCount
                    }{" "}
                    pending
                  </span>

                  <span className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {
                      selectedTeacher.rejectedCount
                    }{" "}
                    rejected
                  </span>
                </div>
              </div>

              {/* Assignments */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  Assignments
                </h3>

                {selectedTeacher
                  .assignments?.length ===
                0 ? (
                  <p className="text-sm text-gray-500">
                    No assignments found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTeacher.assignments.map(
                      (assignment) => (
                        <div
                          key={
                            assignment.id
                          }
                          className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {
                                  assignment
                                    .subject
                                    .name
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  assignment
                                    .subject
                                    .code
                                }
                              </p>
                            </div>

                            <span className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {
                                assignment
                                  .classroom
                                  .name
                              }
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-gray-500">
                            Section:{" "}
                            {
                              assignment
                                .section
                                .name
                            }{" "}
                            • Coefficient:{" "}
                            {
                              assignment
                                .subject
                                .coefficient
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  Availability Slots
                </h3>

                {selectedTeacher
                  .availability?.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                    <EyeOff
                      size={24}
                      className="mx-auto mb-2 text-gray-400"
                    />

                    <p className="text-sm text-gray-500">
                      No availability slots
                      submitted.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTeacher.availability.map(
                      (slot) => (
                        <div
                          key={slot.id}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDay(
                                slot.day
                              )}
                            </p>

                            <p className="text-sm text-gray-500">
                              {
                                slot.startTime
                              }{" "}
                              -{" "}
                              {
                                slot.endTime
                              }
                            </p>

                            {slot.note && (
                              <p className="mt-1 text-xs text-gray-500">
                                Note:{" "}
                                {slot.note}
                              </p>
                            )}
                          </div>

                          <span
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                              slot.status
                            )}`}
                          >
                            {getStatusIcon(
                              slot.status
                            )}

                            {slot.status}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
              <button
                type="button"
                onClick={() =>
                  setSelectedTeacher(null)
                }
                className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}