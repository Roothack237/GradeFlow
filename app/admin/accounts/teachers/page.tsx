
"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type TeacherAssignment = {
  id: string;

  subject: {
    id: string;
    name: string;
    code: string;
  } | null;

  classroom: {
    id: string;
    name: string;

    section: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  assignments: TeacherAssignment[];
};
export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  // Form
 const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  sectionId: "",
  classroomId: "",
  subjectId: "",
});

const [sections, setSections] = useState<
  { id: string; name: string }[]
>([]);

const [classrooms, setClassrooms] = useState<
  { id: string; name: string; sectionId: string }[]
>([]);

const [subjects, setSubjects] = useState<
  { id: string; name: string; code: string }[]
>([]);

  // =========================================================
  // FETCH TEACHERS
  // =========================================================

  const fetchTeachers = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/teachers");

      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }

      const data = await response.json();

      setTeachers(
        Array.isArray(data)
          ? data
          : data.teachers ?? data.data ?? []
      );
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchFormData();
  }, []);

const fetchFormData = async () => {
  try {
    const [sectionsRes, classesRes, subjectsRes] =
      await Promise.all([
        fetch("/api/admin/sections"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/subjects"),
      ]);

    const sectionsData = await sectionsRes.json();
    const classesData = await classesRes.json();
    const subjectsData = await subjectsRes.json();

    setSections(
      Array.isArray(sectionsData)
        ? sectionsData
        : sectionsData.sections ?? sectionsData.data ?? []
    );

    setClassrooms(
      Array.isArray(classesData)
        ? classesData
        : classesData.classes ?? classesData.data ?? []
    );

    setSubjects(
      Array.isArray(subjectsData)
        ? subjectsData
        : subjectsData.subjects ?? subjectsData.data ?? []
    );
  } catch (error) {
    console.error("Failed to load form data:", error);
  }
};

 // =========================================================
// OPEN ADD TEACHER MODAL
// =========================================================
const openModal = () => {
  setEditingTeacher(null);

  setFormData({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    sectionId: "",
    classroomId: "",
    subjectId: "",
  });

  setShowModal(true);
};

const openEditModal = (teacher: Teacher) => {
  setEditingTeacher(teacher);

  const firstAssignment = teacher.assignments?.[0];

  setFormData({
    firstName: teacher.firstName || "",
    lastName: teacher.lastName || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    dateOfBirth: "",
    sectionId: firstAssignment?.classroom?.section?.id || "",
    classroomId: firstAssignment?.classroom?.id || "",
    subjectId: firstAssignment?.subject?.id || "",
  });

  setShowModal(true);
};

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
  if (submitting) return;

  setShowModal(false);
  setEditingTeacher(null);

  setFormData({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    sectionId: "",
    classroomId: "",
    subjectId: "",
  });
};
  // =========================================================
  // HANDLE FORM CHANGE
  // =========================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

