"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  NotebookPen,
  Search,
  Filter,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Send,
  Undo2,
  Download,
  TrendingUp,
  Layers,
  Eye,
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
  Pagination,
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

type ResultRow = {
  id: string;
  ca1: number;
  ca2: number;
  exam: number;
  average: number;
  grade: string | null;
  studentId: string;
  studentName: string;
  matricule: string;
  className: string | null;
  subjectName: string;
  coefficient: number;
  teacherName: string;
  sequenceId: string;
  sequenceName: string;
  termName: string;
  published: boolean;
  publicationStatus: string;
};

type Summary = {
  average: number | null;
  recorded: number;
  passed: number;
  passRate: number | null;
};

type Overview = {
  summary: {
    expected: number;
    covered: number;
    recorded: number;
    missing: number;
    average: number | null;
    passRate: number | null;
    completionRate: number | null;
  };
  classes: {
    id: string;
    name: string;
    sectionName: string | null;
    students: number;
    recorded: number;
    average: number | null;
    passRate: number | null;
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
    recorded: number;
    average: number | null;
    passRate: number | null;
    highest: number | null;
    lowest: number | null;
  }[];
  incomplete: {
    classroomId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    missing: number;
    students: { id: string; name: string; matricule: string }[];
  }[];
  incompleteTotal: number;
};

type PublicationData = {
  term: {
    id: string;
    name: string;
    academicYear: { name: string };
    sequences: { id: string; name: string; order: number }[];
  } | null;
  classes: {
    id: string;
    name: string;
    sectionName: string | null;
    students: number;
    termStatus: string;
    termPublishedAt: string | null;
    sequences: {
      sequenceId: string;
      sequenceName: string;
      status: string;
      publishedAt: string | null;
    }[];
  }[];
  message?: string;
};

type Option = { id: string; name: string };
type TermOption = Option & { sequences: { id: string; name: string }[] };

