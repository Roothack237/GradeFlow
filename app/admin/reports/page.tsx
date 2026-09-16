"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Printer,
  RefreshCw,
  School,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

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
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type Term = {
  id: string;
  name: string;
  isCurrent?: boolean;
  academicYear?: { id: string; name: string };
};

type Option = { id: string; name: string };

type StudentReport = {
  type: "STUDENT";
  term: { id: string; name: string; academicYear: { name: string } };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    gender: string | null;
    status: string;
    classroom: { id: string; name: string; section: { name: string } | null } | null;
    parent: { fullName: string; email: string | null; phone: string | null } | null;
  };
  subjects: {
    id: string;
    name: string;
    coefficient: number;
    teacher: string;
    average: number | null;
    grade: string | null;
    sequences: {
      sequenceName: string;
      ca1: number;
      ca2: number;
      exam: number;
      average: number;
    }[];
  }[];
  summary: {
    average: number | null;
    grade: string | null;
    subjects: number;
    marks: number;
    bestSubject: string | null;
    weakestSubject: string | null;
  };
  attendance: {
    counts: Record<string, number>;
    total: number;
    rate: number | null;
  };
  reportCard: {
    average: number;
    rank: number | null;
    decision: string | null;
    principalRemark: string | null;
  } | null;
};

type ClassReport = {
  type: "CLASS";
  term: { id: string; name: string; academicYear: { name: string } };
  classroom: {
    id: string;
    name: string;
    sectionName: string | null;
    students: number;
  };
  students: {
    id: string;
    name: string;
    matricule: string;
    marks: number;
    average: number | null;
    grade: string | null;
    passRate: number | null;
    attendanceRate: number | null;
    rank: number | null;
    decision: string | null;
  }[];
  subjects: {
    id: string;
    name: string;
    coefficient: number;
    recorded: number;
    average: number | null;
    passRate: number | null;
  }[];
  summary: {
    average: number | null;
    marks: number;
    passRate: number | null;
    published: number;
  };
};

type AttendanceReport = {
  type: "ATTENDANCE";
  term: { id: string; name: string; academicYear: { name: string } };
  range: { from: string | null; to: string | null };
  summary: {
    counts: Record<string, number>;
    total: number;
    rate: number | null;
    chronicAbsence: number;
  };
  classes: {
    id: string;
    name: string;
    sectionName: string | null;
    counts: Record<string, number>;
    total: number;
    rate: number | null;
  }[];
  students: {
    id: string;
    name: string;
    matricule: string;
    className: string | null;
    counts: Record<string, number>;
    total: number;
    rate: number | null;
  }[];
  days: { date: string; total: number }[];
};

type PerformanceReport = {
  type: "PERFORMANCE";
  term: { id: string; name: string; academicYear: { name: string } };
  summary: {
    classes: number;
    subjects: number;
    marks: number;
    students: number;
    average: number | null;
    passRate: number | null;
    strongestSubject: string | null;
    weakestSubject: string | null;
  };
  classes: {
    id: string;
    name: string;
    sectionName: string | null;
    students: number;
    assessed: number;
    marks: number;
    average: number | null;
    passRate: number | null;
  }[];
  subjects: {
    id: string;
    name: string;
    coefficient: number;
    recorded: number;
    average: number | null;
    passRate: number | null;
    highest: number | null;
    lowest: number | null;
  }[];
  topStudents: {
    id: string;
    name: string;
    matricule: string;
    className: string | null;
    average: number | null;
    grade: string | null;
    attendanceRate: number | null;
  }[];
  bottomStudents: PerformanceReport["topStudents"];
};

type AcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
};

type ReportCardStudentRow = {
  id: string;
  name: string;
  matricule: string;
  status: string;
  statusLabel: string;
  enrolled: boolean;
  parentName: string | null;
  subjects: number;
  marks: { expected: number; recorded: number; missing: number; complete: boolean };
  average: number | null;
  grade: string | null;
  rank: number | null;
  ranked: number;
  decision: string | null;
  attendanceRate: number | null;
  reportCardId: string | null;
  pdfUrl: string | null;
};

type ReportCardClass = {
  term: { id: string; name: string; academicYear: string; academicYearId: string };
  classroom: { id: string; name: string; sectionName: string | null };
  publication: { status: string | null; published: boolean };
  summary: {
    students: number;
    assessed: number;
    withoutMarks: number;
    incomplete: number;
    average: number | null;
    markCoverage: number | null;
  };
  students: ReportCardStudentRow[];
};

