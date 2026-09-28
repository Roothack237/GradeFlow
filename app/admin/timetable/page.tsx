"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Send,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";

/* =========================================================
   TYPES
========================================================= */

type AvailabilityStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type Term = {
  id: string;
  name: string;
  order?: number;
};

type AcademicYear = {
  id: string;
  name: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;

  /*
   * IMPORTANT:
   * Terms are returned inside each academic year
   * by the timetable API.
   */
  terms?: Term[];
};

type Classroom = {
  id: string;
  name: string;
  section?: string | null;
};

type Teacher = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type Availability = {
  id: string;
  teacherId: string;
  teacherName?: string;
  dayOfWeek: number;
  dayName?: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  createdAt?: string;
  updatedAt?: string;
};

type TimetableEntry = {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  academicYearId: string;
  termId: string;

  day: string;
  startTime: string;
  endTime: string;

  room?: string | null;

  classroom?: {
    id: string;
    name: string;
  } | null;

  subject?: {
    id: string;
    name: string;
  } | null;

  teacher?: {
    id: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
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

/* =========================================================
   CONSTANTS
========================================================= */

const DAYS = [
  {
    value: "MONDAY",
    label: "Monday",
  },
  {
    value: "TUESDAY",
    label: "Tuesday",
  },
  {
    value: "WEDNESDAY",
    label: "Wednesday",
  },
  {
    value: "THURSDAY",
    label: "Thursday",
  },
  {
    value: "FRIDAY",
    label: "Friday",
  },
];

const TIME_SLOTS = [
  {
    startTime: "08:00",
    endTime: "10:00",
  },
  {
    startTime: "10:15",
    endTime: "12:00",
  },
  {
    startTime: "12:30",
    endTime: "14:30",
  },
];

const DAY_NUMBER_MAP: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

/* =========================================================
   HELPERS
========================================================= */

function getTeacherName(
  teacher?: Teacher | TimetableEntry["teacher"] | null
) {
  if (!teacher) {
    return "Unknown teacher";
  }

  if (teacher.name) {
    return teacher.name;
  }

  const firstName = teacher.firstName || "";
  const lastName = teacher.lastName || "";

  return `${firstName} ${lastName}`.trim() || "Unknown teacher";
}

function getDayName(
  dayOfWeek: number,
  dayName?: string
) {
  if (dayName) {
    return dayName;
  }

  return DAY_NUMBER_MAP[dayOfWeek] || "Unknown";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminTimetablePage() {
  /* =========================================================
     SIDEBAR
  ========================================================= */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =========================================================
     DATABASE DATA
  ========================================================= */

  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  const [classrooms, setClassrooms] =
    useState<Classroom[]>([]);

  const [teachers, setTeachers] =
    useState<Teacher[]>([]);

  const [availability, setAvailability] =
    useState<Availability[]>([]);

  const [timetable, setTimetable] =
    useState<TimetableEntry[]>([]);

  const [publications, setPublications] =
    useState<Publication[]>([]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const [
    selectedAcademicYearId,
    setSelectedAcademicYearId,
  ] = useState("");

  const [
    selectedTermId,
    setSelectedTermId,
  ] = useState("");

  const [
    selectedClassroomId,
    setSelectedClassroomId,
  ] = useState("");

  /* =========================================================
     UI STATES
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [
    updatingAvailability,
    setUpdatingAvailability,
  ] = useState<string | null>(null);

  const [viewOpen, setViewOpen] =
    useState(false);

  const [activeDay, setActiveDay] =
    useState("MONDAY");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD ALL TIMETABLE INFORMATION
  ========================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/timetable",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load timetable information."
        );
      }

      /* =====================================================
         ACADEMIC YEARS

         IMPORTANT:
         Terms are inside each academic year.
      ===================================================== */

      const loadedAcademicYears: AcademicYear[] =
        Array.isArray(data.academicYears)
          ? data.academicYears
          : [];

      setAcademicYears(
        loadedAcademicYears
      );

      /* =====================================================
         CLASSROOMS
      ===================================================== */

      setClassrooms(
        Array.isArray(data.classrooms)
          ? data.classrooms
          : []
      );

      /* =====================================================
         TEACHERS
      ===================================================== */

      setTeachers(
        Array.isArray(data.teachers)
          ? data.teachers
          : []
      );

      /* =====================================================
         TEACHER AVAILABILITY
      ===================================================== */

      setAvailability(
        Array.isArray(data.availability)
          ? data.availability
          : []
      );

      /* =====================================================
         EXISTING TIMETABLE
      ===================================================== */

      setTimetable(
        Array.isArray(data.timetable)
          ? data.timetable
          : []
      );

      /* =====================================================
         PUBLICATIONS
      ===================================================== */

      setPublications(
        Array.isArray(data.publications)
          ? data.publications
          : []
      );

      /* =====================================================
         DEFAULT ACADEMIC YEAR
      ===================================================== */

      if (
        !selectedAcademicYearId &&
        loadedAcademicYears.length > 0
      ) {
        const activeYear =
          loadedAcademicYears.find(
            (year) => year.isActive
          ) ||
          loadedAcademicYears[0];

        setSelectedAcademicYearId(
          activeYear.id
        );
      }

      /* =====================================================
         DEFAULT CLASSROOM

         We no longer force Form 3.
      ===================================================== */

      if (
        !selectedClassroomId &&
        Array.isArray(data.classrooms) &&
        data.classrooms.length > 0
      ) {
        setSelectedClassroomId(
          data.classrooms[0].id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     SELECTED ACADEMIC YEAR
  ========================================================= */

  const selectedAcademicYear =
    useMemo(() => {
      return academicYears.find(
        (year) =>
          year.id === selectedAcademicYearId
      );
    }, [
      academicYears,
      selectedAcademicYearId,
    ]);

  /* =========================================================
     AVAILABLE TERMS

     This is the IMPORTANT FIX.

     Terms come from:
       selectedAcademicYear.terms
  ========================================================= */

  const availableTerms = useMemo(() => {
    return selectedAcademicYear?.terms ?? [];
  }, [selectedAcademicYear]);

  /* =========================================================
     KEEP SELECTED TERM VALID

     Whenever the academic year changes:
     - get its terms
     - keep the current term if it belongs
     - otherwise select the first term
  ========================================================= */

  useEffect(() => {
    if (!selectedAcademicYearId) {
      setSelectedTermId("");
      return;
    }

    const academicYear =
      academicYears.find(
        (year) =>
          year.id === selectedAcademicYearId
      );

    const yearTerms =
      academicYear?.terms ?? [];

    if (yearTerms.length === 0) {
      setSelectedTermId("");
      return;
    }

    const currentTermStillExists =
      yearTerms.some(
        (term) =>
          term.id === selectedTermId
      );

    if (!currentTermStillExists) {
      setSelectedTermId(
        yearTerms[0].id
      );
    }
  }, [
    selectedAcademicYearId,
    academicYears,
    selectedTermId,
  ]);

  /* =========================================================
     SELECTED TERM
  ========================================================= */

  const selectedTerm = useMemo(() => {
    return availableTerms.find(
      (term) =>
        term.id === selectedTermId
    );
  }, [
    availableTerms,
    selectedTermId,
  ]);

  /* =========================================================
     SELECTED CLASSROOM
  ========================================================= */

  const selectedClassroom =
    useMemo(() => {
      return classrooms.find(
        (classroom) =>
          classroom.id ===
          selectedClassroomId
      );
    }, [
      classrooms,
      selectedClassroomId,
    ]);

  /* =========================================================
     EXISTING TIMETABLE
  ========================================================= */

  const selectedTimetable =
    useMemo(() => {
      return timetable.filter(
        (entry) => {
          return (
            entry.academicYearId ===
              selectedAcademicYearId &&
            entry.termId ===
              selectedTermId &&
            entry.classroomId ===
              selectedClassroomId
          );
        }
      );
    }, [
      timetable,
      selectedAcademicYearId,
      selectedTermId,
      selectedClassroomId,
    ]);

  /* =========================================================
     PUBLICATION
  ========================================================= */

  const selectedPublication =
    useMemo(() => {
      return publications.find(
        (publication) => {
          return (
            publication.termId ===
              selectedTermId &&
            publication.classroomId ===
              selectedClassroomId
          );
        }
      );
    }, [
      publications,
      selectedTermId,
      selectedClassroomId,
    ]);

  const publicationIsPublished =
    selectedPublication?.status ===
    "PUBLISHED";

  /* =========================================================
     AVAILABILITY COUNTS
  ========================================================= */

  const pendingAvailabilityCount =
    useMemo(() => {
      return availability.filter(
        (item) =>
          item.status === "PENDING"
      ).length;
    }, [availability]);

  const approvedAvailabilityCount =
    useMemo(() => {
      return availability.filter(
        (item) =>
          item.status === "APPROVED"
      ).length;
    }, [availability]);

  /* =========================================================
     FIND TIMETABLE ENTRY
  ========================================================= */

  const getEntry = (
    day: string,
    startTime: string
  ) => {
    return selectedTimetable.find(
      (entry) =>
        entry.day === day &&
        entry.startTime === startTime
    );
  };

  /* =========================================================
     APPROVE / REJECT TEACHER AVAILABILITY
  ========================================================= */

  const updateAvailability = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      setUpdatingAvailability(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/timetable/availability/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update teacher availability."
        );
      }

      setAvailability((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item
        )
      );

      setMessage(
        status === "APPROVED"
          ? "Teacher availability approved."
          : "Teacher availability rejected."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update teacher availability."
      );
    } finally {
      setUpdatingAvailability(null);
    }
  };

  /* =========================================================
     APPROVE ALL
  ========================================================= */

  const approveAll = async () => {
    const pending =
      availability.filter(
        (item) =>
          item.status === "PENDING"
      );

    if (pending.length === 0) {
      setMessage(
        "There are no pending availability requests."
      );
      return;
    }

    for (const item of pending) {
      await updateAvailability(
        item.id,
        "APPROVED"
      );
    }

    setMessage(
      "All pending teacher availability requests have been approved."
    );
  };

  /* =========================================================
     GENERATE TIMETABLE
  ========================================================= */

  const generateTimetable = async () => {
    if (!selectedAcademicYearId) {
      setError(
        "Please select an academic year."
      );
      return;
    }

    if (!selectedTermId) {
      setError("Please select a term.");
      return;
    }

    if (!selectedClassroomId) {
      setError("Please select a class.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/timetable",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            academicYearId:
              selectedAcademicYearId,
            termId:
              selectedTermId,
            classroomId:
              selectedClassroomId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to generate timetable."
        );
      }

      if (
        Array.isArray(data.timetable)
      ) {
        setTimetable(
          data.timetable
        );
      }

      setMessage(
        data?.message ||
          "Timetable generated successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate timetable."
      );
    } finally {
      setGenerating(false);
    }
  };

  /* =========================================================
     PUBLISH / UNPUBLISH
  ========================================================= */

  const publishTimetable = async (
    action: "publish" | "unpublish"
  ) => {
    if (!selectedTermId) {
      setError("Please select a term.");
      return;
    }

    if (!selectedClassroomId) {
      setError("Please select a class.");
      return;
    }

    if (
      action === "publish" &&
      selectedTimetable.length === 0
    ) {
      setError(
        "There is no timetable to publish for this class."
      );
      return;
    }

    try {
      setPublishing(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/timetable/publish",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            termId: selectedTermId,
            classroomId:
              selectedClassroomId,
            action,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Failed to ${
              action === "publish"
                ? "publish"
                : "unpublish"
            } timetable.`
        );
      }

      setMessage(
        data?.message ||
          (action === "publish"
            ? "Timetable published successfully."
            : "Timetable unpublished successfully.")
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update timetable publication."
      );
    } finally {
      setPublishing(false);
    }
  };

  /* =========================================================
     DOWNLOAD TIMETABLE
  ========================================================= */

  const handleDownloadTimetable = () => {
    if (
      selectedTimetable.length === 0
    ) {
      setError(
        "There is no timetable available to download."
      );
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=900"
    );

    if (!printWindow) {
      setError(
        "Please allow pop-ups in your browser to download the timetable."
      );
      return;
    }

    const className =
      selectedClassroom?.name ||
      "Class";

    const termName =
      selectedTerm?.name || "Term";

    const academicYearName =
      selectedAcademicYear?.name ||
      "Academic Year";

    const rows = DAYS.map(
      (day) => {
        const cells =
          TIME_SLOTS.map(
            (slot) => {
              const entry =
                getEntry(
                  day.value,
                  slot.startTime
                );

              if (!entry) {
                return `
                  <td class="empty">
                    Free
                  </td>
                `;
              }

              return `
                <td>
                  <strong>
                    ${
                      entry.subject
                        ?.name ||
                      "Subject"
                    }
                  </strong>

                  <br />

                  <span>
                    ${getTeacherName(
                      entry.teacher
                    )}
                  </span>

                  ${
                    entry.room
                      ? `
                        <br />
                        <small>
                          Room: ${entry.room}
                        </small>
                      `
                      : ""
                  }
                </td>
              `;
            }
          ).join("");

        return `
          <tr>
            <th>
              ${day.label}
            </th>

            ${cells}
          </tr>
        `;
      }
    ).join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>

          <title>
            ${className} Timetable
          </title>

          <style>

            body {
              font-family:
                Arial,
                sans-serif;

              padding:
                30px;

              color:
                #111827;
            }

            h1 {
              text-align:
                center;

              margin-bottom:
                5px;
            }

            h2 {
              text-align:
                center;

              margin-top:
                0;

              color:
                #4b5563;
            }

            .info {
              text-align:
                center;

              margin-bottom:
                25px;

              color:
                #6b7280;
            }

            table {
              width:
                100%;

              border-collapse:
                collapse;
            }

            th,
            td {
              border:
                1px solid
                #d1d5db;

              padding:
                14px;

              text-align:
                center;

              vertical-align:
                middle;
            }

            th {
              background:
                #f3f4f6;
            }

            td strong {
              font-size:
                14px;
            }

            td span {
              font-size:
                12px;

              color:
                #6b7280;
            }

            td small {
              color:
                #6b7280;
            }

            .empty {
              color:
                #9ca3af;
            }

            .breaks {
              margin-top:
                20px;

              padding:
                12px;

              border:
                1px dashed
                #d1d5db;

              text-align:
                center;
            }

            .footer {
              margin-top:
                25px;

              text-align:
                center;

              font-size:
                11px;

              color:
                #9ca3af;
            }

            @media print {

              body {
                padding:
                  10px;
              }

            }

          </style>

        </head>

        <body>

          <h1>
            GradeFlow
          </h1>

          <h2>
            ${className} Timetable
          </h2>

          <div class="info">

            ${academicYearName}

            &nbsp; • &nbsp;

            ${termName}

          </div>

          <table>

            <thead>

              <tr>

                <th>
                  Day
                </th>

                <th>
                  08:00 - 10:00
                </th>

                <th>
                  10:15 - 12:00
                </th>

                <th>
                  12:30 - 14:30
                </th>

              </tr>

            </thead>

            <tbody>

              ${rows}

            </tbody>

          </table>

          <div class="breaks">

            <strong>
              10:00 - 10:15
            </strong>

            — Break

            &nbsp;&nbsp; | &nbsp;&nbsp;

            <strong>
              12:00 - 12:30
            </strong>

            — Break

            &nbsp;&nbsp; | &nbsp;&nbsp;

            <strong>
              14:30 - 15:00
            </strong>

            — Revision / Class Activity

          </div>

          <div class="footer">
            Generated by GradeFlow
          </div>

        </body>

      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
        />

        <div className="lg:pl-72">

          <AdminNavbar
            onMenuClick={() =>
              setSidebarOpen(true)
            }
          />

          <main className="flex min-h-[80vh] items-center justify-center">

            <div className="flex flex-col items-center gap-3">

              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading timetable and teacher
                availabilities...
              </p>

            </div>

          </main>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-72">

        {/* ===================================================
            NAVBAR
        =================================================== */}

        <AdminNavbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-7xl space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">

                  <CalendarDays className="h-7 w-7 text-purple-600 dark:text-purple-400" />

                </div>

                <div>

                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Timetable Management
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage teacher availability and
                    view the existing class timetable.
                  </p>

                </div>

              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >

                <RefreshCw
                  className={
                    `h-4 w-4 ${
                      loading
                        ? "animate-spin"
                        : ""
                    }`
                  }
                />

                Refresh

              </button>

            </div>

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {message && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">

                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <span>
                  {message}
                </span>

              </div>
            )}

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* =================================================
                FILTERS
            ================================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="mb-5 flex items-center gap-3">

                <CalendarDays className="h-5 w-5 text-purple-600" />

                <div>

                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Timetable Settings
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select the academic year,
                    term and class.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                {/* =================================================
                    ACADEMIC YEAR
                ================================================= */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Academic Year
                  </label>

                  <div className="relative">

                    <select
                      value={
                        selectedAcademicYearId
                      }
                      onChange={(e) => {
                        setSelectedAcademicYearId(
                          e.target.value
                        );

                        /*
                         * Reset term immediately.
                         * The effect above will then
                         * select the first term of the
                         * newly selected academic year.
                         */
                        setSelectedTermId("");
                      }}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >

                      <option value="">
                        Select academic year
                      </option>

                      {academicYears.map(
                        (year) => (
                          <option
                            key={year.id}
                            value={year.id}
                          >
                            {year.name}

                            {year.isActive
                              ? " (Active)"
                              : ""}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-gray-400" />

                  </div>

                </div>

                {/* =================================================
                    TERM
                ================================================= */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Term
                  </label>

                  <div className="relative">

                    <select
                      value={selectedTermId}
                      onChange={(e) =>
                        setSelectedTermId(
                          e.target.value
                        )
                      }
                      disabled={
                        !selectedAcademicYearId
                      }
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >

                      <option value="">
                        {selectedAcademicYearId
                          ? "Select term"
                          : "Select academic year first"}
                      </option>

                      {availableTerms.map(
                        (term) => (
                          <option
                            key={term.id}
                            value={term.id}
                          >
                            {term.name}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-gray-400" />

                  </div>

                  {/* Helpful message if no terms exist */}

                  {selectedAcademicYearId &&
                    availableTerms.length ===
                      0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No terms are configured
                        for this academic year.
                      </p>
                    )}

                </div>

                {/* =================================================
                    CLASS
                ================================================= */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Class
                  </label>

                  <div className="relative">

                    <select
                      value={
                        selectedClassroomId
                      }
                      onChange={(e) =>
                        setSelectedClassroomId(
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >

                      <option value="">
                        Select class
                      </option>

                      {classrooms.map(
                        (classroom) => (
                          <option
                            key={
                              classroom.id
                            }
                            value={
                              classroom.id
                            }
                          >
                            {classroom.name}

                            {classroom.section
                              ? ` — ${classroom.section}`
                              : ""}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-gray-400" />

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Teachers */}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Teachers
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {teachers.length}
                    </p>

                  </div>

                  <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">

                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />

                  </div>

                </div>

              </div>

              {/* Pending */}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pending Availability
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {pendingAvailabilityCount}
                    </p>

                  </div>

                  <div className="rounded-xl bg-yellow-100 p-3 dark:bg-yellow-900/30">

                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />

                  </div>

                </div>

              </div>

              {/* Approved */}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Approved Availability
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {approvedAvailabilityCount}
                    </p>

                  </div>

                  <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/30">

                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />

                  </div>

                </div>

              </div>

              {/* Existing Timetable */}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Existing Periods
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedTimetable.length}
                    </p>

                  </div>

                  <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">

                    <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                TEACHER AVAILABILITY
            ================================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">

                <div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Teacher Availability
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    All availability submitted
                    by teachers is displayed here.
                  </p>

                </div>

                <button
                  onClick={approveAll}
                  disabled={
                    pendingAvailabilityCount ===
                    0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <CheckCircle2 className="h-4 w-4" />

                  Approve All

                </button>

              </div>

              <div className="overflow-x-auto">

                <table className="min-w-full text-left text-sm">

                  <thead className="bg-gray-50 dark:bg-gray-800/50">

                    <tr>

                      <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Teacher
                      </th>

                      <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Day
                      </th>

                      <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Available Time
                      </th>

                      <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                    {availability.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-gray-500 dark:text-gray-400"
                        >
                          No teacher availability
                          has been submitted.
                        </td>

                      </tr>

                    ) : (

                      availability.map(
                        (item) => {

                          const teacher =
                            teachers.find(
                              (teacher) =>
                                teacher.id ===
                                item.teacherId
                            );

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                            >

                              <td className="px-5 py-4">

                                <div className="font-medium text-gray-900 dark:text-white">

                                  {item.teacherName ||
                                    getTeacherName(
                                      teacher
                                    )}

                                </div>

                                {teacher?.email && (
                                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {teacher.email}
                                  </div>
                                )}

                              </td>

                              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">

                                {getDayName(
                                  item.dayOfWeek,
                                  item.dayName
                                )}

                              </td>

                              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">

                                {item.startTime}
                                {" - "}
                                {item.endTime}

                              </td>

                              <td className="px-5 py-4">

                                {item.status ===
                                  "APPROVED" && (
                                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    Approved
                                  </span>
                                )}

                                {item.status ===
                                  "PENDING" && (
                                  <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                                    Pending
                                  </span>
                                )}

                                {item.status ===
                                  "REJECTED" && (
                                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                    Rejected
                                  </span>
                                )}

                              </td>

                              <td className="px-5 py-4">

                                {item.status ===
                                "PENDING" ? (

                                  <div className="flex justify-end gap-2">

                                    <button
                                      onClick={() =>
                                        updateAvailability(
                                          item.id,
                                          "APPROVED"
                                        )
                                      }
                                      disabled={
                                        updatingAvailability ===
                                        item.id
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                    >

                                      {updatingAvailability ===
                                      item.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      )}

                                      Approve

                                    </button>

                                    <button
                                      onClick={() =>
                                        updateAvailability(
                                          item.id,
                                          "REJECTED"
                                        )
                                      }
                                      disabled={
                                        updatingAvailability ===
                                        item.id
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >

                                      <XCircle className="h-3.5 w-3.5" />

                                      Reject

                                    </button>

                                  </div>

                                ) : (

                                  <div className="text-right text-xs text-gray-400">
                                    Already reviewed
                                  </div>

                                )}

                              </td>

                            </tr>
                          );
                        }
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* =================================================
                EXISTING TIMETABLE ACTIONS
            ================================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Existing Timetable
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your previously generated timetable
                    is loaded from the database.
                  </p>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <button
                    onClick={() =>
                      setViewOpen(true)
                    }
                    disabled={
                      selectedTimetable.length ===
                      0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <Eye className="h-4 w-4" />

                    View Timetable

                  </button>

                  <button
                    onClick={
                      generateTimetable
                    }
                    disabled={
                      generating ||
                      !selectedAcademicYearId ||
                      !selectedTermId ||
                      !selectedClassroomId
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >

                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}

                    Regenerate

                  </button>

                </div>

              </div>

            </section>

            {/* =================================================
                TIMETABLE PREVIEW
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">

                <div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">

                    {selectedClassroom?.name ||
                      "Class"}{" "}
                    Timetable

                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">

                    {selectedAcademicYear?.name ||
                      "Academic Year"}

                    {" • "}

                    {selectedTerm?.name ||
                      "Term"}

                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      setViewOpen(true)
                    }
                    disabled={
                      selectedTimetable.length ===
                      0
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >

                    <Eye className="h-4 w-4" />

                    View

                  </button>

                </div>

              </div>

              {/* =================================================
                  PUBLICATION STATUS
              ================================================= */}

              <div className="border-b border-gray-200 p-5 dark:border-gray-800">

                <div
                  className={`rounded-xl border p-4 ${
                    publicationIsPublished
                      ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20"
                      : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40"
                  }`}
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-start gap-3">

                      <div
                        className={`rounded-lg p-2 ${
                          publicationIsPublished
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >

                        {publicationIsPublished ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Clock3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}

                      </div>

                      <div>

                        <h3 className="font-semibold text-gray-900 dark:text-white">

                          {publicationIsPublished
                            ? "Timetable Published"
                            : "Timetable Not Published"}

                        </h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">

                          {publicationIsPublished
                            ? `Published on ${formatDate(
                                selectedPublication?.publishedAt
                              )}`
                            : "The timetable has not been published yet."}

                        </p>

                      </div>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        publicationIsPublished
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >

                      {publicationIsPublished
                        ? "PUBLISHED"
                        : "NOT PUBLISHED"}

                    </span>

                  </div>

                </div>

              </div>

              {/* =================================================
                  DESKTOP TIMETABLE
              ================================================= */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full border-collapse">

                  <thead>

                    <tr>

                      <th className="w-40 border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
                        Day
                      </th>

                      {TIME_SLOTS.map(
                        (slot) => (
                          <th
                            key={
                              slot.startTime
                            }
                            className="border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm font-semibold text-gray-700 last:border-r-0 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
                          >
                            {slot.startTime}
                            {" - "}
                            {slot.endTime}
                          </th>
                        )
                      )}

                    </tr>

                  </thead>

                  <tbody>

                    {DAYS.map(
                      (day) => (
                        <tr
                          key={day.value}
                        >

                          <td className="border-b border-r border-gray-200 bg-gray-50 px-4 py-5 text-sm font-semibold text-gray-800 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
                            {day.label}
                          </td>

                          {TIME_SLOTS.map(
                            (slot) => {

                              const entry =
                                getEntry(
                                  day.value,
                                  slot.startTime
                                );

                              return (
                                <td
                                  key={`${day.value}-${slot.startTime}`}
                                  className="border-b border-r border-gray-200 p-3 last:border-r-0 dark:border-gray-800"
                                >

                                  {entry ? (

                                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-900/50 dark:bg-purple-950/20">

                                      <p className="font-semibold text-purple-900 dark:text-purple-200">

                                        {entry.subject
                                          ?.name ||
                                          "Subject"}

                                      </p>

                                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">

                                        {getTeacherName(
                                          entry.teacher
                                        )}

                                      </p>

                                      {entry.room && (
                                        <p className="mt-1 text-xs text-gray-500">
                                          Room:{" "}
                                          {
                                            entry.room
                                          }
                                        </p>
                                      )}

                                    </div>

                                  ) : (

                                    <div className="py-4 text-center text-xs text-gray-400">
                                      Free
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

              {/* =================================================
                  MOBILE TIMETABLE
              ================================================= */}

              <div className="md:hidden">

                <div className="flex gap-2 overflow-x-auto border-b border-gray-200 p-3 dark:border-gray-800">

                  {DAYS.map(
                    (day) => (
                      <button
                        key={day.value}
                        onClick={() =>
                          setActiveDay(
                            day.value
                          )
                        }
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                          activeDay ===
                          day.value
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  )}

                </div>

                <div className="space-y-3 p-4">

                  {TIME_SLOTS.map(
                    (slot) => {

                      const entry =
                        getEntry(
                          activeDay,
                          slot.startTime
                        );

                      return (
                        <div
                          key={
                            slot.startTime
                          }
                          className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                        >

                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">

                            <Clock className="h-4 w-4" />

                            {slot.startTime}
                            {" - "}
                            {slot.endTime}

                          </div>

                          {entry ? (

                            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">

                              <p className="font-semibold text-purple-900 dark:text-purple-200">

                                {entry.subject
                                  ?.name ||
                                  "Subject"}

                              </p>

                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">

                                {getTeacherName(
                                  entry.teacher
                                )}

                              </p>

                              {entry.room && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Room:{" "}
                                  {
                                    entry.room
                                  }
                                </p>
                              )}

                            </div>

                          ) : (

                            <p className="text-sm text-gray-400">
                              Free period
                            </p>

                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* =================================================
                  BREAKS
              ================================================= */}

              <div className="border-t border-gray-200 p-5 dark:border-gray-800">

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/40">

                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      10:00 - 10:15
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Break
                    </p>

                  </div>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/40">

                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      12:00 - 12:30
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Break
                    </p>

                  </div>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/40">

                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      14:30 - 15:00
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Revision / Class Activity
                    </p>

                  </div>

                </div>

              </div>

            </section>

          </div>

        </main>

      </div>

      {/* =====================================================
          VIEW TIMETABLE POPUP
      ===================================================== */}

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

            {/* =================================================
                POPUP HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  View Timetable
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">

                  {selectedClassroom?.name ||
                    "Class"}

                  {" • "}

                  {selectedTerm?.name ||
                    "Term"}

                  {" • "}

                  {selectedAcademicYear?.name ||
                    "Academic Year"}

                </p>

              </div>

              <button
                onClick={() =>
                  setViewOpen(false)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >

                <X className="h-5 w-5" />

              </button>

            </div>

            {/* =================================================
                POPUP BODY
            ================================================= */}

            <div className="max-h-[calc(95vh-90px)] overflow-auto p-5">

              {/* =================================================
                  POPUP ACTIONS
              ================================================= */}

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  {publicationIsPublished ? (

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">

                      <CheckCircle2 className="h-3.5 w-3.5" />

                      Published

                    </span>

                  ) : (

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">

                      <Clock3 className="h-3.5 w-3.5" />

                      Not Published

                    </span>

                  )}

                </div>

                <div className="flex flex-wrap gap-2">

                  {/* DOWNLOAD */}

                  <button
                    onClick={
                      handleDownloadTimetable
                    }
                    disabled={
                      selectedTimetable.length ===
                      0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >

                    <Download className="h-4 w-4" />

                    Download Timetable

                  </button>

                  {/* PUBLISH / UNPUBLISH */}

                  <button
                    onClick={() =>
                      publishTimetable(
                        publicationIsPublished
                          ? "unpublish"
                          : "publish"
                      )
                    }
                    disabled={
                      publishing ||
                      selectedTimetable.length ===
                        0
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                      publicationIsPublished
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >

                    {publishing ? (

                      <Loader2 className="h-4 w-4 animate-spin" />

                    ) : publicationIsPublished ? (

                      <X className="h-4 w-4" />

                    ) : (

                      <Send className="h-4 w-4" />

                    )}

                    {publicationIsPublished
                      ? "Unpublish Timetable"
                      : "Publish Timetable"}

                  </button>

                </div>

              </div>

              {/* =================================================
                  TIMETABLE TABLE
              ================================================= */}

              {selectedTimetable.length ===
              0 ? (

                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">

                  <CalendarDays className="mx-auto h-10 w-10 text-gray-400" />

                  <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">
                    No timetable found
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    No timetable records exist
                    for this class, term and
                    academic year.
                  </p>

                </div>

              ) : (

                <>

                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">

                    <table className="min-w-full border-collapse">

                      <thead>

                        <tr>

                          <th className="border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Day
                          </th>

                          {TIME_SLOTS.map(
                            (slot) => (
                              <th
                                key={
                                  slot.startTime
                                }
                                className="border-b border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              >
                                {slot.startTime}
                                {" - "}
                                {slot.endTime}
                              </th>
                            )
                          )}

                        </tr>

                      </thead>

                      <tbody>

                        {DAYS.map(
                          (day) => (

                            <tr
                              key={
                                day.value
                              }
                            >

                              <td className="border-b border-r border-gray-200 bg-gray-50 px-4 py-5 text-sm font-semibold text-gray-800 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {day.label}
                              </td>

                              {TIME_SLOTS.map(
                                (slot) => {

                                  const entry =
                                    getEntry(
                                      day.value,
                                      slot.startTime
                                    );

                                  return (
                                    <td
                                      key={`${day.value}-${slot.startTime}`}
                                      className="border-b border-gray-200 p-3 dark:border-gray-800"
                                    >

                                      {entry ? (

                                        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">

                                          <p className="font-semibold text-purple-900 dark:text-purple-200">
                                            {entry.subject
                                              ?.name ||
                                              "Subject"}
                                          </p>

                                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            {getTeacherName(
                                              entry.teacher
                                            )}
                                          </p>

                                          {entry.room && (
                                            <p className="mt-1 text-xs text-gray-500">
                                              Room:{" "}
                                              {
                                                entry.room
                                              }
                                            </p>
                                          )}

                                        </div>

                                      ) : (

                                        <div className="py-4 text-center text-xs text-gray-400">
                                          Free
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

                  {/* =================================================
                      BREAKS
                  ================================================= */}

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">

                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        10:00 - 10:15
                      </p>

                      <p className="text-xs text-gray-500">
                        Break
                      </p>

                    </div>

                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">

                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        12:00 - 12:30
                      </p>

                      <p className="text-xs text-gray-500">
                        Break
                      </p>

                    </div>

                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">

                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        14:30 - 15:00
                      </p>

                      <p className="text-xs text-gray-500">
                        Revision / Class Activity
                      </p>

                    </div>

                  </div>

                </>

              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}