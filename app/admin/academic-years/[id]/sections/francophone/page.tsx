
"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

export default function FrancophoneSectionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* SIDEBAR */}
      <Sidebar
        open={false}
        onClose={() => {}}
      />

      {/* MAIN */}
      <div className="min-h-screen lg:ml-72">
        {/* NAVBAR */}
        <Navbar
          onMenuClick={() => {}}
          title="Francophone Section"
          subtitle="Francophone Academic section"
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">

            {/* HEADER */}
            <div className="mb-8">
              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <GraduationCap size={32} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Francophone
                  </p>

                  <h1 className="mt-1 text-2xl font-bold">
                    Francophone Section
                  </h1>
                </div>

              </div>

              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Manage classes and subjects for the Francophone section.
              </p>
            </div>

            {/* SECTION OPTIONS */}
            <div className="grid gap-5 md:grid-cols-2">

              {/* CLASSES */}
              <Link
                href={`/admin/academic-years/${id}/sections/francophone/classes`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <GraduationCap size={23} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  Classes
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View and manage all classes in the Francophone section.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Manage Classes

                  <ArrowLeft
                    size={16}
                    className="rotate-180 transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>

              {/* SUBJECTS */}
              <Link
                href={`/admin/academic-years/${id}/sections/francophone/subjects`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <BookOpen size={23} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  Subjects
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View and manage subjects for the Francophone section.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Manage Subjects

                  <ArrowLeft
                    size={16}
                    className="rotate-180 transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>

            </div>

            {/* SECTION INFORMATION */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

              <h2 className="text-lg font-bold">
                Section Information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-3">

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Section
                  </p>

                  <p className="mt-1 font-semibold">
                    Francophone Section
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    System
                  </p>

                  <p className="mt-1 font-semibold">
                    Francophone
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Academic Year ID
                  </p>

                  <p className="mt-1 break-all font-mono text-sm">
                    {id}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
