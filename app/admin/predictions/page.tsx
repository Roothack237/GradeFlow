"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  Download,
  Info,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Select,
  StatCard,
  TableWrap,
  Td,
  Th,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type Prediction = {
  id: string;
  name: string;
  matricule: string;
  className: string | null;
  sectionName: string | null;
  marks: number;
  currentAverage: number | null;
  lastSequenceAverage: number | null;
  trend: number | null;
  attendanceRate: number | null;
  projectedAverage: number | null;
  passProbability: number | null;
  riskLevel: string;
  factors: string[];
  weakestSubject: string | null;
  strongestSubject: string | null;
};

type PredictionsPayload = {
  term: {
    id: string;
    name: string;
    academicYear: { name: string };
  } | null;
  generatedAt?: string;
  methodology?: {
    name: string;
    description: string;
    projectedAverage: string;
    passProbability: string;
    riskLevels: Record<string, string>;
  };
  summary: {
    students: number;
    analysed: number;
    atRisk: number;
    highRisk: number;
    predictedPassRate: number | null;
    average: number | null;
    improving: number;
    declining: number;
  };
  students: Prediction[];
  subjects: {
    id: string;
    name: string;
    marks: number;
    average: number | null;
    atRisk: number;
    atRiskRate: number;
  }[];
  classes: {
    id: string;
    name: string;
    students: number;
    atRisk: number;
    predictedPassRate: number;
  }[];
  message?: string;
};

type Recommendation = {
  title: string;
  action: string;
  evidence: string;
  icon: "risk" | "subject" | "class" | "attendance" | "trend" | "monitor";
  tone: "red" | "amber" | "blue" | "emerald" | "gray";
};

