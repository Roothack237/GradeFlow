"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  ClipboardCheck,
  Loader2,
  Search,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";

// =========================================================
// TYPES
// =========================================================

type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
};

type Section = {
  id: string;
  name: string;
};

type Classroom = {
  id: string;
  name: string;
  section?: Section;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type Sequence = {
  id: string;
  name: string;
  order: number;
};

type Term = {
  id: string;
  name: string;
  order: number;
  sequences: Sequence[];
};

type AcademicYear = {
  id: string;
  name: string;
  terms: Term[];
};

type Mark = {
  id: string;
  ca1: number;
  ca2: number;
  exam: number;
  average: number;
  grade?: string | null;
  remark?: string | null;

  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    classroom: Classroom;
  };

  subject: Subject;

  teacher: Teacher;

  sequence: {
    id: string;
    name: string;
    order: number;

    term: {
      id: string;
      name: string;
      order: number;

      academicYear: {
        id: string;
        name: string;
      };
    };
  };
};

// =========================================================
// PAGE
// =========================================================

export default function TeacherRecordsPage() {
  // =========================================================
  // RECORDS
  // =========================================================

  const [marks, setMarks] = useState<Mark[]>([]);

  // =========================================================
  // FILTER DATA
  // =========================================================

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // =========================================================
  // FILTER VALUES
  // =========================================================

  const [teacherId, setTeacherId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [sequenceId, setSequenceId] = useState("");

  // =========================================================
  // UI
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD RECORDS
  // =========================================================

  async function loadRecords() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (teacherId) {
        params.set("teacherId", teacherId);
      }

      if (classroomId) {
        params.set("classroomId", classroomId);
      }

      if (subjectId) {
        params.set("subjectId", subjectId);
      }

      if (academicYearId) {
        params.set("academicYearId", academicYearId);
      }

      if (termId) {
        params.set("termId", termId);
      }

      if (sequenceId) {
        params.set("sequenceId", sequenceId);
      }

      const response = await fetch(
        `/api/admin/teacher-records?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load teacher records."
        );
      }

      setMarks(data.marks ?? []);

      setTeachers(data.filters?.teachers ?? []);

      setClassrooms(data.filters?.classrooms ?? []);

      setSubjects(data.filters?.subjects ?? []);

      setAcademicYears(data.filters?.academicYears ?? []);
    } catch (err) {
      console.error("TEACHER RECORDS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load teacher records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [
    teacherId,
    classroomId,
    subjectId,
    academicYearId,
    termId,
    sequenceId,
  ]);

  // =========================================================
  // SECTIONS
  // =========================================================

  const sections = useMemo<Section[]>(() => {
    const sectionMap = new Map<string, Section>();

    classrooms.forEach((classroom) => {
      if (classroom.section) {
        sectionMap.set(
          classroom.section.id,
          classroom.section
        );
      }
    });

    return Array.from(sectionMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [classrooms]);

  // =========================================================
  // CLASSROOMS FILTERED BY SECTION
  // =========================================================

  const filteredClassrooms = useMemo(() => {
    if (!sectionId) {
      return classrooms;
    }

    return classrooms.filter(
      (classroom) =>
        classroom.section?.id === sectionId
    );
  }, [classrooms, sectionId]);

  // =========================================================
  // SELECTED ACADEMIC YEAR
  // =========================================================

  const selectedYear = useMemo(() => {
    return academicYears.find(
      (year) => year.id === academicYearId
    );
  }, [academicYears, academicYearId]);

  // =========================================================
  // TERMS
  // =========================================================

  const terms = useMemo(() => {
    if (!selectedYear) {
      return [];
    }

    return [...selectedYear.terms].sort(
      (a, b) => a.order - b.order
    );
  }, [selectedYear]);

  // =========================================================
  // SELECTED TERM
  // =========================================================

  const selectedTerm = useMemo(() => {
    return terms.find(
      (term) => term.id === termId
    );
  }, [terms, termId]);

  // =========================================================
  // SEQUENCES
  // =========================================================

  const sequences = useMemo(() => {
    if (!selectedTerm) {
      return [];
    }

    return [...selectedTerm.sequences].sort(
      (a, b) => a.order - b.order
    );
  }, [selectedTerm]);

  // =========================================================
  // SELECTED SEQUENCE
  // =========================================================

  const selectedSequence = useMemo(() => {
    return sequences.find(
      (sequence) => sequence.id === sequenceId
    );
  }, [sequences, sequenceId]);

  // =========================================================
  // SELECTED SECTION
  // =========================================================

  const selectedSection = useMemo(() => {
    return sections.find(
      (section) => section.id === sectionId
    );
  }, [sections, sectionId]);

  // =========================================================
  // SECTION CHANGE
  // =========================================================

  function handleSectionChange(value: string) {
    setSectionId(value);

    // A class belongs to a section.
    setClassroomId("");
  }

  // =========================================================
  // ACADEMIC YEAR CHANGE
  // =========================================================

  function handleAcademicYearChange(value: string) {
    setAcademicYearId(value);

    // Term belongs to academic year.
    setTermId("");

    // Sequence belongs to term.
    setSequenceId("");
  }

  // =========================================================
  // TERM CHANGE
  // =========================================================

  function handleTermChange(value: string) {
    setTermId(value);

    // Sequence belongs to term.
    setSequenceId("");
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  function clearFilters() {
    setTeacherId("");
    setSectionId("");
    setClassroomId("");
    setSubjectId("");
    setAcademicYearId("");
    setTermId("");
    setSequenceId("");
  }

  // =========================================================
  // FILTER MARKS
  //
  // We apply every selected filter again on the client.
  //
  // IMPORTANT:
  // When sequenceId is selected, only marks belonging
  // to that exact sequence are displayed.
  // =========================================================

  const filteredMarks = useMemo(() => {
    let result = [...marks];

    // Teacher
    if (teacherId) {
      result = result.filter(
        (mark) => mark.teacher.id === teacherId
      );
    }

    // Section
    if (sectionId) {
      result = result.filter(
        (mark) =>
          mark.student.classroom.section?.id ===
          sectionId
      );
    }

    // Classroom
    if (classroomId) {
      result = result.filter(
        (mark) =>
          mark.student.classroom.id ===
          classroomId
      );
    }

    // Subject
    if (subjectId) {
      result = result.filter(
        (mark) =>
          mark.subject.id === subjectId
      );
    }

    // Academic Year
    if (academicYearId) {
      result = result.filter(
        (mark) =>
          mark.sequence.term.academicYear.id ===
          academicYearId
      );
    }

    // Term
    if (termId) {
      result = result.filter(
        (mark) =>
          mark.sequence.term.id === termId
      );
    }

    // Sequence
    if (sequenceId) {
      result = result.filter(
        (mark) =>
          mark.sequence.id === sequenceId
      );
    }

    // Sort students alphabetically.
    result.sort((a, b) => {
      const lastNameComparison =
        a.student.lastName.localeCompare(
          b.student.lastName
        );

      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }

      return a.student.firstName.localeCompare(
        b.student.firstName
      );
    });

    return result;
  }, [
    marks,
    teacherId,
    sectionId,
    classroomId,
    subjectId,
    academicYearId,
    termId,
    sequenceId,
  ]);

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminNavbar />

        <main className="min-h-[calc(100vh-5rem)] p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">

            {/* HEADER */}

            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  <ClipboardCheck size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Teacher Records
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View the marks submitted by teachers.
                  </p>
                </div>
              </div>
            </div>

            {/* FILTERS */}

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="mb-5 flex items-center gap-3">
                <Search
                  size={20}
                  className="text-purple-600"
                />

                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select the teacher and academic information.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* TEACHER */}

                <FilterSelect
                  label={`Teacher (${teachers.length})`}
                  value={teacherId}
                  onChange={setTeacherId}
                >
                  <option value="">
                    All Teachers
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {teacher.fullName} —{" "}
                      {teacher.teacherId}
                    </option>
                  ))}
                </FilterSelect>

                {/* SECTION */}

                <FilterSelect
                  label={`Section (${sections.length})`}
                  value={sectionId}
                  onChange={handleSectionChange}
                >
                  <option value="">
                    All Sections
                  </option>

                  {sections.map((section) => (
                    <option
                      key={section.id}
                      value={section.id}
                    >
                      {section.name}
                    </option>
                  ))}
                </FilterSelect>

                {/* CLASS */}

                <FilterSelect
                  label={`Class (${filteredClassrooms.length})`}
                  value={classroomId}
                  onChange={setClassroomId}
                >
                  <option value="">
                    All Classes
                  </option>

                  {filteredClassrooms.map((classroom) => (
                    <option
                      key={classroom.id}
                      value={classroom.id}
                    >
                      {classroom.name}
                      {classroom.section
                        ? ` — ${classroom.section.name}`
                        : ""}
                    </option>
                  ))}
                </FilterSelect>

                {/* SUBJECT */}

                <FilterSelect
                  label={`Subject (${subjects.length})`}
                  value={subjectId}
                  onChange={setSubjectId}
                >
                  <option value="">
                    All Subjects
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name} —{" "}
                      {subject.code}
                    </option>
                  ))}
                </FilterSelect>

                {/* ACADEMIC YEAR */}

                <FilterSelect
                  label={`Academic Year (${academicYears.length})`}
                  value={academicYearId}
                  onChange={handleAcademicYearChange}
                >
                  <option value="">
                    All Academic Years
                  </option>

                  {academicYears.map((year) => (
                    <option
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                    </option>
                  ))}
                </FilterSelect>

                {/* TERM */}

                <FilterSelect
                  label={
                    academicYearId
                      ? `Term (${terms.length})`
                      : "Term"
                  }
                  value={termId}
                  onChange={handleTermChange}
                  disabled={!academicYearId}
                >
                  {!academicYearId ? (
                    <option value="">
                      Select an academic year first
                    </option>
                  ) : (
                    <>
                      <option value="">
                        All Terms
                      </option>

                      {terms.map((term) => (
                        <option
                          key={term.id}
                          value={term.id}
                        >
                          {term.name}
                        </option>
                      ))}
                    </>
                  )}
                </FilterSelect>

                {/* SEQUENCE */}

                <FilterSelect
                  label={
                    termId
                      ? `Sequence (${sequences.length})`
                      : "Sequence"
                  }
                  value={sequenceId}
                  onChange={setSequenceId}
                  disabled={!termId}
                >
                  {!termId ? (
                    <option value="">
                      Select a term first
                    </option>
                  ) : (
                    <>
                      <option value="">
                        All Sequences
                      </option>

                      {sequences.map((sequence) => (
                        <option
                          key={sequence.id}
                          value={sequence.id}
                        >
                          {sequence.name}
                        </option>
                      ))}
                    </>
                  )}
                </FilterSelect>
              </div>

              {/* CURRENT SELECTION */}

              {(teacherId ||
                sectionId ||
                classroomId ||
                subjectId ||
                academicYearId ||
                termId ||
                sequenceId) && (
                <div className="mt-5 rounded-xl bg-purple-50 p-4 dark:bg-purple-950/20">

                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                    Current Selection
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-700 dark:text-gray-300">

                    {teacherId && (
                      <SelectionBadge>
                        Teacher:{" "}
                        {
                          teachers.find(
                            (teacher) =>
                              teacher.id === teacherId
                          )?.fullName
                        }
                      </SelectionBadge>
                    )}

                    {sectionId && (
                      <SelectionBadge>
                        Section:{" "}
                        {selectedSection?.name}
                      </SelectionBadge>
                    )}

                    {classroomId && (
                      <SelectionBadge>
                        Class:{" "}
                        {
                          classrooms.find(
                            (classroom) =>
                              classroom.id ===
                              classroomId
                          )?.name
                        }
                      </SelectionBadge>
                    )}

                    {subjectId && (
                      <SelectionBadge>
                        Subject:{" "}
                        {
                          subjects.find(
                            (subject) =>
                              subject.id === subjectId
                          )?.name
                        }
                      </SelectionBadge>
                    )}

                    {academicYearId && (
                      <SelectionBadge>
                        Academic Year:{" "}
                        {selectedYear?.name}
                      </SelectionBadge>
                    )}

                    {termId && (
                      <SelectionBadge>
                        Term:{" "}
                        {selectedTerm?.name}
                      </SelectionBadge>
                    )}

                    {sequenceId && (
                      <SelectionBadge>
                        Sequence:{" "}
                        {selectedSequence?.name}
                      </SelectionBadge>
                    )}
                  </div>
                </div>
              )}

              {/* CLEAR */}

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Clear Filters
              </button>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* CONTENT */}

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                  <Loader2
                    size={32}
                    className="animate-spin text-purple-700"
                  />

                  <p className="text-sm text-gray-500">
                    Loading teacher records...
                  </p>
                </div>
              </div>
            ) : (
              <MarksTable
                marks={filteredMarks}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// =========================================================
// FILTER SELECT
// =========================================================

function FilterSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900 dark:disabled:text-gray-600"
      >
        {children}
      </select>
    </div>
  );
}

// =========================================================
// SELECTION BADGE
// =========================================================

function SelectionBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm dark:bg-gray-900 dark:text-purple-300">
      {children}
    </span>
  );
}

// =========================================================
// MARKS TABLE
// =========================================================

function MarksTable({
  marks,
}: {
  marks: Mark[];
}) {
  if (marks.length === 0) {
    return (
      <EmptyState
        message="No First Sequence marks have been recorded for the selected filters."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

      {/* HEADER */}

      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Student First Sequence Marks
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {marks.length} student
              {marks.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            {marks[0]?.sequence.name}
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">

          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                Student Name
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                First Sequence Mark
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

            {marks.map((mark) => (
              <tr
                key={mark.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >

                {/* STUDENT NAME */}

                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {mark.student.firstName}{" "}
                    {mark.student.lastName}
                  </p>
                </td>

                {/* FIRST SEQUENCE MARK */}

                <td className="px-6 py-4 text-center">
                  <span className="inline-flex min-w-[70px] justify-center rounded-lg bg-purple-100 px-4 py-2 text-lg font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {mark.average}
                  </span>
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">

      <ClipboardCheck
        size={40}
        className="mx-auto text-gray-300 dark:text-gray-700"
      />

      <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">
        {message}
      </p>
    </div>
  );
}