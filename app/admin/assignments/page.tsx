"use client";

import { useEffect, useState } from "react";
import { Plus, UserRound, BookOpen, School, Trash2, X } from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Teacher = {
  id: string;
  name: string;
};

type Section = {
  id: string;
  name: "ANGLOPHONE" | "FRANCOPHONE";
};

type Classroom = {
  id: string;
  name: string;
  sectionId: string;
  section: Section;
};

type Subject = {
  id: string;
  name: string;
  code?: string;
  coefficient: number;
  classroomId: string;
};

type Assignment = {
  id: string;
  teacher: string;
  subject: string;
  className: string;
  section: string;
  academicYear: string;
};

export default function AssignmentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [error, setError] = useState("");

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [form, setForm] = useState({
    teacherId: "",
    sectionId: "",
    classroomId: "",
    subjectId: "",
    academicYear: "2026/2027",
  });

  // ============================================================
  // SAFE JSON RESPONSE
  // ============================================================

  async function parseResponse(response: Response) {
    const text = await response.text();

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error(
        "Invalid server response:",
        text.substring(0, 500)
      );

      throw new Error(
        "The server returned an invalid response."
      );
    }
  }

  // ============================================================
  // LOAD SECTIONS
  // ============================================================

  async function loadSections() {
    try {
      setLoadingSections(true);
      setError("");

      const response = await fetch("/api/admin/sections", {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load sections"
        );
      }

      setSections(
        Array.isArray(data.sections)
          ? data.sections
          : []
      );
    } catch (error) {
      console.error("LOAD SECTIONS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load sections."
      );

      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  }

  // ============================================================
  // LOAD TEACHERS
  // ============================================================

  async function loadTeachers() {
    try {
      setLoadingTeachers(true);
      setError("");

      const response = await fetch("/api/admin/teachers", {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load teachers"
        );
      }

      setTeachers(
        Array.isArray(data.teachers)
          ? data.teachers
          : []
      );
    } catch (error) {
      console.error("LOAD TEACHERS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load teachers."
      );

      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }

  // ============================================================
  // LOAD CLASSES
  // ============================================================

  async function loadClasses(sectionId: string) {
    if (!sectionId) {
      setClasses([]);
      return;
    }

    try {
      setLoadingClasses(true);
      setError("");

      const response = await fetch(
        `/api/admin/classes?sectionId=${encodeURIComponent(
          sectionId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load classes"
        );
      }

      setClasses(
        Array.isArray(data.classes)
          ? data.classes
          : []
      );
    } catch (error) {
      console.error("LOAD CLASSES ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load classes."
      );

      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }

  // ============================================================
  // LOAD SUBJECTS
  // ============================================================

  async function loadSubjects(classroomId: string) {
    if (!classroomId) {
      setSubjects([]);
      return;
    }

    try {
      setLoadingSubjects(true);
      setError("");

      const response = await fetch(
        `/api/admin/subjects?classroomId=${encodeURIComponent(
          classroomId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load subjects"
        );
      }

      setSubjects(
        Array.isArray(data.subjects)
          ? data.subjects
          : []
      );
    } catch (error) {
      console.error("LOAD SUBJECTS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load subjects."
      );

      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadSections();
    loadTeachers();
  }, []);

  // ============================================================
  // WHEN SECTION CHANGES
  // ============================================================

  useEffect(() => {
    if (form.sectionId) {
      loadClasses(form.sectionId);
    } else {
      setClasses([]);
    }

    setForm((previous) => ({
      ...previous,
      classroomId: "",
      subjectId: "",
    }));

    setSubjects([]);
  }, [form.sectionId]);

  // ============================================================
  // WHEN CLASS CHANGES
  // ============================================================

  useEffect(() => {
    if (form.classroomId) {
      loadSubjects(form.classroomId);
    } else {
      setSubjects([]);
    }

    setForm((previous) => ({
      ...previous,
      subjectId: "",
    }));
  }, [form.classroomId]);

  // ============================================================
  // OPEN FORM
  // ============================================================

  function openForm() {
    setError("");

    setForm({
      teacherId: "",
      sectionId: "",
      classroomId: "",
      subjectId: "",
      academicYear: "2026/2027",
    });

    setClasses([]);
    setSubjects([]);

    setShowForm(true);
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (
      !form.teacherId ||
      !form.sectionId ||
      !form.classroomId ||
      !form.subjectId ||
      !form.academicYear
    ) {
      setError("Please complete all fields.");
      return;
    }

    const teacher = teachers.find(
      (item) => item.id === form.teacherId
    );

    const classroom = classes.find(
      (item) => item.id === form.classroomId
    );

    const subject = subjects.find(
      (item) => item.id === form.subjectId
    );

    const section = sections.find(
      (item) => item.id === form.sectionId
    );

    if (!teacher || !classroom || !subject || !section) {
      setError("Invalid assignment selection.");
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      teacher: teacher.name,
      subject: subject.name,
      className: classroom.name,
      section: section.name,
      academicYear: form.academicYear,
    };

    setAssignments((previous) => [
      ...previous,
      newAssignment,
    ]);

    setShowForm(false);

    setForm({
      teacherId: "",
      sectionId: "",
      classroomId: "",
      subjectId: "",
      academicYear: "2026/2027",
    });

    setClasses([]);
    setSubjects([]);
  }

  // ============================================================
  // REMOVE ASSIGNMENT
  // ============================================================

  function removeAssignment(id: string) {
    if (!window.confirm("Remove this teacher assignment?")) {
      return;
    }

    setAssignments((previous) =>
      previous.filter(
        (assignment) => assignment.id !== id
      )
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">

      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN */}
      <div className="min-h-screen lg:ml-72">

        {/* NAVBAR */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">

          <div className="mx-auto max-w-7xl">

            {/* HEADER */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Teacher Assignments
                </h1>

                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  Assign teachers to classes and subjects.
                </p>
              </div>

              <button
                type="button"
                onClick={openForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800"
              >
                <Plus size={18} />
                Assign Teacher
              </button>

            </div>

            {/* GLOBAL ERROR */}
            {error && !showForm && (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
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

            {/* ==================================================
                FORM POPUP
            ================================================== */}

            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">

                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:bg-gray-900">

                  {/* HEADER */}
                  <div className="flex items-center justify-between">

                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Assign Teacher
                      </h2>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Select the section, class, subject and teacher.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setError("");
                      }}
                      className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <X size={20} />
                    </button>

                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                  >

                    {/* SECTION */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Section
                      </label>

                      <select
                        value={form.sectionId}
                        onChange={(e) =>
                          setForm((previous) => ({
                            ...previous,
                            sectionId: e.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none transition focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">
                          {loadingSections
                            ? "Loading sections..."
                            : "Select section"}
                        </option>

                        {sections.map((section) => (
                          <option
                            key={section.id}
                            value={section.id}
                          >
                            {section.name === "ANGLOPHONE"
                              ? "Anglophone"
                              : "Francophone"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CLASS */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Class
                      </label>

                      <select
                        value={form.classroomId}
                        onChange={(e) =>
                          setForm((previous) => ({
                            ...previous,
                            classroomId: e.target.value,
                          }))
                        }
                        required
                        disabled={
                          !form.sectionId ||
                          loadingClasses
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">
                          {!form.sectionId
                            ? "Select section first"
                            : loadingClasses
                            ? "Loading classes..."
                            : classes.length === 0
                            ? "No classes found"
                            : "Select class"}
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

                    {/* SUBJECT */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subject
                      </label>

                      <select
                        value={form.subjectId}
                        onChange={(e) =>
                          setForm((previous) => ({
                            ...previous,
                            subjectId: e.target.value,
                          }))
                        }
                        required
                        disabled={
                          !form.classroomId ||
                          loadingSubjects
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">
                          {!form.classroomId
                            ? "Select class first"
                            : loadingSubjects
                            ? "Loading subjects..."
                            : subjects.length === 0
                            ? "No subjects found"
                            : "Select subject"}
                        </option>

                        {subjects.map((subject) => (
                          <option
                            key={subject.id}
                            value={subject.id}
                          >
                            {subject.name}
                            {subject.coefficient
                              ? ` — Coef. ${subject.coefficient}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* TEACHER */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Teacher
                      </label>

                      <select
                        value={form.teacherId}
                        onChange={(e) =>
                          setForm((previous) => ({
                            ...previous,
                            teacherId: e.target.value,
                          }))
                        }
                        required
                        disabled={loadingTeachers}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">
                          {loadingTeachers
                            ? "Loading teachers..."
                            : teachers.length === 0
                            ? "No teachers found"
                            : "Select teacher"}
                        </option>

                        {teachers.map((teacher) => (
                          <option
                            key={teacher.id}
                            value={teacher.id}
                          >
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ACADEMIC YEAR */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Academic Year
                      </label>

                      <select
                        value={form.academicYear}
                        onChange={(e) =>
                          setForm((previous) => ({
                            ...previous,
                            academicYear: e.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="2026/2027">
                          2026/2027
                        </option>

                        <option value="2027/2028">
                          2027/2028
                        </option>
                      </select>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex justify-end gap-3 pt-2">

                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setError("");
                        }}
                        className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800"
                      >
                        Assign Teacher
                      </button>

                    </div>

                  </form>

                </div>
              </div>
            )}

            {/* ==================================================
                ASSIGNMENT LIST
            ================================================== */}

            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

              <div className="border-b border-gray-200 p-6 dark:border-gray-800">

                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Current Assignments
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {assignments.length} teacher assignment
                  {assignments.length !== 1 ? "s" : ""}
                </p>

              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">

                {assignments.map((assignment) => (

                  <div
                    key={assignment.id}
                    className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                        <UserRound size={20} />
                      </div>

                      <div>

                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {assignment.teacher}
                        </h3>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {assignment.academicYear}
                        </p>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-3">

                      <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        <BookOpen size={16} />
                        {assignment.subject}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                        <School size={16} />
                        {assignment.className}
                      </span>

                      <span className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                        {assignment.section}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeAssignment(assignment.id)
                      }
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={17} />
                      Remove
                    </button>

                  </div>

                ))}

              </div>

              {assignments.length === 0 && (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No teacher assignments yet.
                </div>
              )}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}