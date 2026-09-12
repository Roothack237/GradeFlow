"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  BookOpen,
  School,
  Eye,
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
  Modal,
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

type Assignment = {
  id: string;
  subject: { id: string; name: string; code: string | null };
  classroom: {
    id: string;
    name: string;
    section: { id: string; name: string } | null;
  };
};

type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  assignments: Assignment[];
};

type Option = { id: string; name: string };
type ClassOption = Option & { sectionId: string; sectionName: string | null };

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  teacherId: string;
  assignments: { classroomId: string; subjectId: string }[];
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  teacherId: "",
  assignments: [],
};

/* =========================================================
   PAGE
========================================================= */

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detail, setDetail] = useState<Teacher | null>(null);
  const [toDelete, setToDelete] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------- load ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        fetch("/api/admin/teachers", { cache: "no-store" }),
        fetch("/api/admin/classes", { cache: "no-store" }),
        fetch("/api/admin/subjects", { cache: "no-store" }),
      ]);

      if (!teachersRes.ok) throw new Error("failed");

      const data = await teachersRes.json();

      if (data.success === false) throw new Error("failed");

      setTeachers(data.teachers ?? []);

      if (classesRes.ok) {
        const classData = await classesRes.json();

        setClasses(
          (classData.classes ?? []).map(
            (classroom: {
              id: string;
              name: string;
              sectionId: string;
              section: { name: string } | null;
            }) => ({
              id: classroom.id,
              name: classroom.name,
              sectionId: classroom.sectionId,
              sectionName: classroom.section?.name ?? null,
            })
          )
        );
      }

      if (subjectsRes.ok) {
        const subjectData = await subjectsRes.json();

        setSubjects(
          (Array.isArray(subjectData) ? subjectData : (subjectData.subjects ?? [])).map(
            (subject: { id: string; name: string }) => ({
              id: subject.id,
              name: subject.name,
            })
          )
        );
      }
    } catch {
      setError("Unable to load the teachers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- derived ---------------- */

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      if (term) {
        const haystack = [
          teacher.fullName,
          teacher.email,
          teacher.teacherId,
          teacher.phone ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      if (subjectFilter) {
        if (!teacher.assignments.some((a) => a.subject.id === subjectFilter)) {
          return false;
        }
      }

      if (classFilter) {
        if (!teacher.assignments.some((a) => a.classroom.id === classFilter)) {
          return false;
        }
      }

      if (assignmentFilter === "ASSIGNED" && teacher.assignments.length === 0) {
        return false;
      }

      if (assignmentFilter === "UNASSIGNED" && teacher.assignments.length > 0) {
        return false;
      }

      return true;
    });
  }, [teachers, search, subjectFilter, classFilter, assignmentFilter]);

  const stats = useMemo(() => {
    const subjectIds = new Set<string>();
    const classroomIds = new Set<string>();
    let assigned = 0;

    for (const teacher of teachers) {
      if (teacher.assignments.length) assigned += 1;

      for (const assignment of teacher.assignments) {
        subjectIds.add(assignment.subject.id);
        classroomIds.add(assignment.classroom.id);
      }
    }

    return {
      total: teachers.length,
      assigned,
      subjects: subjectIds.size,
      classes: classroomIds.size,
    };
  }, [teachers]);

  const activeFilters =
    (search ? 1 : 0) +
    (subjectFilter ? 1 : 0) +
    (classFilter ? 1 : 0) +
    (assignmentFilter ? 1 : 0);

  /* ---------------- form helpers ---------------- */

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(teacher: Teacher) {
    setEditing(teacher);
    setForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone ?? "",
      gender: teacher.gender ? teacher.gender.toUpperCase() : "",
      dateOfBirth: teacher.dateOfBirth
        ? teacher.dateOfBirth.slice(0, 10)
        : "",
      teacherId: teacher.teacherId,
      assignments: teacher.assignments.map((assignment) => ({
        classroomId: assignment.classroom.id,
        subjectId: assignment.subject.id,
      })),
    });
    setFormError("");
    setModalOpen(true);
  }

  async function submit() {
    setFormError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError("First name, last name and email are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        ...(editing ? {} : form.teacherId.trim() ? { teacherId: form.teacherId.trim() } : {}),
      };

      const response = await fetch(
        editing ? `/api/admin/teachers/${editing.id}` : "/api/admin/teachers",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        setFormError(data.error ?? "Unable to save the teacher.");
        return;
      }

      const teacherId = editing?.id ?? data.teacher?.id;

      /* the assignment list is managed through its own endpoint */
      if (teacherId && !editing) {
        if (form.assignments.length) {
          await fetch("/api/admin/teacher-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teacherId,
              assignments: form.assignments,
            }),
          });
        }
      }

      setModalOpen(false);
      setToast(
        editing
          ? "Teacher profile updated."
          : "Teacher created. The 4-digit login code has been emailed to them."
      );
      await load();
    } catch {
      setFormError("Unable to save the teacher. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/teachers/${toDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        setError(data.error ?? "Unable to delete the teacher.");
        return;
      }

      setToast("Teacher deleted.");
      setToDelete(null);
      await load();
    } catch {
      setError("Unable to delete the teacher.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Teachers"
      subtitle="Manage teaching staff and their class and subject assignments."
    >
      <PageHeader
        title="Teachers"
        subtitle="Every teacher account is stored in the school database."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={openCreate}>
          <Plus size={16} />
          Add teacher
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Teachers"
          value={stats.total}
          icon={<GraduationCap size={20} />}
          tone="purple"
          loading={loading}
        />
        <StatCard
          label="With assignments"
          value={stats.assigned}
          icon={<Users size={20} />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Subjects covered"
          value={stats.subjects}
          icon={<BookOpen size={20} />}
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="Classes covered"
          value={stats.classes}
          icon={<School size={20} />}
          tone="amber"
          loading={loading}
        />
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      <Card bodyClassName="p-4" className="mb-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, teacher ID or phone…"
              className="pl-10"
            />
          </div>

          <Select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>

          <Select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="">All classes</option>
            {classes.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </Select>

          <Select
            value={assignmentFilter}
            onChange={(event) => setAssignmentFilter(event.target.value)}
          >
            <option value="">All teachers</option>
            <option value="ASSIGNED">With assignments</option>
            <option value="UNASSIGNED">Without assignments</option>
          </Select>

          {activeFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setSubjectFilter("");
                setClassFilter("");
                setAssignmentFilter("");
              }}
            >
              <X size={16} />
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      <Card bodyClassName="">
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading teachers…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<GraduationCap size={20} />}
              title="No teachers found"
              message={
                activeFilters
                  ? "No teacher matches the current search and filters."
                  : "Add the first teacher to get started."
              }
            />
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Teacher</Th>
                <Th>Contact</Th>
                <Th>Gender</Th>
                <Th>Assignments</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <Td>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {teacher.fullName}
                    </p>
                    <p className="font-mono text-[11px] text-gray-400">
                      {teacher.teacherId}
                    </p>
                  </Td>

                  <Td>
                    <p className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <Mail size={13} className="text-gray-400" />
                      {teacher.email}
                    </p>
                    {teacher.phone ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Phone size={13} className="text-gray-400" />
                        {teacher.phone}
                      </p>
                    ) : null}
                  </Td>

                  <Td className="text-sm capitalize">
                    {teacher.gender ? teacher.gender.toLowerCase() : "—"}
                  </Td>

                  <Td>
                    {teacher.assignments.length === 0 ? (
                      <Badge tone="amber">No assignment</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.assignments.slice(0, 3).map((assignment) => (
                          <Badge key={assignment.id} tone="purple">
                            {assignment.subject.name} ·{" "}
                            {assignment.classroom.name}
                          </Badge>
                        ))}

                        {teacher.assignments.length > 3 ? (
                          <Badge tone="gray">
                            +{teacher.assignments.length - 3} more
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </Td>

                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetail(teacher)}
                      >
                        <Eye size={15} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(teacher)}
                      >
                        <Pencil size={15} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(teacher)}
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {/* ---------------- create / edit ---------------- */}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit teacher" : "Add teacher"}
        subtitle={
          editing
            ? "Update the teacher profile."
            : "A 4-digit login code is generated and emailed to the teacher automatically."
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? "Save changes" : "Create teacher"}
            </Button>
          </div>
        }
      >
        {formError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
            />
          </Field>

          <Field label="Last name" required>
            <Input
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
            />
          </Field>

          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </Field>

          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </Field>

          <Field label="Gender">
            <Select
              value={form.gender}
              onChange={(event) =>
                setForm({ ...form, gender: event.target.value })
              }
            >
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
          </Field>

          <Field label="Date of birth">
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm({ ...form, dateOfBirth: event.target.value })
              }
            />
          </Field>

          {!editing ? (
            <Field
              label="Teacher ID"
              hint="Leave empty to generate one automatically."
            >
              <Input
                value={form.teacherId}
                onChange={(event) =>
                  setForm({ ...form, teacherId: event.target.value })
                }
              />
            </Field>
          ) : null}
        </div>

        {!editing ? (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Class and subject assignments
              </p>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    assignments: [
                      ...form.assignments,
                      { classroomId: "", subjectId: "" },
                    ],
                  })
                }
              >
                <Plus size={14} />
                Add assignment
              </Button>
            </div>

            {form.assignments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No assignment yet. Assignments can also be managed from the
                Teacher Assignments page.
              </p>
            ) : (
              <div className="space-y-2">
                {form.assignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <Select
                      value={assignment.classroomId}
                      onChange={(event) => {
                        const next = [...form.assignments];

                        next[index] = {
                          ...next[index],
                          classroomId: event.target.value,
                        };

                        setForm({ ...form, assignments: next });
                      }}
                    >
                      <option value="">Select a class</option>
                      {classes.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </Select>

                    <Select
                      value={assignment.subjectId}
                      onChange={(event) => {
                        const next = [...form.assignments];

                        next[index] = {
                          ...next[index],
                          subjectId: event.target.value,
                        };

                        setForm({ ...form, assignments: next });
                      }}
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setForm({
                          ...form,
                          assignments: form.assignments.filter(
                            (_, position) => position !== index
                          ),
                        })
                      }
                    >
                      <Trash2 size={15} className="text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ---------------- detail ---------------- */}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.fullName ?? "Teacher"}
        subtitle={detail ? `Teacher ID ${detail.teacherId}` : undefined}
        size="md"
      >
        {detail ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detail.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detail.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gender
                </p>
                <p className="font-medium capitalize text-gray-900 dark:text-white">
                  {detail.gender ? detail.gender.toLowerCase() : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Date of birth
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detail.dateOfBirth
                    ? new Date(detail.dateOfBirth).toLocaleDateString("en-GB")
                    : "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Assignments
              </p>

              {detail.assignments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  This teacher has no class assignment yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {assignment.subject.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.classroom.name}
                        {assignment.classroom.section
                          ? ` · ${assignment.classroom.section.name}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete teacher"
        message={
          toDelete
            ? `${toDelete.fullName} will be removed together with the linked user account. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
