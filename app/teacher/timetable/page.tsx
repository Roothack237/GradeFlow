"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Eye,
  Loader2,
  User,
  X,
} from "lucide-react";

import TeacherSidebar from "@/components/teacher/TeacherSidebar";

// ============================================================
// TYPES
// ============================================================

type Section = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
  order: number;
  academicYearId: string;
  academicYearName: string;
  isActive?: boolean;
};

type Classroom = {
  id: string;
  name: string;
  sectionId: string;
  sectionName: string;
  academicYearId: string;
  academicYearName: string;
  isActive?: boolean;
};

type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
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
    section?: {
      id: string;
      name: string;
    } | null;
  } | null;

  subject?: Subject | null;

  teacher?: Teacher | null;

  academicYear?: {
    id: string;
    name: string;
  } | null;

  term?: {
    id: string;
    name: string;
    order: number;
  } | null;
};

type Publication = {
  id: string;

  termId: string;
  term: string;
  termOrder: number;

  classroomId: string;
  classroom: string;

  sectionId: string;
  section: string;

  academicYearId: string;
  academicYear: string;

  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";

  publishedAt: string | null;
  notes: string | null;
};

// ============================================================
// CONSTANTS
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function formatSectionName(section?: string | null) {
  if (!section) {
    return "Section";
  }

  if (section === "ANGLOPHONE") {
    return "Anglophone";
  }

  if (section === "FRANCOPHONE") {
    return "Francophone";
  }

  return section;
}

function formatPublishedDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
}

function getEntryDay(entry: TimetableEntry) {
  return String(entry.day).toUpperCase();
}

// ============================================================
// PAGE
// ============================================================

