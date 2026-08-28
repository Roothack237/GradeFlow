"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

type Classroom = {
  id: string;
  name: string;
  section: {
    id: string;
    name: string;
  };
};

type Child = {
  id: string;
  name: string;
  classId: string;
};

export default function AddParentPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [children, setChildren] = useState<Child[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      classId: "",
    },
  ]);

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================
     LOAD CLASSES
  ========================= */

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoadingClasses(true);

        const response = await fetch("/api/admin/classes", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load classes");
        }

        setClasses(data.classes || []);
      } catch (error) {
        console.error("Failed to load classes:", error);
        setMessage("Unable to load classes.");
      } finally {
        setLoadingClasses(false);
      }
    }

    loadClasses();
  }, []);

  /* =========================
     PARENT INPUT
  ========================= */

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  /* =========================
     CHILD INPUT
  ========================= */

  function handleChildChange(
    id: string,
    field: "name" | "classId",
    value: string
  ) {
    setChildren((currentChildren) =>
      currentChildren.map((child) =>
        child.id === id
          ? {
              ...child,
              [field]: value,
            }
          : child
      )
    );
  }

  /* =========================
     ADD CHILD
  ========================= */

  function addChild() {
    setChildren((currentChildren) => [
      ...currentChildren,
      {
        id: crypto.randomUUID(),
        name: "",
        classId: "",
      },
    ]);
  }

  /* =========================
     REMOVE CHILD
  ========================= */

  function removeChild(id: string) {
    // Don't allow the last child to be removed
    if (children.length === 1) {
      return;
    }

    setChildren((currentChildren) =>
      currentChildren.filter((child) => child.id !== id)
    );
  }

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      // Validate children
      const invalidChild = children.some(
        (child) => !child.name.trim() || !child.classId
      );

      if (invalidChild) {
        setMessage(
          "Please provide a name and class for every child."
        );
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          children: children.map((child) => ({
            name: child.name,
            classId: child.classId,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Something went wrong."
        );
        return;
      }

      setMessage(
        "Parent account created successfully. A login code will be generated."
      );

      // Reset parent
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });

      // Reset children
      setChildren([
        {
          id: crypto.randomUUID(),
          name: "",
          classId: "",
        },
      ]);
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

        {/* BACK */}
        <Link
          href="/admin/accounts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-purple-600"
        >
          <ArrowLeft size={16} />
          Back to Accounts
        </Link>

        {/* CARD */}
        <div className="rounded-2xl border border-gray-400 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          {/* HEADER */}
          <div className="mb-8 flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
              <UserPlus size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Parent
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a parent account and link their children.
              </p>
            </div>

          </div>

          {/* MESSAGE */}
          {message && (
            <div className="mb-6 rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

            {/* =========================
                PARENT INFORMATION
            ========================= */}

            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Parent Information
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* FIRST NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    First Name
                  </label>

                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Enter first name"
                    className="w-full rounded-xl border border-purple-700 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* LAST NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Last Name
                  </label>

                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Enter last name"
                    className="w-full rounded-xl border border-purple-700 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

              </div>
            </div>

            {/* =========================
                CONTACT
            ========================= */}

            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="parent@example.com"
                    className="w-full rounded-xl border border-purple-700 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Phone Number
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+237..."
                    className="w-full rounded-xl border border-purple-700 bg-gray-50 p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

              </div>
            </div>

            {/* =========================
                CHILDREN
            ========================= */}

            <div>

              {/* CHILDREN HEADER */}
              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Children
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add one or more children belonging to this parent.
                  </p>
                </div>

                {/* ADD CHILD BUTTON */}
                <button
                  type="button"
                  onClick={addChild}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
                >
                  <Plus size={17} />
                  Add Child
                </button>

              </div>

              {/* CHILD LIST */}
              <div className="space-y-4">

                {children.map((child, index) => (

                  <div
                    key={child.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
                  >

                    {/* CHILD HEADER */}
                    <div className="mb-4 flex items-center justify-between">

                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Child {index + 1}
                      </h3>

                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeChild(child.id)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      )}

                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">

                      {/* CHILD NAME */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                          Child&apos;s Name
                        </label>

                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) =>
                            handleChildChange(
                              child.id,
                              "name",
                              e.target.value
                            )
                          }
                          required
                          placeholder="Enter child's name"
                          className="w-full rounded-xl border border-purple-700 bg-white p-3 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </div>

                      {/* CHILD CLASS */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                          Child&apos;s Class
                        </label>

                        <select
                          value={child.classId}
                          onChange={(e) =>
                            handleChildChange(
                              child.id,
                              "classId",
                              e.target.value
                            )
                          }
                          required
                          disabled={loadingClasses}
                          className="w-full appearance-none rounded-xl border border-purple-700 bg-gray-50 p-3 pr-10 text-gray-900 outline-none transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                        >
                          <option value="">
                            {loadingClasses
                              ? "Loading classes..."
                              : "Select class"}
                          </option>

                            {!loadingClasses && classes.length === 0 && (
                              <option value="" disabled>
                                No classes available
                              </option>
                            )}
                          {classes.map((classroom) => (
                            <option
                              key={classroom.id}
                              value={classroom.id}
                            >
                              {classroom.name}  — 
                              {classroom.section.name}
                            </option>
                          ))}
                        </select>

                          {/* LOADING ANIMATION */}
                            {loadingClasses && (
                              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" />
                              </div>
                            )}

                      </div>

                    </div>

                  </div>

                ))}

              </div>

              {/* LOADING CLASSES */}
              {loadingClasses && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Loading available classes...
                </div>
              )}

              {!loadingClasses && classes.length === 0 && (
                <p className="mt-4 text-sm text-red-500">
                  No classes have been created yet. Please create a class before registering a parent.
                </p>
              )}

            </div>

            {/* =========================
                BUTTONS
            ========================= */}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">

              <Link
                href="/admin/accounts"
                className="rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading || loadingClasses}
                className="rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create Parent Account"}
              </button>

            </div>

          </form>

        </div>
      </div>
    </main>
  );
}