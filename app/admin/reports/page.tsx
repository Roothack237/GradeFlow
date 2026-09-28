
"use client";

import { useEffect, useState } from "react";

import {
  Award,
  BarChart3,
  Download,
  Eye,
  FileDown,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";

// =========================================================
// TYPES
// =========================================================

type Sequence = {
  id: string;
  name: string;
  order: number;
  termId?: string;
};

type Term = {
  id: string;
  name: string;
  order?: number;
  academicYearId?: string;
  academicYear?: {
    id: string;
  };
  sequences?: Sequence[];
};

type AcademicYear = {
  id: string;
  name: string;
};

type Classroom = {
  id: string;
  name: string;
};

type StudentReport = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  marksRecorded: number;
  total: number;
  average: number;
  position: number | null;
};

type ReportCardsData = {
  classroom: {
    id: string;
    name: string;
  };

  term: {
    id: string;
    name: string;
  };

  sequence?: {
    id: string;
    name: string;
  };

  summary: {
    totalStudents: number;
    classAverage: number;
    published: boolean;
  };

  students: StudentReport[];

  publication?: {
    published: boolean;
  };
};

// =========================================================
// PAGE
// =========================================================

export default function ReportCardsPage() {
  // =======================================================
  // STATE
  // =======================================================

  const [academicYears, setAcademicYears] = useState<
    AcademicYear[]
  >([]);

  const [terms, setTerms] = useState<Term[]>([]);

  const [sequences, setSequences] = useState<Sequence[]>([]);

  const [classes, setClasses] = useState<Classroom[]>([]);

  const [selectedYear, setSelectedYear] = useState("");

  const [selectedTerm, setSelectedTerm] = useState("");

  const [selectedSequence, setSelectedSequence] =
    useState("");

  const [selectedClass, setSelectedClass] = useState("");

  const [loadingData, setLoadingData] = useState(true);

  const [loading, setLoading] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const [reportCards, setReportCards] =
    useState<ReportCardsData | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null
  );

  // =======================================================
  // LOAD INITIAL DATA
  // =======================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoadingData(true);

      const [
        yearsResponse,
        termsResponse,
        classesResponse,
      ] = await Promise.all([
        fetch("/api/admin/academic-years"),
        fetch("/api/admin/terms"),
        fetch("/api/admin/classes"),
      ]);

      const yearsData = await yearsResponse.json();
      const termsData = await termsResponse.json();
      const classesData = await classesResponse.json();

      // =====================================================
      // ACADEMIC YEARS
      // =====================================================

      if (yearsResponse.ok) {
        setAcademicYears(
          Array.isArray(yearsData)
            ? yearsData
            : yearsData.academicYears ||
                yearsData.years ||
                yearsData.data ||
                []
        );
      }

      // =====================================================
      // TERMS
      // =====================================================

      if (termsResponse.ok) {
        const termList: Term[] = Array.isArray(termsData)
          ? termsData
          : termsData.terms ||
            termsData.data ||
            [];

        /*
         * Make sure terms are ordered correctly.
         */
        const normalizedTerms = [...termList].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );

        setTerms(
          normalizedTerms.map((term) => ({
            ...term,
            academicYearId:
              term.academicYearId ?? term.academicYear?.id,
          }))
        );
      }

      // =====================================================
      // CLASSES
      // =====================================================

      if (classesResponse.ok) {
        const classList = Array.isArray(classesData)
          ? classesData
          : classesData.classes ||
            classesData.classrooms ||
            classesData.data ||
            [];

        setClasses(classList);
      }
    } catch (error) {
      console.error(
        "Failed to load report card data:",
        error
      );
    } finally {
      setLoadingData(false);
    }
  }

  // =======================================================
  // GET SEQUENCE DISPLAY NAME
  // =======================================================

  function getSequenceName(
    termOrder: number | undefined,
    sequenceOrder: number
  ) {
    /*
     * The sequence order resets for every term:
     *
     * First Term:
     *   order 1 -> First Sequence
     *   order 2 -> Second Sequence
     *
     * Second Term:
     *   order 1 -> Third Sequence
     *   order 2 -> Fourth Sequence
     *
     * Third Term:
     *   order 1 -> Fifth Sequence
     *   order 2 -> Sixth Sequence
     */

    if (termOrder === 1) {
      return sequenceOrder === 1
        ? "First Sequence"
        : "Second Sequence";
    }

    if (termOrder === 2) {
      return sequenceOrder === 1
        ? "Third Sequence"
        : "Fourth Sequence";
    }

    if (termOrder === 3) {
      return sequenceOrder === 1
        ? "Fifth Sequence"
        : "Sixth Sequence";
    }

    return `Sequence ${sequenceOrder}`;
  }

  // =======================================================
  // UPDATE SEQUENCES WHEN TERM CHANGES
  // =======================================================

  useEffect(() => {
    /*
     * No term selected
     */
    if (!selectedTerm) {
      setSequences([]);
      setSelectedSequence("");
      return;
    }

    const term = terms.find(
      (item) => item.id === selectedTerm
    );

    if (!term) {
      setSequences([]);
      setSelectedSequence("");
      return;
    }

    /*
     * Get the sequences belonging ONLY to the
     * selected term.
     */
    const termSequences = [...(term.sequences || [])]
      .sort((a, b) => a.order - b.order)
      .slice(0, 2)
      .map((sequence) => ({
        ...sequence,

        /*
         * Keep the REAL sequence ID.
         * Only change the displayed name.
         */
        name: getSequenceName(
          term.order,
          sequence.order
        ),
      }));

    setSequences(termSequences);

    /*
     * A sequence from the previous term must never
     * remain selected.
     */
    setSelectedSequence("");

    /*
     * Clear previous report results.
     */
    setReportCards(null);
  }, [selectedTerm, terms]);

  // =======================================================
  // GENERATE REPORT CARDS
  // =======================================================

  async function loadReportCards() {
    if (
      !selectedYear ||
      !selectedTerm ||
      !selectedSequence ||
      !selectedClass
    ) {
      alert(
        "Please select an academic year, term, sequence and class."
      );

      return;
    }

    try {
      setLoading(true);

      setReportCards(null);

      const params = new URLSearchParams({
        academicYearId: selectedYear,
        termId: selectedTerm,
        sequenceId: selectedSequence,
        classroomId: selectedClass,
      });

      const response = await fetch(
        `/api/admin/reports/report-cards?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              `Failed to generate report cards. Status: ${response.status}`
          );
        }

      setReportCards(data);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate report cards."
      );
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
// PUBLISH REPORT CARDS
// =======================================================

async function publishReportCards() {
  if (
    !selectedTerm ||
    !selectedClass ||
    !selectedSequence
  ) {
    alert(
      "Please select an academic year, term, sequence and class."
    );
    return;
  }

  if (!reportCards) {
    alert("Please generate the report cards first.");
    return;
  }

  if (reportCards.students.length === 0) {
    alert("There are no students to publish report cards for.");
    return;
  }

  const alreadyPublished =
    reportCards.publication?.published ??
    reportCards.summary.published;

  if (alreadyPublished) {
    alert("The report cards for this class and term are already published.");
    return;
  }

  const confirmed = window.confirm(
    `Publish report cards for ${reportCards.classroom.name} - ${reportCards.term.name}?\n\nParents will be able to access the published report cards.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setPublishing(true);

    const response = await fetch(
      "/api/admin/publications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
          scope: "TERM",
          action: "PUBLISH",
          publicationType: "REPORT_CARD",
          termId: selectedTerm,
          classroomId: selectedClass,
          sequenceId: selectedSequence,
          notes: `Report cards published for ${reportCards.term.name} - ${reportCards.classroom.name}.`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Failed to publish report cards."
      );
    }

    alert(
      data?.message ||
        "Report cards published successfully."
    );

    // Refresh the report-card data so the status changes
    // immediately from Not Published -> Published.
    await loadReportCards();
  } catch (error) {
    console.error(
      "Failed to publish report cards:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to publish report cards."
    );
  } finally {
    setPublishing(false);
  }
}

  // =======================================================
  // PDF URL
  // =======================================================

  function getClassPdfUrl() {
    const params = new URLSearchParams({
      academicYearId: selectedYear,
      termId: selectedTerm,
      sequenceId: selectedSequence,
      classroomId: selectedClass,
    });

    return `/api/admin/reports/report-cards/pdf?${params.toString()}`;
  }

  function getStudentPdfUrl(
    studentId: string,
    inline = false
  ) {
    const params = new URLSearchParams({
      academicYearId: selectedYear,
      termId: selectedTerm,
      sequenceId: selectedSequence,
      classroomId: selectedClass,
      studentId,
    });

    if (inline) {
      params.set("inline", "1");
    }

    return `/api/admin/reports/report-cards/pdf?${params.toString()}`;
  }

  // =======================================================
  // RESET
  // =======================================================

  function resetFilters() {
    setSelectedYear("");
    setSelectedTerm("");
    setSelectedSequence("");
    setSelectedClass("");
    setSequences([]);
    setReportCards(null);
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminNavbar />

        <main className="p-4 md:p-6 lg:p-8">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-6">
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Report Cards
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generate and manage student report cards.
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              FILTER CARD
          ================================================= */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generate Report Cards
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the academic year, term, sequence and
                class.
              </p>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                  {/* =================================================
                      ACADEMIC YEAR
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Academic Year
                    </label>

                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedTerm("");
                        setSelectedSequence("");
                        setSequences([]);
                        setReportCards(null);
                      }}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    >
                      <option value="">
                        Select Academic Year
                      </option>

                      {academicYears.map((year) => (
                        <option
                          key={year.id}
                          value={year.id}
                        >
                          {year.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* =================================================
                      TERM
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Term
                    </label>

                    <select
                      value={selectedTerm}
                      onChange={(e) => {
                        setSelectedTerm(e.target.value);
                        setSelectedSequence("");
                        setSequences([]);
                        setReportCards(null);
                      }}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    >
                      <option value="">
                        Select Term
                      </option>

                      {terms
                        .filter(
                          (term) =>
                            !selectedYear ||
                            term.academicYearId === selectedYear
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
                  </div>

                  {/* =================================================
                      SEQUENCE
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sequence
                    </label>

                    <select
                      value={selectedSequence}
                      onChange={(e) => {
                        setSelectedSequence(
                          e.target.value
                        );

                        setReportCards(null);
                      }}
                      disabled={!selectedTerm}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-900"
                    >
                      <option value="">
                        {!selectedTerm
                          ? "Select Term First"
                          : sequences.length === 0
                          ? "No Sequences"
                          : "Select Sequence"}
                      </option>

                      {sequences.map((sequence) => (
                        <option
                          key={sequence.id}
                          value={sequence.id}
                        >
                          {sequence.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* =================================================
                      CLASS
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Class
                    </label>

                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setReportCards(null);
                      }}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    >
                      <option value="">
                        Select Class
                      </option>

                      {classes.map((classroom) => (
                        <option
                          key={classroom.id}
                          value={classroom.id}
                        >
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div className="mt-5 flex flex-wrap gap-3">

                  <button
                    onClick={loadReportCards}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate Report Cards
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>

                </div>
              </>
            )}
          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {!reportCards && !loading && (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">

              <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />

              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No Report Cards Generated
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                Select an academic year, term, sequence and
                class, then generate the report cards.
              </p>

            </div>
          )}

          {/* =================================================
              RESULTS
          ================================================= */}

          {reportCards && (
            <div className="mt-6 space-y-6">

              {/* =================================================
                  CLASS HEADER
              ================================================= */}

              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center dark:border-gray-800 dark:bg-gray-900">

                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {reportCards.classroom.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {reportCards.term.name}

                    {reportCards.sequence?.name
                      ? ` • ${reportCards.sequence.name}`
                      : ""}
                  </p>
                </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* DOWNLOAD FULL CLASS PDF */}
                      <a
                        href={getClassPdfUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                      >
                        <FileDown className="h-4 w-4" />
                        Download Full Class PDF
                      </a>

                      {/* PUBLISH REPORT CARDS */}
                      <button
                        type="button"
                        onClick={publishReportCards}
                        disabled={
                          publishing ||
                          (reportCards.publication?.published ??
                            reportCards.summary.published)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {publishing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {(
                              reportCards.publication?.published ??
                              reportCards.summary.published
                            )
                              ? "Report Cards Published"
                              : "Publish Report Cards"}
                          </>
                        )}
                      </button>
                    </div>

              </div>

              {/* =================================================
                  STATISTICS
              ================================================= */}

              <div className="grid gap-4 md:grid-cols-3">

                {/* Total Students */}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Students
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {reportCards.summary.totalStudents}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>

                  </div>

                </div>

                {/* Average */}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Class Average
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {Number(
                          reportCards.summary.classAverage
                        ).toFixed(2)}
                        %
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>

                  </div>

                </div>

                {/* Publication */}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Publication Status
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {(
                          reportCards.publication
                            ?.published ??
                          reportCards.summary.published
                        )
                          ? "Published"
                          : "Not Published"}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                      <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  STUDENT TABLE
              ================================================= */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Student Report Cards
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Preview or download individual report
                    cards.
                  </p>

                </div>

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[700px]">

                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          #
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Student
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Average
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Rank
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Actions
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {reportCards.students.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-12 text-center text-sm text-gray-500"
                          >
                            No students found for this
                            class.
                          </td>
                        </tr>
                      ) : (
                        reportCards.students.map(
                          (student, index) => (
                            <tr
                              key={student.id}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-950"
                            >

                              <td className="px-5 py-4 text-sm text-gray-500">
                                {index + 1}
                              </td>

                              <td className="px-5 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {student.name}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-center">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {Number(
                                    student.average
                                  ).toFixed(2)}
                                  %
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center">

                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">

                                  <Award className="h-3.5 w-3.5" />

                                  {student.position ?? "—"} n  

                                </span>

                              </td>

                              <td className="px-5 py-4">

                                <div className="flex justify-end gap-2">

                                  {/* Preview */}

                                  <button
                                    onClick={() =>
                                      setPreviewUrl(
                                        getStudentPdfUrl(
                                          student.id,
                                          true
                                        )
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Preview
                                  </button>

                                  {/* Download */}

                                  <a
                                    href={getStudentPdfUrl(
                                      student.id
                                    )}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-2 text-xs font-medium text-white hover:bg-purple-800"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </a>

                                </div>

                              </td>

                            </tr>
                          )
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* =====================================================
          PDF PREVIEW
      ===================================================== */}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Report Card Preview
                </h2>

                <p className="text-xs text-gray-500">
                  Preview before downloading
                </p>
              </div>

              <button
                onClick={() => setPreviewUrl(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="flex-1 bg-gray-100 dark:bg-gray-950">

              <iframe
                src={previewUrl}
                title="Report Card Preview"
                className="h-full w-full"
              />

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