export default function TeacherTimetablePage() {
  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ==========================================================
  // GENERAL DATA
  // ==========================================================

  const [teacher, setTeacher] = useState<Teacher | null>(null);

  const [publications, setPublications] = useState<Publication[]>([]);

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  const [sections, setSections] = useState<Section[]>([]);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [terms, setTerms] = useState<Term[]>([]);

  // ==========================================================
  // LOADING / ERRORS
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // SELECTED PUBLISHED CLASS
  // ==========================================================

  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);

  // ==========================================================
  // PERSONAL TIMETABLE POPUP
  // ==========================================================

  const [personalModalOpen, setPersonalModalOpen] =
    useState(false);

  const [personalSectionId, setPersonalSectionId] = useState("");

  const [personalTermId, setPersonalTermId] = useState("");

  const [personalClassroomId, setPersonalClassroomId] =
    useState("");

  const [personalTimetable, setPersonalTimetable] =
    useState<TimetableEntry[]>([]);

  const [personalInfo, setPersonalInfo] = useState<{
    section?: Section;
    classroom?: {
      id: string;
      name: string;
    };
    term?: {
      id: string;
      name: string;
    };
  } | null>(null);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teacher/timetable", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load timetable."
        );
      }

      setTeacher(data?.teacher ?? null);

      setPublications(
        Array.isArray(data?.publications)
          ? data.publications
          : []
      );

      setTimetable(
        Array.isArray(data?.timetable)
          ? data.timetable
          : []
      );

      setSections(
        Array.isArray(data?.sections)
          ? data.sections
          : []
      );

      setClassrooms(
        Array.isArray(data?.classrooms)
          ? data.classrooms
          : []
      );

      setTerms(
        Array.isArray(data?.terms)
          ? data.terms
          : []
      );
    } catch (err) {
      console.error("TEACHER TIMETABLE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // SELECTED PUBLISHED TIMETABLE ENTRIES
  // ==========================================================

  const selectedPublishedEntries = useMemo(() => {
    if (!selectedPublication) {
      return [];
    }

    return timetable.filter(
      (entry) =>
        entry.classroomId === selectedPublication.classroomId &&
        entry.termId === selectedPublication.termId
    );
  }, [timetable, selectedPublication]);

  // ==========================================================
  // OPEN PUBLISHED TIMETABLE
  // ==========================================================

  const openPublishedTimetable = (
    publication: Publication
  ) => {
    setSelectedPublication(publication);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // OPEN PERSONAL MODAL
  // ==========================================================

  const openPersonalModal = () => {
    setError("");
    setPersonalTimetable([]);
    setPersonalInfo(null);

    if (selectedPublication) {
      setPersonalSectionId(selectedPublication.sectionId);
      setPersonalTermId(selectedPublication.termId);
      setPersonalClassroomId(
        selectedPublication.classroomId
      );
    } else {
      if (sections.length > 0) {
        setPersonalSectionId(sections[0].id);
      }

      if (terms.length > 0) {
        const activeTerm =
          terms.find((term) => term.isActive) || terms[0];

        setPersonalTermId(activeTerm.id);
      }

      if (classrooms.length > 0) {
        setPersonalClassroomId(classrooms[0].id);
      }
    }

    setPersonalModalOpen(true);
  };

  // ==========================================================
  // CLASSROOMS FOR SELECTED SECTION
  // ==========================================================

  const personalClassrooms = useMemo(() => {
    if (!personalSectionId) {
      return classrooms;
    }

    return classrooms.filter(
      (classroom) =>
        classroom.sectionId === personalSectionId
    );
  }, [classrooms, personalSectionId]);

  // ==========================================================
  // TERMS FOR SELECTED CLASS
  // ==========================================================

  const personalTerms = useMemo(() => {
    if (!personalClassroomId) {
      return terms;
    }

    const classroom = classrooms.find(
      (item) => item.id === personalClassroomId
    );

    if (!classroom) {
      return terms;
    }

    return terms.filter(
      (term) =>
        term.academicYearId === classroom.academicYearId
    );
  }, [
    terms,
    classrooms,
    personalClassroomId,
  ]);

  // ==========================================================
  // WHEN SECTION CHANGES
  // ==========================================================

  useEffect(() => {
    if (!personalModalOpen) {
      return;
    }

    const validClass = classrooms.find(
      (classroom) =>
        classroom.id === personalClassroomId &&
        classroom.sectionId === personalSectionId
    );

    if (!validClass) {
      const firstClass = classrooms.find(
        (classroom) =>
          classroom.sectionId === personalSectionId
      );

      setPersonalClassroomId(firstClass?.id || "");
    }
  }, [
    personalSectionId,
    classrooms,
    personalClassroomId,
    personalModalOpen,
  ]);

  // ==========================================================
  // WHEN CLASS CHANGES
  // ==========================================================

  useEffect(() => {
    if (!personalModalOpen) {
      return;
    }

    const classroom = classrooms.find(
      (item) => item.id === personalClassroomId
    );

    if (!classroom) {
      return;
    }

    const validTerm = terms.find(
      (term) =>
        term.id === personalTermId &&
        term.academicYearId === classroom.academicYearId
    );

    if (!validTerm) {
      const firstTerm = terms.find(
        (term) =>
          term.academicYearId === classroom.academicYearId
      );

      setPersonalTermId(firstTerm?.id || "");
    }
  }, [
    personalClassroomId,
    classrooms,
    terms,
    personalTermId,
    personalModalOpen,
  ]);

  // ==========================================================
  // LOAD PERSONAL TIMETABLE
  // ==========================================================

  const loadPersonalTimetable = async () => {
    if (!personalSectionId) {
      setError("Please select a section.");
      return;
    }

    if (!personalTermId) {
      setError("Please select a term.");
      return;
    }

    if (!personalClassroomId) {
      setError("Please select a class.");
      return;
    }

    try {
      setLoadingPersonal(true);
      setError("");

      const params = new URLSearchParams();

      params.set("personal", "true");
      params.set("termId", personalTermId);
      params.set("classroomId", personalClassroomId);

      const response = await fetch(
        `/api/teacher/timetable?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load personal timetable."
        );
      }

      setPersonalTimetable(
        Array.isArray(data?.timetable)
          ? data.timetable
          : []
      );

      setPersonalInfo({
        section: data?.section
          ? {
              id: data.section.id,
              name: data.section.name,
            }
          : undefined,

        classroom: data?.classroom
          ? {
              id: data.classroom.id,
              name: data.classroom.name,
            }
          : undefined,

        term: data?.term
          ? {
              id: data.term.id,
              name: data.term.name,
            }
          : undefined,
      });

      setPersonalModalOpen(false);
    } catch (err) {
      console.error(
        "PERSONAL TIMETABLE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load personal timetable."
      );
    } finally {
      setLoadingPersonal(false);
    }
  };

  // ==========================================================
  // FIND ENTRY
  // ==========================================================

  const getPublishedEntry = (
    day: string,
    startTime: string
  ) => {
    return selectedPublishedEntries.find(
      (entry) =>
        getEntryDay(entry) === day &&
        entry.startTime === startTime
    );
  };

  const getPersonalEntry = (
    day: string,
    startTime: string
  ) => {
    return personalTimetable.find(
      (entry) =>
        getEntryDay(entry) === day &&
        entry.startTime === startTime
    );
  };

  // ==========================================================
  // SELECTED PERSONAL CLASS
  // ==========================================================

  const selectedPersonalClass = classrooms.find(
    (classroom) =>
      classroom.id === personalClassroomId
  );

  // ==========================================================
  // TIMETABLE TABLE
  // ==========================================================

  const renderTimetableTable = (
    entries: TimetableEntry[],
    personal = false
  ) => {
    if (entries.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />

          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No timetable available
          </h3>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {personal
              ? "You have no timetable period for this class and term."
              : "No timetable records are available for this published class."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-[900px] w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                Day
              </th>

              {TIME_SLOTS.map((slot) => (
                <th
                  key={`${slot.startTime}-${slot.endTime}`}
                  className="border-b border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
                >
                  <div>{slot.startTime}</div>

                  <div className="text-xs font-normal text-gray-400">
                    to {slot.endTime}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {DAYS.map((day) => (
              <tr key={day.value}>
                <td className="border-b border-r border-gray-200 bg-gray-50 px-4 py-5 font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {day.label}
                </td>

                {TIME_SLOTS.map((slot) => {
                  const entry = personal
                    ? getPersonalEntry(
                        day.value,
                        slot.startTime
                      )
                    : getPublishedEntry(
                        day.value,
                        slot.startTime
                      );

                  return (
                    <td
                      key={`${day.value}-${slot.startTime}`}
                      className="h-28 border-b border-gray-200 p-3 align-top dark:border-gray-800"
                    >
                      {entry ? (
                        <div className="h-full min-h-[90px] rounded-xl bg-purple-50 p-3 dark:bg-purple-950/30">
                          <div className="font-semibold text-purple-800 dark:text-purple-300">
                            {entry.subject?.name ||
                              "Subject"}
                          </div>

                          {entry.subject?.code && (
                            <div className="mt-1 text-xs text-purple-500 dark:text-purple-400">
                              {entry.subject.code}
                            </div>
                          )}

                          {!personal &&
                            entry.teacher?.fullName && (
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {entry.teacher.fullName}
                              </div>
                            )}

                          {personal && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                              <User className="h-3.5 w-3.5" />
                              My class
                            </div>
                          )}

                          {entry.room && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Room: {entry.room}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[90px] items-center justify-center text-xs text-gray-400">
                          Free
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TeacherSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading timetable...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="lg:pl-">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* HEADER */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-950/40">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Timetable
                  </h1>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View published class timetables and your
                    personal teaching timetable.
                  </p>
                </div>
              </div>

              {teacher && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Welcome,{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {teacher.fullName}
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={openPersonalModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              <User className="h-4 w-4" />

              View Personal Timetable
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* PUBLISHED CLASS TIMETABLES */}

          <section className="mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Published Class Timetables
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a class to view its published timetable.
              </p>
            </div>

            {publications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />

                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  No published timetables
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  The administrator has not published a timetable
                  available to you yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {publications.map((publication) => {
                  const isSelected =
                    selectedPublication?.id ===
                    publication.id;

                  return (
                    <button
                      key={publication.id}
                      onClick={() =>
                        openPublishedTimetable(
                          publication
                        )
                      }
                      className={`group rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${
                        isSelected
                          ? "border-purple-500 ring-2 ring-purple-100 dark:ring-purple-950"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-950/40">
                          <CalendarDays className="h-5 w-5 text-purple-600" />
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                          Published
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                        {publication.classroom} Timetable
                      </h3>

                      <div className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium">
                            Section:
                          </span>{" "}
                          {formatSectionName(
                            publication.section
                          )}
                        </div>

                        <div>
                          <span className="font-medium">
                            Term:
                          </span>{" "}
                          {publication.term}
                        </div>

                        <div>
                          <span className="font-medium">
                            Academic Year:
                          </span>{" "}
                          {publication.academicYear}
                        </div>
                      </div>

                      {publication.publishedAt && (
                        <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800">
                          Published{" "}
                          {formatPublishedDate(
                            publication.publishedAt
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-600">
                        <Eye className="h-4 w-4" />

                        View Timetable

                        <ChevronDown className="ml-auto h-4 w-4 -rotate-90 transition group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* SELECTED PUBLISHED TIMETABLE */}

          {selectedPublication && (
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedPublication.classroom} Timetable
                    </h2>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      Published
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formatSectionName(
                      selectedPublication.section
                    )}{" "}
                    • {selectedPublication.term} •{" "}
                    {selectedPublication.academicYear}
                  </p>
                </div>

                <button
                  onClick={openPersonalModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300"
                >
                  <User className="h-4 w-4" />

                  View Personal Timetable
                </button>
              </div>

              <div className="p-5">
                <div className="mb-5 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <Clock3 className="h-4 w-4" />
                    08:00 - 14:30
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    Monday - Friday
                  </div>
                </div>

                {renderTimetableTable(
                  selectedPublishedEntries
                )}
              </div>
            </section>
          )}

          {/* PERSONAL TIMETABLE */}

          {personalInfo && (
            <section className="mt-6 rounded-2xl border border-purple-200 bg-white shadow-sm dark:border-purple-900/50 dark:bg-gray-900">
              <div className="border-b border-purple-100 p-5 dark:border-purple-900/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />

                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        My Personal Timetable
                      </h2>
                    </div>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatSectionName(
                        personalInfo.section?.name
                      )}{" "}
                      • {personalInfo.classroom?.name} •{" "}
                      {personalInfo.term?.name}
                    </p>
                  </div>

                  <button
                    onClick={openPersonalModal}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <ChevronDown className="h-4 w-4" />

                    Change Selection
                  </button>
                </div>
              </div>

              <div className="p-5">
                {renderTimetableTable(
                  personalTimetable,
                  true
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ======================================================
          PERSONAL TIMETABLE MODAL
      ====================================================== */}

      {personalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  View Personal Timetable
                </h2>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select your section, term and class.
                </p>
              </div>

              <button
                onClick={() =>
                  setPersonalModalOpen(false)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-5">

              {/* SECTION */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Section
                </label>

                <div className="relative">
                  <select
                    value={personalSectionId}
                    onChange={(event) =>
                      setPersonalSectionId(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                  >
                    <option value="">
                      Select section
                    </option>

                    {sections.map((section) => (
                      <option
                        key={section.id}
                        value={section.id}
                      >
                        {formatSectionName(
                          section.name
                        )}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* TERM */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Term
                </label>

                <div className="relative">
                  <select
                    value={personalTermId}
                    onChange={(event) =>
                      setPersonalTermId(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                  >
                    <option value="">
                      Select term
                    </option>

                    {personalTerms.map((term) => (
                      <option
                        key={term.id}
                        value={term.id}
                      >
                        {term.name} —{" "}
                        {term.academicYearName}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* CLASS */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Class
                </label>

                <div className="relative">
                  <select
                    value={personalClassroomId}
                    onChange={(event) =>
                      setPersonalClassroomId(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                  >
                    <option value="">
                      Select class
                    </option>

                    {personalClassrooms.map(
                      (classroom) => (
                        <option
                          key={classroom.id}
                          value={classroom.id}
                        >
                          {classroom.name}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                {selectedPersonalClass && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {selectedPersonalClass.academicYearName}
                  </p>
                )}
              </div>

              {/* INFORMATION */}

              <div className="rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
                Your personal timetable will show only
                the periods where <strong>you</strong> are
                assigned to teach the selected class.
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-gray-800">
              <button
                onClick={() =>
                  setPersonalModalOpen(false)
                }
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={loadPersonalTimetable}
                disabled={
                  loadingPersonal ||
                  !personalSectionId ||
                  !personalTermId ||
                  !personalClassroomId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingPersonal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}

                View Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}