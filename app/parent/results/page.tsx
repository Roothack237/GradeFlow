"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Loader2,
  Lock,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";
import ChildSelector from "@/components/parent/ChildSelector";

type SubjectMark = {
  subject: string;
  coefficient: number;
  teacher: string;
  average: number;
  grade: string;
  remark: string | null;
  passed: boolean;
};

type SequenceResult = {
  id: string;
  name: string;
  subjects: SubjectMark[];
  average: number | null;
  marks: number;
};

type TermResult = {
  id: string;
  name: string;
  academicYear: string;
  sequences: SequenceResult[];
  marks: number;
  average: number | null;
  publication: { status: string; publishedAt: string | null };
  published: boolean;
};

type ResultsData = {
  student: { id: string; name: string; class: string | null };
  terms: TermResult[];
  scale: { passMark: number };
};

export default function ParentResultsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});

  const loadResults = useCallback(async (studentId: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/parent/results?studentId=${encodeURIComponent(studentId)}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load the results.");
      }

      setData(payload);

      /* open the first term that has marks by default */
      const firstWithMarks = payload.terms?.find((term: TermResult) => term.marks > 0);

      setOpenTerms(
        firstWithMarks ? { [firstWithMarks.id]: true } : {}
      );
    } catch (err) {
      console.error("Parent Results Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load the results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (childId) loadResults(childId);
  }, [childId, loadResults]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Results"
          subtitle="Marks by term and sequence for your children."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Results
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Follow your child's marks by term and sequence. Results appear
                once the administration publishes them.
              </p>
            </div>

            <ChildSelector selectedId={childId} onSelect={setChildId} />

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm">Loading results...</span>
                </div>
              </div>
            )}

            {!loading && data && childId && (
              <>
                {data.terms.length === 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                    <ClipboardList
                      size={40}
                      className="mx-auto text-gray-300 dark:text-gray-600"
                    />

                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      No term is configured for this class yet.
                    </p>
                  </div>
                )}

                <div className="space-y-5">
                  {data.terms.map((term) => (
                    <section
                      key={term.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                    >
                      {/* Term header */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenTerms((current) => ({
                            ...current,
                            [term.id]: !current[term.id],
                          }))
                        }
                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            <BookOpen size={20} />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {term.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              {term.academicYear} · {term.marks} marks
                              {term.average !== null && (
                                <> · average {term.average}/20</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {term.marks > 0 && !term.published && (
                            <span className="hidden items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 sm:inline-flex dark:bg-amber-950/40 dark:text-amber-300">
                              <Lock size={12} />
                              Pending publication
                            </span>
                          )}

                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${
                              openTerms[term.id] ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {openTerms[term.id] && (
                        <div className="border-t border-gray-100 p-5 dark:border-gray-800">
                          {term.marks === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No mark has been recorded for this term yet.
                            </p>
                          ) : !term.published ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                              <div className="flex items-start gap-3">
                                <Lock size={16} className="mt-0.5 shrink-0" />

                                <p>
                                  The results of this term have not been
                                  published by the administration yet. They will
                                  appear here as soon as they are released.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {term.sequences
                                .filter((sequence) => sequence.marks > 0)
                                .map((sequence) => (
                                  <div key={sequence.id}>
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                        {sequence.name}
                                      </h3>

                                      {sequence.average !== null && (
                                        <span
                                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
                                            sequence.average >= data.scale.passMark
                                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                          }`}
                                        >
                                          <Award size={14} />
                                          {sequence.average}/20
                                        </span>
                                      )}
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="w-full min-w-[560px] text-left text-sm">
                                        <thead>
                                          <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                                            <th className="pb-2.5 pr-4 font-semibold">Subject</th>
                                            <th className="pb-2.5 pr-4 font-semibold">Teacher</th>
                                            <th className="pb-2.5 pr-4 font-semibold">Average</th>
                                            <th className="pb-2.5 pr-4 font-semibold">Grade</th>
                                            <th className="pb-2.5 font-semibold">Remark</th>
                                          </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                          {sequence.subjects.map((subject) => (
                                            <tr key={subject.subject}>
                                              <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">
                                                {subject.subject}
                                                <span className="ml-2 text-xs font-normal text-gray-400">
                                                  coef {subject.coefficient}
                                                </span>
                                              </td>

                                              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                                {subject.teacher}
                                              </td>

                                              <td className="py-2.5 pr-4">
                                                <span
                                                  className={`font-bold ${
                                                    subject.passed
                                                      ? "text-emerald-600 dark:text-emerald-400"
                                                      : "text-red-600 dark:text-red-400"
                                                  }`}
                                                >
                                                  {subject.average}/20
                                                </span>
                                              </td>

                                              <td className="py-2.5 pr-4">
                                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                  {subject.grade}
                                                </span>
                                              </td>

                                              <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400">
                                                {subject.remark ?? "—"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
