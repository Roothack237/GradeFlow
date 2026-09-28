"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type SubjectPerformance = {
  subjectId: string;
  subject: string;
  average: number | null;
  students: number;
  marksRecorded: number;
};

type ClassPerformance = {
  classroomId: string;
  class: string;
  section: string;
  students: number;
  average: number | null;
  passRate: number | null;
  attendanceRate: number | null;
  subjects: SubjectPerformance[];
};

type SectionPerformance = {
  section: string;
  students: number;
  average: number | null;
  passRate: number | null;
  attendanceRate: number | null;
  classes: ClassPerformance[];
};

type SchoolSubjectPerformance = {
  subjectId: string;
  subject: string;
  average: number | null;
  marksRecorded: number;
};

type AnalyticsData = {
  success: boolean;

  academicYear: {
    id: string;
    name: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
  };

  sections: SectionPerformance[];

  classes: ClassPerformance[];

  subjects: SchoolSubjectPerformance[];

  summary: {
    students: number;
    classes: number;
    marksRecorded: number;
    attendanceRecords: number;
    average: number | null;
  };

  aiAnalysisData: {
    strongestSubjects: SchoolSubjectPerformance[];
    weakestSubjects: SchoolSubjectPerformance[];

    classPerformance: {
      classroomId: string;
      class: string;
      section: string;
      average: number | null;
      subjects: SubjectPerformance[];
    }[];
  };
};

/* =========================================================
   HELPERS
========================================================= */

function formatPercent(
  value: number | null | undefined
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
}

/* =========================================================
   CLASS HELPERS
========================================================= */

function escapePrintHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getBestClass(
  section: SectionPerformance
): ClassPerformance | null {
  const classes = section.classes.filter(
    (item) => item.average !== null
  );

  if (classes.length === 0) {
    return null;
  }

  return [...classes].sort(
    (a, b) =>
      (b.average ?? -1) -
      (a.average ?? -1)
  )[0];
}

function getLowestClass(
  section: SectionPerformance
): ClassPerformance | null {
  const classes = section.classes.filter(
    (item) => item.average !== null
  );

  if (classes.length === 0) {
    return null;
  }

  return [...classes].sort(
    (a, b) =>
      (a.average ?? 999) -
      (b.average ?? 999)
  )[0];
}

/* =========================================================
   SCHOOL-WIDE CLASS HELPERS
========================================================= */

function getBestSchoolClass(
  classes: ClassPerformance[]
): ClassPerformance | null {
  const validClasses = classes.filter(
    (item) => item.average !== null
  );

  if (validClasses.length === 0) {
    return null;
  }

  return [...validClasses].sort(
    (a, b) =>
      (b.average ?? -1) -
      (a.average ?? -1)
  )[0];
}

function getLowestSchoolClass(
  classes: ClassPerformance[]
): ClassPerformance | null {
  const validClasses = classes.filter(
    (item) => item.average !== null
  );

  if (validClasses.length === 0) {
    return null;
  }

  return [...validClasses].sort(
    (a, b) =>
      (a.average ?? 999) -
      (b.average ?? 999)
  )[0];
}

/* =========================================================
   SECTION SUBJECTS
========================================================= */

function getAllSectionSubjects(
  section: SectionPerformance
): SubjectPerformance[] {
  const subjectMap = new Map<
    string,
    {
      subject: SubjectPerformance;
      totalWeightedScore: number;
      totalStudents: number;
      totalMarks: number;
    }
  >();

  for (const classItem of section.classes) {
    for (const subject of classItem.subjects) {
      if (subject.average === null) {
        continue;
      }

      const existing = subjectMap.get(
        subject.subjectId
      );

      if (!existing) {
        subjectMap.set(subject.subjectId, {
          subject,
          totalWeightedScore:
            subject.average *
            subject.students,
          totalStudents:
            subject.students,
          totalMarks:
            subject.marksRecorded,
        });
      } else {
        existing.totalWeightedScore +=
          subject.average *
          subject.students;

        existing.totalStudents +=
          subject.students;

        existing.totalMarks +=
          subject.marksRecorded;
      }
    }
  }

  return Array.from(
    subjectMap.values()
  ).map((item) => ({
    ...item.subject,
    average:
      item.totalStudents > 0
        ? item.totalWeightedScore /
          item.totalStudents
        : item.subject.average,
    students: item.totalStudents,
    marksRecorded: item.totalMarks,
  }));
}

function getBestSubject(
  section: SectionPerformance
): SubjectPerformance | null {
  const subjects =
    getAllSectionSubjects(section).filter(
      (subject) =>
        subject.average !== null
    );

  if (subjects.length === 0) {
    return null;
  }

  return [...subjects].sort(
    (a, b) =>
      (b.average ?? -1) -
      (a.average ?? -1)
  )[0];
}

function getLowestSubject(
  section: SectionPerformance
): SubjectPerformance | null {
  const subjects =
    getAllSectionSubjects(section).filter(
      (subject) =>
        subject.average !== null
    );

  if (subjects.length === 0) {
    return null;
  }

  return [...subjects].sort(
    (a, b) =>
      (a.average ?? 999) -
      (b.average ?? 999)
  )[0];
}

/* =========================================================
   SCHOOL SUBJECT HELPERS
========================================================= */

function getBestSchoolSubject(
  subjects: SchoolSubjectPerformance[]
): SchoolSubjectPerformance | null {
  const validSubjects = subjects.filter(
    (subject) =>
      subject.average !== null
  );

  if (validSubjects.length === 0) {
    return null;
  }

  return [...validSubjects].sort(
    (a, b) =>
      (b.average ?? -1) -
      (a.average ?? -1)
  )[0];
}

function getLowestSchoolSubject(
  subjects: SchoolSubjectPerformance[]
): SchoolSubjectPerformance | null {
  const validSubjects = subjects.filter(
    (subject) =>
      subject.average !== null
  );

  if (validSubjects.length === 0) {
    return null;
  }

  return [...validSubjects].sort(
    (a, b) =>
      (a.average ?? 999) -
      (b.average ?? 999)
  )[0];
}

