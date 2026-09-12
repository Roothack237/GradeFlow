"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Layers,
  Lock,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Undo2,
  Users,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
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

type Mark = {
  id: string;
  ca1: number;
  ca2: number;
  exam: number;
  average: number;
  grade: string | null;
  remark: string | null;
  student: { id: string; name: string; matricule: string };
  classroom: { id: string; name: string; section?: { name: string } | null } | null;
  subject: { id: string; name: string; coefficient: number };
  sequence: { id: string; name: string; order: number };
  term: { id: string; name: string; academicYear: { name: string } };
  teacher: { id: string; fullName: string };
  publicationState: string;
};

type Overview = {
  scope: { termId: string | null; sequenceId: string | null; sequences: number };
  summary: {
    expected: number;
    covered: number;
    recorded: number;
    missing: number;
    completionRate: number | null;
    average: number | null;
    passRate: number | null;
    students: number;
    classes: number;
    subjects: number;
  };
  classes: {
    id: string;
    name: string;
    sectionName: string | null;
    students: number;
    subjects: number;
    expected: number;
    recorded: number;
    covered: number;
    missing: number;
    average: number | null;
    passRate: number | null;
    completion: number | null;
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
    recorded: number;
    expected: number;
    covered: number;
    missing: number;
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
    expected: number;
    recorded: number;
    missing: number;
    students: { id: string; name: string; matricule: string }[];
  }[];
  incompleteTotal: number;
  message?: string;
};

type PublicationState = {
  term: {
    id: string;
    name: string;
    isCurrent: boolean;
    academicYear: { id: string; name: string };
    sequences: { id: string; name: string; order: number }[];
  } | null;
  classes: {
    id: string;
    name: string;
    section: { id: string; name: string } | null;
    students: number;
    marks: number;
    termPublication: {
      status: string;
      publishedAt: string | null;
      notes: string | null;
      publishedBy: string | null;
    } | null;
    sequences: {
      id: string;
      name: string;
      order: number;
      publication: { status: string; publishedAt: string | null } | null;
    }[];
  }[];
  summary: {
    classes: number;
    sequences: number;
    sequencesPublished: number;
    sequencesPending: number;
    termsPublished: number;
    termsPending: number;
  };
  message?: string;
};

type Option = { id: string; name: string };
type TermOption = Option & {
  isCurrent: boolean;
  academicYear?: { name: string };
  sequences: { id: string; name: string }[];
};

const STATE_TONES: Record<string, "green" | "amber" | "gray" | "red" | "blue"> = {
  PUBLISHED: "green",
  SEQUENCE_PUBLISHED: "green",
  TERM_PUBLISHED: "blue",
  UNPUBLISHED: "red",
  NOT_PUBLISHED: "gray",
};

const STATE_LABELS: Record<string, string> = {
  PUBLISHED: "Published",
  SEQUENCE_PUBLISHED: "Published (sequence)",
  TERM_PUBLISHED: "Published (term)",
  UNPUBLISHED: "Unpublished",
  NOT_PUBLISHED: "Not published",
};

type PendingAction = {
  scope: "TERM" | "SEQUENCE";
  classroomId: string;
  className: string;
  sequenceId?: string;
  sequenceName?: string;
  action: "PUBLISH" | "UNPUBLISH";
};

/* =========================================================
   PAGE
========================================================= */