type ReportData =
  | StudentReport
  | ClassReport
  | AttendanceReport
  | PerformanceReport;

type Tab = "PERFORMANCE" | "CLASS" | "STUDENT" | "ATTENDANCE" | "REPORT_CARDS";

/* =========================================================
   HELPERS
========================================================= */

function toCsv(rows: (string | number | null)[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/* =========================================================
   PAGE
========================================================= */

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("PERFORMANCE");

  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [students, setStudents] = useState<Option[]>([]);

  const [termId, setTermId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [generating, setGenerating] = useState(false);

  /* report card generator (Academic Year → Class → Term → students) */
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [reportCardClasses, setReportCardClasses] = useState<Option[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [reportCards, setReportCards] = useState<ReportCardClass | null>(null);
  const [reportCardsLoading, setReportCardsLoading] = useState(false);
  const [reportCardsError, setReportCardsError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  /* ---------------- lookups ---------------- */

  useEffect(() => {
    async function loadLookups() {
      try {
        const [termsRes, classesRes, studentsRes] = await Promise.all([
          fetch("/api/admin/terms", { cache: "no-store" }),
          fetch("/api/admin/classes", { cache: "no-store" }),
          fetch("/api/admin/students?page=1&pageSize=200", { cache: "no-store" }),
        ]);

        if (termsRes.ok) {
          const termData = await termsRes.json();
          const list: Term[] = termData.terms ?? [];

          setTerms(list);

          const current = list.find((term) => term.isCurrent) ?? list[0];

          if (current) setTermId((value) => value || current.id);
        }

        if (classesRes.ok) {
          const classData = await classesRes.json();

          setClasses(
            (classData.classes ?? []).map(
              (classroom: { id: string; name: string }) => ({
                id: classroom.id,
                name: classroom.name,
              })
            )
          );
        }

        if (studentsRes.ok) {
          const studentData = await studentsRes.json();

          setStudents(
            (studentData.students ?? []).map(
              (student: {
                id: string;
                firstName: string;
                lastName: string;
                matricule: string;
              }) => ({
                id: student.id,
                name: `${student.firstName} ${student.lastName} — ${student.matricule}`,
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

  /* ---------------- academic years ---------------- */

  useEffect(() => {
    async function loadYears() {
      try {
        const response = await fetch("/api/admin/academic-years", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        const list: AcademicYear[] = payload.academicYears ?? [];

        setAcademicYears(list);

        const active =
          list.find((year) => year.name === "2026/2027") ??
          list.find((year) => year.isActive) ??
          list[0];

        if (active) setYearId((value) => value || active.id);
      } catch {
        /* non critical */
      }
    }

    loadYears();
  }, []);

  /* ---------------- classes of the selected year ---------------- */

  useEffect(() => {
    async function loadClasses() {
      if (!yearId) return;

      try {
        const response = await fetch(
          `/api/admin/classes?academicYearId=${encodeURIComponent(yearId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) return;

        const payload = await response.json();

        setReportCardClasses(
          (payload.classes ?? []).map(
            (classroom: { id: string; name: string }) => ({
              id: classroom.id,
              name: classroom.name,
            })
          )
        );
      } catch {
        /* non critical */
      }
    }

    loadClasses();
  }, [yearId]);

  /* ---------------- load report ---------------- */

  const load = useCallback(async () => {
    setError("");

    if (tab === "STUDENT" && !studentId) {
      setData(null);
      return;
    }

    if (tab === "CLASS" && !classroomId) {
      setData(null);
      return;
    }

    if (tab === "REPORT_CARDS") {
      setData(null);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({ type: tab });

      if (termId) params.set("termId", termId);
      if (tab === "STUDENT") params.set("studentId", studentId);
      if (tab === "CLASS") params.set("classroomId", classroomId);
      if (tab === "ATTENDANCE") {
        if (classroomId) params.set("classroomId", classroomId);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }

      const response = await fetch(`/api/admin/reports?${params}`, {
        cache: "no-store",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to build this report.");
        setData(null);
        return;
      }

      setData(payload as ReportData);
    } catch {
      setError("Unable to build this report. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, termId, classroomId, studentId, from, to]);

  const loadReportCards = useCallback(async () => {
    if (!termId || !classroomId) {
      setReportCards(null);
      return;
    }

    try {
      setReportCardsLoading(true);
      setReportCardsError("");
      setPreviewUrl("");

      const params = new URLSearchParams({ termId, classroomId });

      if (includeInactive) params.set("includeInactive", "true");

      const response = await fetch(
        `/api/admin/reports/report-cards?${params.toString()}`,
        { cache: "no-store" }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setReportCardsError(
          payload.error ?? "Unable to load the students of this class."
        );
        setReportCards(null);
        return;
      }

      setReportCards(payload as ReportCardClass);
    } catch {
      setReportCardsError("Unable to load the students of this class.");
      setReportCards(null);
    } finally {
      setReportCardsLoading(false);
    }
  }, [termId, classroomId, includeInactive]);

  useEffect(() => {
    load();

    /* the report card tab is loaded from the same effect, so the page keeps
       a single data-loading effect like the rest of the admin screens */
    if (tab === "REPORT_CARDS") loadReportCards();
  }, [load, tab, loadReportCards]);

  /* ---------------- report cards of one class ---------------- */

  const pdfBase = `/api/admin/reports/report-cards/pdf?termId=${encodeURIComponent(
    termId
  )}&classroomId=${encodeURIComponent(classroomId)}${
    includeInactive ? "&includeInactive=true" : ""
  }`;

  async function generateClassReportCards() {
    if (!termId || !classroomId) {
      setReportCardsError("Select an academic year, a class and a term first.");
      return;
    }

    setGenerating(true);
    setReportCardsError("");

    try {
      const response = await fetch("/api/admin/reports/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId, classroomId, includeInactive }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setReportCardsError(
          payload.error ?? "Unable to generate the report cards."
        );
        return;
      }

      setToast(payload.message ?? "Report cards generated.");
      await loadReportCards();
    } catch {
      setReportCardsError("Unable to generate the report cards.");
    } finally {
      setGenerating(false);
    }
  }

  /* ---------------- report cards ---------------- */

  async function generateReportCards() {
    if (!termId) {
      setError("Select a term first.");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/admin/reports/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId,
          classroomId: classroomId || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to generate the report cards.");
        return;
      }

      setToast(payload.message ?? "Report cards generated.");
      await load();
    } catch {
      setError("Unable to generate the report cards.");
    } finally {
      setGenerating(false);
    }
  }

  /* ---------------- export ---------------- */

  function exportCsv() {
    if (!data) return;

    if (data.type === "PERFORMANCE") {
      download(
        `gradeflow-performance-${data.term.name.replace(/\s+/g, "-").toLowerCase()}.csv`,
        toCsv([
          ["Class", "Section", "Students", "Assessed", "Marks", "Average", "Pass rate"],
          ...data.classes.map((row) => [
            row.name,
            row.sectionName ?? "",
            row.students,
            row.assessed,
            row.marks,
            row.average,
            row.passRate,
          ]),
          [],
          ["Subject", "Coefficient", "Marks", "Average", "Pass rate", "Highest", "Lowest"],
          ...data.subjects.map((row) => [
            row.name,
            row.coefficient,
            row.recorded,
            row.average,
            row.passRate,
            row.highest,
            row.lowest,
          ]),
          [],
          ["Top students", "Class", "Average", "Grade", "Attendance"],
          ...data.topStudents.map((row) => [
            row.name,
            row.className ?? "",
            row.average,
            row.grade ?? "",
            row.attendanceRate,
          ]),
        ])
      );

      return;
    }

    if (data.type === "CLASS") {
      download(
        `gradeflow-class-${data.classroom.name.replace(/\s+/g, "-").toLowerCase()}.csv`,
        toCsv([
          ["Student", "Matricule", "Marks", "Average", "Grade", "Pass rate", "Attendance", "Rank", "Decision"],
          ...data.students.map((row) => [
            row.name,
            row.matricule,
            row.marks,
            row.average,
            row.grade ?? "",
            row.passRate,
            row.attendanceRate,
            row.rank,
            row.decision ?? "",
          ]),
        ])
      );

      return;
    }

    if (data.type === "ATTENDANCE") {
      download(
        `gradeflow-attendance-${data.term.name.replace(/\s+/g, "-").toLowerCase()}.csv`,
        toCsv([
          ["Student", "Matricule", "Class", "Present", "Absent", "Late", "Excused", "Total", "Rate"],
          ...data.students.map((row) => [
            row.name,
            row.matricule,
            row.className ?? "",
            row.counts.PRESENT ?? 0,
            row.counts.ABSENT ?? 0,
            row.counts.LATE ?? 0,
            row.counts.EXCUSED ?? 0,
            row.total,
            row.rate,
          ]),
        ])
      );

      return;
    }

    download(
      `gradeflow-student-${data.student.matricule}.csv`,
      toCsv([
        ["Subject", "Teacher", "Coefficient", "Sequence", "CA1", "CA2", "Exam", "Average"],
        ...data.subjects.flatMap((subject) =>
          subject.sequences.map((sequence) => [
            subject.name,
            subject.teacher,
            subject.coefficient,
            sequence.sequenceName,
            sequence.ca1,
            sequence.ca2,
            sequence.exam,
            sequence.average,
          ])
        ),
        [],
        ["Term average", data.summary.average ?? ""],
        ["Grade", data.summary.grade ?? ""],
        ["Class rank", data.reportCard?.rank ?? ""],
        ["Attendance rate", data.attendance.rate ?? ""],
      ])
    );
  }

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();

    if (!term) return students.slice(0, 50);

    return students
      .filter((student) => student.name.toLowerCase().includes(term))
      .slice(0, 50);
  }, [students, studentSearch]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "PERFORMANCE", label: "School performance", icon: <TrendingUp size={16} /> },
    { id: "CLASS", label: "Class report", icon: <School size={16} /> },
    { id: "STUDENT", label: "Student report", icon: <GraduationCap size={16} /> },
    { id: "ATTENDANCE", label: "Attendance", icon: <CalendarCheck size={16} /> },
    {
      id: "REPORT_CARDS",
      label: "Report cards",
      icon: <Sparkles size={16} />,
    },
  ];

  return (
    <AdminShell
      title="Reports"
      subtitle="Print-ready reports built from the marks and attendance stored in the database."
    >
      <PageHeader
        title="Reports"
        subtitle="School performance, class, student and attendance reports."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Rebuild
        </Button>

        <Button
          variant="secondary"
          onClick={exportCsv}
          disabled={!data}
        >
          <Download size={16} />
          Download CSV
        </Button>

        <Button variant="secondary" onClick={() => window.print()} disabled={!data}>
          <Printer size={16} />
          Print
        </Button>

        {tab === "REPORT_CARDS" ? null : (
          <Button onClick={generateReportCards} loading={generating}>
            <Sparkles size={16} />
            Generate report cards
          </Button>
        )}
      </PageHeader>

      {/* ---------------- filters ---------------- */}

      <Card bodyClassName="p-4" className="mb-5 print:hidden">
        <div className="flex flex-wrap gap-2">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === entry.id
                  ? "bg-purple-700 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              {entry.icon}
              {entry.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 lg:grid-cols-4 dark:border-gray-800">
          <Field label="Term">
            <Select
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
            >
              {(tab === "REPORT_CARDS" && yearId
                ? terms.filter((term) => term.academicYear?.id === yearId)
                : terms
              ).map((term) => (
                <option key={term.id} value={term.id}>
                  {term.academicYear?.name ? `${term.academicYear.name} · ` : ""}
                  {term.name}
                </option>
              ))}
            </Select>
          </Field>

          {tab === "REPORT_CARDS" ? (
            <>
              <Field label="Academic year">
                <Select
                  value={yearId}
                  onChange={(event) => {
                    setYearId(event.target.value);
                    setClassroomId("");
                    setReportCards(null);
                  }}
                >
                  <option value="">Select an academic year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                      {year.isActive ? " (active)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Class">
                <Select
                  value={classroomId}
                  onChange={(event) => setClassroomId(event.target.value)}
                >
                  <option value="">Select a class</option>
                  {reportCardClasses.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : null}

          {tab === "CLASS" || tab === "ATTENDANCE" ? (
            <Field label={tab === "ATTENDANCE" ? "Class (optional)" : "Class"}>
              <Select
                value={classroomId}
                onChange={(event) => setClassroomId(event.target.value)}
              >
                <option value="">
                  {tab === "ATTENDANCE" ? "All classes" : "Select a class"}
                </option>
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {tab === "STUDENT" ? (
            <>
              <Field label="Find a student" className="lg:col-span-2">
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search by name or matricule…"
                />
              </Field>

              <Field label="Student">
                <Select
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  <option value="">Select a student</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : null}

          {tab === "ATTENDANCE" ? (
            <>
              <Field label="From">
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </Field>

              <Field label="To">
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </Field>
            </>
          ) : null}
        </div>
      </Card>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {tab === "REPORT_CARDS" ? (
        <div className="space-y-6">
          {reportCardsError ? (
            <ErrorState
              message={reportCardsError}
              onRetry={loadReportCards}
            />
          ) : null}

          {!yearId || !classroomId || !termId ? (
            <Card>
              <EmptyState
                icon={<FileText size={20} />}
                title="Choose the class to report on"
                message="Academic year → class → term, then the students of that class appear below with their marks, averages and ranks. Report cards are generated per student from the marks stored in the database."
              />
            </Card>
          ) : reportCardsLoading ? (
            <Card title="Loading students">
              <LoadingState label="Reading the marks of this class from the database…" />
            </Card>
          ) : !reportCards ? (
            <Card>
              <EmptyState
                icon={<FileText size={20} />}
                title="No class data"
                message="Select another class or term."
              />
            </Card>
          ) : (
            <>
              <Card bodyClassName="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {reportCards.classroom.name} · {reportCards.term.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Academic year {reportCards.term.academicYear} ·{" "}
                        {reportCards.summary.students} student(s) in this view
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={includeInactive}
                        onChange={(event) =>
                          setIncludeInactive(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-purple-700"
                      />
                      Include suspended &amp; dismissed students (history)
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setPreviewUrl(`${pdfBase}&inline=1`)
                      }
                      disabled={!reportCards.summary.assessed}
                    >
                      <Eye size={16} />
                      Preview class set
                    </Button>

                    <a
                      href={pdfBase}
                      className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 ${
                        reportCards.summary.assessed
                          ? ""
                          : "pointer-events-none opacity-50"
                      }`}
                    >
                      <Download size={16} />
                      Download class PDF
                    </a>

                    <Button
                      onClick={generateClassReportCards}
                      loading={generating}
                      disabled={!reportCards.summary.assessed}
                    >
                      <Sparkles size={16} />
                      Generate report cards
                    </Button>
                  </div>
                </div>

                {!reportCards.publication.published ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                    The results of {reportCards.classroom.name} for{" "}
                    {reportCards.term.name} are not published yet. Report cards
                    can be generated and printed, but parents only see them once
                    the results are published in Results → Publications.
                  </p>
                ) : (
                  <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Results are published: parents can open these report cards.
                  </p>
                )}
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Students in the class"
                  value={reportCards.summary.students}
                  icon={<Users size={20} />}
                  tone="purple"
                  hint={`${reportCards.summary.assessed} with marks`}
                />
                <StatCard
                  label="Marks coverage"
                  value={
                    reportCards.summary.markCoverage === null
                      ? "—"
                      : `${reportCards.summary.markCoverage}%`
                  }
                  icon={<BarChart3 size={20} />}
                  tone="blue"
                  hint={`${reportCards.summary.incomplete} student(s) with gaps`}
                />
                <StatCard
                  label="Class average"
                  value={reportCards.summary.average ?? "—"}
                  icon={<TrendingUp size={20} />}
                  tone="emerald"
                />
                <StatCard
                  label="Without marks"
                  value={reportCards.summary.withoutMarks}
                  icon={<AlertTriangle size={20} />}
                  tone="amber"
                  hint="No report card is generated for them"
                />
              </div>

              <Card
                title={`Students of ${reportCards.classroom.name}`}
                description="One report card per student — generated from their own marks in PostgreSQL."
                bodyClassName=""
              >
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>Student</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Marks</Th>
                      <Th className="text-right">Average</Th>
                      <Th className="text-right">Rank</Th>
                      <Th>Decision</Th>
                      <Th className="text-right">Report card</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportCards.students.map((student, index) => (
                      <tr key={student.id}>
                        <Td className="text-xs text-gray-400">{index + 1}</Td>
                        <Td>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {student.matricule}
                            {student.parentName
                              ? ` · ${student.parentName}`
                              : ""}
                          </p>
                        </Td>
                        <Td>
                          <Badge
                            tone={
                              student.status === "ACTIVE"
                                ? "green"
                                : student.status === "SUSPENDED"
                                  ? "amber"
                                  : student.status === "DISMISSED"
                                    ? "red"
                                    : "gray"
                            }
                          >
                            {student.statusLabel}
                          </Badge>
                        </Td>
                        <Td className="text-right text-xs">
                          {student.marks.recorded}/{student.marks.expected}
                          {student.marks.complete ? (
                            <CheckCircle2
                              size={13}
                              className="ml-1 inline text-emerald-600"
                            />
                          ) : (
                            <span className="ml-1 text-amber-600">·</span>
                          )}
                        </Td>
                        <Td className="text-right font-semibold">
                          {student.average ?? "—"}
                        </Td>
                        <Td className="text-right">
                          {student.rank ? `${student.rank}/${student.ranked}` : "—"}
                        </Td>
                        <Td>{student.decision ?? "—"}</Td>
                        <Td>
                          <div className="flex items-center justify-end gap-2">
                            {student.marks.recorded === 0 ? (
                              <span className="text-xs text-gray-400">
                                No marks
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewUrl(
                                      `${pdfBase}&studentId=${student.id}&inline=1`
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/40"
                                  title={`Preview ${student.name}'s report card`}
                                >
                                  <Eye size={16} />
                                </button>

                                <a
                                  href={`${pdfBase}&studentId=${student.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                  title={`Download ${student.name}'s report card`}
                                >
                                  <Download size={14} />
                                  Download
                                </a>
                              </>
                            )}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>

                <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Already stored: {reportCards.students.filter((student) => student.reportCardId).length}{" "}
                  of {reportCards.students.length} report card(s) for{" "}
                  {reportCards.term.name}.
                </div>
              </Card>

              {previewUrl ? (
                <Card
                  title="Report card preview"
                  description="This is the exact document that is downloaded and printed."
                  bodyClassName="p-4"
                >
                  <iframe
                    key={previewUrl}
                    src={previewUrl}
                    title="Report card preview"
                    className="h-[760px] w-full rounded-xl border border-gray-200 dark:border-gray-800"
                  />

                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setPreviewUrl("")}
                    >
                      Close preview
                    </Button>
                  </div>
                </Card>
              ) : null}
            </>
          )}
        </div>
      ) : loading ? (
        <Card title="Building the report">
          <LoadingState label="Building the report from the database…" />
        </Card>
      ) : !data ? (
        <Card>
          <EmptyState
            icon={<FileText size={20} />}
            title="No report selected"
            message={
              tab === "STUDENT"
                ? "Pick a student to build their term report."
                : tab === "CLASS"
                  ? "Pick a class to build its term report."
                  : "Choose a term to build the report."
            }
          />
        </Card>
      ) : data.type === "PERFORMANCE" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="School average"
              value={data.summary.average ?? "—"}
              icon={<BarChart3 size={20} />}
              tone="purple"
            />
            <StatCard
              label="Pass rate"
              value={`${data.summary.passRate ?? 0}%`}
              icon={<TrendingUp size={20} />}
              tone="emerald"
            />
            <StatCard
              label="Students assessed"
              value={data.summary.students}
              icon={<Users size={20} />}
              tone="blue"
            />
            <StatCard
              label="Marks"
              value={data.summary.marks}
              icon={<FileText size={20} />}
              tone="amber"
              hint={`${data.summary.classes} class(es) · ${data.summary.subjects} subject(s)`}
            />
          </div>

          <Card
            title={`Class performance — ${data.term.name} (${data.term.academicYear.name})`}
          >
            <TableWrap>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th className="text-right">Students</Th>
                  <Th className="text-right">Assessed</Th>
                  <Th className="text-right">Marks</Th>
                  <Th className="text-right">Average</Th>
                  <Th className="text-right">Pass rate</Th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">
                      {row.name}
                      {row.sectionName ? (
                        <span className="ml-2 text-xs text-gray-400">
                          {row.sectionName}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right">{row.students}</Td>
                    <Td className="text-right">{row.assessed}</Td>
                    <Td className="text-right">{row.marks}</Td>
                    <Td className="text-right font-semibold">{row.average ?? "—"}</Td>
                    <Td className="text-right">{row.passRate ?? "—"}%</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>

          <Card title="Subject performance">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th className="text-right">Coefficient</Th>
                  <Th className="text-right">Marks</Th>
                  <Th className="text-right">Average</Th>
                  <Th className="text-right">Pass rate</Th>
                  <Th className="text-right">Highest</Th>
                  <Th className="text-right">Lowest</Th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">{row.name}</Td>
                    <Td className="text-right">{row.coefficient}</Td>
                    <Td className="text-right">{row.recorded}</Td>
                    <Td className="text-right font-semibold">
                      {row.average ?? "—"}
                    </Td>
                    <Td className="text-right">{row.passRate ?? "—"}%</Td>
                    <Td className="text-right">{row.highest ?? "—"}</Td>
                    <Td className="text-right">{row.lowest ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>

          <Card title="Top students">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th className="text-right">Average</Th>
                  <Th className="text-right">Grade</Th>
                  <Th className="text-right">Attendance</Th>
                </tr>
              </thead>
              <tbody>
                {data.topStudents.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">
                      {row.name}
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        {row.matricule}
                      </span>
                    </Td>
                    <Td className="text-sm">{row.className ?? "—"}</Td>
                    <Td className="text-right font-semibold">
                      {row.average ?? "—"}
                    </Td>
                    <Td className="text-right">{row.grade ?? "—"}</Td>
                    <Td className="text-right">
                      {row.attendanceRate ?? "—"}%
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      ) : data.type === "CLASS" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Class average"
              value={data.summary.average ?? "—"}
              icon={<School size={20} />}
              tone="purple"
            />
            <StatCard
              label="Pass rate"
              value={`${data.summary.passRate ?? 0}%`}
              icon={<TrendingUp size={20} />}
              tone="emerald"
            />
            <StatCard
              label="Students"
              value={data.classroom.students}
              icon={<Users size={20} />}
              tone="blue"
            />
            <StatCard
              label="Marks recorded"
              value={data.summary.marks}
              icon={<FileText size={20} />}
              tone="amber"
              hint={
                data.summary.published
                  ? "Results published"
                  : "Results not published"
              }
            />
          </div>

          <Card
            title={`${data.classroom.name} — ${data.term.name}`}
            description={
              data.classroom.sectionName
                ? `${data.classroom.sectionName} section`
                : undefined
            }
          >
            <TableWrap>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th className="text-right">Marks</Th>
                  <Th className="text-right">Average</Th>
                  <Th className="text-right">Grade</Th>
                  <Th className="text-right">Attendance</Th>
                  <Th className="text-right">Rank</Th>
                  <Th>Decision</Th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((row, index) => (
                  <tr key={row.id}>
                    <Td className="font-medium">
                      {index + 1}. {row.name}
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        {row.matricule}
                      </span>
                    </Td>
                    <Td className="text-right">{row.marks}</Td>
                    <Td className="text-right font-semibold">
                      {row.average ?? "—"}
                    </Td>
                    <Td className="text-right">{row.grade ?? "—"}</Td>
                    <Td className="text-right">
                      {row.attendanceRate ?? "—"}%
                    </Td>
                    <Td className="text-right">{row.rank ?? "—"}</Td>
                    <Td>
                      {row.decision ? (
                        <Badge
                          tone={row.decision === "PROMOTED" ? "green" : "amber"}
                        >
                          {row.decision.toLowerCase()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Not generated
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>

          <Card title="Subject averages for this class">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th className="text-right">Coefficient</Th>
                  <Th className="text-right">Marks</Th>
                  <Th className="text-right">Average</Th>
                  <Th className="text-right">Pass rate</Th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">{row.name}</Td>
                    <Td className="text-right">{row.coefficient}</Td>
                    <Td className="text-right">{row.recorded}</Td>
                    <Td className="text-right font-semibold">
                      {row.average ?? "—"}
                    </Td>
                    <Td className="text-right">{row.passRate ?? "—"}%</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      ) : data.type === "ATTENDANCE" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Attendance rate"
              value={`${data.summary.rate ?? 0}%`}
              icon={<CalendarCheck size={20} />}
              tone="purple"
            />
            <StatCard
              label="Records"
              value={data.summary.total}
              icon={<FileText size={20} />}
              tone="blue"
            />
            <StatCard
              label="Absences"
              value={data.summary.counts.ABSENT ?? 0}
              icon={<Users size={20} />}
              tone="amber"
            />
            <StatCard
              label="Below 75% attendance"
              value={data.summary.chronicAbsence}
              icon={<TrendingUp size={20} />}
              tone={data.summary.chronicAbsence ? "red" : "gray"}
            />
          </div>

          <Card title={`Attendance by class — ${data.term.name}`}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th className="text-right">Present</Th>
                  <Th className="text-right">Absent</Th>
                  <Th className="text-right">Late</Th>
                  <Th className="text-right">Excused</Th>
                  <Th className="text-right">Rate</Th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">{row.name}</Td>
                    <Td className="text-right">{row.counts.PRESENT ?? 0}</Td>
                    <Td className="text-right">{row.counts.ABSENT ?? 0}</Td>
                    <Td className="text-right">{row.counts.LATE ?? 0}</Td>
                    <Td className="text-right">{row.counts.EXCUSED ?? 0}</Td>
                    <Td className="text-right font-semibold">
                      {row.rate ?? "—"}%
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>

          <Card title="Students with the lowest attendance">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th className="text-right">Absent</Th>
                  <Th className="text-right">Late</Th>
                  <Th className="text-right">Records</Th>
                  <Th className="text-right">Rate</Th>
                </tr>
              </thead>
              <tbody>
                {data.students.slice(0, 25).map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">
                      {row.name}
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        {row.matricule}
                      </span>
                    </Td>
                    <Td className="text-sm">{row.className ?? "—"}</Td>
                    <Td className="text-right">{row.counts.ABSENT ?? 0}</Td>
                    <Td className="text-right">{row.counts.LATE ?? 0}</Td>
                    <Td className="text-right">{row.total}</Td>
                    <Td className="text-right font-semibold">
                      {row.rate ?? "—"}%
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Term average"
              value={data.summary.average ?? "—"}
              icon={<BarChart3 size={20} />}
              tone="purple"
              hint={`Grade ${data.summary.grade ?? "—"}`}
            />
            <StatCard
              label="Attendance rate"
              value={`${data.attendance.rate ?? 0}%`}
              icon={<CalendarCheck size={20} />}
              tone="emerald"
            />
            <StatCard
              label="Class rank"
              value={data.reportCard?.rank ?? "—"}
              icon={<Users size={20} />}
              tone="blue"
              hint={data.reportCard?.decision ?? "Report card not generated yet"}
            />
            <StatCard
              label="Subjects"
              value={data.summary.subjects}
              icon={<FileText size={20} />}
              tone="amber"
              hint={`${data.summary.marks} mark(s) recorded`}
            />
          </div>

          <Card
            title={`${data.student.firstName} ${data.student.lastName} — ${data.term.name}`}
            description={`${data.student.matricule} · ${
              data.student.classroom?.name ?? "No class"
            }${data.student.classroom?.section ? ` · ${data.student.classroom.section.name}` : ""}${
              data.student.parent ? ` · Parent: ${data.student.parent.fullName}` : ""
            }`}
          >
            <TableWrap>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th>Teacher</Th>
                  <Th className="text-right">Coeff.</Th>
                  <Th>Sequence</Th>
                  <Th className="text-right">CA1</Th>
                  <Th className="text-right">CA2</Th>
                  <Th className="text-right">Exam</Th>
                  <Th className="text-right">Average</Th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.flatMap((subject) =>
                  subject.sequences.map((sequence, index) => (
                    <tr key={`${subject.id}-${sequence.sequenceName}`}>
                      <Td className="font-medium">
                        {index === 0 ? subject.name : ""}
                      </Td>
                      <Td className="text-xs text-gray-500">
                        {index === 0 ? subject.teacher : ""}
                      </Td>
                      <Td className="text-right">
                        {index === 0 ? subject.coefficient : ""}
                      </Td>
                      <Td className="text-sm">{sequence.sequenceName}</Td>
                      <Td className="text-right">{sequence.ca1}</Td>
                      <Td className="text-right">{sequence.ca2}</Td>
                      <Td className="text-right">{sequence.exam}</Td>
                      <Td className="text-right font-semibold">
                        {sequence.average}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Subject averages">
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
                        Coefficient {subject.coefficient} · {subject.teacher}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {subject.average ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {subject.grade ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Attendance detail">
              <div className="grid grid-cols-2 gap-3">
                {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                  <div
                    key={status}
                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {status.toLowerCase()}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {data.attendance.counts[status] ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-purple-50 p-3 text-sm text-purple-900 dark:bg-purple-950/30 dark:text-purple-200">
                Best subject: <strong>{data.summary.bestSubject ?? "—"}</strong>
                <br />
                Subject to improve:{" "}
                <strong>{data.summary.weakestSubject ?? "—"}</strong>
              </div>

              {data.reportCard?.principalRemark ? (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {data.reportCard.principalRemark}
                </p>
              ) : null}
            </Card>
          </div>
        </div>
      )}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
