"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Download,
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

type ReportData =
  | StudentReport
  | ClassReport
  | AttendanceReport
  | PerformanceReport;

type Tab = "PERFORMANCE" | "CLASS" | "STUDENT" | "ATTENDANCE";

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

  useEffect(() => {
    load();
  }, [load]);

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

        <Button onClick={generateReportCards} loading={generating}>
          <Sparkles size={16} />
          Generate report cards
        </Button>
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
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.academicYear?.name ? `${term.academicYear.name} · ` : ""}
                  {term.name}
                </option>
              ))}
            </Select>
          </Field>

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

      {loading ? (
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
