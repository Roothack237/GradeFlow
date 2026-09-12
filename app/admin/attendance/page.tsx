"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  X,
  RefreshCw,
  Trash2,
  Download,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  Percent,
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

type AttendanceRow = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  studentName: string;
  matricule: string;
  className: string | null;
  subjectName: string;
  teacherName: string;
  sequenceName: string;
  termName: string;
  academicYearName: string;
};

type Summary = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
  total: number;
  rate: number | null;
};

type Option = { id: string; name: string };

type TermOption = Option & {
  sequences: { id: string; name: string }[];
};

const STATUS_TONES: Record<string, "green" | "red" | "amber" | "blue"> = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "amber",
  EXCUSED: "blue",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   PAGE
========================================================= */

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [sequenceFilter, setSequenceFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const [deleteTarget, setDeleteTarget] = useState<AttendanceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------- debounce the student search ---------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- lookups ---------------- */

  useEffect(() => {
    async function loadLookups() {
      try {
        const [classesRes, subjectsRes, teachersRes, yearsRes, termsRes] =
          await Promise.all([
            fetch("/api/admin/classes", { cache: "no-store" }),
            fetch("/api/admin/subjects", { cache: "no-store" }),
            fetch("/api/admin/teachers", { cache: "no-store" }),
            fetch("/api/admin/academic-years", { cache: "no-store" }),
            fetch("/api/admin/terms", { cache: "no-store" }),
          ]);

        if (classesRes.ok) {
          const data = await classesRes.json();
          setClasses(data.classes ?? data.classrooms ?? []);
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
          setTerms(data.terms ?? []);
        }
      } catch {
        /* lookups are non-critical */
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

  /* ---------------- load attendance ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (yearFilter) params.set("academicYearId", yearFilter);
      if (termFilter) params.set("termId", termFilter);
      if (sequenceFilter) params.set("sequenceId", sequenceFilter);
      if (classFilter) params.set("classroomId", classFilter);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (teacherFilter) params.set("teacherId", teacherFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(`/api/admin/attendance?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();

      setRows(data.attendance ?? []);
      setSummary(data.summary ?? null);
      setTotal(data.total ?? 0);
    } catch {
      setError("Unable to load attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    yearFilter,
    termFilter,
    sequenceFilter,
    classFilter,
    subjectFilter,
    teacherFilter,
    statusFilter,
    from,
    to,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- actions ---------------- */

  async function changeStatus(row: AttendanceRow, status: string) {
    try {
      const response = await fetch(`/api/admin/attendance/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("failed");

      setToast("Attendance updated.");
      load();
    } catch {
      setError("Unable to update this attendance record.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/attendance/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("failed");

      setDeleteTarget(null);
      setToast("Attendance record deleted.");
      load();
    } catch {
      setError("Unable to delete this attendance record.");
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setYearFilter("");
    setTermFilter("");
    setSequenceFilter("");
    setClassFilter("");
    setSubjectFilter("");
    setTeacherFilter("");
    setStatusFilter("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const activeFilters = [
    yearFilter,
    termFilter,
    sequenceFilter,
    classFilter,
    subjectFilter,
    teacherFilter,
    statusFilter,
    from,
    to,
  ].filter(Boolean).length;

  function exportCsv() {
    const header = [
      "Date",
      "Student",
      "Matricule",
      "Class",
      "Subject",
      "Teacher",
      "Sequence",
      "Term",
      "Year",
      "Status",
    ];

    const lines = rows.map((row) =>
      [
        row.date.slice(0, 10),
        row.studentName,
        row.matricule,
        row.className ?? "",
        row.subjectName,
        row.teacherName,
        row.sequenceName,
        row.termName,
        row.academicYearName,
        row.status,
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
    link.download = `gradeflow-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell
      title="Attendance"
      subtitle="Review and manage the attendance recorded by teachers."
    >
      <PageHeader
        title="Attendance records"
        subtitle="Every attendance entry, with school-wide statistics."
      >
        <Button variant="secondary" onClick={() => load()} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}>
          <Download size={16} />
          Export CSV
        </Button>
      </PageHeader>

      {/* STATISTICS */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Attendance rate"
          value={summary?.rate === null ? "—" : `${summary?.rate ?? 0}%`}
          icon={<Percent size={20} />}
          tone="purple"
          hint={`${summary?.total ?? 0} record(s)`}
          loading={loading && !summary}
        />
        <StatCard
          label="Present"
          value={summary?.PRESENT ?? 0}
          icon={<UserCheck size={20} />}
          tone="emerald"
          loading={loading && !summary}
        />
        <StatCard
          label="Absent"
          value={summary?.ABSENT ?? 0}
          icon={<UserX size={20} />}
          tone="red"
          loading={loading && !summary}
        />
        <StatCard
          label="Late"
          value={summary?.LATE ?? 0}
          icon={<Clock size={20} />}
          tone="amber"
          loading={loading && !summary}
        />
        <StatCard
          label="Excused"
          value={summary?.EXCUSED ?? 0}
          icon={<ShieldCheck size={20} />}
          tone="blue"
          loading={loading && !summary}
        />
      </div>

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
            <Button variant="ghost" onClick={clearFilters}>
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
                  setPage(1);
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
                {terms.map((term) => (
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

            <Field label="Status">
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
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

            <Field label="From date">
              <Input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
            </Field>

            <Field label="To date">
              <Input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </Field>
          </div>
        ) : null}
      </Card>

      {/* TABLE */}

      <Card bodyClassName="">
        {error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : loading ? (
          <div className="p-5">
            <LoadingState />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<CalendarCheck size={20} />}
              title="No attendance found"
              message={
                activeFilters || search
                  ? "No attendance record matches the current filters."
                  : "Attendance recorded by teachers will appear here."
              }
            />
          </div>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th>Subject</Th>
                  <Th>Teacher</Th>
                  <Th>Sequence</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <Td className="whitespace-nowrap text-xs">
                      {formatDate(row.date)}
                    </Td>

                    <Td>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {row.studentName}
                      </p>
                      <p className="font-mono text-[11px] text-gray-400">
                        {row.matricule}
                      </p>
                    </Td>

                    <Td className="text-sm">{row.className ?? "—"}</Td>
                    <Td className="text-sm">{row.subjectName}</Td>
                    <Td className="text-sm text-gray-500 dark:text-gray-400">
                      {row.teacherName}
                    </Td>

                    <Td className="text-xs text-gray-500 dark:text-gray-400">
                      <p>{row.sequenceName}</p>
                      <p className="text-[11px]">{row.termName}</p>
                    </Td>

                    <Td>
                      <Select
                        value={row.status}
                        onChange={(event) => changeStatus(row, event.target.value)}
                        className="w-[122px] py-1.5 text-xs"
                        aria-label={`Status for ${row.studentName}`}
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                      </Select>
                    </Td>

                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <Badge tone={STATUS_TONES[row.status] ?? "gray"}>
                          {row.status}
                        </Badge>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Delete record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete attendance record"
        message={`Delete the ${deleteTarget?.status.toLowerCase()} record for ${
          deleteTarget?.studentName ?? "this student"
        } on ${deleteTarget ? formatDate(deleteTarget.date) : ""}?`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
