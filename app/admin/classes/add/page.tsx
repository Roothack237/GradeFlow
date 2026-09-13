"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import NavBar from "@/components/admin/NavBar";

type Section = { id: string; name: "ANGLOPHONE" | "FRANCOPHONE" };
type AcademicYear = { id: string; name: string; isActive: boolean };

export default function AddClassPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);

  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [sectionsRes, yearsRes] = await Promise.all([
          fetch("/api/admin/sections", { cache: "no-store" }),
          fetch("/api/admin/academic-years", { cache: "no-store" }),
        ]);

        const sectionsData = await sectionsRes.json();
        const yearsData = await yearsRes.json();

        if (!sectionsRes.ok) {
          throw new Error(sectionsData.error || "Failed to load sections.");
        }

        setSections(Array.isArray(sectionsData) ? sectionsData : []);

        const active = (yearsData.academicYears || []).find(
          (year: AcademicYear) => year.isActive
        );

        setAcademicYear(active || null);
      } catch (err) {
        console.error("LOAD ADD CLASS DATA ERROR:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load form data."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !sectionId) {
      setError("Class name and section are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sectionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create class.");
      }

      router.push("/admin/classes");
    } catch (err) {
      console.error("CREATE CLASS ERROR:", err);
      setError(err instanceof Error ? err.message : "Unable to create class.");
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
          title="Add Class"
          subtitle="Create a new class for the active academic year"
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
                    Add Class
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {academicYear
                      ? `This class will belong to ${academicYear.name} (active year).`
                      : "No active academic year is set."}
                  </p>
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
                  Loading form...
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
                      placeholder="e.g. Form 1, Upper Sixth A"
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
                      <option value="">Select a section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !academicYear}
                    className="w-full rounded-xl bg-purple-700 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Class"}
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
