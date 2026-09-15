"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Layers } from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";
import SectionClasses from "@/components/admin/SectionClasses";

/**
 * Academic Year → Section page (Phase 7/8).
 * Lists the classes of the section for the academic year, loaded from
 * Prisma. Accepts either the real section id or the "anglophone" /
 * "francophone" slugs used by older links.
 */
export default function SectionPage() {
  const params = useParams<{ id: string; sectionId: string }>();
  const { id, sectionId } = params ?? {};

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [section, setSection] = useState<{ id: string; name: string } | null>(null);

  /* Resolve the section (slug or id) against the database. */
  useEffect(() => {
    if (!sectionId) return;

    fetch("/api/admin/sections", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const sections: { id: string; name: string }[] = data.sections ?? [];

        const found =
          sections.find((entry) => entry.id === sectionId) ??
          sections.find(
            (entry) => entry.name.toLowerCase() === sectionId.toLowerCase()
          );

        if (found) setSection(found);
      })
      .catch(() => undefined);
  }, [sectionId]);

  const isAnglophone = section?.name?.toUpperCase() === "ANGLOPHONE";

  const sectionTitle = isAnglophone
    ? "Anglophone Section"
    : section?.name?.toUpperCase() === "FRANCOPHONE"
      ? "Francophone Section"
      : "Section";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:ml-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={sectionTitle}
          subtitle="Classes of this section for the selected academic year."
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* BACK */}
            <Link
              href={`/admin/academic-years/${id}`}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:text-purple-800 dark:text-purple-400"
            >
              <ArrowLeft size={16} />
              Academic year
            </Link>

            {/* HEADER */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    isAnglophone
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  <GraduationCap size={32} />
                </div>

                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                    <Layers size={14} />
                    Section classes
                  </p>

                  <h1 className="mt-1 text-2xl font-bold">{sectionTitle}</h1>
                </div>
              </div>
            </div>

            {id && section ? (
              <SectionClasses
                academicYearId={id}
                sectionId={section.id}
                basePath={`/admin/academic-years/${id}/sections/${section.id}`}
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading section…
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
