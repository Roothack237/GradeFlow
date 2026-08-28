"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  MoreVertical,
  X,
  GraduationCap,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Classroom = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  coefficient: number;
  classroomId: string;
};

export default function SubjectsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    coefficient: "",
  });

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
   * ============================
   * LOAD CLASSROOMS
   * ============================
   */

  useEffect(() => {
    async function loadClassrooms() {
      try {
        setLoadingClasses(true);

        const response = await fetch("/api/admin/classes", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load classrooms");
        }

        const data = await response.json();

        const loadedClasses = Array.isArray(data)
          ? data
          : Array.isArray(data.classrooms)
            ? data.classrooms
            : Array.isArray(data.classes)
              ? data.classes
              : [];

        setClassrooms(loadedClasses);
        
        setClassrooms(loadedClasses);
      } catch (error) {
        console.error("Failed to load classrooms:", error);
      } finally {
        setLoadingClasses(false);
      }
    }

    loadClassrooms();
  }, []);

  /*
   * ============================
   * LOAD SUBJECTS FOR CLASS
   * ============================
   */

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      return;
    }

    async function loadSubjects() {
      try {
        setLoadingSubjects(true);

        const response = await fetch(
          `/api/admin/subjects?classroomId=${selectedClassId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load subjects");
        }

        const data = await response.json();

        setSubjects(data.subjects ?? []);
      } catch (error) {
        console.error("Failed to load subjects:", error);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, [selectedClassId]);

  /*
   * ============================
   * OPEN FORM
   * ============================
   */

  function openAddSubject() {
    if (!selectedClassId) {
      alert("Please select a class first.");
      return;
    }

    setForm({
      name: "",
      coefficient: "",
    });

    setShowForm(true);
  }

  /*
   * ============================
   * CREATE SUBJECT
   * ============================
   */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedClassId) {
      alert("Please select a class first.");
      return;
    }

    if (!form.name.trim()) {
      alert("Please enter the subject name.");
      return;
    }

    const coefficient = Number(form.coefficient);

    if (!coefficient || coefficient <= 0) {
      alert("Please enter a valid coefficient.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          coefficient,
          classroomId: selectedClassId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subject");
      }

      setSubjects((previous) => [...previous, data.subject]);

      setForm({
        name: "",
        coefficient: "",
      });

      setShowForm(false);
    } catch (error) {
      console.error("CREATE SUBJECT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create subject."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================
   * DELETE SUBJECT
   * ============================
   */

  async function deleteSubject(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/subjects/${id}`, {
        method: "DELETE",
      });

      console.log("SUBJECT API STATUS:", response.status);

      const data = await response.json();

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error ||
            `Failed to load subjects (${response.status})`
        );
      }

      setSubjects((previous) =>
        previous.filter((subject) => subject.id !== id)
      );
    } catch (error) {
      console.error("DELETE SUBJECT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete subject."
      );
    }
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

        {/* CONTENT */}

        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-7xl">

            {/* HEADER */}

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

               

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Subjects
                </h1>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Create and manage subjects for each class.
                </p>

              </div>

              <button
                type="button"
                onClick={openAddSubject}
                //disabled={!selectedClassId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800  "
              >
                <Plus size={18} />
                Add Subject
              </button>

            </div>

            {/* CLASS SELECTION */}

            <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                  <GraduationCap size={22} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Select Class
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a class to view and manage its subjects.
                  </p>
                </div>

              </div>

              <div className="mt-5">

                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-md"
                >

                  <option value="">
                    {loadingClasses
                      ? "Loading classes..."
                      : "Select a class"}
                  </option>

                  {classrooms.map((classroom) => (
                    <option
                      key={classroom.id}
                      value={classroom.id}
                    >
                      {classroom.name}
                    </option>
                  ))}

                </select>

              </div>

            </section>

            {/* SELECTED CLASS */}

            {selectedClassId && (
              <div className="mt-8">

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {classrooms.find(
                        (classroom) =>
                          classroom.id === selectedClassId
                      )?.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Subjects assigned to this class
                    </p>
                  </div>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {subjects.length}{" "}
                    {subjects.length === 1
                      ? "Subject"
                      : "Subjects"}
                  </span>

                </div>

                {/* LOADING */}

                {loadingSubjects && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />

                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Loading subjects...
                    </p>

                  </div>
                )}

                {/* SUBJECT CARDS */}

                {!loadingSubjects && subjects.length > 0 && (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
                      >

                        <div className="flex items-start justify-between">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                            <BookOpen size={23} />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              deleteSubject(subject.id)
                            }
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                            aria-label="Delete subject"
                          >
                            <MoreVertical size={20} />
                          </button>

                        </div>

                        <div className="mt-5">

                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {subject.name}
                          </h3>

                          <div className="mt-3 inline-flex items-center rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            Coefficient: {subject.coefficient}
                          </div>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

                {/* EMPTY */}

                {!loadingSubjects && subjects.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">

                    <BookOpen
                      className="mx-auto text-gray-400"
                      size={40}
                    />

                    <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                      No subjects yet
                    </h3>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      This class does not have any subjects.
                    </p>

                    <button
                      type="button"
                      onClick={openAddSubject}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-800"
                    >
                      <Plus size={17} />
                      Add Subject
                    </button>

                  </div>
                )}

              </div>
            )}

            {/* NO CLASS SELECTED */}

            {!selectedClassId && !loadingClasses && (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">

                <GraduationCap
                  className="mx-auto text-gray-400"
                  size={42}
                />

                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  Select a class
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose a class above to manage its subjects.
                </p>

              </div>
            )}

          </div>
        </main>
      </div>

      {/* ========================= */}
      {/* ADD SUBJECT POPUP */}
      {/* ========================= */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">

            {/* POPUP HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Subject
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add a subject to{" "}
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {
                      classrooms.find(
                        (classroom) =>
                          classroom.id === selectedClassId
                      )?.name
                    }
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* SUBJECT NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Mathematics"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

              </div>

              {/* COEFFICIENT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Coefficient
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.coefficient}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      coefficient: e.target.value,
                    })
                  }
                  placeholder="e.g. 4"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Subject"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}