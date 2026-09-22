"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";

// =========================================================
// TYPES
// =========================================================

type Teacher = {
  id: string;
  teacherId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

type Section = {
  id: string;
  name: string;
};

type Classroom = {
  id: string;
  name: string;
  sectionId: string;
  section: Section;
  academicYear?: {
    id: string;
    name: string;
  };
};

type Subject = {
  id: string;
  name: string;
  code?: string;
  coefficient: number;
};

type Assignment = {
  id: string;
  teacher: {
    id: string;
    teacherId?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
    coefficient: number;
  };
  classroom: {
    id: string;
    name: string;
    section: {
      id: string;
      name: string;
    };
  };
};

// =========================================================
// CONSTANTS
// =========================================================

const ACADEMIC_YEAR = "2026/2027";

const CLASS_ORDER = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth Arts",
  "Lower Sixth Science",
  "Upper Sixth Arts",
  "Upper Sixth Science",
];

// =========================================================
// PAGE
// =========================================================

export default function TeacherAssignmentsPage() {
  // -------------------------------------------------------
  // DATA
  // -------------------------------------------------------

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // -------------------------------------------------------
  // ASSIGNMENT FORM
  // -------------------------------------------------------

  const [showForm, setShowForm] = useState(false);

  const [selectedSectionId, setSelectedSectionId] =
    useState("");

  const [selectedTeacherId, setSelectedTeacherId] =
    useState("");

  const [selectedClassIds, setSelectedClassIds] =
    useState<string[]>([]);

  const [selectedSubjectsByClass, setSelectedSubjectsByClass] =
    useState<Record<string, string[]>>({});

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        teachersResponse,
        sectionsResponse,
        classroomsResponse,
        subjectsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch("/api/admin/teachers", {
          cache: "no-store",
        }),

        fetch("/api/admin/sections", {
          cache: "no-store",
        }),

        fetch(
          `/api/admin/classes?academicYear=${encodeURIComponent(
            ACADEMIC_YEAR
          )}`,
          {
            cache: "no-store",
          }
        ),

        fetch("/api/admin/subjects", {
          cache: "no-store",
        }),

        fetch("/api/admin/teacher-assignments", {
          cache: "no-store",
        }),
      ]);

      // -------------------------------------------------------
      // TEACHERS
      // -------------------------------------------------------

      if (!teachersResponse.ok) {
        throw new Error("Failed to load teachers");
      }

      const teachersData = await teachersResponse.json();

      const loadedTeachers = Array.isArray(teachersData)
        ? teachersData
        : teachersData.teachers || [];

      setTeachers(loadedTeachers);

      // -------------------------------------------------------
      // SECTIONS
      // -------------------------------------------------------

      if (!sectionsResponse.ok) {
        throw new Error("Failed to load sections");
      }

      const sectionsData = await sectionsResponse.json();

      const loadedSections = Array.isArray(sectionsData)
        ? sectionsData
        : sectionsData.sections || [];

      setSections(loadedSections);

      // -------------------------------------------------------
      // CLASSROOMS
      // -------------------------------------------------------

      if (!classroomsResponse.ok) {
        throw new Error("Failed to load classes");
      }

      const classroomsData = await classroomsResponse.json();

      const loadedClassrooms = Array.isArray(classroomsData)
        ? classroomsData
        : classroomsData.classes ||
          classroomsData.classrooms ||
          [];

      setClassrooms(loadedClassrooms);

      // -------------------------------------------------------
      // SUBJECTS
      // -------------------------------------------------------

      if (!subjectsResponse.ok) {
        throw new Error("Failed to load subjects");
      }

      const subjectsData = await subjectsResponse.json();

      const loadedSubjects = Array.isArray(subjectsData)
        ? subjectsData
        : subjectsData.subjects || [];

      setSubjects(loadedSubjects);

      // -------------------------------------------------------
      // ASSIGNMENTS
      // -------------------------------------------------------

      if (!assignmentsResponse.ok) {
        throw new Error(
          "Failed to load teacher assignments"
        );
      }

      const assignmentsData =
        await assignmentsResponse.json();

      const loadedAssignments = Array.isArray(
        assignmentsData
      )
        ? assignmentsData
        : assignmentsData.assignments || [];

      setAssignments(loadedAssignments);
    } catch (err) {
      console.error("LOAD ASSIGNMENT DATA ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load assignment data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // TEACHER NAME
  // =========================================================

  function getTeacherName(teacher: Teacher) {
    if (teacher.fullName) {
      return teacher.fullName;
    }

    const fullName =
      `${teacher.firstName || ""} ${
        teacher.lastName || ""
      }`.trim();

    return (
      fullName ||
      teacher.teacherId ||
      "Unknown teacher"
    );
  }

  // =========================================================
  // SELECTED SECTION
  // =========================================================

  const selectedSection = useMemo(() => {
    return sections.find(
      (section) => section.id === selectedSectionId
    );
  }, [sections, selectedSectionId]);

  // =========================================================
  // FILTER CLASSES BY SECTION
  // =========================================================

  const sectionClassrooms = useMemo(() => {
    if (!selectedSectionId) {
      return [];
    }

    const filtered = classrooms.filter(
      (classroom) =>
        classroom.sectionId === selectedSectionId
    );

    return [...filtered].sort((a, b) => {
      const indexA = CLASS_ORDER.indexOf(a.name);
      const indexB = CLASS_ORDER.indexOf(b.name);

      if (indexA === -1 && indexB === -1) {
        return a.name.localeCompare(b.name);
      }

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }, [classrooms, selectedSectionId]);

  // =========================================================
  // SELECT CLASS
  // =========================================================

  function toggleClass(classroomId: string) {
    setSelectedClassIds((current) => {
      if (current.includes(classroomId)) {
        setSelectedSubjectsByClass((subjects) => {
          const copy = { ...subjects };
          delete copy[classroomId];
          return copy;
        });

        return current.filter(
          (id) => id !== classroomId
        );
      }

      return [...current, classroomId];
    });
  }

  // =========================================================
  // SELECT ALL CLASSES
  // =========================================================

  function selectAllClasses() {
    const allIds = sectionClassrooms.map(
      (classroom) => classroom.id
    );

    setSelectedClassIds(allIds);
  }

  // =========================================================
  // CLEAR CLASSES
  // =========================================================

  function clearClasses() {
    setSelectedClassIds([]);
    setSelectedSubjectsByClass({});
  }

  // =========================================================
  // SELECT SUBJECT
  // =========================================================

  function toggleSubject(
    classroomId: string,
    subjectId: string
  ) {
    setSelectedSubjectsByClass((current) => {
      const existing =
        current[classroomId] || [];

      const updated = existing.includes(subjectId)
        ? existing.filter(
            (id) => id !== subjectId
          )
        : [...existing, subjectId];

      return {
        ...current,
        [classroomId]: updated,
      };
    });
  }

  // =========================================================
  // SELECT ALL SUBJECTS
  // =========================================================

  function selectAllSubjects(classroomId: string) {
    setSelectedSubjectsByClass((current) => ({
      ...current,
      [classroomId]: subjects.map(
        (subject) => subject.id
      ),
    }));
  }

  // =========================================================
  // CLEAR SUBJECTS
  // =========================================================

  function clearSubjects(classroomId: string) {
    setSelectedSubjectsByClass((current) => ({
      ...current,
      [classroomId]: [],
    }));
  }

  // =========================================================
  // OPEN FORM
  // =========================================================

  function openForm() {
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  // =========================================================
  // CLOSE FORM
  // =========================================================

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setSelectedSectionId("");
    setSelectedTeacherId("");
    setSelectedClassIds([]);
    setSelectedSubjectsByClass({});
    setError("");
  }

  // =========================================================
  // CHANGE SECTION
  // =========================================================

  function changeSection(sectionId: string) {
    setSelectedSectionId(sectionId);

    // Reset classes and subjects when section changes
    setSelectedClassIds([]);
    setSelectedSubjectsByClass({});
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedSectionId) {
      setError("Please select a section.");
      return;
    }

    if (!selectedTeacherId) {
      setError("Please select a teacher.");
      return;
    }

    if (selectedClassIds.length === 0) {
      setError("Please select at least one class.");
      return;
    }

    const missingSubjects = selectedClassIds.filter(
      (classroomId) =>
        !selectedSubjectsByClass[classroomId] ||
        selectedSubjectsByClass[classroomId].length ===
          0
    );

    if (missingSubjects.length > 0) {
      setError(
        "Please select at least one subject for every selected class."
      );
      return;
    }

    try {
      setSaving(true);

      let created = 0;
      let alreadyExists = 0;

      for (const classroomId of selectedClassIds) {
        const subjectIds =
          selectedSubjectsByClass[classroomId];

        const response = await fetch(
          "/api/admin/teacher-assignments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              teacherId: selectedTeacherId,
              classroomId,
              subjectIds,
            }),
          }
        );

        const data = await response.json();

        if (response.status === 409) {
          alreadyExists++;
          continue;
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to create teacher assignment."
          );
        }

        created += data.assignments?.length || 0;
      }

      await loadData();

      setShowForm(false);

      setSelectedSectionId("");
      setSelectedTeacherId("");
      setSelectedClassIds([]);
      setSelectedSubjectsByClass({});

      if (created > 0) {
        setSuccess(
          `${created} teacher assignment${
            created === 1 ? "" : "s"
          } created successfully.`
        );
      } else if (alreadyExists > 0) {
        setSuccess(
          "The selected assignments already exist."
        );
      }
    } catch (err) {
      console.error(
        "CREATE TEACHER ASSIGNMENTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create teacher assignments."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function deleteAssignment(id: string) {
    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/teacher-assignments",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to remove assignment."
        );
      }

      setAssignments((current) =>
        current.filter(
          (assignment) => assignment.id !== id
        )
      );

      setSuccess(
        "Teacher assignment removed successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove assignment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const teacherName =
        assignment.teacher.fullName ||
        `${assignment.teacher.firstName || ""} ${
          assignment.teacher.lastName || ""
        }`.trim();

      return (
        teacherName
          .toLowerCase()
          .includes(query) ||
        assignment.subject.name
          .toLowerCase()
          .includes(query) ||
        assignment.classroom.name
          .toLowerCase()
          .includes(query) ||
        assignment.classroom.section.name
          .toLowerCase()
          .includes(query)
      );
    });
  }, [assignments, search]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminNavbar />

        <main className="p-4 md:p-6 lg:p-8">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  <GraduationCap size={23} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Teacher Assignments
                  </h1>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage teachers, subjects and classes.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              <Plus size={18} />
              Assign Teacher
            </button>
          </div>

          {/* =====================================================
              ALERTS
          ====================================================== */}

          {error && !showForm && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
              <span>{success}</span>

              <button
                type="button"
                onClick={() => setSuccess("")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* =====================================================
              ASSIGN TEACHER MODAL
          ====================================================== */}

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

                {/* MODAL HEADER */}

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Assign Teacher
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Select a section, teacher, classes and subjects.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* MODAL BODY */}

                <form
                  onSubmit={handleSubmit}
                  className="overflow-y-auto p-6"
                >
                  {/* FORM ERROR */}

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  {/* =================================================
                      SECTION
                  ================================================== */}

                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      1. Section
                    </label>

                    <div className="relative">
                      <select
                        value={selectedSectionId}
                        onChange={(e) =>
                          changeSection(e.target.value)
                        }
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">
                          Select section
                        </option>

                        {sections.map((section) => (
                          <option
                            key={section.id}
                            value={section.id}
                          >
                            {section.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      TEACHER
                  ================================================== */}

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      2. Teacher
                    </label>

                    <div className="relative">
                      <UserRound
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        value={selectedTeacherId}
                        onChange={(e) =>
                          setSelectedTeacherId(
                            e.target.value
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">
                          Select teacher
                        </option>

                        {teachers.map((teacher) => (
                          <option
                            key={teacher.id}
                            value={teacher.id}
                          >
                            {getTeacherName(teacher)}
                            {teacher.teacherId
                              ? ` (${teacher.teacherId})`
                              : ""}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      CLASSES
                  ================================================== */}

                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          3. Classes
                        </label>

                        {selectedSection && (
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedSection.name} section
                          </p>
                        )}
                      </div>

                      {selectedSectionId &&
                        sectionClassrooms.length > 0 && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={selectAllClasses}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
                            >
                              Select all
                            </button>

                            <button
                              type="button"
                              onClick={clearClasses}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                    </div>

                    {!selectedSectionId ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                        <GraduationCap
                          size={30}
                          className="mx-auto mb-2 text-slate-400"
                        />

                        <p className="text-sm text-slate-500">
                          Select a section first to see its classes.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {sectionClassrooms.map(
                          (classroom) => {
                            const selected =
                              selectedClassIds.includes(
                                classroom.id
                              );

                            return (
                              <button
                                key={classroom.id}
                                type="button"
                                onClick={() =>
                                  toggleClass(
                                    classroom.id
                                  )
                                }
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                                  selected
                                    ? "border-purple-500 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/20"
                                    : "border-slate-200 hover:border-purple-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-purple-700 dark:hover:bg-slate-800"
                                }`}
                              >
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                    selected
                                      ? "border-purple-600 bg-purple-600 text-white"
                                      : "border-slate-300 dark:border-slate-600"
                                  }`}
                                >
                                  {selected && (
                                    <Check size={14} />
                                  )}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {classroom.name}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {classroom.section.name}
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {selectedSectionId &&
                      sectionClassrooms.length === 0 && (
                        <div className="rounded-xl border border-dashed border-red-300 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            No classes were found for this section.
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            The nine classes must exist as classroom
                            records for this academic year.
                          </p>
                        </div>
                      )}
                  </div>

                  {/* =================================================
                      SUBJECTS
                  ================================================== */}

                  {selectedClassIds.length > 0 && (
                    <div className="mb-6">
                      <div className="mb-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          4. Subjects
                        </label>

                        <p className="mt-1 text-xs text-slate-500">
                          Select one or more subjects for each class.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {selectedClassIds.map(
                          (classroomId) => {
                            const classroom =
                              classrooms.find(
                                (item) =>
                                  item.id ===
                                  classroomId
                              );

                            if (!classroom) {
                              return null;
                            }

                            const selectedSubjects =
                              selectedSubjectsByClass[
                                classroomId
                              ] || [];

                            return (
                              <div
                                key={classroomId}
                                className="rounded-xl border border-slate-200 dark:border-slate-800"
                              >
                                {/* CLASS TITLE */}

                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                  <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                      {classroom.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      {
                                        classroom.section
                                          .name
                                      }
                                    </p>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        selectAllSubjects(
                                          classroomId
                                        )
                                      }
                                      className="text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
                                    >
                                      All
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        clearSubjects(
                                          classroomId
                                        )
                                      }
                                      className="text-xs font-medium text-slate-500 hover:underline"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>

                                {/* SUBJECT LIST */}

                                <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {subjects.map(
                                    (subject) => {
                                      const checked =
                                        selectedSubjects.includes(
                                          subject.id
                                        );

                                      return (
                                        <button
                                          key={
                                            subject.id
                                          }
                                          type="button"
                                          onClick={() =>
                                            toggleSubject(
                                              classroomId,
                                              subject.id
                                            )
                                          }
                                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                                            checked
                                              ? "border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30"
                                              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                                          }`}
                                        >
                                          <div
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                              checked
                                                ? "border-purple-600 bg-purple-600 text-white"
                                                : "border-slate-300 dark:border-slate-600"
                                            }`}
                                          >
                                            {checked && (
                                              <Check
                                                size={13}
                                              />
                                            )}
                                          </div>

                                          <BookOpen
                                            size={16}
                                            className="shrink-0 text-slate-400"
                                          />

                                          <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                              {
                                                subject.name
                                              }
                                            </p>

                                            <p className="text-[10px] text-slate-500">
                                              {subject.code ||
                                                "No code"}{" "}
                                              • Coef.{" "}
                                              {
                                                subject.coefficient
                                              }
                                            </p>
                                          </div>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>

                                <div className="px-4 pb-3 text-xs text-slate-500">
                                  {selectedSubjects.length}{" "}
                                  subject
                                  {selectedSubjects.length ===
                                  1
                                    ? ""
                                    : "s"}{" "}
                                  selected
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      MODAL FOOTER
                  ================================================== */}

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Plus size={17} />
                          Assign Teacher
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =====================================================
              EXISTING ASSIGNMENTS
          ====================================================== */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2
                  size={22}
                  className="animate-spin"
                />
                Loading assignments...
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      Current Assignments
                    </h2>

                    <p className="text-sm text-slate-500">
                      {assignments.length} total assignment
                      {assignments.length === 1
                        ? ""
                        : "s"}
                    </p>
                  </div>

                  <div className="relative w-full md:w-80">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Search assignments..."
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Teacher
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Class
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Section
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-sm text-slate-500"
                        >
                          No teacher assignments found.
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map(
                        (assignment) => {
                          const teacherName =
                            assignment.teacher
                              .fullName ||
                            `${assignment.teacher.firstName || ""} ${
                              assignment.teacher.lastName || ""
                            }`.trim() ||
                            assignment.teacher
                              .teacherId ||
                            "Unknown";

                          return (
                            <tr
                              key={assignment.id}
                              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                    <UserRound
                                      size={16}
                                    />
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                      {teacherName}
                                    </p>

                                    {assignment.teacher
                                      .teacherId && (
                                      <p className="text-xs text-slate-500">
                                        {
                                          assignment
                                            .teacher
                                            .teacherId
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  {
                                    assignment.subject
                                      .name
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  {assignment.subject
                                    .code ||
                                    "No code"}{" "}
                                  • Coef.{" "}
                                  {
                                    assignment.subject
                                      .coefficient
                                  }
                                </p>
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                {
                                  assignment.classroom
                                    .name
                                }
                              </td>

                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {
                                    assignment
                                      .classroom
                                      .section.name
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  disabled={
                                    deletingId ===
                                    assignment.id
                                  }
                                  onClick={() =>
                                    deleteAssignment(
                                      assignment.id
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  {deletingId ===
                                  assignment.id ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={15}
                                    />
                                  )}

                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}