"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  matricule?: string | null;
  className?: string | null;
};

const initialFormData = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  className: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // MODAL
  // =========================================================

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // null = creating a new student
  // student = editing an existing student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // =========================================================
  // DELETE
  // =========================================================

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =========================================================
  // FORM
  // =========================================================

  const [formData, setFormData] = useState(initialFormData);

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/students", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const responseText = await response.text();

      let data: any = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error(
            "INVALID JSON FROM STUDENTS API:",
            responseText
          );

          throw new Error(
            `Students API returned invalid response (${response.status})`
          );
        }
      }

      console.log("STUDENTS API STATUS:", response.status);
      console.log("STUDENTS API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to fetch students (${response.status})`
        );
      }

      const studentList = Array.isArray(data)
        ? data
        : Array.isArray(data.students)
        ? data.students
        : Array.isArray(data.data)
        ? data.data
        : [];

      setStudents(studentList);
    } catch (error) {
      console.error("FAILED TO FETCH STUDENTS:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openModal = () => {
    setEditingStudent(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (student: Student) => {
    setEditingStudent(student);

    setFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      gender: student.gender || "",
      dateOfBirth: student.dateOfBirth
        ? student.dateOfBirth.substring(0, 10)
        : "",
      className: student.className || "",
    });

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingStudent(null);
    setFormData(initialFormData);
  };

  // =========================================================
  // HANDLE FORM CHANGE
  // =========================================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE / UPDATE STUDENT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // -------------------------------------------------------
      // UPDATE
      // -------------------------------------------------------

      if (editingStudent) {
        const response = await fetch(
          `/api/admin/students/${editingStudent.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              gender: formData.gender || null,
              dateOfBirth: formData.dateOfBirth || null,
              className: formData.className || null,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Failed to update student"
          );
        }

        alert("Student updated successfully.");

        closeModal();
        await fetchStudents();

        return;
      }

      // -------------------------------------------------------
      // CREATE
      // -------------------------------------------------------

      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender || null,
          dateOfBirth: formData.dateOfBirth || null,
          className: formData.className || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create student"
        );
      }

      alert("Student created successfully.");

      closeModal();

      await fetchStudents();
    } catch (error) {
      console.error(
        editingStudent
          ? "STUDENT UPDATE FAILED:"
          : "STUDENT CREATION FAILED:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : editingStudent
          ? "Failed to update student"
          : "Failed to create student"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE STUDENT
  // =========================================================

  const handleDelete = async (student: Student) => {
    const studentName =
      student.fullName ||
      `${student.firstName || ""} ${
        student.lastName || ""
      }`.trim();

    const confirmed = window.confirm(
      `Are you sure you want to delete ${studentName || "this student"}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(student.id);

      const response = await fetch(
        `/api/admin/students/${student.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to delete student"
        );
      }

      // Remove immediately from UI
      setStudents((previous) =>
        previous.filter(
          (item) => item.id !== student.id
        )
      );

      alert("Student deleted successfully.");
    } catch (error) {
      console.error("STUDENT DELETE FAILED:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete student"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    date: string | null | undefined
  ) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="lg:ml-72">
        <Navbar title="Students" />

        <main className="p-5 sm:p-8">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Students
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage all registered students.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Student
            </button>
          </div>

          {/* =================================================
              STUDENT COUNT
          ================================================= */}

          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Students
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? "—" : students.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-900/30">
                🎓
              </div>

            </div>
          </div>

          {/* =================================================
              STUDENTS TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px] text-left text-sm">

                <thead className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">

                  <tr>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      #
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Student Name
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Matricule
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Gender
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Class
                    </th>

                    {/* NEW */}
                    <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y dark:divide-gray-800">

                  {/* LOADING */}

                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        Loading students...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (

                    /* EMPTY */

                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        No students found.
                      </td>
                    </tr>

                  ) : (

                    /* STUDENTS */

                    students.map((student, index) => {

                      const studentName =
                        student.fullName ||
                        `${student.firstName ?? ""} ${
                          student.lastName ?? ""
                        }`.trim();

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >

                          {/* NUMBER */}

                          <td className="px-6 py-5 text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>

                          {/* NAME */}

                          <td className="px-6 py-5">

                            <div className="font-semibold text-gray-900 dark:text-white">
                              {studentName || "Student"}
                            </div>

                          </td>

                          {/* MATRICULE */}

                          <td className="px-6 py-5">

                            {student.matricule ? (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {student.matricule}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                —
                              </span>
                            )}

                          </td>

                          {/* GENDER */}

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {student.gender || "—"}
                          </td>

                          {/* DATE OF BIRTH */}

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {formatDate(student.dateOfBirth)}
                          </td>

                          {/* CLASS */}

                          <td className="px-6 py-5">

                            {student.className ? (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {student.className}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                Not assigned
                              </span>
                            )}

                          </td>

                          {/* =================================================
                              ACTIONS
                          ================================================= */}

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(student)
                                }
                                disabled={
                                  deletingId === student.id
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                ✏️ Edit
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(student)
                                }
                                disabled={
                                  deletingId === student.id
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId === student.id
                                  ? "Deleting..."
                                  : "🗑️ Delete"}
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

      {/* =====================================================
          ADD / EDIT STUDENT MODAL
      ===================================================== */}

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

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editingStudent
                    ? "Update the student's information."
                    : "Register a new student."}
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

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >

              <div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Student Information
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the students personal information.
                </p>

              </div>

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

              {/* GENDER + DATE OF BIRTH */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

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

                  </select>

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

              {/* CLASS */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Class
                </label>

                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  placeholder="Enter class"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />

              </div>

              {/* AUTOMATIC INFORMATION */}

              {!editingStudent && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">

                  <div className="flex gap-3">

                    <div className="text-lg">
                      ℹ️
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        Automatically generated
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">
                        The student's matricule,
                        email address and phone number
                        will be generated automatically
                        by the system after registration.
                      </p>

                    </div>

                  </div>

                </div>
              )}

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
                    ? editingStudent
                      ? "Saving..."
                      : "Creating..."
                    : editingStudent
                    ? "Save Changes"
                    : "Add Student"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </div>
  );
}