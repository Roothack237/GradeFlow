"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import NavBar from "@/components/admin/NavBar";

type Section = { id: string; name: "ANGLOPHONE" | "FRANCOPHONE" };

export default function EditClassPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [academicYearName, setAcademicYearName] = useState("");

  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [classRes, sectionsRes] = await Promise.all([
          fetch(`/api/admin/classes/${id}`, { cache: "no-store" }),
          fetch("/api/admin/sections", { cache: "no-store" }),
        ]);

        const classData = await classRes.json();
        const sectionsData = await sectionsRes.json();

        if (!classRes.ok) {
          throw new Error(classData.error || "Failed to load class.");
        }

        setName(classData.classroom.name);
        setSectionId(classData.classroom.sectionId);
        setAcademicYearName(classData.classroom.academicYear?.name ?? "");
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
      } catch (err) {
        console.error("LOAD EDIT CLASS ERROR:", err);
        setError(err instanceof Error ? err.message : "Unable to load class.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !sectionId) {
      setError("Class name and section are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/admin/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sectionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update class.");
      }

      router.push("/admin/classes");
    } catch (err) {
      console.error("UPDATE CLASS ERROR:", err);
      setError(err instanceof Error ? err.message : "Unable to update class.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <NavBar
          onMenuClick={() => setSidebarOpen(true)}
          title="Edit Class"
          subtitle="Update class details"
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/admin/classes"
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
            >
              <ArrowLeft size={17} />
              Back to Classes
            </Link>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <BookOpen size={28} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit Class
                  </h1>

                  {academicYearName && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Academic year: {academicYearName} (fixed — a class
                      cannot move between years)
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                  <Loader2 size={20} className="animate-spin" />
                  Loading class...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Class Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Section
                    </label>

                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-purple-700 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
