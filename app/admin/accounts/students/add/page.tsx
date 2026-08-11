"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

type Classroom = {
  id: string;
  name: string;
};

export default function AddStudentPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    matricule: "",
    gender: "",
    dateOfBirth: "",
    classroomId: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load classrooms
  useEffect(() => {
    async function loadClassrooms() {
      try {
        const response = await fetch("/api/admin/classrooms");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setClassrooms(data);
      } catch (error) {
        console.error("LOAD CLASSROOMS ERROR:", error);
        setMessage("Unable to load classrooms.");
      }
    }

    loadClassrooms();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setMessage("Student created successfully!");

      setForm({
        firstName: "",
        lastName: "",
        matricule: "",
        gender: "",
        dateOfBirth: "",
        classroomId: "",
      });
    } catch (error) {
      console.error("CREATE STUDENT ERROR:", error);

      setMessage("Unable to create student.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <Link
          href="/admin/accounts/students"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
        >
          <ArrowLeft size={16} />
          Back to Students
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          {/* Header */}
          <div className="mb-8 flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
              <UserPlus size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Student
              </h1>

              <p className="text-sm text-gray-500">
                Create a new student record.
              </p>
            </div>

          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* First and Last Name */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  First Name
                </label>

                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Last Name
                </label>

                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

            </div>

            {/* Matricule */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Matricule
              </label>

              <input
                name="matricule"
                value={form.matricule}
                onChange={handleChange}
                required
                placeholder="e.g. STU-2026-001"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Gender + DOB */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Gender
                </label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                <label className="mb-2 block text-sm font-medium">
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

            </div>

            {/* Classroom */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Class
              </label>

              <select
                name="classroomId"
                value={form.classroomId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">
                  Select class
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

              {classrooms.length === 0 && (
                <p className="mt-2 text-sm text-red-500">
                  No classrooms found. Create a classroom first.
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">

              <Link
                href="/admin/accounts/students"
                className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading || classrooms.length === 0}
                className="rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create Student"}
              </button>

            </div>

          </form>

        </div>
      </div>
    </main>
  );
}