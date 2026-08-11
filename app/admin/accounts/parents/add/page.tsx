"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function AddParentPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    childName: "",
    childClass: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      const response = await fetch("/api/admin/parents", {
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

      setMessage(
        "Parent account created successfully. A login code will be generated."
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        childName: "",
        childClass: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("Unable to create parent account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/admin/accounts/parents"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
        >
          <ArrowLeft size={16} />
          Back to Parents
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
              <UserPlus size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Parent
              </h1>

              <p className="text-sm text-gray-500">
                Create a parent account and link their child.
              </p>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Parent Information */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Parent Information
              </h2>

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
            </div>

            {/* Contact */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="parent@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone Number
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+237..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

              </div>
            </div>

            {/* Child */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Child Information
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Childs Name
                  </label>

                  <input
                    name="childName"
                    value={form.childName}
                    onChange={handleChange}
                    required
                    placeholder="Enter child's name"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Childs Class
                  </label>

                  <select
                    name="childClass"
                    value={form.childClass}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select class</option>
                    <option value="Form 1 A">Form 1 A</option>
                    <option value="Form 1 B">Form 1 B</option>
                    <option value="Form 2 A">Form 2 A</option>
                    <option value="Form 2 B">Form 2 B</option>
                    <option value="Form 3 A">Form 3 A</option>
                  </select>
                </div>

              </div>

              <p className="mt-3 text-xs text-gray-400">
                We will connect this to the actual student and classroom
                records in PostgreSQL.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">

              <Link
                href="/admin/accounts/parents"
                className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Parent Account"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </main>
  );
}