// =========================================================
// DELETE TEACHER
// =========================================================
const handleDelete = async (teacher: Teacher) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `/api/admin/teachers/${teacher.id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to delete teacher"
      );
    }

    // Remove teacher immediately from the UI
    setTeachers((previousTeachers) =>
      previousTeachers.filter(
        (item) => item.id !== teacher.id
      )
    );

    alert("Teacher deleted successfully.");
  } catch (error) {
    console.error("TEACHER DELETE FAILED:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to delete teacher"
    );
  }
};

  // =========================================================
  // SUBMIT TEACHER
  // =========================================================

  const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  try {
    setSubmitting(true);

    const isEditing = !!editingTeacher;

    const url = isEditing
      ? `/api/admin/teachers/${editingTeacher.id}`
      : "/api/admin/teachers";

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          (isEditing
            ? "Failed to update teacher"
            : "Failed to create teacher")
      );
    }

    // Close modal
    setShowModal(false);
    setEditingTeacher(null);

    // Reset form
  setFormData({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    sectionId: "",
    classroomId: "",
    subjectId: "",
  });


    // Refresh teachers
    await fetchTeachers();
  } catch (error) {
    console.error(
      editingTeacher
        ? "TEACHER UPDATE FAILED:"
        : "TEACHER CREATION FAILED:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : editingTeacher
        ? "Failed to update teacher"
        : "Failed to create teacher"
    );
  } finally {
    setSubmitting(false);
  }
};
  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="lg:ml-72">

        {/* NAVBAR */}
        <Navbar title="Teachers" />

        <main className="p-5 sm:p-8">

          {/* ================================================= */}
          {/* PAGE HEADER */}
          {/* ================================================= */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teachers
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage all teachers.
              </p>
            </div>

            {/* ADD TEACHER BUTTON */}
            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Teacher
            </button>

          </div>

          {/* ================================================= */}
          {/* TEACHERS TABLE */}
          {/* ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left text-sm">

                {/* TABLE HEADER */}
                <thead className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">

                  <tr>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Section
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Classes
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Subjects
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Phone
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>

                  </tr>

                </thead>

                {/* TABLE BODY */}
                <tbody className="divide-y dark:divide-gray-800">

                  {/* LOADING */}
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        Loading teachers...
                      </td>
                    </tr>

                  ) : teachers.length === 0 ? (

                    /* EMPTY */
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        No teachers found.
                      </td>
                    </tr>

                  ) : (

                    /* TEACHERS */
                    teachers.map((teacher) => {

                      const assignments =
                        teacher.assignments ?? [];

                      // Get unique sections
                      const sections = [
                        ...new Set(
                          assignments
                            .map(
                              (assignment) =>
                                assignment.section?.name
                            )
                            .filter(Boolean)
                        ),
                      ];

                      // Get unique classes
                      const classes = [
                        ...new Set(
                          assignments
                            .map(
                              (assignment) =>
                                assignment.classroom?.name
                            )
                            .filter(Boolean)
                        ),
                      ];

                      // Get unique subjects
                      const subjects = [
                        ...new Set(
                          assignments
                            .map(
                              (assignment) =>
                                assignment.subject?.name
                            )
                            .filter(Boolean)
                        ),
                      ];

                      return (
                        <tr
                          key={teacher.id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >

                          {/* NAME */}
                          <td className="px-6 py-5">

                            <div className="font-semibold text-gray-900 dark:text-white">
                              {teacher.fullname || `${teacher.firstName} ${teacher.lastName}`}
                            </div>

                          </td>

                          {/* EMAIL */}
                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {teacher.email}
                          </td>

                          {/* SECTION */}
                          <td className="px-6 py-5">

                            {sections.length > 0 ? (

                              <div className="flex flex-wrap gap-2">

                                {sections.map((section) => (
                                  <span
                                    key={section}
                                    className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  >
                                    {section}
                                  </span>
                                ))}

                              </div>

                            ) : (

                              <span className="text-gray-400">
                                Not assigned
                              </span>

                            )}

                          </td>

                          {/* CLASSES */}
                          <td className="px-6 py-5">

                            {classes.length > 0 ? (

                              <div className="flex flex-wrap gap-2">

                                {classes.map((className) => (
                                  <span
                                    key={className}
                                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  >
                                    {className}
                                  </span>
                                ))}

                              </div>

                            ) : (

                              <span className="text-gray-400">
                                Not assigned
                              </span>

                            )}

                          </td>

                          {/* SUBJECTS */}
                          <td className="px-6 py-5">

                            {subjects.length > 0 ? (

                              <div className="flex flex-wrap gap-2">

                                {subjects.map((subject) => (
                                  <span
                                    key={subject}
                                    className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  >
                                    {subject}
                                  </span>
                                ))}

                              </div>

                            ) : (

                              <span className="text-gray-400">
                                Not assigned
                              </span>

                            )}

                          </td>

                          {/* PHONE */}
                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {teacher.phone || "—"}
                          </td>

                         {/* ACTIONS */}
                                <td className="px-6 py-5">
                                <div className="flex items-center gap-2">

                                    {/* EDIT */}
                                    <button
                                    type="button"
                                    onClick={() => openEditModal(teacher)}
                                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                    >
                                    Edit
                                    </button>

                                    {/* DELETE */}
                                    <button
                                    type="button"
                                    onClick={() => handleDelete(teacher)}
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                                    >
                                    Delete
                                    </button>

                                </div>
                                </td>

                        </tr>
                      );
                    })

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </main>

      </div>

      {/* ===================================================== */}
      {/* ADD TEACHER MODAL */}
      {/* ===================================================== */}

      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

            {/* ================================================= */}
            {/* MODAL HEADER */}
            {/* ================================================= */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTeacher ? "Edit Teacher" : "Add Teacher"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {editingTeacher
                        ? "Update the teacher's information."
                        : "Create a new teacher account."}
                    </p>

              </div>

              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                ×
              </button>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <form
  onSubmit={handleSubmit}
  className="space-y-5 p-6"
>
  {/* FIRST + LAST NAME */}
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

    {/* FIRST NAME */}
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        First Name
      </label>

      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        required
        placeholder="Enter first name"
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>

    {/* LAST NAME */}
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Last Name
      </label>

      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        required
        placeholder="Enter last name"
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>

  </div>

  {/* EMAIL */}
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Email
    </label>

    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      required
      placeholder="teacher@example.com"
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
    />
  </div>

  {/* PHONE */}
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Phone
    </label>

    <input
      type="tel"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      placeholder="Enter phone number"
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
    />
  </div>

  {/* DATE OF BIRTH */}
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Date of Birth
    </label>

    <input
      type="date"
      name="dateOfBirth"
      value={formData.dateOfBirth}
      onChange={handleChange}
      required
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
    />
  </div>

  {/* SECTION + CLASS */}
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

    {/* SECTION */}
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Section
      </label>

      <select
        name="sectionId"
        value={formData.sectionId}
        onChange={(e) => {
          setFormData((previous) => ({
            ...previous,
            sectionId: e.target.value,
            classroomId: "",
          }));
        }}
        required
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
    </div>

    {/* CLASS */}
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Class
      </label>

      <select
        name="classroomId"
        value={formData.classroomId}
        onChange={handleChange}
        required
        disabled={!formData.sectionId}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <option value="">
          {formData.sectionId
            ? "Select class"
            : "Select section first"}
        </option>

        {classrooms
          .filter(
            (classroom) =>
              classroom.sectionId === formData.sectionId
          )
          .map((classroom) => (
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

  {/* SUBJECT */}
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Subject
    </label>

    <select
      name="subjectId"
      value={formData.subjectId}
      onChange={handleChange}
      required
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
    >
      <option value="">
        Select subject
      </option>

      {subjects.map((subject) => (
        <option
          key={subject.id}
          value={subject.id}
        >
          {subject.name} ({subject.code})
        </option>
      ))}
    </select>
  </div>

  {/* FORM ACTIONS */}
  <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">

    {/* CANCEL */}
    <button
      type="button"
      onClick={closeModal}
      disabled={submitting}
      className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      Cancel
    </button>

    {/* SUBMIT */}
    <button
      type="submit"
      disabled={submitting}
      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting
        ? editingTeacher
          ? "Updating..."
          : "Creating..."
        : editingTeacher
        ? "Update Teacher"
        : "Add Teacher"}
    </button>

  </div>
</form>

          </div>

        </div>

      )}

    </div>
  );
}

