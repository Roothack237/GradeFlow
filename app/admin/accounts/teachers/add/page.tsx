"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

export default function AddTeacherPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/teachers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create teacher.");
        return;
      }

      setMessage(
        `Teacher created successfully. Teacher ID: ${data.teacher.teacherId}`
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      });

    } catch {
      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">

      <div className="mx-auto max-w-3xl">

        <Link
          href="/admin/accounts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
        >
          <ArrowLeft size={17} />
          Back to Manage Accounts
        </Link>

        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-purple-700 dark:bg-purple-700 sm:p-8">

          {/* Header */}

          <div className="mb-8 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              <GraduationCap size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Teacher
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create a new teacher account.
              </p>
            </div>

          </div>

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            <div className="grid gap-5 sm:grid-cols-2">

              {/* First Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
                  First Name
                </label>

                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                  className="h-12 w-full rounded-xl border border-purple-600 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                />
              </div>

              {/* Last Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Last Name
                </label>

                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
                  className="h-12 w-full rounded-xl border border-purple-600 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                />
              </div>

            </div>

            {/* Email */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
                Email Address
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="teacher@example.com"
                className="h-12 w-full rounded-xl border border-purple-600 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
              />
            </div>

            {/* Phone */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
                Phone Number
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+237 6XX XXX XXX"
                className="h-12 w-full rounded-xl border border-purple-600 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
              />
            </div>
           

            {/* Message */}

            {message && (
              <div className="rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
                {message}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Creating account...
                </>
              ) : (
                "Create Teacher Account"
              )}

            </button>

          </form>

        </div>

      </div>

    </main>
  );
}