/* =========================================================
   CLASS SUBJECT HELPERS
========================================================= */

function getBestClassSubject(
  classItem: ClassPerformance
): SubjectPerformance | null {
  const subjects =
    classItem.subjects.filter(
      (subject) =>
        subject.average !== null
    );

  if (subjects.length === 0) {
    return null;
  }

  return [...subjects].sort(
    (a, b) =>
      (b.average ?? -1) -
      (a.average ?? -1)
  )[0];
}

function getLowestClassSubject(
  classItem: ClassPerformance
): SubjectPerformance | null {
  const subjects =
    classItem.subjects.filter(
      (subject) =>
        subject.average !== null
    );

  if (subjects.length === 0) {
    return null;
  }

  return [...subjects].sort(
    (a, b) =>
      (a.average ?? 999) -
      (b.average ?? 999)
  )[0];
}

/* =========================================================
   DOWNLOAD PDF
========================================================= */

async function downloadPdfFromApi(
  endpoint: string,
  params: Record<string, string>,
  filename: string
) {
  const query = new URLSearchParams(params);

  const url = `${endpoint}?${query.toString()}`;

  console.log(
    "REQUESTING PDF:",
    url
  );

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (!response.ok) {
    let errorMessage =
      `Request failed with status ${response.status}`;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const payload =
        await response
          .json()
          .catch(() => ({}));

      errorMessage =
        payload?.error ||
        payload?.message ||
        errorMessage;
    } else {
      const text =
        await response
          .text()
          .catch(() => "");

      if (text) {
        errorMessage = text;
      }
    }

    console.error(
      "PDF API ERROR:",
      {
        endpoint,
        params,
        status: response.status,
        statusText:
          response.statusText,
        errorMessage,
      }
    );

    throw new Error(
      errorMessage
    );
  }

  if (
    !contentType.includes("pdf")
  ) {
    const text =
      await response
        .text()
        .catch(() => "");

    console.error(
      "SERVER DID NOT RETURN PDF:",
      text
    );

    throw new Error(
      "The server did not return a PDF file."
    );
  }

  const blob =
    await response.blob();

  if (blob.size === 0) {
    throw new Error(
      "The generated PDF is empty."
    );
  }

  const blobUrl =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = blobUrl;
  anchor.download = filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(
      blobUrl
    );
  }, 1000);
}

/* =========================================================
   TREND BADGE
========================================================= */

