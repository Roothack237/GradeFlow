"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Child = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  matricule?: string;
  className?: string;
  class?: string;
  sectionId?: string;
  classroomId?: string;
};

type ChildForm = {
  name: string;
  sectionId: string;
  classroomId: string;
  verified: boolean;
  studentId?: string;
};

type Parent = {
  id: string;
  parentId: string;
  fullName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  children: Child[];
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  children: ChildForm[];
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

const emptyChild = (): ChildForm => ({
  name: "",
  sectionId: "",
  classroomId: "",
  verified: false,
});

const emptyForm = (): FormData => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  children: [emptyChild()],
});

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // FETCH PARENTS
  // =========================================================

  const fetchParents = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/parents", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.error("INVALID JSON FROM PARENTS API:", text);

          throw new Error(
            `Parents API returned an invalid response (${response.status})`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to fetch parents (${response.status})`
        );
      }

      const parentList = Array.isArray(data)
        ? data
        : Array.isArray(data.parents)
        ? data.parents
        : Array.isArray(data.data)
        ? data.data
        : [];

      setParents(parentList);
    } catch (error) {
      console.error("FAILED TO FETCH PARENTS:", error);
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH SECTIONS AND CLASSES
  // =========================================================

  const fetchSectionsAndClasses = async () => {
    try {
      const [sectionsResponse, classesResponse] = await Promise.all([
        fetch("/api/admin/sections", {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }),

        fetch("/api/admin/classes", {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }),
      ]);

      const sectionsText = await sectionsResponse.text();
      const classesText = await classesResponse.text();

      let sectionsData: any = {};
      let classesData: any = {};

      if (sectionsText.trim()) {
        try {
          sectionsData = JSON.parse(sectionsText);
        } catch {
          throw new Error("Invalid JSON returned by sections API.");
        }
      }

      if (classesText.trim()) {
        try {
          classesData = JSON.parse(classesText);
        } catch {
          throw new Error("Invalid JSON returned by classes API.");
        }
      }

      if (!sectionsResponse.ok) {
        throw new Error(
          sectionsData?.error || "Failed to load sections."
        );
      }

      if (!classesResponse.ok) {
        throw new Error(
          classesData?.error || "Failed to load classes."
        );
      }

      const sectionList = Array.isArray(sectionsData)
        ? sectionsData
        : sectionsData.sections ?? [];

      const classroomList = Array.isArray(classesData)
        ? classesData
        : classesData.classes ?? [];

      setSections(sectionList);
      setClassrooms(classroomList);
    } catch (error) {
      console.error("FAILED TO FETCH SECTIONS/CLASSES:", error);
    }
  };

  useEffect(() => {
    fetchParents();
    fetchSectionsAndClasses();
  }, []);

  // =========================================================
  // GET CLASSES FOR SECTION
  // =========================================================

  const getClassesForSection = (sectionId: string) => {
    if (!sectionId) return [];

    return classrooms.filter(
      (classroom) => classroom.sectionId === sectionId
    );
  };

  // =========================================================
  // VERIFY CHILD
  // =========================================================

  const verifyChild = async (index: number) => {
    const child = formData.children[index];

    if (!child.name.trim()) {
      alert("Please enter the child's name.");
      return;
    }

    if (!child.sectionId) {
      alert("Please select a section.");
      return;
    }

    if (!child.classroomId) {
      alert("Please select a class.");
      return;
    }

    try {
      setVerifyingIndex(index);

      const params = new URLSearchParams({
        name: child.name.trim(),
        classroomId: child.classroomId,
        sectionId: child.sectionId,
      });

      const response = await fetch(
        `/api/admin/students/verify?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `Verification API returned an invalid response (${response.status}).`
          );
        }
      }

      if (!response.ok || !data.student) {
        setFormData((previous) => {
          const children = [...previous.children];

          children[index] = {
            ...children[index],
            verified: false,
            studentId: undefined,
          };

          return {
            ...previous,
            children,
          };
        });

        alert(
          data?.error ||
            "This child is not registered in the selected class."
        );

        return;
      }

      setFormData((previous) => {
        const children = [...previous.children];

        children[index] = {
          ...children[index],
          verified: true,
          studentId: data.student.id,
          name: data.student.fullName,
        };

        return {
          ...previous,
          children,
        };
      });

      alert(
        `Child verified successfully: ${data.student.fullName}`
      );
    } catch (error) {
      console.error("VERIFY CHILD ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to verify child. Please try again."
      );
    } finally {
      setVerifyingIndex(null);
    }
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    setEditingParent(null);
    setFormData(emptyForm());
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (parent: Parent) => {
    setEditingParent(parent);

    const fullName = parent.fullName || "";
    const nameParts = fullName.trim().split(/\s+/);

    const firstName =
      nameParts.length > 1
        ? nameParts.slice(0, -1).join(" ")
        : fullName;

    const lastName =
      nameParts.length > 1
        ? nameParts[nameParts.length - 1]
        : "";

    const children: ChildForm[] =
      parent.children && parent.children.length > 0
        ? parent.children.map((child) => ({
            name:
              child.fullName ||
              `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim(),

            sectionId: child.sectionId || "",
            classroomId: child.classroomId || "",

            verified: Boolean(child.id),

            studentId: child.id,
          }))
        : [emptyChild()];

    let dateOfBirth = "";

    if (parent.dateOfBirth) {
      const date = new Date(parent.dateOfBirth);

      if (!Number.isNaN(date.getTime())) {
        dateOfBirth = date.toISOString().split("T")[0];
      }
    }

    setFormData({
      firstName,
      lastName,
      email: parent.email || "",
      phone: parent.phone || "",
      gender: parent.gender || "",
      dateOfBirth,
      children,
    });

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (submitting || verifyingIndex !== null) return;

    setShowModal(false);
    setEditingParent(null);
    setFormData(emptyForm());
  };

  // =========================================================
  // HANDLE PARENT FORM CHANGE
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
  // HANDLE CHILD CHANGE
  // =========================================================

  const handleChildChange = (
    index: number,
    field: keyof ChildForm,
    value: string | boolean
  ) => {
    setFormData((previous) => {
      const children = [...previous.children];

      children[index] = {
        ...children[index],
        [field]: value,
      };

      // Changing identifying information invalidates verification
      if (
        field === "name" ||
        field === "sectionId" ||
        field === "classroomId"
      ) {
        children[index].verified = false;
        delete children[index].studentId;
      }

      // Changing section should reset the selected class
      if (field === "sectionId") {
        children[index].classroomId = "";
      }

      return {
        ...previous,
        children,
      };
    });
  };

  // =========================================================
  // ADD CHILD
  // =========================================================

  const addChild = () => {
    setFormData((previous) => ({
      ...previous,
      children: [
        ...previous.children,
        emptyChild(),
      ],
    }));
  };

  // =========================================================
  // REMOVE CHILD
  // =========================================================

  const removeChild = (index: number) => {
    setFormData((previous) => {
      if (previous.children.length === 1) {
        return previous;
      }

      return {
        ...previous,
        children: previous.children.filter(
          (_, childIndex) => childIndex !== index
        ),
      };
    });
  };

  // =========================================================
  // SUBMIT PARENT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Make sure every child has been verified
    const unverifiedChild = formData.children.find(
      (child) =>
        !child.name.trim() ||
        !child.sectionId ||
        !child.classroomId ||
        !child.verified ||
        !child.studentId
    );

    if (unverifiedChild) {
      alert(
        "Please complete and verify all children before saving the parent."
      );
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = Boolean(editingParent);

      const url = isEditing
        ? `/api/admin/parents/${editingParent!.id}`
        : "/api/admin/parents";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify(formData),
      });

      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.error(
            "INVALID JSON FROM PARENT SAVE API:",
            text
          );

          throw new Error(
            `Server returned an invalid response (${response.status})`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to ${
              isEditing ? "update" : "create"
            } parent`
        );
      }

      setShowModal(false);
      setEditingParent(null);
      setFormData(emptyForm());

      await fetchParents();

      setSuccessMessage(
  isEditing
    ? "Parent updated successfully."
    : "Parent account created successfully. A 4-digit login code has been sent to the parent's email."
);

setTimeout(() => {
  setSuccessMessage("");
}, 5000);
    } catch (error) {
      console.error("PARENT SAVE FAILED:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save parent."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE PARENT
  // =========================================================

  const handleDelete = async (parent: Parent) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${parent.fullName}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(parent.id);

      const response = await fetch(
        `/api/admin/parents/${parent.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `Server returned an invalid response (${response.status})`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to delete parent"
        );
      }

      setParents((previous) =>
        previous.filter(
          (item) => item.id !== parent.id
        )
      );

      alert("Parent deleted successfully.");
    } catch (error) {
      console.error("PARENT DELETE FAILED:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete parent."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="lg:ml-72">
        <Navbar title="Parents" />

        <main className="p-5 sm:p-8">

          {/* PAGE HEADER */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Parents
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View and manage all parents.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Parent
            </button>
          </div>

          {/* PARENTS TABLE */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">

            {successMessage && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                {successMessage}
              </div>
            )}

              <table className="w-full min-w-[1300px] text-left text-sm">

                <thead className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Gender
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Children
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Phone
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Parent ID
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
                        Loading parents...
                      </td>
                    </tr>
                  ) : parents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        No parents found.
                      </td>
                    </tr>
                  ) : (
                    parents.map((parent) => {
                      const children = parent.children ?? [];

                      return (
                        <tr
                          key={parent.id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >

                          {/* NAME */}

                          <td className="px-6 py-5">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {parent.fullName}
                            </div>
                          </td>

                          {/* GENDER */}

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {parent.gender || "—"}
                            </span>
                          </td>

                          {/* DATE OF BIRTH */}

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {parent.dateOfBirth
                              ? new Date(
                                  parent.dateOfBirth
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          {/* EMAIL */}

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {parent.email || "—"}
                          </td>

                          {/* CHILDREN */}

                          <td className="px-6 py-5">
                            {children.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {children.map((child) => {
                                  const childName =
                                    child.fullName ||
                                    `${child.firstName ?? ""} ${
                                      child.lastName ?? ""
                                    }`.trim();

                                  return (
                                    <span
                                      key={child.id}
                                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    >
                                      {childName || "Student"}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                No children assigned
                              </span>
                            )}
                          </td>

                          {/* PHONE */}

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {parent.phone || "—"}
                          </td>

                          {/* PARENT ID */}

                          <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                            {parent.parentId}
                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(parent)
                                }
                                disabled={
                                  deletingId === parent.id
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(parent)
                                }
                                disabled={
                                  deletingId === parent.id
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                              >
                                {deletingId === parent.id
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
          ADD / EDIT PARENT MODAL
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

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingParent
                    ? "Edit Parent"
                    : "Add Parent"}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editingParent
                    ? "Update the parent's information."
                    : "Create a new parent account and assign their children."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  submitting || verifyingIndex !== null
                }
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

              {/* PARENT INFORMATION */}

              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Parent Information
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the parents personal information.
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

              {/* GENDER + DATE */}

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

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
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
                  placeholder="parent@example.com"
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

              {/* CHILDREN */}

              <div className="border-t border-gray-200 pt-6 dark:border-gray-800">

                <div className="mb-4 flex items-center justify-between gap-4">

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Children Information
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Select the child's section and class, then verify the child.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addChild}
                    disabled={submitting}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    + Add Child
                  </button>

                </div>

                <div className="space-y-4">

                  {formData.children.map(
                    (child, index) => {

                      const availableClasses =
                        getClassesForSection(
                          child.sectionId
                        );

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                        >

                          <div className="mb-4 flex items-center justify-between">

                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              Child {index + 1}
                            </h4>

                            {formData.children.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeChild(index)
                                }
                                disabled={
                                  submitting ||
                                  verifyingIndex !== null
                                }
                                className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                              >
                                Remove
                              </button>
                            )}

                          </div>

                          <div className="space-y-4">

                            {/* CHILD NAME */}

                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Child Name
                              </label>

                              <input
                                type="text"
                                value={child.name}
                                onChange={(e) =>
                                  handleChildChange(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                required
                                placeholder="Enter child's full name"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                            </div>

                            {/* SECTION */}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Section
                                </label>

                                <select
                                  value={child.sectionId}
                                  onChange={(e) =>
                                    handleChildChange(
                                      index,
                                      "sectionId",
                                      e.target.value
                                    )
                                  }
                                  required
                                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                                  value={child.classroomId}
                                  onChange={(e) =>
                                    handleChildChange(
                                      index,
                                      "classroomId",
                                      e.target.value
                                    )
                                  }
                                  required
                                  disabled={
                                    !child.sectionId
                                  }
                                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900"
                                >
                                  <option value="">
                                    {!child.sectionId
                                      ? "Select section first"
                                      : availableClasses.length ===
                                        0
                                      ? "No classes available"
                                      : "Select class"}
                                  </option>

                                  {availableClasses.map(
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

                            </div>

                            {/* VERIFICATION */}

                            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">

                              <div>

                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Verification
                                </p>

                                {child.verified ? (
                                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                    ✓ Child verified successfully
                                  </p>
                                ) : (
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Verify that this child exists in the selected class.
                                  </p>
                                )}

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  verifyChild(index)
                                }
                                disabled={
                                  submitting ||
                                  verifyingIndex !== null ||
                                  !child.name.trim() ||
                                  !child.sectionId ||
                                  !child.classroomId
                                }
                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  child.verified
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                {verifyingIndex === index
                                  ? "Verifying..."
                                  : child.verified
                                  ? "✓ Verified"
                                  : "Verify Child"}
                              </button>

                            </div>

                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    submitting ||
                    verifyingIndex !== null
                  }
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    verifyingIndex !== null
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? editingParent
                      ? "Saving..."
                      : "Creating..."
                    : editingParent
                    ? "Save Changes"
                    : "Add Parent"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

