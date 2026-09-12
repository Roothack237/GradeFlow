"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Mail,
  Phone,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  X,
  UserRound,
  GraduationCap,
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

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  classroomId: string | null;
  classroom?: { id: string; name: string } | null;
};

type Parent = {
  id: string;
  parentId: string;
  fullName: string;
  firstName?: string | null;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  children: Child[];
};

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  className: string | null;
  parentId: string | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  children: { studentId: string; name: string }[];
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  children: [],
};

/* =========================================================
   PAGE
========================================================= */

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [search, setSearch] = useState("");
  const [linkFilter, setLinkFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [childSearch, setChildSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detail, setDetail] = useState<Parent | null>(null);
  const [toDelete, setToDelete] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------- load ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [parentsRes, studentsRes] = await Promise.all([
        fetch("/api/admin/parents", { cache: "no-store" }),
        fetch("/api/admin/students?page=1&pageSize=200", { cache: "no-store" }),
      ]);

      if (!parentsRes.ok) throw new Error("failed");

      const data = await parentsRes.json();

      setParents(data.parents ?? []);

      if (studentsRes.ok) {
        const studentData = await studentsRes.json();

        setStudents(studentData.students ?? []);
      }
    } catch {
      setError("Unable to load the parents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- derived ---------------- */

  const classNamesByChild = useMemo(() => {
    const map = new Map<string, string>();

    for (const student of students) {
      if (student.className) map.set(student.id, student.className);
    }

    return map;
  }, [students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return parents.filter((parent) => {
      if (term) {
        const haystack = [
          parent.fullName,
          parent.email ?? "",
          parent.phone ?? "",
          parent.parentId,
          ...parent.children.map((child) => child.firstName),
          ...parent.children.map((child) => child.lastName),
          ...parent.children.map((child) => child.matricule),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      if (linkFilter === "WITH" && parent.children.length === 0) return false;

      if (linkFilter === "WITHOUT" && parent.children.length > 0) return false;

      if (classFilter) {
        if (
          !parent.children.some(
            (child) =>
              child.classroomId === classFilter ||
              child.classroom?.id === classFilter
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [parents, search, linkFilter, classFilter]);

  const stats = useMemo(() => {
    const linked = parents.reduce(
      (sum, parent) => sum + parent.children.length,
      0
    );

    const withoutParent = students.filter((student) => !student.parentId).length;

    return {
      total: parents.length,
      linked,
      unassigned: withoutParent,
      average: parents.length
        ? Math.round((linked / parents.length) * 10) / 10
        : 0,
    };
  }, [parents, students]);

  const classesForFilter = useMemo(() => {
    const map = new Map<string, string>();

    for (const parent of parents) {
      for (const child of parent.children) {
        const id = child.classroomId ?? child.classroom?.id;

        if (id && child.classroom?.name) map.set(id, child.classroom.name);
      }
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [parents]);

  /* ---------------- form helpers ---------------- */

  const availableStudents = useMemo(() => {
    const term = childSearch.trim().toLowerCase();

    const selectedIds = new Set(form.children.map((child) => child.studentId));

    return students
      .filter((student) => {
        /* students already linked to another parent are not selectable,
           unless they are already in this form */
        if (student.parentId && !selectedIds.has(student.id)) return false;

        if (!term) return true;

        return `${student.firstName} ${student.lastName} ${student.matricule} ${
          student.className ?? ""
        }`
          .toLowerCase()
          .includes(term);
      })
      .slice(0, 8);
  }, [students, childSearch, form.children]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setChildSearch("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(parent: Parent) {
    setEditing(parent);
    setForm({
      firstName: parent.fullName.split(" ")[0] ?? "",
      lastName: parent.lastName ?? parent.fullName.split(" ").slice(1).join(" "),
      email: parent.email ?? "",
      phone: parent.phone ?? "",
      gender: parent.gender ? parent.gender.toUpperCase() : "",
      dateOfBirth: parent.dateOfBirth ? parent.dateOfBirth.slice(0, 10) : "",
      children: parent.children.map((child) => ({
        studentId: child.id,
        name: `${child.firstName} ${child.lastName}`.trim(),
      })),
    });
    setChildSearch("");
    setFormError("");
    setModalOpen(true);
  }

  async function submit() {
    setFormError("");

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim()
    ) {
      setFormError("First name, last name and email are required.");
      return;
    }

    if (form.children.length === 0) {
      setFormError("At least one child is required.");
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
        children: form.children.map((child) => ({
          studentId: child.studentId,
          name: child.name,
        })),
      };

      const response = await fetch(
        editing ? `/api/admin/parents/${editing.id}` : "/api/admin/parents",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(data.error ?? "Unable to save the parent.");
        return;
      }

      setModalOpen(false);
      setToast(
        editing
          ? "Parent updated."
          : "Parent created. Their login code has been emailed to them."
      );
      await load();
    } catch {
      setFormError("Unable to save the parent. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/parents/${toDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to delete the parent.");
        return;
      }

      setToast("Parent deleted.");
      setToDelete(null);
      await load();
    } catch {
      setError("Unable to delete the parent.");
    } finally {
      setDeleting(false);
    }
  }

  const activeFilters =
    (search ? 1 : 0) + (linkFilter ? 1 : 0) + (classFilter ? 1 : 0);

  return (
    <AdminShell
      title="Parents"
      subtitle="Manage parent and guardian accounts and the students linked to them."
    >
      <PageHeader
        title="Parents"
        subtitle="Parent accounts and their children, straight from the database."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={openCreate}>
          <Plus size={16} />
          Add parent
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Parents"
          value={stats.total}
          icon={<Users size={20} />}
          tone="purple"
          loading={loading}
        />
        <StatCard
          label="Children linked"
          value={stats.linked}
          icon={<GraduationCap size={20} />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Students without a parent"
          value={stats.unassigned}
          icon={<UserRound size={20} />}
          tone={stats.unassigned ? "amber" : "gray"}
          loading={loading}
        />
        <StatCard
          label="Average children per parent"
          value={stats.average}
          icon={<Users size={20} />}
          tone="blue"
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
              placeholder="Search by parent, email, phone or child…"
              className="pl-10"
            />
          </div>

          <Select
            value={linkFilter}
            onChange={(event) => setLinkFilter(event.target.value)}
          >
            <option value="">All parents</option>
            <option value="WITH">With children</option>
            <option value="WITHOUT">Without children</option>
          </Select>

          <Select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="">All classes</option>
            {classesForFilter.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </Select>

          {activeFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setLinkFilter("");
                setClassFilter("");
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
            <LoadingState label="Loading parents…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Users size={20} />}
              title="No parents found"
              message={
                activeFilters
                  ? "No parent matches the current search and filters."
                  : "Add the first parent or guardian to get started."
              }
            />
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Parent</Th>
                <Th>Contact</Th>
                <Th>Children</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((parent) => (
                <tr
                  key={parent.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <Td>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {parent.fullName}
                    </p>
                    <p className="font-mono text-[11px] text-gray-400">
                      {parent.parentId}
                    </p>
                  </Td>

                  <Td>
                    <p className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <Mail size={13} className="text-gray-400" />
                      {parent.email ?? "—"}
                    </p>
                    {parent.phone ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Phone size={13} className="text-gray-400" />
                        {parent.phone}
                      </p>
                    ) : null}
                  </Td>

                  <Td>
                    {parent.children.length === 0 ? (
                      <Badge tone="amber">No child linked</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {parent.children.slice(0, 3).map((child) => (
                          <Badge key={child.id} tone="purple">
                            {child.firstName} {child.lastName}
                          </Badge>
                        ))}

                        {parent.children.length > 3 ? (
                          <Badge tone="gray">
                            +{parent.children.length - 3} more
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
                        onClick={() => setDetail(parent)}
                      >
                        <Eye size={15} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(parent)}
                      >
                        <Pencil size={15} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(parent)}
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
        title={editing ? "Edit parent" : "Add parent"}
        subtitle="A parent account always needs at least one verified child."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? "Save changes" : "Create parent"}
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
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Children
          </p>

          {form.children.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {form.children.map((child) => (
                <span
                  key={child.studentId}
                  className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                >
                  {child.name}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        children: form.children.filter(
                          (entry) => entry.studentId !== child.studentId
                        ),
                      })
                    }
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-3 rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No child linked yet. Search for a student below.
            </p>
          )}

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={childSearch}
              onChange={(event) => setChildSearch(event.target.value)}
              placeholder="Search a student by name, matricule or class…"
              className="pl-10"
            />
          </div>

          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {availableStudents.length === 0 ? (
              <p className="p-3 text-xs text-gray-500 dark:text-gray-400">
                No student available. Students can only be linked once.
              </p>
            ) : (
              availableStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      children: [
                        ...form.children,
                        {
                          studentId: student.id,
                          name: `${student.firstName} ${student.lastName}`.trim(),
                        },
                      ],
                    })
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left text-sm transition hover:border-purple-400 hover:bg-purple-50 dark:border-gray-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/30"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {student.className ?? "No class"} · {student.matricule}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ---------------- detail ---------------- */}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.fullName ?? "Parent"}
        subtitle={detail ? `Parent ID ${detail.parentId}` : undefined}
        size="md"
      >
        {detail ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detail.email ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detail.phone ?? "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Children
              </p>

              {detail.children.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No child linked to this account.
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.children.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {child.firstName} {child.lastName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {child.classroom?.name ??
                          classNamesByChild.get(child.id) ??
                          "No class"}{" "}
                        · {child.matricule}
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
        title="Delete parent"
        message={
          toDelete
            ? `${toDelete.fullName} will be removed, their login disabled and the children unlinked. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
