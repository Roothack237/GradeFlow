"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  UserPlus,
  ClipboardList,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

const sectionData: Record<
  string,
  {
    name: string;
    language: "ANGLOPHONE" | "FRANCOPHONE";
  }
> = {
  "anglophone-form-1-a": {
    name: "Form 1 A",
    language: "ANGLOPHONE",
  },

  "anglophone-form-1-b": {
    name: "Form 1 B",
    language: "ANGLOPHONE",
  },

  "anglophone-form-2-a": {
    name: "Form 2 A",
    language: "ANGLOPHONE",
  },

  "francophone-6eme": {
    name: "6ème",
    language: "FRANCOPHONE",
  },

  "francophone-5eme": {
    name: "5ème",
    language: "FRANCOPHONE",
  },

  "francophone-4eme": {
    name: "4ème",
    language: "FRANCOPHONE",
  },
};

export default function SectionPage({
  params,
}: {
  params: Promise<{
    id: string;
    sectionId: string;
  }>;
}) {
  const { id, sectionId } = use(params);

  const section = sectionData[sectionId];

  const languageLabel =
    section?.language === "ANGLOPHONE"
      ? "Anglophone"
      : "Francophone";

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
          title={section?.name || "Section"}
          subtitle={`${languageLabel} section`}
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">

          <div className="mx-auto max-w-7xl">

           

            {/* HEADER */}
            <div className="mb-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">

                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                      section?.language === "ANGLOPHONE"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    <GraduationCap size={32} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {languageLabel}
                    </p>

                    <h1 className="text-3xl font-bold">
                      {section?.name || "Section Not Found"}
                    </h1>

                  </div>

                </div>

              </div>

              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Manage students, subjects, teachers and academic
                information for this section.
              </p>

            </div>

            {/* SECTION OPTIONS */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* STUDENTS */}
              <Link
                href={`/admin/academic-years/${id}/sections/${sectionId}/students`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <Users size={23} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  Students
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View and manage students in this section.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-purple-600">
                  Manage students
                  <ArrowLeft
                    size={16}
                    className="rotate-180 transition-transform group-hover:translate-x-1"
                  />
                </div>

              </Link>

              {/* SUBJECTS */}
              <Link
                href={`/admin/subjects?academicYear=${id}&section=${sectionId}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <BookOpen size={23} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  Subjects
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Manage subjects assigned to this section.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  Manage subjects
                  <ArrowLeft
                    size={16}
                    className="rotate-180 transition-transform group-hover:translate-x-1"
                  />
                </div>

              </Link>

              {/* TEACHERS */}
              <Link
                href={`/admin/assignments?academicYear=${id}&section=${sectionId}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <UserPlus size={23} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  Teachers
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View teachers assigned to this section.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-green-600">
                  View teachers
                  <ArrowLeft
                    size={16}
                    className="rotate-180 transition-transform group-hover:translate-x-1"
                  />
                </div>

              </Link>

              {/* RESULTS */}
              <Link
                href={`/admin/results?academicYear=${id}&section=${sectionId}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-700"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <ClipboardList size={23} />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  Results
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View and manage academic results.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange-600">
                  Manage results
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
                    {section?.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    System
                  </p>

                  <p className="mt-1 font-semibold">
                    {languageLabel}
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