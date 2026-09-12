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
  const [riskFilter, setRiskFilter] = useState("");
  const [search, setSearch] = useState("");

  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [showMethod, setShowMethod] = useState(false);

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
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (termId) params.set("termId", termId);
      if (classroomId) params.set("classroomId", classroomId);

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
  }, [termId, classroomId]);

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

  const activeFilters = (riskFilter ? 1 : 0) + (search ? 1 : 0);

  return (
    <AdminShell
      title="Predictions"
      subtitle="Risk and performance projections computed from the marks and attendance in the database."
    >
      <PageHeader
        title="Predictions & Analytics"
        subtitle="Every projection below is derived from recorded school data — nothing is simulated."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Recompute
        </Button>

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

          <Field label="Class">
            <Select
              value={classroomId}
              onChange={(event) => setClassroomId(event.target.value)}
            >
              <option value="">All classes</option>
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </Select>
          </Field>

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