const STATUS_TONE: Record<string, "green" | "amber" | "gray" | "red" | "blue"> = {
  PUBLISHED: "green",
  UNPUBLISHED: "red",
  DRAFT: "amber",
  NOT_PUBLISHED: "gray",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   PAGE
========================================================= */

export default function ResultsPage() {
  const [tab, setTab] = useState<"review" | "publish">("review");

  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [years, setYears] = useState<Option[]>([]);

  const [termFilter, setTermFilter] = useState("");
  const [sequenceFilter, setSequenceFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const [publications, setPublications] = useState<PublicationData | null>(null);
  const [publishTerm, setPublishTerm] = useState("");
  const [publishing, setPublishing] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  /* ---------------- debounce ---------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- lookups + defaults ---------------- */

  useEffect(() => {
    async function loadLookups() {
      try {
        const [classesRes, subjectsRes, teachersRes, termsRes, yearsRes] =
          await Promise.all([
            fetch("/api/admin/classes", { cache: "no-store" }),
            fetch("/api/admin/subjects", { cache: "no-store" }),
            fetch("/api/admin/teachers", { cache: "no-store" }),
            fetch("/api/admin/terms", { cache: "no-store" }),
            fetch("/api/admin/academic-years", { cache: "no-store" }),
          ]);

        if (classesRes.ok) {
          const data = await classesRes.json();
          setClasses(data.classes ?? []);
        }

        if (subjectsRes.ok) {
          const data = await subjectsRes.json();
          setSubjects(Array.isArray(data) ? data : (data.subjects ?? []));
        }

        if (teachersRes.ok) {
          const data = await teachersRes.json();
          setTeachers(
            (data.teachers ?? []).map((teacher: { id: string; fullName: string }) => ({
              id: teacher.id,
              name: teacher.fullName,
            }))
          );
        }

        if (yearsRes.ok) {
          const data = await yearsRes.json();
          setYears(data.academicYears ?? []);
        }

        if (termsRes.ok) {
          const data = await termsRes.json();
          const list: TermOption[] = data.terms ?? [];
          setTerms(list);

          const current = list.find(
            (term: TermOption & { isCurrent?: boolean }) => term.isCurrent
          );

          if (current) {
            setTermFilter((value) => value || current.id);
            setPublishTerm((value) => value || current.id);
          }
        }
      } catch {
        /* non-critical */
      }
    }

    loadLookups();
  }, []);

  const sequenceOptions = useMemo(() => {
    const filtered = termFilter
      ? terms.filter((term) => term.id === termFilter)
      : terms;

    return filtered.flatMap((term) =>
      (term.sequences ?? []).map((sequence) => ({
        id: sequence.id,
        name: `${term.name} · ${sequence.name}`,
      }))
    );
  }, [terms, termFilter]);

  /* ---------------- load results ---------------- */

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (termFilter) params.set("termId", termFilter);
      if (sequenceFilter) params.set("sequenceId", sequenceFilter);
      if (classFilter) params.set("classroomId", classFilter);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (teacherFilter) params.set("teacherId", teacherFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const overviewParams = new URLSearchParams();
      if (termFilter) overviewParams.set("termId", termFilter);
      if (sequenceFilter) overviewParams.set("sequenceId", sequenceFilter);
      if (classFilter) overviewParams.set("classroomId", classFilter);

      const [resultsRes, overviewRes] = await Promise.all([
        fetch(`/api/admin/results?${params}`, { cache: "no-store" }),
        fetch(`/api/admin/results/overview?${overviewParams}`, {
          cache: "no-store",
        }),
      ]);

      if (!resultsRes.ok) throw new Error("failed");

      const data = await resultsRes.json();

      setRows(data.results ?? []);
      setSummary(data.summary ?? null);
      setTotal(data.total ?? 0);

      if (overviewRes.ok) {
        setOverview(await overviewRes.json());
      }
    } catch {
      setError("Unable to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    termFilter,
    sequenceFilter,
    classFilter,
    subjectFilter,
    teacherFilter,
    debouncedSearch,
  ]);

  useEffect(() => {
    if (tab === "review") loadResults();
  }, [tab, loadResults]);

  /* ---------------- load publications ---------------- */

  const loadPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (publishTerm) params.set("termId", publishTerm);

      const response = await fetch(`/api/admin/publications?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      setPublications(await response.json());
    } catch {
      setError("Unable to load the publication state. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [publishTerm]);

  useEffect(() => {
    if (tab === "publish") loadPublications();
  }, [tab, loadPublications]);

  /* ---------------- publish / unpublish ---------------- */

  async function changePublication(options: {
    scope: "TERM" | "SEQUENCE";
    classroomId: string;
    sequenceId?: string;
    action: "PUBLISH" | "UNPUBLISH";
  }) {
    const key = `${options.scope}:${options.classroomId}:${options.sequenceId ?? ""}`;
    setPublishing(key);

    try {
      const response = await fetch("/api/admin/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...options,
          termId: publishTerm || publications?.term?.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to update the publication state.");
        return;
      }

      setToast(data.message ?? "Publication updated.");
      await loadPublications();
    } catch {
      setError("Unable to update the publication state.");
    } finally {
      setPublishing("");
    }
  }

  function exportCsv() {
    const header = [
      "Student",
      "Matricule",
      "Class",
      "Subject",
      "Sequence",
      "Term",
      "CA1",
      "CA2",
      "Exam",
      "Average",
      "Grade",
      "Teacher",
      "Publication",
    ];

    const lines = rows.map((row) =>
      [
        row.studentName,
        row.matricule,
        row.className ?? "",
        row.subjectName,
        row.sequenceName,
        row.termName,
        row.ca1,
        row.ca2,
        row.exam,
        row.average,
        row.grade ?? "",
        row.teacherName,
        row.publicationStatus,
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
    link.download = `gradeflow-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const activeFilters = [
    termFilter,
    sequenceFilter,
    classFilter,
    subjectFilter,
    teacherFilter,
  ].filter(Boolean).length;

  return (
    <AdminShell
      title="Results Management"
      subtitle="Review the marks entered by teachers and publish them."
    >
      <PageHeader
        title="Results"
        subtitle="Review, verify and publish academic results."
      >
        <Button
          variant="secondary"
          onClick={tab === "review" ? loadResults : loadPublications}
          loading={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>

        {tab === "review" ? (
          <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}>
            <Download size={16} />
            Export CSV
          </Button>
        ) : null}
      </PageHeader>

      {/* TABS */}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("review")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "review"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <NotebookPen size={16} />
          Review marks
        </button>

        <button
          type="button"
          onClick={() => setTab("publish")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "publish"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <Send size={16} />
          Publication
        </button>
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={loadResults} />
        </div>
      ) : null}

      {/* =========================================================
          REVIEW TAB
      ========================================================= */}

      {tab === "review" ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Marks recorded"
              value={summary?.recorded ?? 0}
              icon={<NotebookPen size={20} />}
              tone="purple"
              hint={
                overview
                  ? `${overview.summary.covered}/${overview.summary.expected} expected entries`
                  : undefined
              }
              loading={loading && !summary}
            />
            <StatCard
              label="Average"
              value={summary?.average ?? "—"}
              icon={<TrendingUp size={20} />}
              tone="blue"
              loading={loading && !summary}
            />
            <StatCard
              label="Pass rate"
              value={summary?.passRate === null ? "—" : `${summary?.passRate ?? 0}%`}
              icon={<CheckCircle2 size={20} />}
              tone="emerald"
              loading={loading && !summary}
            />
            <StatCard
              label="Missing marks"
              value={overview?.summary.missing ?? 0}
              icon={<AlertTriangle size={20} />}
              tone={overview?.summary.missing ? "amber" : "gray"}
              hint={
                overview?.summary.completionRate === undefined
                  ? undefined
                  : `${overview?.summary.completionRate ?? 0}% complete · ${overview?.summary.covered ?? 0}/${overview?.summary.expected ?? 0} entries`
              }
              loading={loading && !overview}
            />
          </div>

          {/* INCOMPLETE RESULTS */}

          {overview && overview.incomplete.length > 0 ? (
            <Card
              title="Incomplete results"
              description="Students who do not yet have a mark for a subject their class is assessed on."
              className="mb-6"
            >
              <div className="space-y-3">
                {overview.incomplete.slice(0, 6).map((entry) => (
                  <div
                    key={`${entry.classroomId}-${entry.subjectId}`}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        {entry.className} · {entry.subjectName}
                      </p>

                      <Badge tone="amber">
                        {entry.missing} student(s) missing
                      </Badge>
                    </div>

                    <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
                      {entry.students.map((student) => student.name).join(", ")}
                      {entry.missing > entry.students.length
                        ? ` +${entry.missing - entry.students.length} more`
                        : ""}
                    </p>
                  </div>
                ))}

                {overview.incomplete.length > 6 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{overview.incomplete.length - 6} more class/subject
                    combinations with missing marks.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : overview && overview.summary.expected > 0 ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 size={18} className="mr-2 inline" />
              All expected marks have been recorded for this scope.
            </div>
          ) : null}

          {/* CLASS / SUBJECT PERFORMANCE */}

          {overview && overview.classes.length > 0 ? (
            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <Card title="Class performance">
                <div className="space-y-3">
                  {overview.classes.map((classroom) => (
                    <div
                      key={classroom.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {classroom.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {classroom.students} student(s) ·{" "}
                          {classroom.recorded} mark(s)
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {classroom.average ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {classroom.passRate === null
                            ? "no data"
                            : `${classroom.passRate}% pass`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Subject performance">
                <div className="space-y-3">
                  {overview.subjects.map((subject) => (
                    <div key={subject.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {subject.name}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {subject.average ?? "—"}
                        </span>
                      </div>

                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${
                            (subject.average ?? 0) >= 70
                              ? "bg-emerald-500"
                              : (subject.average ?? 0) >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, subject.average ?? 0))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          {/* FILTERS */}

          <Card bodyClassName="p-4" className="mb-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by student name or matricule…"
                  className="pl-10"
                />
              </div>

              <Button
                variant="secondary"
                onClick={() => setShowFilters((value) => !value)}
              >
                <Filter size={16} />
                Filters
                {activeFilters > 0 ? (
                  <span className="ml-1 rounded-full bg-purple-700 px-1.5 text-[10px] text-white">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>

              {activeFilters > 0 || search ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setSequenceFilter("");
                    setClassFilter("");
                    setSubjectFilter("");
                    setTeacherFilter("");
                    setPage(1);
                  }}
                >
                  <X size={16} />
                  Clear
                </Button>
              ) : null}
            </div>

            {showFilters ? (
              <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-800">
                <Field label="Academic year">
                  <Select
                    value={yearFilter}
                    onChange={(event) => {
                      setYearFilter(event.target.value);
                      setTermFilter("");
                      setSequenceFilter("");
                    }}
                  >
                    <option value="">All years</option>
                    {years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Term">
                  <Select
                    value={termFilter}
                    onChange={(event) => {
                      setTermFilter(event.target.value);
                      setSequenceFilter("");
                      setPage(1);
                    }}
                  >
                    <option value="">All terms</option>
                    {terms
                      .filter((term) =>
                        yearFilter
                          ? (term as TermOption & { academicYear?: { id: string } })
                              .academicYear?.id === yearFilter
                          : true
                      )
                      .map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                  </Select>
                </Field>

                <Field label="Sequence">
                  <Select
                    value={sequenceFilter}
                    onChange={(event) => {
                      setSequenceFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All sequences</option>
                    {sequenceOptions.map((sequence) => (
                      <option key={sequence.id} value={sequence.id}>
                        {sequence.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Class">
                  <Select
                    value={classFilter}
                    onChange={(event) => {
                      setClassFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All classes</option>
                    {classes.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Subject">
                  <Select
                    value={subjectFilter}
                    onChange={(event) => {
                      setSubjectFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Teacher">
                  <Select
                    value={teacherFilter}
                    onChange={(event) => {
                      setTeacherFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All teachers</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : null}
          </Card>

          {/* RESULTS TABLE */}

          <Card bodyClassName="">
            {loading ? (
              <div className="p-5">
                <LoadingState />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<NotebookPen size={20} />}
                  title="No results found"
                  message={
                    activeFilters || search
                      ? "No mark matches the current filters."
                      : "Marks entered by teachers will appear here for review."
                  }
                />
              </div>
            ) : (
              <>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Student</Th>
                      <Th>Class</Th>
                      <Th>Subject</Th>
                      <Th>Sequence</Th>
                      <Th className="text-right">CA1</Th>
                      <Th className="text-right">CA2</Th>
                      <Th className="text-right">Exam</Th>
                      <Th className="text-right">Average</Th>
                      <Th>Teacher</Th>
                      <Th>Publication</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <Td>
                          <Link
                            href={`/admin/students/${row.studentId}`}
                            className="font-medium text-gray-900 hover:text-purple-700 dark:text-white dark:hover:text-purple-300"
                          >
                            {row.studentName}
                          </Link>
                          <p className="font-mono text-[11px] text-gray-400">
                            {row.matricule}
                          </p>
                        </Td>
                        <Td className="text-sm">{row.className ?? "—"}</Td>
                        <Td className="text-sm">{row.subjectName}</Td>
                        <Td className="text-xs text-gray-500 dark:text-gray-400">
                          <p>{row.sequenceName}</p>
                          <p className="text-[11px]">{row.termName}</p>
                        </Td>
                        <Td className="text-right">{row.ca1}</Td>
                        <Td className="text-right">{row.ca2}</Td>
                        <Td className="text-right">{row.exam}</Td>
                        <Td className="text-right font-semibold">
                          {row.average}
                          {row.grade ? (
                            <span className="ml-1 text-xs text-gray-400">
                              {row.grade}
                            </span>
                          ) : null}
                        </Td>
                        <Td className="text-xs text-gray-500 dark:text-gray-400">
                          {row.teacherName}
                        </Td>
                        <Td>
                          <Badge tone={row.published ? "green" : "amber"}>
                            {row.published ? "Published" : "Not published"}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                />
              </>
            )}
          </Card>
        </>
      ) : null}

      {/* =========================================================
          PUBLICATION TAB
      ========================================================= */}

      {tab === "publish" ? (
        <>
          <Card bodyClassName="p-4" className="mb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Term to publish" className="sm:max-w-sm">
                <Select
                  value={publishTerm}
                  onChange={(event) => setPublishTerm(event.target.value)}
                >
                  <option value="">Select a term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {(term as TermOption & { academicYear?: { name: string } })
                        .academicYear?.name ?? ""}{" "}
                      · {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <p className="text-xs text-gray-500 dark:text-gray-400 sm:pb-4">
                Publishing notifies the parents of the class and the teachers
                involved. Sequence-level publishing releases only that sequence.
              </p>
            </div>
          </Card>

          {loading ? (
            <Card title="Loading publication state">
              <LoadingState />
            </Card>
          ) : !publications?.term ? (
            <Card>
              <EmptyState
                icon={<Layers size={20} />}
                title="No term selected"
                message={
                  publications?.message ??
                  "Choose a term to manage the publication of its results."
                }
              />
            </Card>
          ) : publications.classes.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Layers size={20} />}
                title="No classes yet"
                message="Create classes before publishing results."
              />
            </Card>
          ) : (
            <div className="space-y-5">
              {publications.classes.map((classroom) => (
                <Card
                  key={classroom.id}
                  title={classroom.name}
                  description={`${classroom.students} student(s)${
                    classroom.sectionName ? ` · ${classroom.sectionName}` : ""
                  }`}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[classroom.termStatus] ?? "gray"}>
                        Term: {classroom.termStatus.replace("_", " ").toLowerCase()}
                      </Badge>

                      <Button
                        size="sm"
                        variant={
                          classroom.termStatus === "PUBLISHED"
                            ? "secondary"
                            : "primary"
                        }
                        loading={
                          publishing === `TERM:${classroom.id}:`
                        }
                        onClick={() =>
                          changePublication({
                            scope: "TERM",
                            classroomId: classroom.id,
                            action:
                              classroom.termStatus === "PUBLISHED"
                                ? "UNPUBLISH"
                                : "PUBLISH",
                          })
                        }
                      >
                        {classroom.termStatus === "PUBLISHED" ? (
                          <>
                            <Undo2 size={14} />
                            Unpublish term
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Publish whole term
                          </>
                        )}
                      </Button>
                    </div>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {classroom.sequences.map((sequence) => {
                      const key = `SEQUENCE:${classroom.id}:${sequence.sequenceId}`;

                      return (
                        <div
                          key={sequence.sequenceId}
                          className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {sequence.sequenceName}
                            </p>

                            <Badge
                              tone={STATUS_TONE[sequence.status] ?? "gray"}
                            >
                              {sequence.status.replace("_", " ").toLowerCase()}
                            </Badge>
                          </div>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {sequence.publishedAt
                              ? `Published ${formatDateTime(sequence.publishedAt)}`
                              : "Not published yet"}
                          </p>

                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant={
                                sequence.status === "PUBLISHED"
                                  ? "secondary"
                                  : "primary"
                              }
                              className="w-full"
                              loading={publishing === key}
                              onClick={() =>
                                changePublication({
                                  scope: "SEQUENCE",
                                  classroomId: classroom.id,
                                  sequenceId: sequence.sequenceId,
                                  action:
                                    sequence.status === "PUBLISHED"
                                      ? "UNPUBLISH"
                                      : "PUBLISH",
                                })
                              }
                            >
                              {sequence.status === "PUBLISHED" ? (
                                <>
                                  <Undo2 size={14} />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  Publish sequence
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                <Eye size={16} className="mr-2 inline" />
                Results that are not published stay hidden from parents and are
                marked as “Not published” on the review screen.
              </div>
            </div>
          )}
        </>
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