export default function ResultsPage() {
  const [tab, setTab] = useState<"REVIEW" | "PUBLICATION">("REVIEW");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  /* ---------------- lookups ---------------- */

  const [terms, setTerms] = useState<TermOption[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);

  /* ---------------- review state ---------------- */

  const [termId, setTermId] = useState("");
  const [sequenceId, setSequenceId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [search, setSearch] = useState("");

  const [marks, setMarks] = useState<Mark[]>([]);
  const [summary, setSummary] = useState<{
    marks: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    passed: number;
    passRate: number | null;
  } | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- publication state ---------------- */

  const [publications, setPublications] = useState<PublicationState | null>(null);
  const [publishTermId, setPublishTermId] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [working, setWorking] = useState(false);

  /* ---------------- lookups load ---------------- */

  useEffect(() => {
    async function loadLookups() {
      try {
        const [termsRes, classesRes, subjectsRes, teachersRes] =
          await Promise.all([
            fetch("/api/admin/terms", { cache: "no-store" }),
            fetch("/api/admin/classes", { cache: "no-store" }),
            fetch("/api/admin/subjects", { cache: "no-store" }),
            fetch("/api/admin/teachers", { cache: "no-store" }),
          ]);

        if (termsRes.ok) {
          const data = await termsRes.json();
          const list: TermOption[] = data.terms ?? [];

          setTerms(list);

          const current = list.find((term) => term.isCurrent) ?? list[0];

          if (current) {
            setTermId((value) => value || current.id);
            setPublishTermId((value) => value || current.id);
          }
        }

        if (classesRes.ok) {
          const data = await classesRes.json();

          setClasses(
            (data.classes ?? []).map(
              (classroom: { id: string; name: string }) => ({
                id: classroom.id,
                name: classroom.name,
              })
            )
          );
        }

        if (subjectsRes.ok) {
          const data = await subjectsRes.json();

          setSubjects(
            (Array.isArray(data) ? data : (data.subjects ?? [])).map(
              (subject: { id: string; name: string }) => ({
                id: subject.id,
                name: subject.name,
              })
            )
          );
        }

        if (teachersRes.ok) {
          const data = await teachersRes.json();

          setTeachers(
            (data.teachers ?? []).map(
              (teacher: { id: string; fullName: string }) => ({
                id: teacher.id,
                name: teacher.fullName,
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

  const sequenceOptions = useMemo(() => {
    const term = terms.find((entry) => entry.id === termId);

    return term?.sequences ?? [];
  }, [terms, termId]);

  useEffect(() => {
    setSequenceId("");
  }, [termId]);

  /* ---------------- review load ---------------- */

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (termId) params.set("termId", termId);
      if (sequenceId) params.set("sequenceId", sequenceId);
      if (classroomId) params.set("classroomId", classroomId);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (teacherFilter) params.set("teacherId", teacherFilter);
      if (publicationFilter) params.set("publication", publicationFilter);
      if (search) params.set("search", search);

      const overviewParams = new URLSearchParams();

      if (termId) overviewParams.set("termId", termId);
      if (sequenceId) overviewParams.set("sequenceId", sequenceId);
      if (classroomId) overviewParams.set("classroomId", classroomId);

      const [marksRes, overviewRes] = await Promise.all([
        fetch(`/api/admin/results?${params}`, { cache: "no-store" }),
        fetch(`/api/admin/results/overview?${overviewParams}`, {
          cache: "no-store",
        }),
      ]);

      if (!marksRes.ok) throw new Error("failed");

      const data = await marksRes.json();

      setMarks(data.results ?? []);
      setSummary(data.summary ?? null);
      setTotal(data.total ?? 0);

      if (overviewRes.ok) setOverview(await overviewRes.json());
    } catch {
      setError("Unable to load the results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    termId,
    sequenceId,
    classroomId,
    subjectFilter,
    teacherFilter,
    publicationFilter,
    search,
  ]);

  /* ---------------- publications load ---------------- */

  const loadPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (publishTermId) params.set("termId", publishTermId);

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
  }, [publishTermId]);

  useEffect(() => {
    if (tab === "REVIEW") loadReview();
    else loadPublications();
  }, [tab, loadReview, loadPublications]);

  /* ---------------- publish / unpublish ---------------- */

  async function applyPublication() {
    if (!pending) return;

    setWorking(true);
    setError("");

    try {
      const response = await fetch("/api/admin/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: pending.scope,
          action: pending.action,
          termId: publishTermId || publications?.term?.id,
          classroomId: pending.classroomId,
          sequenceId: pending.sequenceId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to update the publication state.");
        setPending(null);
        return;
      }

      setToast(data.message ?? "Publication state updated.");
      setPending(null);
      await loadPublications();
    } catch {
      setError("Unable to update the publication state.");
    } finally {
      setWorking(false);
    }
  }

  async function approveAll() {
    if (!publications?.term) return;

    setWorking(true);
    setError("");

    try {
      const pendingSequences = publications.classes.flatMap((classroom) =>
        classroom.sequences
          .filter((sequence) => sequence.publication?.status !== "PUBLISHED")
          .map((sequence) => ({
            classroomId: classroom.id,
            sequenceId: sequence.id,
          }))
      );

      let done = 0;
      let failure = "";

      for (const entry of pendingSequences) {
        const response = await fetch("/api/admin/publications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "SEQUENCE",
            action: "PUBLISH",
            termId: publications.term.id,
            classroomId: entry.classroomId,
            sequenceId: entry.sequenceId,
          }),
        });

        if (response.ok) done += 1;
        else if (!failure) {
          const data = await response.json().catch(() => ({}));
          failure = data.error ?? "Some sequences could not be published.";
        }
      }

      if (failure) setError(failure);

      setToast(
        done
          ? `${done} sequence(s) published.`
          : "Nothing to publish — every sequence is already published."
      );
      await loadPublications();
    } catch {
      setError("Unable to publish the pending sequences.");
    } finally {
      setWorking(false);
    }
  }

  /* ---------------- derived ---------------- */

  const activeFilters =
    (termId ? 1 : 0) +
    (sequenceId ? 1 : 0) +
    (classroomId ? 1 : 0) +
    (subjectFilter ? 1 : 0) +
    (teacherFilter ? 1 : 0) +
    (publicationFilter ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <AdminShell
      title="Results"
      subtitle="Review the marks recorded by teachers and publish results per term or per sequence."
    >
      <PageHeader
        title="Results"
        subtitle="Marks are reviewed here and published to families at the level you choose."
      >
        <Button
          variant="secondary"
          onClick={tab === "REVIEW" ? loadReview : loadPublications}
          loading={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </PageHeader>

      {/* ---------------- tabs ---------------- */}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("REVIEW")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "REVIEW"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <BarChart3 size={16} />
          Review marks
        </button>

        <button
          type="button"
          onClick={() => setTab("PUBLICATION")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "PUBLICATION"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <Megaphone size={16} />
          Publication — term & sequences
        </button>
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={tab === "REVIEW" ? loadReview : loadPublications} />
        </div>
      ) : null}

      {/* =========================================================
          REVIEW TAB
      ========================================================= */}

      {tab === "REVIEW" ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Marks in this view"
              value={summary?.marks ?? 0}
              icon={<BookOpen size={20} />}
              tone="purple"
              loading={loading && !summary}
              hint={total ? `${total} mark(s) match the filters` : undefined}
            />
            <StatCard
              label="Average"
              value={summary?.average ?? "—"}
              icon={<BarChart3 size={20} />}
              tone="blue"
              loading={loading && !summary}
              hint={
                summary
                  ? `highest ${summary.highest ?? "—"} · lowest ${summary.lowest ?? "—"}`
                  : undefined
              }
            />
            <StatCard
              label="Pass rate"
              value={
                summary?.passRate === null || summary?.passRate === undefined
                  ? "—"
                  : `${summary.passRate}%`
              }
              icon={<CheckCircle2 size={20} />}
              tone="emerald"
              loading={loading && !summary}
            />
            <StatCard
              label="Missing marks"
              value={overview?.summary.missing ?? 0}
              icon={<AlertTriangle size={20} />}
              tone={overview?.summary.missing ? "amber" : "gray"}
              loading={loading && !overview}
              hint={
                overview?.summary.completionRate === null ||
                overview?.summary.completionRate === undefined
                  ? undefined
                  : `${overview.summary.completionRate}% complete · ${overview.summary.covered}/${overview.summary.expected} entries`
              }
            />
          </div>

          {/* incomplete results */}

          {overview && overview.incomplete.length > 0 ? (
            <Card
              title="Incomplete results"
              description="Class and subject pairs where some students have no mark yet."
              className="mb-6"
            >
              <div className="space-y-3">
                {overview.incomplete.slice(0, 8).map((entry) => (
                  <div
                    key={`${entry.classroomId}-${entry.subjectId}`}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        {entry.className} · {entry.subjectName}
                      </p>

                      <Badge tone="amber">
                        {entry.missing} of {entry.expected} missing
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

                {overview.incomplete.length > 8 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{overview.incomplete.length - 8} more class/subject
                    combinations with missing marks.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : overview && overview.summary.expected > 0 ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 size={18} className="mr-2 inline" />
              Every expected mark has been recorded for this scope.
            </div>
          ) : null}

          {/* class + subject performance */}

          {overview && (overview.classes.length > 0 || overview.subjects.length > 0) ? (
            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <Card title="Class performance">
                <div className="space-y-3">
                  {overview.classes.map((classroom) => (
                    <div
                      key={classroom.id}
                      className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {classroom.name}
                        </p>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {classroom.average ?? "—"}
                        </span>
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${
                            (classroom.average ?? 0) >= 70
                              ? "bg-emerald-500"
                              : (classroom.average ?? 0) >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, classroom.average ?? 0))}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {classroom.students} student(s) · {classroom.subjects}{" "}
                        subject(s) · {classroom.recorded} mark(s) ·{" "}
                        {classroom.passRate ?? "—"}% pass
                        {classroom.missing
                          ? ` · ${classroom.missing} missing`
                          : " · complete"}
                      </p>
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

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {subject.recorded} mark(s) ·{" "}
                        {subject.passRate ?? "—"}% pass · highest{" "}
                        {subject.highest ?? "—"} · lowest {subject.lowest ?? "—"}
                        {subject.missing ? ` · ${subject.missing} missing` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          {/* filters */}

          <Card bodyClassName="p-4" className="mb-5">
            <div className="grid gap-3 lg:grid-cols-4">
              <Field label="Term">
                <Select
                  value={termId}
                  onChange={(event) => {
                    setTermId(event.target.value);
                    setPage(1);
                  }}
                >
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.academicYear?.name
                        ? `${term.academicYear.name} · `
                        : ""}
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Sequence">
                <Select
                  value={sequenceId}
                  onChange={(event) => {
                    setSequenceId(event.target.value);
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
                  value={classroomId}
                  onChange={(event) => {
                    setClassroomId(event.target.value);
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

              <Field label="Publication">
                <Select
                  value={publicationFilter}
                  onChange={(event) => {
                    setPublicationFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All marks</option>
                  <option value="PUBLISHED">Published only</option>
                  <option value="NOT_PUBLISHED">Not published only</option>
                </Select>
              </Field>

              <Field label="Search student">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Name or matricule…"
                    className="pl-9"
                  />
                </div>
              </Field>

              {activeFilters ? (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSequenceId("");
                      setClassroomId("");
                      setSubjectFilter("");
                      setTeacherFilter("");
                      setPublicationFilter("");
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X size={16} />
                    Clear filters
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {/* marks table */}

          <Card bodyClassName="p-0">
            {loading ? (
              <div className="p-5">
                <LoadingState label="Loading the marks…" />
              </div>
            ) : marks.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<BookOpen size={20} />}
                  title="No mark found"
                  message={
                    activeFilters
                      ? "No mark matches the current filters."
                      : "Marks recorded by teachers will appear here for review."
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
                    {marks.map((mark) => (
                      <tr
                        key={mark.id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <Td>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {mark.student.name}
                          </p>
                          <p className="font-mono text-[11px] text-gray-400">
                            {mark.student.matricule}
                          </p>
                        </Td>
                        <Td className="text-sm">
                          {mark.classroom?.name ?? "—"}
                        </Td>
                        <Td className="text-sm">
                          {mark.subject.name}
                          <span className="ml-1 text-[11px] text-gray-400">
                            ×{mark.subject.coefficient}
                          </span>
                        </Td>
                        <Td className="text-sm">
                          {mark.sequence.name}
                          <span className="block text-[11px] text-gray-400">
                            {mark.term.name}
                          </span>
                        </Td>
                        <Td className="text-right">{mark.ca1}</Td>
                        <Td className="text-right">{mark.ca2}</Td>
                        <Td className="text-right">{mark.exam}</Td>
                        <Td className="text-right font-semibold">
                          {mark.average}
                          {mark.grade ? (
                            <span className="ml-1 text-xs text-gray-400">
                              {mark.grade}
                            </span>
                          ) : null}
                        </Td>
                        <Td className="text-xs text-gray-500 dark:text-gray-400">
                          {mark.teacher.fullName}
                        </Td>
                        <Td>
                          <Badge
                            tone={STATE_TONES[mark.publicationState] ?? "gray"}
                          >
                            {STATE_LABELS[mark.publicationState] ??
                              mark.publicationState.toLowerCase()}
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

      {tab === "PUBLICATION" ? (
        <>
          {publications?.summary ? (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Classes"
                value={publications.summary.classes}
                icon={<Users size={20} />}
                tone="purple"
                loading={loading && !publications}
              />
              <StatCard
                label="Sequences published"
                value={`${publications.summary.sequencesPublished}/${publications.summary.sequences}`}
                icon={<Layers size={20} />}
                tone="emerald"
                loading={loading && !publications}
              />
              <StatCard
                label="Sequences pending"
                value={publications.summary.sequencesPending}
                icon={<AlertTriangle size={20} />}
                tone={publications.summary.sequencesPending ? "amber" : "gray"}
                loading={loading && !publications}
              />
              <StatCard
                label="Terms published"
                value={`${publications.summary.termsPublished}/${publications.summary.classes}`}
                icon={<Megaphone size={20} />}
                tone="blue"
                loading={loading && !publications}
              />
            </div>
          ) : null}

          <Card bodyClassName="p-4" className="mb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Term" className="sm:max-w-xs">
                <Select
                  value={publishTermId}
                  onChange={(event) => setPublishTermId(event.target.value)}
                >
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.academicYear?.name
                        ? `${term.academicYear.name} · `
                        : ""}
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Button
                variant="secondary"
                onClick={approveAll}
                loading={working}
                disabled={
                  !publications?.summary.sequencesPending ||
                  loading
                }
              >
                <Send size={16} />
                Publish every pending sequence
              </Button>

              <p className="text-xs text-gray-500 sm:pb-4 dark:text-gray-400">
                Publishing a sequence releases only that sequence. Publishing the
                whole term releases every sequence of the term at once. Parents
                and teachers of the class are notified on publication.
              </p>
            </div>
          </Card>

          {loading ? (
            <Card title="Loading the publication state">
              <LoadingState label="Loading the publication state…" />
            </Card>
          ) : !publications?.term ? (
            <Card>
              <EmptyState
                icon={<Megaphone size={20} />}
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
                icon={<Users size={20} />}
                title="No class yet"
                message="Create classes before publishing results."
              />
            </Card>
          ) : (
            <div className="space-y-5">
              {publications.classes.map((classroom) => {
                const termPublished =
                  classroom.termPublication?.status === "PUBLISHED";

                return (
                  <Card
                    key={classroom.id}
                    title={classroom.name}
                    description={`${classroom.students} student(s) · ${
                      classroom.marks
                    } mark(s) in ${publications.term?.name}${
                      classroom.section ? ` · ${classroom.section.name}` : ""
                    }`}
                    action={
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={termPublished ? "green" : "gray"}>
                          {termPublished
                            ? "Term published"
                            : "Term not published"}
                        </Badge>

                        <Button
                          size="sm"
                          variant={termPublished ? "secondary" : "primary"}
                          onClick={() =>
                            setPending({
                              scope: "TERM",
                              classroomId: classroom.id,
                              className: classroom.name,
                              action: termPublished ? "UNPUBLISH" : "PUBLISH",
                            })
                          }
                        >
                          {termPublished ? (
                            <>
                              <Undo2 size={14} />
                              Unpublish term
                            </>
                          ) : (
                            <>
                              <Megaphone size={14} />
                              Publish whole term
                            </>
                          )}
                        </Button>
                      </div>
                    }
                  >
                    {classroom.termPublication?.publishedAt ? (
                      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                        Term published on{" "}
                        {new Date(
                          classroom.termPublication.publishedAt
                        ).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {classroom.termPublication.publishedBy
                          ? ` by ${classroom.termPublication.publishedBy}`
                          : ""}
                      </p>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {classroom.sequences.map((sequence) => {
                        const published =
                          sequence.publication?.status === "PUBLISHED";

                        return (
                          <div
                            key={sequence.id}
                            className={`rounded-xl border p-3 transition ${
                              published
                                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                                : "border-gray-200 dark:border-gray-800"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {sequence.name}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {sequence.publication?.publishedAt
                                    ? `Published ${new Date(
                                        sequence.publication.publishedAt
                                      ).toLocaleDateString("en-GB")}`
                                    : "Not published"}
                                </p>
                              </div>

                              <Badge tone={published ? "green" : "gray"}>
                                {published ? (
                                  <>
                                    <Lock size={11} /> Released
                                  </>
                                ) : (
                                  "Pending"
                                )}
                              </Badge>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant={published ? "secondary" : "primary"}
                                className="flex-1"
                                onClick={() =>
                                  setPending({
                                    scope: "SEQUENCE",
                                    classroomId: classroom.id,
                                    className: classroom.name,
                                    sequenceId: sequence.id,
                                    sequenceName: sequence.name,
                                    action: published ? "UNPUBLISH" : "PUBLISH",
                                  })
                                }
                              >
                                {published ? (
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
                );
              })}
            </div>
          )}
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={applyPublication}
        title={
          pending
            ? `${
                pending.action === "PUBLISH" ? "Publish" : "Unpublish"
              } ${pending.scope === "TERM" ? "the whole term" : "the sequence"}`
            : ""
        }
        message={
          pending
            ? `${pending.action === "PUBLISH" ? "Publishing" : "Unpublishing"} ${
                pending.scope === "TERM"
                  ? `every sequence of ${pending.className}`
                  : `${pending.sequenceName} for ${pending.className}`
              }. ${
                pending.action === "PUBLISH"
                  ? "Parents and teachers of the class will be notified and the results become visible to them."
                  : "The results will no longer be visible to parents and teachers."
              }`
            : ""
        }
        confirmLabel={pending?.action === "PUBLISH" ? "Publish" : "Unpublish"}
        loading={working}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
