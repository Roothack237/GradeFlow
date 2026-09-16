"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Filter,
  X,
  GraduationCap,
  ShieldOff,
  XCircle,
  RotateCcw,
  History,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import StudentStatusDialog, {
  type StudentStatusTarget,
} from "@/components/admin/StudentStatusDialog";
import {
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  actionLabel,
  availableStatusActions,
  statusLabel,
  statusTone,
  type StudentStatusAction,
} from "@/lib/student-status";
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
  Modal,
  PageHeader,
  Pagination,
  Select,
  TableWrap,
  Td,
  Th,
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type Student = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  status: "ACTIVE" | "SUSPENDED" | "DISMISSED" | "PENDING";
  className: string | null;
  classroomId: string;
  sectionName: string | null;
  sectionId: string | null;
  parentId: string | null;
  parentName: string | null;
};

type Classroom = {
  id: string;
  name: string;
  sectionId?: string;
  section?: { id: string; name: string } | null;
};

type Parent = { id: string; fullName: string };

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  gender: "MALE",
  dateOfBirth: "",
  classroomId: "",
  parentId: "",
  status: "ACTIVE",
  matricule: "",
};

/* =========================================================
   PAGE
========================================================= */

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState<{
    student: Student;
    action: StudentStatusAction;
  } | null>(null);

  /* ---------------- debounce search ---------------- */

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
        const [classesResponse, parentsResponse] = await Promise.all([
          fetch("/api/admin/classes", { cache: "no-store" }),
          fetch("/api/admin/parents", { cache: "no-store" }),
        ]);

        if (classesResponse.ok) {
          const data = await classesResponse.json();
          const list = Array.isArray(data)
            ? data
            : data.classes ?? data.classrooms ?? [];
          setClassrooms(list);
        }

        if (parentsResponse.ok) {
          const data = await parentsResponse.json();
          setParents(data.parents ?? []);
        }
      } catch {
        /* lookups are non critical */
      }
    }

    loadLookups();
  }, []);

  /* ---------------- load students ---------------- */

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (classFilter) params.set("classroomId", classFilter);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/students?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();

      setStudents(data.students ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Unable to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, classFilter, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* ---------------- form helpers ---------------- */

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setFormError("");
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth.slice(0, 10),
      classroomId: student.classroomId,
      parentId: student.parentId ?? "",
      status: student.status,
      matricule: student.matricule,
    });
    setFormOpen(true);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        editing ? `/api/admin/students/${editing.id}` : "/api/admin/students",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            parentId: form.parentId || null,
            matricule: form.matricule || undefined,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(data.error ?? "Unable to save the student.");
        return;
      }

      setFormOpen(false);
      setToast(
        editing ? "Student updated successfully." : "Student registered successfully."
      );
      loadStudents();
    } catch {
      setFormError("Unable to save the student. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/students/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("failed");

      setDeleteTarget(null);
      setToast("Student deleted.");
      loadStudents();
    } catch {
      setError("Unable to delete this student.");
    } finally {
      setDeleting(false);
    }
  }

  const activeFilters = useMemo(
    () => [classFilter, statusFilter].filter(Boolean).length,
    [classFilter, statusFilter]
  );

  return (
    <AdminShell
      title="Student Management"
      subtitle="Register students, manage their class, status and family links."
    >
      <PageHeader
        title="Students"
        subtitle="Every student registered in the school."
      >
        <Button variant="secondary" onClick={loadStudents} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={openCreate}>
          <Plus size={16} />
          Register student
        </Button>
      </PageHeader>

      {/* TOOLBAR */}

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
              placeholder="Search by name or matricule…"
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
                setClassFilter("");
                setStatusFilter("");
                setPage(1);
              }}
            >
              <X size={16} />
              Clear
            </Button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-800">
            <Field label="Class">
              <Select
                value={classFilter}
                onChange={(event) => {
                  setClassFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All classes</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
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
                {STUDENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STUDENT_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        ) : null}
      </Card>

      {/* TABLE */}

      <Card bodyClassName="">
        {error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={loadStudents} />
          </div>
        ) : loading ? (
          <div className="p-5">
            <LoadingState />
          </div>
        ) : students.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Users size={20} />}
              title="No students found"
              message={
                search || activeFilters
                  ? "No student matches the current search or filters."
                  : "Register your first student to get started."
              }
              action={
                <Button onClick={openCreate}>
                  <Plus size={16} />
                  Register student
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Matricule</Th>
                  <Th>Class</Th>
                  <Th>Parent / Guardian</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {student.gender === "FEMALE" ? "Female" : "Male"}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td className="font-mono text-xs">{student.matricule}</Td>

                    <Td>
                      <p>{student.className ?? "—"}</p>
                      <p className="text-xs text-gray-400">
                        {student.sectionName ?? ""}
                      </p>
                    </Td>

                    <Td>
                      {student.parentName ? (
                        <span className="text-sm">{student.parentName}</span>
                      ) : (
                        <Badge tone="amber">Not linked</Badge>
                      )}
                    </Td>

                    <Td>
                      <div className="space-y-1">
                        <Badge tone={statusTone(student.status)}>
                          {statusLabel(student.status)}
                        </Badge>

                        {student.status !== "ACTIVE" ? (
                          <p className="text-[11px] text-gray-400">
                            {student.status === "SUSPENDED"
                              ? "Keep history · not on the current roll"
                              : "Archived history · not enrolled"}
                          </p>
                        ) : null}
                      </div>
                    </Td>

                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {availableStatusActions(student.status).map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => setStatusTarget({ student, action })}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                              action === "REACTIVATE"
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                            }`}
                            title={`${actionLabel(action)} ${student.fullName}`}
                          >
                            {action === "SUSPEND" ? (
                              <ShieldOff size={13} />
                            ) : action === "DISMISS" ? (
                              <XCircle size={13} />
                            ) : (
                              <RotateCcw size={13} />
                            )}
                            {actionLabel(action)}
                          </button>
                        ))}

                        {student.status !== "ACTIVE" ? (
                          <Link
                            href={`/admin/students/${student.id}#history`}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            title={`View ${student.fullName}'s history`}
                          >
                            <History size={13} />
                            View History
                          </Link>
                        ) : null}

                        <Link
                          href={`/admin/students/${student.id}`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/40"
                          title="View profile"
                        >
                          <Eye size={16} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openEdit(student)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/40"
                          title="Edit student"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(student)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Delete student"
                        >
                          <Trash2 size={16} />
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

      {/* CREATE / EDIT */}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit student" : "Register a new student"}
        subtitle={
          editing
            ? "Update the student record. A parent is optional."
            : "A parent or guardian can be linked now or later."
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>

            <Button type="submit" form="student-form" loading={saving}>
              {editing ? "Save changes" : "Register student"}
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2">
          {formError ? (
            <div className="sm:col-span-2">
              <ErrorState message={formError} />
            </div>
          ) : null}

          <Field label="First name" required>
            <Input
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
              required
              minLength={2}
            />
          </Field>

          <Field label="Last name" required>
            <Input
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
              required
              minLength={2}
            />
          </Field>

          <Field label="Gender" required>
            <Select
              value={form.gender}
              onChange={(event) =>
                setForm({ ...form, gender: event.target.value })
              }
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
          </Field>

          <Field label="Date of birth" required>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm({ ...form, dateOfBirth: event.target.value })
              }
              required
            />
          </Field>

          <Field label="Class" required>
            <Select
              value={form.classroomId}
              onChange={(event) =>
                setForm({ ...form, classroomId: event.target.value })
              }
              required
            >
              <option value="">Select a class</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </Select>
          </Field>

          {editing ? (
            <Field
              label="Status"
              hint="Use the Suspend / Dismiss / Reactivate actions on the student row to change the status (a reason is recorded)."
            >
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(form.status)}>
                  {statusLabel(form.status)}
                </Badge>
              </div>
            </Field>
          ) : (
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
              </Select>
            </Field>
          )}

          <Field
            label="Parent / Guardian"
            hint="Optional — you can link a parent later."
          >
            <Select
              value={form.parentId}
              onChange={(event) =>
                setForm({ ...form, parentId: event.target.value })
              }
            >
              <option value="">No parent linked</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.fullName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Matricule" hint="Leave blank to generate automatically.">
            <Input
              value={form.matricule}
              onChange={(event) =>
                setForm({ ...form, matricule: event.target.value })
              }
              placeholder={editing ? "" : "GF-2026-000000"}
            />
          </Field>
        </form>
      </Modal>

      <StudentStatusDialog
        student={
          statusTarget
            ? ({
                id: statusTarget.student.id,
                fullName: statusTarget.student.fullName,
                matricule: statusTarget.student.matricule,
                className: statusTarget.student.className,
                status: statusTarget.student.status,
              } satisfies StudentStatusTarget)
            : null
        }
        action={statusTarget?.action ?? null}
        onClose={() => setStatusTarget(null)}
        onDone={(message) => {
          setToast(message);
          loadStudents();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete student"
        message={`Delete ${deleteTarget?.fullName ?? "this student"}? Their marks, attendance and report cards will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}

      {/* Legend for the "register" CTA when the list is empty in a filtered view */}
      {!loading && students.length === 0 && !search && !activeFilters ? (
        <div className="mt-5">
          <Card>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                <GraduationCap size={22} />
              </span>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Tip: link parents later
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Students can be registered without a parent. Open a student
                  profile to review attendance, marks and results.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </AdminShell>
  );
}
