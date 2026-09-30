
"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardList,
  Download,
  Loader2,
  Trophy,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";
import ChildSelector from "@/components/parent/ChildSelector";

type SubjectMark = {
  id: string;
  subject: string;
  coefficient: number;
  teacher: string;
  score: number;
  average: number;
  grade: string;
  remark: string | null;
  passed: boolean;
};

type SequenceResult = {
  id: string;
  name: string;
  order: number;
  subjects: SubjectMark[];
  average: number | null;
  rank: number | null;
  marks: number;
  publication: {
    status: string;
    publishedAt: string | null;
  };
};

type TermResult = {
  id: string;
  name: string;
  academicYear: string;
  order: number;
  sequences: SequenceResult[];
  publishedSequences: number;
  average?: number | null;
  publication: {
    status: string;
    publishedAt: string | null;
  };
};

type ResultsData = {
  student: {
    id: string;
    name: string;
    matricule: string;
    class: string | null;
    section: string | null;
  };

  terms: TermResult[];

  reportCards: {
    id: string;
    termId: string;
    term: string;
    average: number;
    position: number | null;
    decision: string | null;
    principalRemark: string | null;
    pdfUrl: string | null;
    generatedAt: string;
  }[];

  scale: {
    maxMark: number;
    passMark: number;
  };
};

