"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Users,
  X,
} from "lucide-react";

type Level = {
  id: string;
  name: string;
};

type Classroom = {
  id: string;
  name: string;
  level: Level;
  _count: {
    students: number;
  };
};

export default function ClassesPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [levelId, setLevelId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [classroomsResponse, levelsResponse] =
        await Promise.all([
          fetch("/api/admin/classrooms"),
          fetch("/api/admin/levels"),
        ]);

      const classroomsData = await classroomsResponse.json();
      const levelsData = await levelsResponse.json();

      if (!classroomsResponse.ok) {
        throw new Error(
          classroomsData.error || "Unable to load classes."
        );
      }

      if (!levelsResponse.ok) {
        throw new Error(
          levelsData.error || "Unable to load levels."
        );
      }

      setClassrooms(classroomsData);
      setLevels(levelsData);
    } catch (error) {
      console.error("LOAD CLASSES ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load classes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const [classroomsResponse, levelsResponse] =
        await Promise.all([
          fetch("/api/admin/classrooms"),
          fetch("/api/admin/levels"),
        ]);

      const classroomsData = await classroomsResponse.json();
      const levelsData = await levelsResponse.json();

      if (!classroomsResponse.ok) {
        throw new Error(
          classroomsData.error || "Unable to load classes."
        );
      }

      if (!levelsResponse.ok) {
        throw new Error(
          levelsData.error || "Unable to load levels."
        );
      }

      setClassrooms(classroomsData);
      setLevels(levelsData);
    } catch (error) {
      console.error("LOAD CLASSES ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load classes."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  async function handleCreateClass(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setCreating(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/classrooms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            levelId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Unable to create class."
        );
        return;
      }

      setMessage("Class created successfully.");

      setName("");
      setLevelId("");
      setShowAddForm(false);

      await loadData();
    } catch (error) {
      console.error("CREATE CLASS ERROR:", error);

      setMessage("Unable to create class.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <Link
          href="/admin/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Classes
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Create and manage school classrooms.
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddForm(true);
              setMessage("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
          >
            <Plus size={18} />
            Add Class
          </button>

        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
            {message}
          </div>
        )}

        {/* Add Class Form */}
        {showAddForm && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add New Class
                </h2>

                <p className="text-sm text-gray-500">
                  Create a classroom and assign it to a level.
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleCreateClass}
              className="grid gap-5 sm:grid-cols-2"
            >

              {/* Class Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Class Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  placeholder="e.g. Form 1 A"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Level */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level
                </label>

                <select
                  value={levelId}
                  onChange={(e) =>
                    setLevelId(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">
                    Select level
                  </option>

                  {levels.map((level) => (
                    <option
                      key={level.id}
                      value={level.id}
                    >
                      {level.name}
                    </option>
                  ))}
                </select>

                {levels.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    No levels found. Create a level first.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 sm:col-span-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddForm(false)
                  }
                  className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    levels.length === 0
                  }
                  className="rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Class"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Classes */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500">
              Loading classes...
            </p>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">

            <BookOpen
              size={45}
              className="mx-auto mb-4 text-gray-400"
            />

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              No classes yet
            </h2>

            <p className="mt-2 text-gray-500">
              Create your first classroom to start
              adding students.
            </p>

            <button
              onClick={() => setShowAddForm(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
            >
              <Plus size={18} />
              Add Class
            </button>

          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                    <BookOpen size={22} />
                  </div>

                </div>

                <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
                  {classroom.name}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {classroom.level.name}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={17} />
                  {classroom._count.students}{" "}
                  {classroom._count.students === 1
                    ? "Student"
                    : "Students"}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}