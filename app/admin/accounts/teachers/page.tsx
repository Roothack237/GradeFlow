"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

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
  fullName?: string;
  email: string;
  phone: string | null;
  gender?: string | null;
  dateOfBirth: string | null;
  assignments: TeacherAssignment[];
};

type AssignmentForm = {
  sectionId: string;
  classroomId: string;
  subjectId: string;
};

type Section = {
  id: string;
  name: string;
};

type Classroom = {
  id: string;
  name: string;
  sectionId: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

const emptyAssignment = (): AssignmentForm => ({
  sectionId: "",
  classroomId: "",
  subjectId: "",
});

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    console.error("API returned non-JSON response:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      response: text.slice(0, 500),
    });

    throw new Error(
      `API error (${response.status}) from ${response.url}`
    );
  }

  return response.json();
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTeacher, setEditingTeacher] =
    useState<Teacher | null>(null);

  // Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  });

  // Multiple teaching assignments
  const [assignments, setAssignments] = useState<AssignmentForm[]>([
    emptyAssignment(),
  ]);

  // Form data
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // =========================================================
  // FETCH TEACHERS
  // =========================================================

  const fetchTeachers = async () => {
  try {
    setLoading(true);

    const response = await fetch("/api/admin/teachers", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.error || "Failed to fetch teachers"
      );
    }

    setTeachers(
      Array.isArray(data)
        ? data
        : data.teachers ?? data.data ?? []
    );
  } catch (error) {
    console.error("FAILED TO LOAD TEACHERS:", error);

    setTeachers([]);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to load teachers"
    );
  } finally {
    setLoading(false);
  }
};

  // =========================================================
  // FETCH FORM DATA
  // =========================================================

  const fetchFormData = async () => {
  try {
    const [sectionsRes, classesRes, subjectsRes] =
      await Promise.all([
        fetch("/api/admin/sections", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }),

        fetch("/api/admin/classes", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }),

        fetch("/api/admin/subjects", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }),
      ]);

    console.log("FORM API STATUS:", {
      sections: {
        status: sectionsRes.status,
        ok: sectionsRes.ok,
        url: sectionsRes.url,
      },
      classes: {
        status: classesRes.status,
        ok: classesRes.ok,
        url: classesRes.url,
      },
      subjects: {
        status: subjectsRes.status,
        ok: subjectsRes.ok,
        url: subjectsRes.url,
      },
    });

    const sectionsData = await parseJsonResponse(sectionsRes);
    const classesData = await parseJsonResponse(classesRes);
    const subjectsData = await parseJsonResponse(subjectsRes);

    if (!sectionsRes.ok) {
      throw new Error(
        sectionsData?.error ||
          "Failed to fetch sections"
      );
    }

    if (!classesRes.ok) {
      throw new Error(
        classesData?.error ||
          "Failed to fetch classes"
      );
    }

    if (!subjectsRes.ok) {
      throw new Error(
        subjectsData?.error ||
          "Failed to fetch subjects"
      );
    }

    setSections(
      Array.isArray(sectionsData)
        ? sectionsData
        : sectionsData.sections ??
            sectionsData.data ??
            []
    );

    setClassrooms(
      Array.isArray(classesData)
        ? classesData
        : classesData.classes ??
            classesData.classrooms ??
            classesData.data ??
            []
    );

    setSubjects(
      Array.isArray(subjectsData)
        ? subjectsData
        : subjectsData.subjects ??
            subjectsData.data ??
            []
    );
  } catch (error) {
    console.error(
      "FAILED TO LOAD FORM DATA:",
      error
    );

    setSections([]);
    setClassrooms([]);
    setSubjects([]);
  }
};

  useEffect(() => {
    fetchTeachers();
    fetchFormData();
  }, []);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
    });

    setAssignments([emptyAssignment()]);
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openModal = () => {
    setEditingTeacher(null);
    resetForm();
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);

    setFormData({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      gender: teacher.gender || "",
      dateOfBirth: teacher.dateOfBirth
        ? teacher.dateOfBirth.substring(0, 10)
        : "",
    });

    const teacherAssignments =
      teacher.assignments?.map((assignment) => ({
        sectionId:
          assignment.classroom?.section?.id || "",
        classroomId:
          assignment.classroom?.id || "",
        subjectId:
          assignment.subject?.id || "",
      })) || [];

    setAssignments(
      teacherAssignments.length > 0
        ? teacherAssignments
        : [emptyAssignment()]
    );

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingTeacher(null);
    resetForm();
  };

  // =========================================================
  // HANDLE BASIC FORM CHANGE
  // =========================================================

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // HANDLE ASSIGNMENT CHANGE
  // =========================================================

  const handleAssignmentChange = (
    index: number,
    field: keyof AssignmentForm,
    value: string
  ) => {
    setAssignments((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // If section changes, reset class
      if (field === "sectionId") {
        updated[index].classroomId = "";
      }

      return updated;
    });
  };

  // =========================================================
  // ADD ASSIGNMENT
  // =========================================================

  const addAssignment = () => {
    setAssignments((previous) => [
      ...previous,
      emptyAssignment(),
    ]);
  };

  // =========================================================
  // REMOVE ASSIGNMENT
  // =========================================================

  const removeAssignment = (index: number) => {
    if (assignments.length === 1) return;

    setAssignments((previous) =>
      previous.filter(
        (_, assignmentIndex) =>
          assignmentIndex !== index
      )
    );
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

  const invalidAssignment = assignments.some(
    (assignment) =>
      !assignment.sectionId ||
      !assignment.classroomId ||
      !assignment.subjectId
  );

  if (invalidAssignment) {
    alert(
      "Please complete Section, Class and Subject for every assignment."
    );
    return;
  }

  // IMPORTANT: declare this outside try
  const isEditing = !!editingTeacher;

  try {
    setSubmitting(true);

    const url = isEditing
      ? `/api/admin/teachers/${editingTeacher!.id}`
      : "/api/admin/teachers";

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        assignments,
      }),
    });

    // Do NOT immediately call response.json()
    // First check what the server actually returned.
    const contentType = response.headers.get("content-type");

    let data: any = {};

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();

      console.error(
        "SERVER RETURNED NON-JSON:",
        text
      );

      throw new Error(
        `Server returned ${response.status} ${response.statusText} instead of JSON.`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          (isEditing
            ? "Failed to update teacher"
            : "Failed to create teacher")
      );
    }

    setShowModal(false);
    setEditingTeacher(null);
    resetForm();

    await fetchTeachers();

    alert(
      isEditing
        ? "Teacher updated successfully."
        : "Teacher created successfully."
    );
  } catch (error) {
    console.error(
      isEditing
        ? "TEACHER UPDATE FAILED:"
        : "TEACHER CREATION FAILED:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : isEditing
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
          {/* PAGE HEADER */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teachers
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage all teachers.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Teacher
            </button>
          </div>

          {/* TEACHERS TABLE */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Gender
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Sections
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

                <tbody className="divide-y dark:divide-gray-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        Loading teachers...
                      </td>
                    </tr>
                  ) : teachers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        No teachers found.
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher) => {
                      const teacherAssignments =
                        teacher.assignments ?? [];

                      const teacherSections = [
                        ...new Set(
                          teacherAssignments
                            .map(
                              (assignment) =>
                                assignment.classroom?.section?.name
                            )
                            .filter(Boolean)
                        ),
                      ];

                      const teacherClasses = [
                        ...new Set(
                          teacherAssignments
                            .map(
                              (assignment) =>
                                assignment.classroom?.name
                            )
                            .filter(Boolean)
                        ),
                      ];

                      const teacherSubjects = [
                        ...new Set(
                          teacherAssignments
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
                              {teacher.fullName ||
                                `${teacher.firstName} ${teacher.lastName}`}
                            </div>
                          </td>

                          {/* GENDER */}
                          <td className="px-6 py-5">
                            <span className="capitalize text-gray-600 dark:text-gray-400">
                              {teacher.gender || "—"}
                            </span>
                          </td>

                          {/* EMAIL */}
                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {teacher.email}
                          </td>

                          {/* SECTIONS */}
                          <td className="px-6 py-5">
                            {teacherSections.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {teacherSections.map(
                                  (section) => (
                                    <span
                                      key={section}
                                      className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                    >
                                      {section}
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                Not assigned
                              </span>
                            )}
                          </td>

                          {/* CLASSES */}
                          <td className="px-6 py-5">
                            {teacherClasses.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {teacherClasses.map(
                                  (className) => (
                                    <span
                                      key={className}
                                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    >
                                      {className}
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                Not assigned
                              </span>
                            )}
                          </td>

                          {/* SUBJECTS */}
                          <td className="px-6 py-5">
                            {teacherSubjects.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {teacherSubjects.map(
                                  (subject) => (
                                    <span
                                      key={subject}
                                      className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    >
                                      {subject}
                                    </span>
                                  )
                                )}
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
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(teacher)
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                              >
                                📝
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(teacher)
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                              >
                                ❌
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

      {/* TEACHER MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTeacher
                    ? "Edit Teacher"
                    : "Add Teacher"}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editingTeacher
                    ? "Update the teacher's information and teaching assignments."
                    : "Create a teacher account and assign their sections, classes and subjects."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              {/* PERSONAL INFORMATION */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Personal Information
                </h3>

                {/* FIRST + LAST NAME */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

                {/* EMAIL + GENDER */}
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
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

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">
                        Select gender
                      </option>

                      <option value="MALE">
                        Male
                      </option>

                      <option value="FEMALE">
                        Female
                      </option>

                      <option value="OTHER">
                        Other
                      </option>
                    </select>
                  </div>
                </div>

                {/* PHONE + DATE OF BIRTH */}
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                </div>
              </div>

              {/* TEACHING ASSIGNMENTS */}
              <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Teaching Assignments
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Add every section, class and subject taught by this teacher.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addAssignment}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    + Add Assignment
                  </button>
                </div>

                <div className="space-y-4">
                  {assignments.map(
                    (assignment, index) => {
                      const filteredClassrooms =
                        classrooms.filter(
                          (classroom) =>
                            classroom.sectionId ===
                            assignment.sectionId
                        );

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              Assignment {index + 1}
                            </h4>

                            {assignments.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeAssignment(index)
                                }
                                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* SECTION */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Section
                              </label>

                              <select
                                value={assignment.sectionId}
                                onChange={(e) =>
                                  handleAssignmentChange(
                                    index,
                                    "sectionId",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              >
                                <option value="">
                                  Select section
                                </option>

                                {sections.map(
                                  (section) => (
                                    <option
                                      key={section.id}
                                      value={section.id}
                                    >
                                      {section.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            {/* CLASS */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Class
                              </label>

                              <select
                                value={assignment.classroomId}
                                onChange={(e) =>
                                  handleAssignmentChange(
                                    index,
                                    "classroomId",
                                    e.target.value
                                  )
                                }
                                required
                                disabled={
                                  !assignment.sectionId
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              >
                                <option value="">
                                  {assignment.sectionId
                                    ? "Select class"
                                    : "Select section first"}
                                </option>

                                {filteredClassrooms.map(
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
                            </div>

                            {/* SUBJECT */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Subject
                              </label>

                              <select
                                value={assignment.subjectId}
                                onChange={(e) =>
                                  handleAssignmentChange(
                                    index,
                                    "subjectId",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              >
                                <option value="">
                                  Select subject
                                </option>

                                {subjects.map(
                                  (subject) => (
                                    <option
                                      key={subject.id}
                                      value={subject.id}
                                    >
                                      {subject.name} (
                                      {subject.code})
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

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