async function downloadChildResultsPdf(data: ResultsData) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const purple = rgb(0.4, 0.22, 0.62);
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const safeText = (value: unknown) =>
    String(value ?? "—").replace(/[^\x20-\x7E]/g, "?");

  const addPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    page.drawText("GradeFlow | Published Academic Results", {
      x: margin,
      y,
      size: 9,
      font: bold,
      color: purple,
    });
    y -= 17;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1.5,
      color: purple,
    });
    y -= 20;
  };

  const ensureSpace = (height: number) => {
    if (y - height < margin) addPage();
  };

  const drawParagraph = (
    value: unknown,
    options: { size?: number; font?: typeof regular; color?: typeof purple; indent?: number } = {}
  ) => {
    const size = options.size ?? 9;
    const font = options.font ?? regular;
    const indent = options.indent ?? 0;
    const maxWidth = pageWidth - margin * 2 - indent;
    const words = safeText(value).split(/\s+/);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        ensureSpace(size + 5);
        page.drawText(line, {
          x: margin + indent,
          y,
          size,
          font,
          color: options.color ?? rgb(0.15, 0.17, 0.2),
        });
        y -= size + 5;
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) {
      ensureSpace(size + 5);
      page.drawText(line, {
        x: margin + indent,
        y,
        size,
        font,
        color: options.color ?? rgb(0.15, 0.17, 0.2),
      });
      y -= size + 5;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(40);
    y -= 4;
    page.drawText(safeText(title), {
      x: margin,
      y,
      size: 13,
      font: bold,
      color: purple,
    });
    y -= 18;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1.25,
      color: purple,
    });
    y -= 13;
  };

  page.drawText("GRADE FLOW", {
    x: margin,
    y,
    size: 10,
    font: bold,
    color: purple,
  });
  y -= 23;
  page.drawText("Academic Results", {
    x: margin,
    y,
    size: 22,
    font: bold,
    color: rgb(0.12, 0.14, 0.18),
  });
  y -= 27;
  drawParagraph(data.student.name, { size: 14, font: bold });
  drawParagraph(
    `Matricule: ${data.student.matricule} | Class: ${data.student.class ?? "—"} | Section: ${data.student.section ?? "—"}`,
    { size: 9 }
  );
  drawParagraph(`Grading scale: ${data.scale.maxMark} | Pass mark: ${data.scale.passMark}`, {
    size: 9,
  });
  drawParagraph(`Generated: ${new Date().toLocaleDateString()}`, {
    size: 9,
    color: rgb(0.4, 0.42, 0.45),
  });
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
    color: purple,
  });
  y -= 14;

  if (data.terms.length === 0) {
    drawParagraph("No published results are currently available for this child.");
  }

  for (const term of data.terms) {
    drawSectionHeading(`${term.name} | ${term.academicYear}`);

    for (const sequence of term.sequences) {
      ensureSpace(42);
      drawParagraph(sequence.name, { size: 11, font: bold });
      drawParagraph(
        `Average: ${sequence.average === null ? "—" : `${sequence.average}/${data.scale.maxMark}`} | Class rank: ${sequence.rank ?? "—"} | Published: ${sequence.publication.publishedAt ? new Date(sequence.publication.publishedAt).toLocaleDateString() : "—"}`,
        { size: 9 }
      );

      if (sequence.subjects.length === 0) {
        drawParagraph("No published subject marks for this sequence.", { indent: 8 });
      }

      for (const subject of sequence.subjects) {
        ensureSpace(36);
        drawParagraph(
          `${subject.subject} | ${subject.score}/${data.scale.maxMark} | Grade ${subject.grade} | Coefficient ${subject.coefficient}`,
          { font: bold, indent: 8 }
        );
        drawParagraph(`Teacher: ${subject.teacher} | Remark: ${subject.remark ?? "—"}`, {
          size: 8,
          indent: 8,
          color: rgb(0.38, 0.4, 0.44),
        });
      }
      y -= 7;
    }
  }

  if (data.reportCards.length > 0) {
    drawSectionHeading("Published Term Summaries");
    for (const card of data.reportCards) {
      drawParagraph(
        `${card.term} | Average: ${card.average}/${data.scale.maxMark} | Position: ${card.position ?? "—"} | Decision: ${card.decision ?? "—"}`,
        { font: bold }
      );
      if (card.principalRemark) {
        drawParagraph(`Principal remark: ${card.principalRemark}`, { indent: 8 });
      }
    }
  }

  const bytes = await pdf.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = data.student.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  link.href = url;
  link.download = `gradeflow-${safeName}-results.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ParentResultsPage() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [childId, setChildId] =
    useState<string | null>(null);

  const [data, setData] =
    useState<ResultsData | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [downloadingPdf, setDownloadingPdf] =
    useState(false);

  const [error, setError] =
    useState("");

  const [openTerms, setOpenTerms] =
    useState<Record<string, boolean>>({});

  const [openSequences, setOpenSequences] =
    useState<Record<string, boolean>>({});

  const loadResults = useCallback(
    async (studentId: string) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/parent/results?studentId=${encodeURIComponent(
            studentId
          )}`,
          {
            cache: "no-store",
          }
        );

        const payload =
          await response.json();

        console.log(
          "PARENT RESULTS RESPONSE:",
          payload
        );

        if (!response.ok) {
          throw new Error(
            payload.error ||
              payload.message ||
              "Failed to load results."
          );
        }

        setData(payload);

        /*
         * Open the first available term.
         */
        const firstTerm =
          payload.terms?.[0];

        setOpenTerms(
          firstTerm
            ? {
                [firstTerm.id]: true,
              }
            : {}
        );

        /*
         * Open the first published sequence
         * of the first term.
         */
        const firstSequence =
          firstTerm?.sequences?.[0];

        setOpenSequences(
          firstSequence
            ? {
                [firstSequence.id]: true,
              }
            : {}
        );
      } catch (err) {
        console.error(
          "Parent Results Error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load the results."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (childId) {
      loadResults(childId);
    } else {
      setData(null);
    }
  }, [childId, loadResults]);

  const formatDate = (
    value: string | null
  ) => {
    if (!value) return "";

    return new Date(value).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  async function downloadResults() {
    if (!data || data.terms.length === 0) return;

    try {
      setDownloadingPdf(true);
      await downloadChildResultsPdf(data);
    } catch (downloadError) {
      console.error("PARENT RESULTS PDF ERROR:", downloadError);
      setError("Unable to generate the results PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          title="Results"
          subtitle="View your children's published academic results."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-6xl">

            {/* PAGE HEADER */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Results
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Published results appear here as soon as the administration releases them.
              </p>
            </div>

            {/* CHILD SELECTOR */}
            <ChildSelector
              selectedId={childId}
              onSelect={setChildId}
            />

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2
                    size={22}
                    className="animate-spin"
                  />

                  <span className="text-sm">
                    Loading results...
                  </span>
                </div>
              </div>
            )}

            {/* NO CHILD SELECTED */}
            {!loading &&
              !data &&
              !error && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                  <ClipboardList
                    size={42}
                    className="mx-auto text-purple-300"
                  />

                  <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Select a child to view results.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Only results published by the administration will appear.
                  </p>
                </div>
              )}

            {/* RESULTS */}
            {!loading &&
              data &&
              childId && (
                <>
                  {/* STUDENT SUMMARY */}
                  <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {data.student.name}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            Matricule:{" "}
                            {data.student.matricule}
                          </span>

                          {data.student.class && (
                            <span>
                              Class:{" "}
                              {data.student.class}
                            </span>
                          )}

                          {data.student.section && (
                            <span>
                              Section:{" "}
                              {data.student.section}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={downloadResults}
                          disabled={downloadingPdf || data.terms.length === 0}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {downloadingPdf ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          {downloadingPdf ? "Preparing PDF..." : "Download results PDF"}
                        </button>

                        <div className="rounded-xl bg-purple-50 px-4 py-3 text-center dark:bg-purple-950/30">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                            Pass mark
                          </p>

                          <p className="mt-0.5 text-lg font-bold text-purple-700 dark:text-purple-300">
                            {data.scale.passMark}/
                            {data.scale.maxMark}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NO PUBLISHED RESULTS */}
                  {data.terms.length === 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                      <BookOpen
                        size={42}
                        className="mx-auto text-purple-300"
                      />

                      <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        No published results yet.
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Results will appear here when the administration publishes them.
                      </p>
                    </div>
                  )}

                  {/* TERMS */}
                  <div className="space-y-5">
                    {data.terms.map(
                      (term) => (
                        <section
                          key={term.id}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                        >
                          {/* TERM HEADER */}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenTerms(
                                (current) => ({
                                  ...current,
                                  [term.id]:
                                    !current[
                                      term.id
                                    ],
                                })
                              )
                            }
                            className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                <BookOpen
                                  size={20}
                                />
                              </div>

                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {term.name}
                                </p>

                                <p className="mt-0.5 text-xs text-gray-400">
                                  {term.academicYear}{" "}
                                  ·{" "}
                                  {
                                    term.publishedSequences
                                  }{" "}
                                  published sequence
                                  {term.publishedSequences !==
                                  1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </div>

                            <ChevronDown
                              size={18}
                              className={`text-gray-400 transition-transform ${
                                openTerms[term.id]
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </button>

                          {/* TERM CONTENT */}
                          {openTerms[term.id] && (
                            <div className="border-t border-gray-100 p-5 dark:border-gray-800">
                              <div className="space-y-5">

                                {term.sequences.map(
                                  (
                                    sequence
                                  ) => {
                                    const sequenceOpen =
                                      openSequences[
                                        sequence.id
                                      ];

                                    return (
                                      <div
                                        key={
                                          sequence.id
                                        }
                                        className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800"
                                      >
                                        {/* SEQUENCE HEADER */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setOpenSequences(
                                              (
                                                current
                                              ) => ({
                                                ...current,
                                                [sequence.id]:
                                                  !current[
                                                    sequence
                                                      .id
                                                  ],
                                              })
                                            )
                                          }
                                          className="flex w-full items-center justify-between gap-4 bg-gray-50 p-4 text-left dark:bg-gray-800/40"
                                        >
                                          <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                {
                                                  sequence.name
                                                }
                                              </h3>

                                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                Published
                                              </span>
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                              {sequence.publication.publishedAt && (
                                                <span className="flex items-center gap-1">
                                                  <Calendar
                                                    size={
                                                      12
                                                    }
                                                  />

                                                  Published{" "}
                                                  {formatDate(
                                                    sequence
                                                      .publication
                                                      .publishedAt
                                                  )}
                                                </span>
                                              )}

                                              <span>
                                                {
                                                  sequence.marks
                                                }{" "}
                                                mark
                                                {sequence.marks !==
                                                1
                                                  ? "s"
                                                  : ""}
                                              </span>
                                            </div>
                                          </div>

                                          <ChevronDown
                                            size={
                                              18
                                            }
                                            className={`shrink-0 text-gray-400 transition-transform ${
                                              sequenceOpen
                                                ? "rotate-180"
                                                : ""
                                            }`}
                                          />
                                        </button>

                                        {sequenceOpen && (
                                          <div className="p-4">

                                            {/* SEQUENCE SUMMARY */}
                                            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                                              <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-950/20">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                                                  Average
                                                </p>

                                                <p className="mt-1 text-xl font-bold text-purple-700 dark:text-purple-300">
                                                  {sequence.average !==
                                                  null
                                                    ? `${sequence.average}/20`
                                                    : "—"}
                                                </p>
                                              </div>

                                              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                                  Class rank
                                                </p>

                                                <p className="mt-1 flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-blue-300">
                                                  <Trophy
                                                    size={
                                                      18
                                                    }
                                                  />

                                                  {sequence.rank
                                                    ? `${sequence.rank}`
                                                    : "—"}
                                                </p>
                                              </div>

                                              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                  Status
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                  Published
                                                </p>
                                              </div>
                                            </div>

                                            {/* SUBJECT TABLE */}
                                            <div className="overflow-x-auto">
                                              <table className="w-full min-w-[650px] text-left text-sm">
                                                <thead>
                                                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800">
                                                    <th className="pb-3 pr-4 font-semibold">
                                                      Subject
                                                    </th>

                                                    <th className="pb-3 pr-4 font-semibold">
                                                      Teacher
                                                    </th>

                                                    <th className="pb-3 pr-4 font-semibold">
                                                      Score
                                                    </th>

                                                    <th className="pb-3 pr-4 font-semibold">
                                                      Grade
                                                    </th>

                                                    <th className="pb-3 font-semibold">
                                                      Remark
                                                    </th>
                                                  </tr>
                                                </thead>

                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                  {sequence.subjects.map(
                                                    (
                                                      subject
                                                    ) => (
                                                      <tr
                                                        key={
                                                          subject.id
                                                        }
                                                      >
                                                        <td className="py-3 pr-4">
                                                          <div className="font-semibold text-gray-900 dark:text-white">
                                                            {
                                                              subject.subject
                                                            }
                                                          </div>

                                                          <div className="mt-0.5 text-xs text-gray-400">
                                                            Coef.{" "}
                                                            {
                                                              subject.coefficient
                                                            }
                                                          </div>
                                                        </td>

                                                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                                                          {
                                                            subject.teacher
                                                          }
                                                        </td>

                                                        <td className="py-3 pr-4">
                                                          <span
                                                            className={`font-bold ${
                                                              subject.passed
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-red-600 dark:text-red-400"
                                                            }`}
                                                          >
                                                            {
                                                              subject.score
                                                            }
                                                            /20
                                                          </span>
                                                        </td>

                                                        <td className="py-3 pr-4">
                                                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                            {
                                                              subject.grade
                                                            }
                                                          </span>
                                                        </td>

                                                        <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                                                          {subject.remark ??
                                                            "—"}
                                                        </td>
                                                      </tr>
                                                    )
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>

                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}

                              </div>
                            </div>
                          )}
                        </section>
                      )
                    )}
                  </div>

                  {/* REPORT CARDS */}
                  {data.reportCards.length >
                    0 && (
                    <div className="mt-8">
                      <div className="mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Report Cards
                        </h2>

                        <p className="text-xs text-gray-400">
                          Published term report cards.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {data.reportCards.map(
                          (card) => (
                            <div
                              key={card.id}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                            >
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {card.term}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                                  <span>
                                    Average:{" "}
                                    {
                                      card.average
                                    }
                                    /20
                                  </span>

                                  {card.position && (
                                    <span>
                                      Position:{" "}
                                      {
                                        card.position
                                      }
                                    </span>
                                  )}

                                  {card.decision && (
                                    <span>
                                      {
                                        card.decision
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>

                              {card.pdfUrl && (
                                <a
                                  href={
                                    card.pdfUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
                                >
                                  View report card
                                </a>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
