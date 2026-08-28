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
};

type ChildForm = {
  name: string;
  className: string;
};

type Parent = {
  id: string;
  parentId: string;
  fullName: string;
  lastName: string;
  email: string;
  phone: string | null;
  children: Child[];
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  children: ChildForm[];
};

const emptyChild = (): ChildForm => ({
  name: "",
  className: "",
});

const emptyForm = (): FormData => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  children: [emptyChild()],
});

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // MODAL
  // =========================================================

  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =========================================================
  // FORM
  // =========================================================

  const [formData, setFormData] = useState<FormData>(emptyForm());

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
          console.error(
            "INVALID JSON FROM PARENTS API:",
            text
          );

          throw new Error(
            `Parents API returned an invalid response (${response.status})`
          );
        }
      }

      console.log("PARENTS API STATUS:", response.status);
      console.log("PARENTS API RESPONSE:", data);

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

  useEffect(() => {
    fetchParents();
  }, []);

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

    const children =
      parent.children && parent.children.length > 0
        ? parent.children.map((child) => ({
            name:
              child.fullName ||
              `${child.firstName ?? ""} ${
                child.lastName ?? ""
              }`.trim(),
            className:
              child.className ||
              child.class ||
              "",
          }))
        : [emptyChild()];

    setFormData({
      firstName,
      lastName,
      email: parent.email || "",
      phone: parent.phone || "",
      children,
    });

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingParent(null);
    setFormData(emptyForm());
  };

  // =========================================================
  // HANDLE PARENT FORM CHANGE
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
  // HANDLE CHILD CHANGE
  // =========================================================

  const handleChildChange = (
    index: number,
    field: keyof ChildForm,
    value: string
  ) => {
    setFormData((previous) => {
      const children = [...previous.children];

      children[index] = {
        ...children[index],
        [field]: value,
      };

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
  // CREATE OR UPDATE
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

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

      // Close modal
      setShowModal(false);

      // Reset
      setEditingParent(null);
      setFormData(emptyForm());

      // Refresh
      await fetchParents();

      alert(
        isEditing
          ? "Parent updated successfully."
          : "Parent created successfully."
      );
    } catch (error) {
      console.error(
        "PARENT SAVE FAILED:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save parent"
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
          console.error(
            "INVALID JSON FROM DELETE PARENT API:",
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
            "Failed to delete parent"
        );
      }

      // Remove immediately from UI
      setParents((previous) =>
        previous.filter(
          (item) => item.id !== parent.id
        )
      );

      alert("Parent deleted successfully.");
    } catch (error) {
      console.error(
        "PARENT DELETE FAILED:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete parent"
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

              <table className="w-full min-w-[1100px] text-left text-sm">

                <thead className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                      Name
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
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        Loading parents...
                      </td>
                    </tr>
                  ) : parents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        No parents found.
                      </td>
                    </tr>
                  ) : (
                    parents.map((parent) => {
                      const children =
                        parent.children ?? [];

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

                              {/* EDIT */}
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

                              {/* DELETE */}
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

              {/* PARENT INFORMATION */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Parent Information
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the parent's personal information.
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
                      Add the child or children associated with this parent.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addChild}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    + Add Child
                  </button>

                </div>

                <div className="space-y-4">

                  {formData.children.map(
                    (child, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                      >

                        <div className="mb-4 flex items-center justify-between">

                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Child {index + 1}
                          </h4>

                          {formData.children.length >
                            1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeChild(index)
                              }
                              className="text-sm font-medium text-red-600 transition hover:text-red-700 dark:text-red-400"
                            >
                              Remove
                            </button>
                          )}

                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

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
                              placeholder="Enter child's name"
                              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          {/* CLASS */}
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Class
                            </label>

                            <input
                              type="text"
                              value={child.className}
                              onChange={(e) =>
                                handleChildChange(
                                  index,
                                  "className",
                                  e.target.value
                                )
                              }
                              required
                              placeholder="e.g. Form 5 Science"
                              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                        </div>
                      </div>
                    )
                  )}

                </div>
              </div>

              {/* ACTIONS */}
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