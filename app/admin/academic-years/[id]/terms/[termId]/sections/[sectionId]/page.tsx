"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Layers } from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";
import SectionClasses from "@/components/admin/SectionClasses";

/**
 * Academic Year → Term → Section page (Phase 7/8).
 * Lists the classes of the section for the academic year, loaded from
 * Prisma through /api/admin/classes (no hardcoded class names).
 */
export default function TermSectionPage() {
  const params = useParams<{
    id: string;
    termId: string;
    sectionId: string;
  }>();

  const { id, termId, sectionId } = params ?? {};

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [section, setSection] = useState<{
    name: string;
  } | null>(null);

  const [term, setTerm] = useState<{ name: string; academicYear: { name: string } } | null>(
    null
  );

  /* Resolve the section + term names from the database. */
  useEffect(() => {
    if (sectionId) {
      fetch("/api/admin/sections", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          const found = (data.sections ?? []).find(
            (entry: { id: string }) => entry.id === sectionId
          );

          if (found) setSection({ name: found.name });
        })
        .catch(() => undefined);
    }

    if (termId) {
      fetch(`/api/admin/terms/${encodeURIComponent(termId)}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          if (data.term) setTerm(data.term);
        })
        .catch(() => undefined);
    }
  }, [sectionId, termId]);

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
          subtitle={
            term
              ? `${term.name} · ${term.academicYear.name} · Classes of this section`
              : "Classes of this section"
          }
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* BREADCRUMB */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={`/admin/academic-years/${id}`}
                className="inline-flex items-center gap-2 font-semibold text-purple-600 transition hover:text-purple-800 dark:text-purple-400"
              >
                <ArrowLeft size={15} />
                {term?.academicYear.name ?? "Academic year"}
              </Link>

              <span className="text-gray-300 dark:text-gray-600">/</span>

              <Link
                href={`/admin/academic-years/${id}/terms/${termId}`}
                className="font-semibold text-purple-600 transition hover:text-purple-800 dark:text-purple-400"
              >
                {term?.name ?? "Term"}
              </Link>

              <span className="text-gray-300 dark:text-gray-600">/</span>

              <span className="text-gray-500 dark:text-gray-400">{sectionTitle}</span>
            </div>

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
                    {term ? `${term.name} · ${term.academicYear.name}` : "Section classes"}
                  </p>

                  <h1 className="mt-1 text-2xl font-bold">{sectionTitle}</h1>
                </div>
              </div>
            </div>

            {id && sectionId && termId ? (
              <SectionClasses
                academicYearId={id}
                sectionId={sectionId}
                basePath={`/admin/academic-years/${id}/terms/${termId}/sections/${sectionId}`}
                termId={termId}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