async function downloadPredictionsPdf(
  data: PredictionsPayload,
  scopeLabel: string,
  recommendations: Recommendation[]
) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const purple = rgb(0.38, 0.22, 0.61);
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const cleanText = (value: unknown) =>
    String(value ?? "—").replace(/[^\x20-\x7E]/g, "?");

  const addPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    page.drawText("GradeFlow | Predictions & Analytics", {
      x: margin,
      y,
      size: 9,
      font: bold,
      color: purple,
    });
    y -= 16;
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
    const maxWidth = contentWidth - indent;
    const words = cleanText(value).split(/\s+/);
    let line = "";

    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(nextLine, size) > maxWidth) {
        ensureSpace(size + 5);
        page.drawText(line, {
          x: margin + indent,
          y,
          size,
          font,
          color: options.color ?? rgb(0.16, 0.18, 0.22),
        });
        y -= size + 5;
        line = word;
      } else {
        line = nextLine;
      }
    }

    if (line) {
      ensureSpace(size + 5);
      page.drawText(line, {
        x: margin + indent,
        y,
        size,
        font,
        color: options.color ?? rgb(0.16, 0.18, 0.22),
      });
      y -= size + 5;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(38);
    y -= 4;
    page.drawText(cleanText(title), {
      x: margin,
      y,
      size: 13,
      font: bold,
      color: purple,
    });
    y -= 17;
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
  page.drawText("Predictions & Recommendations", {
    x: margin,
    y,
    size: 21,
    font: bold,
    color: rgb(0.12, 0.14, 0.19),
  });
  y -= 22;
  drawParagraph(`Scope: ${scopeLabel}`, { size: 11, font: bold });
  drawParagraph(
    `Term: ${data.term?.name ?? "Not available"} | Academic year: ${data.term?.academicYear.name ?? "Not available"}`,
    { size: 9, color: rgb(0.38, 0.4, 0.44) }
  );
  drawParagraph(`Generated: ${new Date().toLocaleDateString()}`, {
    size: 9,
    color: rgb(0.38, 0.4, 0.44),
  });
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
    color: purple,
  });
  y -= 14;

  drawSectionHeading("Prediction Summary");
  drawParagraph(`Students in scope: ${data.summary.students}`);
  drawParagraph(`Students analysed: ${data.summary.analysed}`);
  drawParagraph(`Students at risk: ${data.summary.atRisk} (${data.summary.highRisk} high risk)`);
  drawParagraph(
    `Predicted pass rate: ${data.summary.predictedPassRate === null ? "Not available" : `${data.summary.predictedPassRate}%`}`
  );
  drawParagraph(`Current average: ${data.summary.average === null ? "Not available" : `${data.summary.average}/20`}`);
  drawParagraph(`Improving: ${data.summary.improving} | Declining: ${data.summary.declining}`);

  drawSectionHeading("Recommendations");
  if (recommendations.length === 0) {
    drawParagraph("No recommendations are available for this scope.");
  }
  for (const recommendation of recommendations) {
    drawParagraph(recommendation.title, { font: bold, color: purple });
    drawParagraph(recommendation.action, { indent: 10 });
    drawParagraph(`Evidence: ${recommendation.evidence}`, {
      size: 8,
      indent: 10,
      color: rgb(0.38, 0.4, 0.44),
    });
    y -= 5;
  }

  drawSectionHeading("Class Projections");
  if (data.classes.length === 0) {
    drawParagraph("No class projection data is available.");
  }
  for (const classroom of data.classes) {
    drawParagraph(
      `${classroom.name} | Predicted pass probability: ${classroom.predictedPassRate}% | At risk: ${classroom.atRisk} of ${classroom.students}`,
      { font: bold }
    );
  }

  drawSectionHeading("Subjects Needing Attention");
  const subjects = data.subjects.filter((subject) => subject.atRisk > 0);
  if (subjects.length === 0) {
    drawParagraph("No recorded subject marks are currently below the pass mark.");
  }
  for (const subject of subjects) {
    drawParagraph(
      `${subject.name} | Average: ${subject.average ?? "Not available"}/20 | Below pass mark: ${subject.atRisk} of ${subject.marks} (${subject.atRiskRate}%)`
    );
  }

  drawSectionHeading("Student Predictions");
  const orderedStudents = [...data.students].sort((left, right) => {
    const riskOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, UNKNOWN: 3 };
    return (riskOrder[left.riskLevel] ?? 4) - (riskOrder[right.riskLevel] ?? 4);
  });
  for (const student of orderedStudents) {
    drawParagraph(
      `${student.name} (${student.matricule}) | ${student.className ?? "No class"} | Risk: ${student.riskLevel}`,
      { font: bold }
    );
    drawParagraph(
      `Current average: ${student.currentAverage === null ? "—" : `${student.currentAverage}/20`} | Projected: ${student.projectedAverage === null ? "—" : `${student.projectedAverage}/20`} | Pass probability: ${student.passProbability === null ? "—" : `${student.passProbability}%`}`,
      { size: 8, indent: 10 }
    );
    drawParagraph(
      `Attendance: ${student.attendanceRate === null ? "—" : `${student.attendanceRate}%`} | Trend: ${student.trend === null ? "—" : `${student.trend > 0 ? "+" : ""}${student.trend}`} | Strongest subject: ${student.strongestSubject ?? "—"} | Weakest subject: ${student.weakestSubject ?? "—"}`,
      { size: 8, indent: 10 }
    );
    y -= 4;
  }

  const bytes = await pdf.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeScope = scopeLabel.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  link.href = url;
  link.download = `gradeflow-predictions-${safeScope}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const RISK_TONE: Record<string, "red" | "amber" | "green" | "gray"> = {
  HIGH: "red",
  MEDIUM: "amber",
  LOW: "green",
  UNKNOWN: "gray",
};

/* =========================================================
   PAGE
========================================================= */

export default function PredictionsPage() {
  const [data, setData] = useState<PredictionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [termId, setTermId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [scopeMode, setScopeMode] = useState<"overall" | "class">("overall");
  const [riskFilter, setRiskFilter] = useState("");
  const [search, setSearch] = useState("");

  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [showMethod, setShowMethod] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  /* ---------------- lookups ---------------- */

  useEffect(() => {
    async function loadLookups() {
      try {
        const [termsRes, classesRes] = await Promise.all([
          fetch("/api/admin/terms", { cache: "no-store" }),
          fetch("/api/admin/classes", { cache: "no-store" }),
        ]);

        if (termsRes.ok) {
          const payload = await termsRes.json();

          const list = payload.terms ?? [];

          setTerms(list);

          const current =
            list.find((term: { isCurrent?: boolean }) => term.isCurrent) ??
            list[0];

          if (current) setTermId((value) => value || current.id);
        }

        if (classesRes.ok) {
          const payload = await classesRes.json();

          setClasses(
            (payload.classes ?? []).map(
              (classroom: { id: string; name: string }) => ({
                id: classroom.id,
                name: classroom.name,
              })
            )
          );
        }
      } catch {
        /* non critical */
      }
    }

    loadLookups();
  }, []);

  /* ---------------- load predictions ---------------- */

  const load = useCallback(async () => {
    if (scopeMode === "class" && !classroomId) {
      setError("Choose a class to generate class-specific predictions.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (termId) params.set("termId", termId);
      if (scopeMode === "class" && classroomId) {
        params.set("classroomId", classroomId);
      }

      const response = await fetch(`/api/admin/predictions?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      setData(await response.json());
    } catch {
      setError("Unable to load the predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [termId, classroomId, scopeMode]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- derived ---------------- */

  const students = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (data?.students ?? []).filter((student) => {
      if (riskFilter && student.riskLevel !== riskFilter) return false;

      if (!term) return true;

      return `${student.name} ${student.matricule} ${student.className ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [data, riskFilter, search]);

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!data) return [];

    const items: Recommendation[] = [];
    const highRiskStudents = data.students
      .filter((student) => student.riskLevel === "HIGH")
      .sort(
        (left, right) =>
          (left.passProbability ?? 0) - (right.passProbability ?? 0)
      );

    if (highRiskStudents.length > 0) {
      const focusStudents = highRiskStudents.slice(0, 3);
      const names = focusStudents
        .map((student) => `${student.name}${student.className ? ` (${student.className})` : ""}`)
        .join(", ");
      items.push({
        title: "Prioritize high-risk students",
        action: `Arrange individual check-ins and targeted revision for ${names}${highRiskStudents.length > focusStudents.length ? ` and ${highRiskStudents.length - focusStudents.length} other student(s)` : ""}.`,
        evidence: `${highRiskStudents.length} high-risk student(s)${data.summary.highRisk !== highRiskStudents.length ? ` in this class filter; ${data.summary.highRisk} across the selected term` : ""}`,
        icon: "risk",
        tone: "red",
      });
    }

    const prioritySubjects = data.subjects
      .filter((subject) => subject.atRisk > 0)
      .slice(0, 2);

    for (const subject of prioritySubjects) {
      items.push({
        title: `Review ${subject.name}`,
        action: `Plan focused practice and check understanding in ${subject.name}.`,
        evidence: `${subject.atRisk} of ${subject.marks} marks below the pass mark (${subject.atRiskRate}%); average ${subject.average ?? "not available"}/20`,
        icon: "subject",
        tone: subject.atRiskRate >= 40 ? "red" : "amber",
      });
    }

    const classToSupport = data.classes.find(
      (classroom) => classroom.students > 0 && classroom.predictedPassRate < 70
    );
    if (classToSupport) {
      items.push({
        title: `Plan class support for ${classToSupport.name}`,
        action: "Review recent assessments with the class and schedule focused support for students flagged at risk.",
        evidence: `${classToSupport.predictedPassRate}% predicted pass probability; ${classToSupport.atRisk} of ${classToSupport.students} student(s) flagged at risk`,
        icon: "class",
        tone: classToSupport.predictedPassRate < 50 ? "red" : "amber",
      });
    }

    const attendanceConcerns = data.students
      .filter(
        (student) =>
          student.attendanceRate !== null && student.attendanceRate < 75
      )
      .sort(
        (left, right) =>
          (left.attendanceRate ?? 100) - (right.attendanceRate ?? 100)
      );
    if (attendanceConcerns.length > 0) {
      const student = attendanceConcerns[0];
      items.push({
        title: "Follow up on attendance",
        action: `Check in with ${student.name}${student.className ? ` (${student.className})` : ""} and identify barriers to attendance.`,
        evidence: `${attendanceConcerns.length} student(s) below 75% attendance; lowest recorded rate is ${student.attendanceRate}%`,
        icon: "attendance",
        tone: "amber",
      });
    }

    const decliningStudents = data.students
      .filter((student) => student.trend !== null && student.trend < -3)
      .sort((left, right) => (left.trend ?? 0) - (right.trend ?? 0));
    if (decliningStudents.length > 0) {
      const student = decliningStudents[0];
      items.push({
        title: "Check recent performance declines",
        action: `Meet with ${student.name}${student.className ? ` (${student.className})` : ""} to identify where performance is slipping and agree on a short follow-up plan.`,
        evidence: `${decliningStudents.length} student(s) declined by more than 3 points between the latest recorded sequences; this student's trend is ${student.trend} points`,
        icon: "trend",
        tone: "blue",
      });
    }

    if (items.length === 0 && data.summary.analysed > 0) {
      items.push({
        title: "Maintain current support and monitor progress",
        action: "Continue the current learning support and review the next sequence results for changes in risk or performance.",
        evidence: `${data.summary.analysed} student(s) analysed; ${data.summary.atRisk} currently flagged at risk; ${data.summary.improving} improving`,
        icon: "monitor",
        tone: "emerald",
      });
    } else if (items.length === 0) {
      items.push({
        title: "More recorded marks are needed",
        action: "Record marks and attendance for this term before using performance recommendations.",
        evidence: `${data.summary.students} student(s) in scope; ${data.summary.analysed} have enough recorded marks to analyse`,
        icon: "monitor",
        tone: "gray",
      });
    }

    return items;
  }, [data]);

  function exportCsv() {
    if (!data) return;

    const header = [
      "Student",
      "Matricule",
      "Class",
      "Current average",
      "Trend",
      "Attendance %",
      "Projected average",
      "Pass probability %",
      "Risk",
      "Factors",
    ];

    const lines = students.map((student) =>
      [
        student.name,
        student.matricule,
        student.className ?? "",
        student.currentAverage ?? "",
        student.trend ?? "",
        student.attendanceRate ?? "",
        student.projectedAverage ?? "",
        student.passProbability ?? "",
        student.riskLevel,
        student.factors.join(" / "),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `gradeflow-predictions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    if (!data) return;

    try {
      setDownloadingPdf(true);
      await downloadPredictionsPdf(data, analysisScopeLabel, recommendations);
    } catch (pdfError) {
      console.error("PREDICTIONS PDF ERROR:", pdfError);
      alert("Unable to generate the predictions PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  const activeFilters = (riskFilter ? 1 : 0) + (search ? 1 : 0);
  const selectedClass = classes.find((classroom) => classroom.id === classroomId);
  const analysisScopeLabel =
    scopeMode === "class"
      ? selectedClass?.name ?? "Selected class"
      : "Overall classes";

  return (
    <AdminShell
      title="Predictions"
      subtitle="Risk and performance projections computed from the marks and attendance in the database."
    >
      <PageHeader
        title="Predictions & Analytics"
        subtitle="Every projection below is derived from recorded school data — nothing is simulated."
      >
        <Button variant="secondary" onClick={exportCsv} disabled={!students.length}>
          <Download size={16} />
          Export CSV
        </Button>

        <Button variant="secondary" onClick={() => setShowMethod((value) => !value)}>
          <Info size={16} />
          Method
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Projected pass rate"
          value={
            data?.summary.predictedPassRate === null ||
            data?.summary.predictedPassRate === undefined
              ? "—"
              : `${data.summary.predictedPassRate}%`
          }
          icon={<Brain size={20} />}
          tone="purple"
          loading={loading && !data}
        />
        <StatCard
          label="Students at risk"
          value={data?.summary.atRisk ?? 0}
          icon={<ShieldAlert size={20} />}
          tone={data?.summary.atRisk ? "amber" : "gray"}
          hint={`${data?.summary.highRisk ?? 0} high risk`}
          loading={loading && !data}
        />
        <StatCard
          label="Improving"
          value={data?.summary.improving ?? 0}
          icon={<TrendingUp size={20} />}
          tone="emerald"
          loading={loading && !data}
        />
        <StatCard
          label="Declining"
          value={data?.summary.declining ?? 0}
          icon={<TrendingDown size={20} />}
          tone={data?.summary.declining ? "red" : "gray"}
          loading={loading && !data}
        />
      </div>

      {data ? (
        <Card
          title={scopeMode === "class" ? `Recommendations: ${analysisScopeLabel}` : "Overall recommendations"}
          description={`Suggested actions based on recorded marks, attendance and projections for ${analysisScopeLabel.toLowerCase()} in ${data.term?.name ?? "the selected term"}.`}
          className="mb-6"
        >
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recommendations.map((recommendation, index) => {
              const toneClass =
                recommendation.tone === "red"
                  ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                  : recommendation.tone === "amber"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : recommendation.tone === "blue"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : recommendation.tone === "emerald"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

              return (
                <li
                  key={`${recommendation.title}-${index}`}
                  className="flex gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
                    {recommendation.icon === "risk" ? (
                      <ShieldAlert size={18} />
                    ) : recommendation.icon === "subject" ? (
                      <Brain size={18} />
                    ) : recommendation.icon === "class" ? (
                      <Users size={18} />
                    ) : recommendation.icon === "attendance" ? (
                      <Info size={18} />
                    ) : recommendation.icon === "trend" ? (
                      <TrendingDown size={18} />
                    ) : (
                      <RefreshCw size={18} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {recommendation.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {recommendation.action}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Evidence: {recommendation.evidence}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {showMethod && data?.methodology ? (
        <Card title={data.methodology.name} className="mb-6">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>{data.methodology.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Projected average
                </p>
                <p className="mt-1">{data.methodology.projectedAverage}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Pass probability
                </p>
                <p className="mt-1">{data.methodology.passProbability}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Risk levels
              </p>
              <ul className="mt-1 space-y-1">
                {Object.entries(data.methodology.riskLevels).map(
                  ([level, description]) => (
                    <li key={level}>
                      <Badge tone={RISK_TONE[level] ?? "gray"}>{level}</Badge>{" "}
                      {description}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      <Card bodyClassName="p-4" className="mb-5">
        <div className="mb-4">
          <Field label="Prediction scope">
            <div className="inline-flex w-full rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800 sm:w-auto">
              <button
                type="button"
                aria-pressed={scopeMode === "overall"}
                onClick={() => {
                  setScopeMode("overall");
                  setClassroomId("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                  scopeMode === "overall"
                    ? "bg-white text-purple-700 shadow-sm dark:bg-gray-700 dark:text-purple-200"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                Overall
              </button>
              <button
                type="button"
                aria-pressed={scopeMode === "class"}
                disabled={classes.length === 0}
                onClick={() => {
                  setScopeMode("class");
                  setClassroomId((current) => current || classes[0]?.id || "");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                  scopeMode === "class"
                    ? "bg-white text-purple-700 shadow-sm dark:bg-gray-700 dark:text-purple-200"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                Per class
              </button>
            </div>
          </Field>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <Field label="Term">
            <Select
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
            >
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Select>
          </Field>

          {scopeMode === "class" ? (
            <Field label="Class">
              <Select
                value={classroomId}
                onChange={(event) => setClassroomId(event.target.value)}
              >
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div className="flex items-end pb-2 text-sm text-gray-500 dark:text-gray-400">
              Overall scope includes all classes.
            </div>
          )}

          <Field label="Risk level">
            <Select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
            >
              <option value="">All levels</option>
              <option value="HIGH">High risk</option>
              <option value="MEDIUM">Medium risk</option>
              <option value="LOW">Low risk</option>
              <option value="UNKNOWN">No data yet</option>
            </Select>
          </Field>

          <Field label="Search">
            <div className="relative">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student or matricule…"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="primary" onClick={load} loading={loading}>
            <RefreshCw size={16} />
            Generate {scopeMode === "class" ? "Class" : "Overall"} Predictions
          </Button>
          <Button
            variant="secondary"
            onClick={exportPdf}
            disabled={!data || loading || downloadingPdf}
            loading={downloadingPdf}
          >
            <Download size={16} />
            Download PDF
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card title="Computing predictions">
          <LoadingState label="Analysing marks, attendance and trends…" />
        </Card>
      ) : !data || data.students.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Brain size={20} />}
            title="Nothing to predict yet"
            message={
              data?.message ??
              "Record marks and attendance for this term and the predictions will appear here."
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="Class projections"
              description="Average pass probability per class, lowest first."
            >
              <div className="space-y-3">
                {data.classes.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {classroom.name}
                      </p>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {classroom.predictedPassRate}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full ${
                          classroom.predictedPassRate >= 70
                            ? "bg-emerald-500"
                            : classroom.predictedPassRate >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, classroom.predictedPassRate)
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {classroom.students} student(s) ·{" "}
                      {classroom.atRisk} flagged at risk
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Subjects needing attention"
              description="Share of recorded marks below the pass mark."
            >
              <div className="space-y-3">
                {data.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {subject.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {subject.marks} mark(s) · average {subject.average ?? "—"}
                      </p>
                    </div>

                    <Badge
                      tone={
                        subject.atRiskRate >= 40
                          ? "red"
                          : subject.atRiskRate >= 20
                            ? "amber"
                            : "green"
                      }
                    >
                      {subject.atRiskRate}% below 50
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card
            title="Student risk analysis"
            description={`${students.length} student(s) shown${
              activeFilters ? " with the current filters" : ""
            }`}
          >
            <TableWrap>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th className="text-right">Average</Th>
                  <Th className="text-right">Trend</Th>
                  <Th className="text-right">Attendance</Th>
                  <Th className="text-right">Projected</Th>
                  <Th className="text-right">Pass probability</Th>
                  <Th>Risk</Th>
                  <Th>Signals</Th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <Td className="font-medium">
                      {student.name}
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        {student.matricule}
                      </span>
                    </Td>
                    <Td className="text-sm">{student.className ?? "—"}</Td>
                    <Td className="text-right">{student.currentAverage ?? "—"}</Td>
                    <Td className="text-right">
                      {student.trend === null ? (
                        "—"
                      ) : (
                        <span
                          className={
                            student.trend >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {student.trend > 0 ? "+" : ""}
                          {student.trend}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right">
                      {student.attendanceRate === null
                        ? "—"
                        : `${student.attendanceRate}%`}
                    </Td>
                    <Td className="text-right font-semibold">
                      {student.projectedAverage ?? "—"}
                    </Td>
                    <Td className="text-right">
                      {student.passProbability === null
                        ? "—"
                        : `${student.passProbability}%`}
                    </Td>
                    <Td>
                      <Badge tone={RISK_TONE[student.riskLevel] ?? "gray"}>
                        {student.riskLevel.toLowerCase()}
                      </Badge>
                    </Td>
                    <Td>
                      {student.factors.length === 0 ? (
                        <span className="text-xs text-gray-400">
                          No signal
                        </span>
                      ) : (
                        <ul className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {student.factors.slice(0, 2).map((factor) => (
                            <li key={factor}>• {factor}</li>
                          ))}
                          {student.factors.length > 2 ? (
                            <li>+{student.factors.length - 2} more</li>
                          ) : null}
                        </ul>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            {students.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Users size={20} />}
                  title="No student matches"
                  message="Adjust the risk level or the search to see other students."
                />
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