function TrendBadge({
  value,
}: {
  value: number | null;
}) {
  if (value === null) {
    return (
      <span className="text-xs text-gray-400">
        No trend
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
        <ArrowUp size={13} />
        +{value.toFixed(1)}%
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
        <ArrowDown size={13} />
        {value.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      0.0%
    </span>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminAnalyticsPage() {
  const [data, setData] =
    useState<AnalyticsData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState<SectionPerformance | null>(
      null
    );

  const [
    selectedClass,
    setSelectedClass,
  ] =
    useState<ClassPerformance | null>(
      null
    );

  const [
    classViewSection,
    setClassViewSection,
  ] =
    useState<SectionPerformance | null>(
      null
    );

  const [
    showGeneralPerformance,
    setShowGeneralPerformance,
  ] = useState(false);

  const [
    downloadingSection,
    setDownloadingSection,
  ] = useState(false);

  const [
    downloadingClass,
    setDownloadingClass,
  ] = useState(false);

  /* =======================================================
     LOAD ANALYTICS
  ======================================================= */

  const loadAnalytics =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/analytics",
            {
              cache: "no-store",
            }
          );

        const payload =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.error ??
              payload.message ??
              "Failed to load analytics."
          );
        }

        setData(
          payload as AnalyticsData
        );
      } catch (error) {
        console.error(
          "ANALYTICS PAGE ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  /*
   * IMPORTANT:
   * "General" is not a real database section.
   *
   * If the API accidentally returns a synthetic
   * General item, remove it from the real section list.
   */
  const sections =
    (data?.sections ?? []).filter(
      (section) =>
        section.section
          .trim()
          .toLowerCase() !==
        "general"
    );

      const printAnalyticsReport = ({
        title,
        subtitle,
        summary,
        rows,
      }: {
        title: string;
        subtitle?: string;
        summary: {
          label: string;
          value: string | number;
        }[];
        rows: {
          cells: (string | number)[];
        }[];
      }) => {
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
          alert("Please allow pop-ups for GradeFlow.");
          return;
        }

        const summaryHtml = summary
          .map(
            (item) => `
              <div class="summary-card">
                <div class="summary-label">
                  ${escapePrintHtml(item.label)}
                </div>

                <div class="summary-value">
                  ${escapePrintHtml(item.value)}
                </div>
              </div>
            `
          )
          .join("");

        const rowsHtml = rows
          .map(
            (row, index) => `
              <tr>
                <td>${index + 1}</td>
                ${row.cells
                  .map(
                    (cell) =>
                      `<td>${escapePrintHtml(cell)}</td>`
                  )
                  .join("")}
              </tr>
            `
          )
          .join("");

        printWindow.document.write(`
          <!DOCTYPE html>

          <html>
            <head>

              <meta charset="UTF-8" />

              <title>
                ${escapePrintHtml(title)}
              </title>

              <style>

                @page {
                  size: A4;
                  margin: 15mm;
                }

                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  padding: 0;
                  font-family: Arial, Helvetica, sans-serif;
                  color: #111827;
                  background: white;
                }

                .header {
                  text-align: center;
                  padding-bottom: 18px;
                  margin-bottom: 22px;
                  border-bottom: 3px solid #7c3aed;
                }

                .school {
                  font-size: 24px;
                  font-weight: 800;
                }

                .title {
                  margin-top: 8px;
                  font-size: 20px;
                  font-weight: 800;
                  color: #7c3aed;
                }

                .subtitle {
                  margin-top: 5px;
                  color: #6b7280;
                  font-size: 12px;
                }

                .summary {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 10px;
                  margin-bottom: 25px;
                }

                .summary-card {
                  border: 1px solid #d1d5db;
                  border-radius: 7px;
                  padding: 13px;
                  text-align: center;
                }

                .summary-label {
                  font-size: 10px;
                  color: #6b7280;
                  font-weight: 700;
                  text-transform: uppercase;
                }

                .summary-value {
                  margin-top: 6px;
                  font-size: 20px;
                  font-weight: 800;
                  color: #7c3aed;
                }

                .section-title {
                  margin-top: 20px;
                  margin-bottom: 10px;
                  font-size: 16px;
                  font-weight: 800;
                }

                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 8px;
                }

                th {
                  background: #f3f4f6;
                  font-weight: 800;
                }

                th,
                td {
                  border: 1px solid #d1d5db;
                  padding: 8px;
                  font-size: 11px;
                  text-align: left;
                }

                .footer {
                  margin-top: 30px;
                  padding-top: 10px;
                  border-top: 1px solid #d1d5db;
                  display: flex;
                  justify-content: space-between;
                  font-size: 9px;
                  color: #6b7280;
                }

                .print-button {
                  position: fixed;
                  top: 15px;
                  right: 15px;
                  border: 0;
                  border-radius: 6px;
                  padding: 10px 16px;
                  background: #7c3aed;
                  color: white;
                  font-weight: 700;
                  cursor: pointer;
                }

                @media print {
                  .print-button {
                    display: none;
                  }
                }

              </style>

            </head>

            <body>

              <button
                class="print-button"
                onclick="window.print()"
              >
                Print / Save as PDF
              </button>

              <div class="header">

                <div class="school">
                  ALL NATIONS SECONDARY SCHOOL
                </div>

                <div class="title">
                  ${escapePrintHtml(title)}
                </div>

                <div class="subtitle">
                  ${escapePrintHtml(
                    subtitle || "GradeFlow Academic Performance Analysis"
                  )}
                </div>

              </div>

              <div class="summary">
                ${summaryHtml}
              </div>

              <div class="section-title">
                Performance Details
              </div>

              <table>

                <thead>
                  <tr>
                    <th>#</th>
                    ${rows.length
                      ? rows[0].cells
                          .map(
                            (_, i) =>
                              `<th>Column ${i + 1}</th>`
                          )
                          .join("")
                      : ""}
                  </tr>
                </thead>

                <tbody>
                  ${rowsHtml}
                </tbody>

              </table>

              <div class="footer">

                <span>
                  GradeFlow — Student Result Management System
                </span>

                <span>
                  Generated ${new Date().toLocaleDateString()}
                </span>

              </div>

              <script>
                window.onload = function () {
                  setTimeout(function () {
                    window.print();
                  }, 500);
                };
              </script>

            </body>
          </html>
        `);

        printWindow.document.close();
      };

  /* =======================================================
     OVERALL SCHOOL VALUES
  ======================================================= */

  const bestSchoolClass =
    data
      ? getBestSchoolClass(
          data.classes
        )
      : null;

  const lowestSchoolClass =
    data
      ? getLowestSchoolClass(
          data.classes
        )
      : null;

  const bestSchoolSubject =
    data
      ? getBestSchoolSubject(
          data.subjects
        )
      : null;

  const lowestSchoolSubject =
    data
      ? getLowestSchoolSubject(
          data.subjects
        )
      : null;

  /* =======================================================
     SECTION PDF
  ======================================================= */

  async function downloadSectionPdf(
    section: SectionPerformance
  ) {
    if (!data) return;

    try {
      setDownloadingSection(true);

      const filename =
        `GradeFlow-${section.section
          .replace(/\s+/g, "-")
          .toLowerCase()}-overall-performance-${data.academicYear.name
          .replace(/\//g, "-")}.pdf`;

      /*
       * This is only for REAL sections.
       *
       * We do NOT send "General" here because
       * General is not a database section.
       */

      await downloadPdfFromApi(
        "/api/admin/analytics/section-pdf",
        {
          section:
            section.section,
          academicYearId:
            data.academicYear.id,
        },
        filename
      );
    } catch (error) {
      console.error(
        "SECTION PDF ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to download section report."
      );
    } finally {
      setDownloadingSection(
        false
      );
    }
  }

  /* =======================================================
     CLASS PDF
  ======================================================= */

  async function downloadClassPdf(
    classItem: ClassPerformance
  ) {
    if (!data) return;

    try {
      setDownloadingClass(true);

      const filename =
        `GradeFlow-${classItem.class
          .replace(/\s+/g, "-")
          .toLowerCase()}-performance-${data.academicYear.name
          .replace(/\//g, "-")}.pdf`;

      await downloadPdfFromApi(
        "/api/admin/analytics/class-pdf",
        {
          classroomId:
            classItem.classroomId,
          academicYearId:
            data.academicYear.id,
        },
        filename
      );
    } catch (error) {
      console.error(
        "CLASS PDF ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to download class report."
      );
    } finally {
      setDownloadingClass(false);
    }
  }

  /* =======================================================
     PRINT
  ======================================================= */

  function printCurrentAnalysis() {
    window.print();
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-6">
              <div className="h-12 w-80 rounded-xl bg-gray-200 dark:bg-gray-800" />

              <div className="h-56 rounded-3xl bg-gray-200 dark:bg-gray-800" />

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({
                  length: 5,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800"
                    />
                  )
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="h-60 rounded-2xl bg-gray-200 dark:bg-gray-800" />

                <div className="h-60 rounded-2xl bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 text-red-600"
                  size={22}
                />

                <div>
                  <h2 className="font-bold text-red-800 dark:text-red-300">
                    Unable to load analytics
                  </h2>

                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                    {error ||
                      "No analytics data was returned."}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadAnalytics
                    }
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
        <main className="mx-auto max-w-7xl p-5 sm:p-8">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-700 text-white shadow-lg shadow-purple-700/20">
                  <BarChart3 size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    School Performance
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Academic performance analysis by section and class
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-900 dark:bg-purple-950/30">
              <BookOpen
                size={19}
                className="text-purple-700 dark:text-purple-300"
              />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  Active Academic Year
                </p>

                <p className="font-bold text-purple-900 dark:text-purple-100">
                  {data.academicYear.name}
                </p>
              </div>

              <span className="ml-2 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                ACTIVE
              </span>
            </div>
          </div>

          {/* =================================================
              GENERAL PERFORMANCE RECTANGLE
          ================================================= */}

          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                General Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Overall academic performance of the entire school across all sections and classes.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-sm dark:border-purple-900/60 dark:bg-gray-900">

              {/* Top part of rectangle */}

              <div className="bg-gradient-to-r from-purple-700 via-purple-700 to-indigo-700 p-6 text-white sm:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <BarChart3 size={24} />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-200">
                          Whole School
                        </p>

                        <h3 className="mt-1 text-2xl font-bold sm:text-3xl">
                          General Performance
                        </h3>
                      </div>
                    </div>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-purple-100">
                      This represents the combined academic performance of all students, classes and sections for the active academic year.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() =>
                        setShowGeneralPerformance(
                          true
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-purple-700 shadow-sm transition hover:bg-purple-50"
                    >
                      <BarChart3
                        size={17}
                      />
                      View General Performance
                    </button>

                    <button
                      type="button"
                      onClick={
                        printCurrentAnalysis
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                      <Download
                        size={17}
                      />
                      Save as PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics inside rectangle */}

              <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0 dark:divide-gray-800">
                <GeneralMetric
                  icon={
                    <GraduationCap
                      size={21}
                    />
                  }
                  label="Students"
                  value={
                    data.summary
                      .students
                  }
                />

                <GeneralMetric
                  icon={
                    <BookOpen size={21} />
                  }
                  label="Classes"
                  value={
                    data.summary
                      .classes
                  }
                />

                <GeneralMetric
                  icon={
                    <BarChart3
                      size={21}
                    />
                  }
                  label="School Average"
                  value={formatPercent(
                    data.summary
                      .average
                  )}
                />

                <GeneralMetric
                  icon={
                    <FileText size={21} />
                  }
                  label="Marks Recorded"
                  value={
                    data.summary
                      .marksRecorded
                  }
                />

                <GeneralMetric
                  icon={
                    <CheckCircle2
                      size={21}
                    />
                  }
                  label="Attendance Records"
                  value={
                    data.summary
                      .attendanceRecords
                  }
                />
              </div>

              {/* Highlights */}

              <div className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-800">
                <GeneralHighlight
                  icon={
                    <TrendingUp
                      size={19}
                    />
                  }
                  label="Best Class"
                  name={
                    bestSchoolClass?.class ??
                    "No data"
                  }
                  value={formatPercent(
                    bestSchoolClass?.average
                  )}
                  positive
                />

                <GeneralHighlight
                  icon={
                    <TrendingDown
                      size={19}
                    />
                  }
                  label="Lowest Class"
                  name={
                    lowestSchoolClass?.class ??
                    "No data"
                  }
                  value={formatPercent(
                    lowestSchoolClass?.average
                  )}
                />

                <GeneralHighlight
                  icon={
                    <TrendingUp
                      size={19}
                    />
                  }
                  label="Best Subject"
                  name={
                    bestSchoolSubject?.subject ??
                    "No data"
                  }
                  value={formatPercent(
                    bestSchoolSubject?.average
                  )}
                  positive
                />

                <GeneralHighlight
                  icon={
                    <TrendingDown
                      size={19}
                    />
                  }
                  label="Lowest Subject"
                  name={
                    lowestSchoolSubject?.subject ??
                    "No data"
                  }
                  value={formatPercent(
                    lowestSchoolSubject?.average
                  )}
                />
              </div>
            </div>
          </section>

          {/* =================================================
              SCHOOL OVERVIEW
          ================================================= */}

          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg font-bold">
                School Overview
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Overall school statistics for{" "}
                {data.academicYear.name}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <OverviewCard
                icon={
                  <GraduationCap
                    size={21}
                  />
                }
                label="Students"
                value={
                  data.summary.students
                }
              />

              <OverviewCard
                icon={
                  <BookOpen size={21} />
                }
                label="Classes"
                value={
                  data.summary.classes
                }
              />

              <OverviewCard
                icon={
                  <BarChart3 size={21} />
                }
                label="School Average"
                value={formatPercent(
                  data.summary.average
                )}
              />

              <OverviewCard
                icon={
                  <FileText size={21} />
                }
                label="Marks Recorded"
                value={
                  data.summary
                    .marksRecorded
                }
              />

              <OverviewCard
                icon={
                  <CheckCircle2
                    size={21}
                  />
                }
                label="Attendance Records"
                value={
                  data.summary
                    .attendanceRecords
                }
              />
            </div>
          </section>

          {/* =================================================
              SECTION PERFORMANCE
          ================================================= */}

          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                Section Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a section to view its overall performance or inspect the performance of its individual classes.
              </p>
            </div>

            {sections.length === 0 ? (
              <EmptyState
                title="No section data"
                message="No real sections are currently available for the active academic year."
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {sections.map(
                  (section) => {
                    const bestClass =
                      getBestClass(
                        section
                      );

                    const lowestClass =
                      getLowestClass(
                        section
                      );

                    const bestSubject =
                      getBestSubject(
                        section
                      );

                    const lowestSubject =
                      getLowestSubject(
                        section
                      );

                    return (
                      <div
                        key={
                          section.section
                        }
                        className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
                      >

                        {/* Section heading */}

                        <div className="border-b border-gray-100 p-6 dark:border-gray-800">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                SECTION
                              </span>

                              <h3 className="mt-3 text-2xl font-bold">
                                {
                                  section.section
                                }
                              </h3>

                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {
                                  section.classes
                                    .length
                                }{" "}
                                classes •{" "}
                                {
                                  section.students
                                }{" "}
                                students
                              </p>
                            </div>

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              <Users
                                size={22}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Statistics */}

                        <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800">
                          <SectionStat
                            label="Average"
                            value={formatPercent(
                              section.average
                            )}
                          />

                          <SectionStat
                            label="Pass Rate"
                            value={formatPercent(
                              section.passRate
                            )}
                          />

                          <SectionStat
                            label="Attendance"
                            value={formatPercent(
                              section.attendanceRate
                            )}
                          />

                          <SectionStat
                            label="Classes"
                            value={
                              section.classes
                                .length
                            }
                          />
                        </div>

                        {/* Highlights */}

                        <div className="grid gap-4 p-6 sm:grid-cols-2">
                          <QuickPerformance
                            label="Best Class"
                            name={
                              bestClass?.class ??
                              "No data"
                            }
                            value={formatPercent(
                              bestClass?.average
                            )}
                            positive
                          />

                          <QuickPerformance
                            label="Lowest Class"
                            name={
                              lowestClass?.class ??
                              "No data"
                            }
                            value={formatPercent(
                              lowestClass?.average
                            )}
                          />

                          <QuickPerformance
                            label="Best Subject"
                            name={
                              bestSubject?.subject ??
                              "No data"
                            }
                            value={formatPercent(
                              bestSubject?.average
                            )}
                            positive
                          />

                          <QuickPerformance
                            label="Lowest Subject"
                            name={
                              lowestSubject?.subject ??
                              "No data"
                            }
                            value={formatPercent(
                              lowestSubject?.average
                            )}
                          />
                        </div>

                        {/* Actions */}

                        <div className="flex flex-col gap-3 border-t border-gray-100 p-6 dark:border-gray-800 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSection(
                                section
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                          >
                            <BarChart3
                              size={17}
                            />

                            View Overall Performance
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setClassViewSection(
                                section
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold transition hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-700 dark:hover:bg-purple-950/20"
                          >
                            <BookOpen
                              size={17}
                            />

                            View Class Performance
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </main>

        {/* ===================================================
            GENERAL PERFORMANCE MODAL
        =================================================== */}

        {showGeneralPerformance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

              <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800">
                <div>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    GENERAL SCHOOL PERFORMANCE
                  </span>

                  <h2 className="mt-3 text-2xl font-bold">
                    Overall School Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Academic Year:{" "}
                    {data.academicYear.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      printCurrentAnalysis
                    }
                    className="hidden items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 sm:flex"
                  >
                    <Download size={17} />
                    Save as PDF
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowGeneralPerformance(
                        false
                      )
                    }
                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X size={21} />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(94vh-100px)] overflow-y-auto p-6">

                {/* General statistics */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <MiniStatCard
                    label="Students"
                    value={
                      data.summary.students
                    }
                  />

                  <MiniStatCard
                    label="Classes"
                    value={
                      data.summary.classes
                    }
                  />

                  <MiniStatCard
                    label="School Average"
                    value={formatPercent(
                      data.summary.average
                    )}
                  />

                  <MiniStatCard
                    label="Marks Recorded"
                    value={
                      data.summary
                        .marksRecorded
                    }
                  />

                  <MiniStatCard
                    label="Attendance Records"
                    value={
                      data.summary
                        .attendanceRecords
                    }
                  />
                </div>

                {/* School performance highlights */}

                <section className="mt-8">
                  <h3 className="mb-4 text-lg font-bold">
                    School Performance Highlights
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <HighlightCard
                      icon={
                        <TrendingUp
                          size={21}
                        />
                      }
                      title="Best Class"
                      name={
                        bestSchoolClass?.class ??
                        "No data"
                      }
                      value={formatPercent(
                        bestSchoolClass?.average
                      )}
                      description="Class with the highest average across the school."
                      positive
                    />

                    <HighlightCard
                      icon={
                        <TrendingDown
                          size={21}
                        />
                      }
                      title="Lowest Class"
                      name={
                        lowestSchoolClass?.class ??
                        "No data"
                      }
                      value={formatPercent(
                        lowestSchoolClass?.average
                      )}
                      description="Class with the lowest average across the school."
                    />

                    <HighlightCard
                      icon={
                        <TrendingUp
                          size={21}
                        />
                      }
                      title="Best Subject"
                      name={
                        bestSchoolSubject?.subject ??
                        "No data"
                      }
                      value={formatPercent(
                        bestSchoolSubject?.average
                      )}
                      description="Subject with the highest average across the school."
                      positive
                    />

                    <HighlightCard
                      icon={
                        <TrendingDown
                          size={21}
                        />
                      }
                      title="Lowest Subject"
                      name={
                        lowestSchoolSubject?.subject ??
                        "No data"
                      }
                      value={formatPercent(
                        lowestSchoolSubject?.average
                      )}
                      description="Subject with the lowest average across the school."
                    />
                  </div>
                </section>

                {/* Classes */}

                <section className="mt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">
                      School Class Performance
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Performance summary of all classes across all sections.
                    </p>
                  </div>

                  {data.classes.length ===
                  0 ? (
                    <EmptyState
                      title="No class data"
                      message="No class performance data is currently available."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                              <TableHeader>
                                Class
                              </TableHeader>

                              <TableHeader>
                                Section
                              </TableHeader>

                              <TableHeader>
                                Students
                              </TableHeader>

                              <TableHeader>
                                Average
                              </TableHeader>

                              <TableHeader>
                                Pass Rate
                              </TableHeader>

                              <TableHeader>
                                Attendance
                              </TableHeader>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {[
                              ...data.classes,
                            ]
                              .sort(
                                (a, b) =>
                                  (b.average ??
                                    -1) -
                                  (a.average ??
                                    -1)
                              )
                              .map(
                                (
                                  classItem
                                ) => (
                                  <tr
                                    key={
                                      classItem.classroomId
                                    }
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                  >
                                    <td className="px-5 py-4 font-semibold">
                                      {
                                        classItem.class
                                      }
                                    </td>

                                    <td className="px-5 py-4">
                                      {
                                        classItem.section
                                      }
                                    </td>

                                    <td className="px-5 py-4">
                                      {
                                        classItem.students
                                      }
                                    </td>

                                    <td className="px-5 py-4 font-bold">
                                      {formatPercent(
                                        classItem.average
                                      )}
                                    </td>

                                    <td className="px-5 py-4">
                                      {formatPercent(
                                        classItem.passRate
                                      )}
                                    </td>

                                    <td className="px-5 py-4">
                                      {formatPercent(
                                        classItem.attendanceRate
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                {/* School subjects */}

                <section className="mt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">
                      School Subject Performance
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Subject-level performance across the whole school.
                    </p>
                  </div>

                  {data.subjects.length ===
                  0 ? (
                    <EmptyState
                      title="No subject data"
                      message="No subject performance data is currently available."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                              <TableHeader>
                                Subject
                              </TableHeader>

                              <TableHeader>
                                Average
                              </TableHeader>

                              <TableHeader>
                                Marks Recorded
                              </TableHeader>

                              <TableHeader>
                                Performance
                              </TableHeader>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {[
                              ...data.subjects,
                            ]
                              .sort(
                                (a, b) =>
                                  (b.average ??
                                    -1) -
                                  (a.average ??
                                    -1)
                              )
                              .map(
                                (
                                  subject
                                ) => {
                                  const average =
                                    subject.average;

                                  const isStrong =
                                    average !==
                                      null &&
                                    average >=
                                      70;

                                  const needsAttention =
                                    average !==
                                      null &&
                                    average < 50;

                                  return (
                                    <tr
                                      key={
                                        subject.subjectId
                                      }
                                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                    >
                                      <td className="px-5 py-4 font-semibold">
                                        {
                                          subject.subject
                                        }
                                      </td>

                                      <td className="px-5 py-4 font-bold">
                                        {formatPercent(
                                          subject.average
                                        )}
                                      </td>

                                      <td className="px-5 py-4">
                                        {
                                          subject.marksRecorded
                                        }
                                      </td>

                                      <td className="px-5 py-4">
                                        {isStrong ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                            <TrendingUp
                                              size={
                                                13
                                              }
                                            />
                                            Strong
                                          </span>
                                        ) : needsAttention ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                                            <TrendingDown
                                              size={
                                                13
                                              }
                                            />
                                            Attention
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            Stable
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                <div className="mt-8 flex flex-col gap-3 sm:hidden">
                  <button
                    type="button"
                    onClick={
                      printCurrentAnalysis
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white"
                  >
                    <Download size={18} />
                    Save as PDF
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowGeneralPerformance(
                        false
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 font-semibold dark:border-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            SECTION OVERALL MODAL
        =================================================== */}

        {selectedSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

              <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800">
                <div>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    OVERALL SECTION PERFORMANCE
                  </span>

                  <h2 className="mt-3 text-2xl font-bold">
                    {
                      selectedSection.section
                    }
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Academic Year:{" "}
                    {
                      data.academicYear
                        .name
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      downloadingSection
                    }
                    onClick={() =>
                      downloadSectionPdf(
                        selectedSection
                      )
                    }
                    className="hidden items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
                  >
                    <Download size={17} />

                    {downloadingSection
                      ? "Generating..."
                      : "Download Report PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSection(
                        null
                      )
                    }
                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X size={21} />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(94vh-100px)] overflow-y-auto p-6">

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStatCard
                    label="Students"
                    value={
                      selectedSection.students
                    }
                  />

                  <MiniStatCard
                    label="Classes"
                    value={
                      selectedSection
                        .classes
                        .length
                    }
                  />

                  <MiniStatCard
                    label="Average"
                    value={formatPercent(
                      selectedSection.average
                    )}
                  />

                  <MiniStatCard
                    label="Pass Rate"
                    value={formatPercent(
                      selectedSection.passRate
                    )}
                  />
                </div>

                <section className="mt-6">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={22}
                        className="text-blue-600"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                          Attendance Performance
                        </p>

                        <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {formatPercent(
                            selectedSection.attendanceRate
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="mb-4 text-lg font-bold">
                    Performance Highlights
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">

                    <HighlightCard
                      icon={
                        <TrendingUp
                          size={21}
                        />
                      }
                      title="Best Class"
                      name={
                        getBestClass(
                          selectedSection
                        )?.class ??
                        "No data"
                      }
                      value={formatPercent(
                        getBestClass(
                          selectedSection
                        )?.average
                      )}
                      description="Highest class average in this section."
                      positive
                    />

                    <HighlightCard
                      icon={
                        <TrendingDown
                          size={21}
                        />
                      }
                      title="Lowest Class"
                      name={
                        getLowestClass(
                          selectedSection
                        )?.class ??
                        "No data"
                      }
                      value={formatPercent(
                        getLowestClass(
                          selectedSection
                        )?.average
                      )}
                      description="Lowest class average in this section."
                    />

                    <HighlightCard
                      icon={
                        <TrendingUp
                          size={21}
                        />
                      }
                      title="Best Subject"
                      name={
                        getBestSubject(
                          selectedSection
                        )?.subject ??
                        "No data"
                      }
                      value={formatPercent(
                        getBestSubject(
                          selectedSection
                        )?.average
                      )}
                      description="Highest subject average across this section."
                      positive
                    />

                    <HighlightCard
                      icon={
                        <TrendingDown
                          size={21}
                        />
                      }
                      title="Lowest Subject"
                      name={
                        getLowestSubject(
                          selectedSection
                        )?.subject ??
                        "No data"
                      }
                      value={formatPercent(
                        getLowestSubject(
                          selectedSection
                        )?.average
                      )}
                      description="Lowest subject average across this section."
                    />

                  </div>
                </section>

                <section className="mt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">
                      Classes in this Section
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Performance summary of each class.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                          <tr>
                            <TableHeader>
                              Class
                            </TableHeader>

                            <TableHeader>
                              Students
                            </TableHeader>

                            <TableHeader>
                              Average
                            </TableHeader>

                            <TableHeader>
                              Pass Rate
                            </TableHeader>

                            <TableHeader>
                              Attendance
                            </TableHeader>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {selectedSection.classes.map(
                            (
                              classItem
                            ) => (
                              <tr
                                key={
                                  classItem.classroomId
                                }
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                              >
                                <td className="px-5 py-4 font-semibold">
                                  {
                                    classItem.class
                                  }
                                </td>

                                <td className="px-5 py-4">
                                  {
                                    classItem.students
                                  }
                                </td>

                                <td className="px-5 py-4 font-bold">
                                  {formatPercent(
                                    classItem.average
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {formatPercent(
                                    classItem.passRate
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {formatPercent(
                                    classItem.attendanceRate
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <div className="mt-8 flex flex-col gap-3 sm:hidden">
                  <button
                    type="button"
                    disabled={
                      downloadingSection
                    }
                    onClick={() =>
                      downloadSectionPdf(
                        selectedSection
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    <Download size={18} />

                    {downloadingSection
                      ? "Generating..."
                      : "Download Report PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      printCurrentAnalysis
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 font-semibold dark:border-gray-700"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            CLASS LIST MODAL
        =================================================== */}

        {classViewSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

              <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800">
                <div>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    CLASS PERFORMANCE
                  </span>

                  <h2 className="mt-3 text-2xl font-bold">
                    {
                      classViewSection.section
                    }
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select a class to view its subject performance.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setClassViewSection(
                      null
                    )
                  }
                  className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="max-h-[calc(94vh-120px)] overflow-y-auto p-6">
                {classViewSection.classes
                  .length === 0 ? (
                  <EmptyState
                    title="No classes"
                    message="No classes are available for this section."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {classViewSection.classes.map(
                      (classItem) => (
                        <button
                          key={
                            classItem.classroomId
                          }
                          type="button"
                          onClick={() => {
                            setClassViewSection(
                              null
                            );

                            setSelectedClass(
                              classItem
                            );
                          }}
                          className="group rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-purple-700 dark:hover:bg-purple-950/20"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                                Class
                              </span>

                              <h3 className="mt-1 text-xl font-bold">
                                {
                                  classItem.class
                                }
                              </h3>

                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {
                                  classItem.students
                                }{" "}
                                students
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-700 shadow-sm dark:bg-gray-900 dark:text-purple-300">
                              <ChevronRight
                                size={19}
                              />
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-3 gap-3">
                            <MiniStat
                              label="Average"
                              value={formatPercent(
                                classItem.average
                              )}
                            />

                            <MiniStat
                              label="Pass"
                              value={formatPercent(
                                classItem.passRate
                              )}
                            />

                            <MiniStat
                              label="Attendance"
                              value={formatPercent(
                                classItem.attendanceRate
                              )}
                            />
                          </div>

                          <div className="mt-5 flex items-center justify-end border-t border-gray-200 pt-4 text-sm font-semibold text-purple-700 dark:border-gray-700 dark:text-purple-300">
                            View class details

                            <ChevronRight
                              size={16}
                              className="ml-1 transition group-hover:translate-x-1"
                            />
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            CLASS DETAIL MODAL
        =================================================== */}

        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

              <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                      CLASS PERFORMANCE
                    </span>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                      {
                        data.academicYear
                          .name
                      }
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-bold">
                    {
                      selectedClass.class
                    }
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {
                      selectedClass.section
                    }{" "}
                    Section
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      downloadingClass
                    }
                    onClick={() =>
                      downloadClassPdf(
                        selectedClass
                      )
                    }
                    className="hidden items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
                  >
                    <Download size={17} />

                    {downloadingClass
                      ? "Generating..."
                      : "Download Report PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedClass(
                        null
                      )
                    }
                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X size={21} />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(94vh-110px)] overflow-y-auto p-6">

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStatCard
                    label="Students"
                    value={
                      selectedClass.students
                    }
                  />

                  <MiniStatCard
                    label="Average"
                    value={formatPercent(
                      selectedClass.average
                    )}
                  />

                  <MiniStatCard
                    label="Pass Rate"
                    value={formatPercent(
                      selectedClass.passRate
                    )}
                  />

                  <MiniStatCard
                    label="Attendance"
                    value={formatPercent(
                      selectedClass.attendanceRate
                    )}
                  />
                </div>

                <section className="mt-6">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={22}
                        className="text-blue-600"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                          Class Attendance
                        </p>

                        <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {formatPercent(
                            selectedClass.attendanceRate
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="mb-4 text-lg font-bold">
                    Subject Performance Highlights
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <HighlightCard
                      icon={
                        <TrendingUp
                          size={21}
                        />
                      }
                      title="Best Performed Subject"
                      name={
                        getBestClassSubject(
                          selectedClass
                        )?.subject ??
                        "No data"
                      }
                      value={formatPercent(
                        getBestClassSubject(
                          selectedClass
                        )?.average
                      )}
                      description="Subject with the highest class average."
                      positive
                    />

                    <HighlightCard
                      icon={
                        <TrendingDown
                          size={21}
                        />
                      }
                      title="Least Performed Subject"
                      name={
                        getLowestClassSubject(
                          selectedClass
                        )?.subject ??
                        "No data"
                      }
                      value={formatPercent(
                        getLowestClassSubject(
                          selectedClass
                        )?.average
                      )}
                      description="Subject with the lowest class average."
                    />
                  </div>
                </section>

                <section className="mt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">
                      Performance Per Subject
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Complete subject-level performance for{" "}
                      {
                        selectedClass.class
                      }.
                    </p>
                  </div>

                  {selectedClass.subjects
                    .length === 0 ? (
                    <EmptyState
                      title="No subject data"
                      message="No marks have been recorded for this class yet."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px]">
                          <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                              <TableHeader>
                                Subject
                              </TableHeader>

                              <TableHeader>
                                Average
                              </TableHeader>

                              <TableHeader>
                                Students
                              </TableHeader>

                              <TableHeader>
                                Marks Recorded
                              </TableHeader>

                              <TableHeader>
                                Performance
                              </TableHeader>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {[
                              ...selectedClass.subjects,
                            ]
                              .sort(
                                (a, b) =>
                                  (b.average ??
                                    -1) -
                                  (a.average ??
                                    -1)
                              )
                              .map(
                                (
                                  subject
                                ) => {
                                  const average =
                                    subject.average;

                                  const isStrong =
                                    average !==
                                      null &&
                                    average >=
                                      70;

                                  const needsAttention =
                                    average !==
                                      null &&
                                    average < 50;

                                  return (
                                    <tr
                                      key={
                                        subject.subjectId
                                      }
                                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                    >
                                      <td className="px-5 py-4">
                                        <p className="font-semibold">
                                          {
                                            subject.subject
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                          {
                                            subject.students
                                          }{" "}
                                          students
                                        </p>
                                      </td>

                                      <td className="px-5 py-4 font-bold">
                                        {formatPercent(
                                          subject.average
                                        )}
                                      </td>

                                      <td className="px-5 py-4">
                                        {
                                          subject.students
                                        }
                                      </td>

                                      <td className="px-5 py-4">
                                        {
                                          subject.marksRecorded
                                        }
                                      </td>

                                      <td className="px-5 py-4">
                                        {isStrong ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                            <TrendingUp
                                              size={
                                                13
                                              }
                                            />
                                            Strong
                                          </span>
                                        ) : needsAttention ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                                            <TrendingDown
                                              size={
                                                13
                                              }
                                            />
                                            Attention
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            Stable
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                <section className="mt-8">
                  <h3 className="mb-4 text-lg font-bold">
                    Mark Recording Coverage
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedClass.subjects.map(
                      (subject) => {
                        const coverage =
                          subject.students >
                          0
                            ? Math.min(
                                100,
                                (subject.marksRecorded /
                                  subject.students) *
                                  100
                              )
                            : 0;

                        return (
                          <div
                            key={
                              subject.subjectId
                            }
                            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold">
                                {
                                  subject.subject
                                }
                              </span>

                              <span className="text-xs font-bold text-gray-500">
                                {
                                  subject.marksRecorded
                                }{" "}
                                marks
                              </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full bg-purple-600"
                                style={{
                                  width: `${coverage}%`,
                                }}
                              />
                            </div>

                            <p className="mt-2 text-xs text-gray-500">
                              {coverage.toFixed(
                                0
                              )}
                              % recorded
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>

                <div className="mt-8 flex flex-col gap-3 sm:hidden">
                  <button
                    type="button"
                    disabled={
                      downloadingClass
                    }
                    onClick={() =>
                      downloadClassPdf(
                        selectedClass
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    <Download size={18} />

                    {downloadingClass
                      ? "Generating..."
                      : "Download Report PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      printCurrentAnalysis
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 font-semibold dark:border-gray-700"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            PRINT STYLES
        =================================================== */}

        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .fixed.z-50 {
              position: static !important;
              display: block !important;
              background: white !important;
              padding: 0 !important;
            }

            .fixed.z-50 * {
              visibility: visible !important;
            }

            .fixed.z-50 > div {
              max-height: none !important;
              max-width: none !important;
              width: 100% !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            .fixed.z-50 .overflow-y-auto {
              max-height: none !important;
              overflow: visible !important;
            }

            button {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Navbar />

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}

/* =========================================================
   GENERAL PERFORMANCE METRIC
========================================================= */

function GeneralMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white p-5 dark:bg-gray-900">
      <div className="text-purple-700 dark:text-purple-300">
        {icon}
      </div>

      <p className="mt-4 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   GENERAL PERFORMANCE HIGHLIGHT
========================================================= */

function GeneralHighlight({
  icon,
  label,
  name,
  value,
  positive = false,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <span
          className={
            positive
              ? "text-green-600 dark:text-green-400"
              : "text-orange-600 dark:text-orange-400"
          }
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 truncate font-bold">
        {name}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          positive
            ? "text-green-700 dark:text-green-300"
            : "text-orange-700 dark:text-orange-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   OVERVIEW CARD
========================================================= */

function OverviewCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="text-purple-700 dark:text-purple-300">
        {icon}
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION STAT
========================================================= */

function SectionStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white p-4 dark:bg-gray-900">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   QUICK PERFORMANCE
========================================================= */

function QuickPerformance({
  label,
  name,
  value,
  positive = false,
}: {
  label: string;
  name: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {label}
        </p>

        {positive ? (
          <TrendingUp
            size={15}
            className="text-green-600"
          />
        ) : (
          <TrendingDown
            size={15}
            className="text-orange-600"
          />
        )}
      </div>

      <p className="mt-2 truncate font-bold">
        {name}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${
          positive
            ? "text-green-700 dark:text-green-300"
            : "text-orange-700 dark:text-orange-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   HIGHLIGHT CARD
========================================================= */

function HighlightCard({
  icon,
  title,
  name,
  value,
  description,
  positive = false,
}: {
  icon: ReactNode;
  title: string;
  name: string;
  value: string;
  description: string;
  positive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        positive
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
          : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={
            positive
              ? "text-green-600"
              : "text-orange-600"
          }
        >
          {icon}
        </span>

        <h3
          className={`font-bold ${
            positive
              ? "text-green-800 dark:text-green-300"
              : "text-orange-800 dark:text-orange-300"
          }`}
        >
          {title}
        </h3>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">
            {name}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <p
          className={`shrink-0 text-xl font-bold ${
            positive
              ? "text-green-700 dark:text-green-300"
              : "text-orange-700 dark:text-orange-300"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MINI STAT CARD
========================================================= */

function MiniStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
      <BarChart3
        size={32}
        className="mx-auto text-gray-400"
      />

      <h3 className="mt-3 font-bold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}