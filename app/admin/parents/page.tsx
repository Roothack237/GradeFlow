"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
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
  Modal,
  PageHeader,
  Select,
  StatCard,
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type Child = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  status: string;
};

type Parent = {
  id: string;
  parentId: string;
  fullName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  children: Child[];
};

type StudentRow = {
  id: string;
  fullName: string;
  matricule: string;
  className: string;
  parentId: string | null;
  parentName: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [linkFilter, setLinkFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  });

  const [selectedChildren, setSelectedChildren] = useState<StudentRow[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<StudentRow[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const [detail, setDetail] = useState<Parent | null>(null);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [working, setWorking] = useState(false);

  /* ---------------- load parents ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/parents", { cache: "no-store" });

      if (!response.ok) throw new Error("failed");

      const payload = await response.json();

      setParents(payload.parents ?? []);
    } catch {
      setError("Unable to load the parents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- student picker ---------------- */

  const searchStudents = useCallback(
    async (term: string) => {
      try {
        setSearchingStudents(true);

        const params = new URLSearchParams({ pageSize: "25" });

        if (term.trim()) params.set("search", term.trim());

        // Students already linked to the parent being edited stay selectable,
        // every other linked student is filtered out below.
        params.set("withoutParent", "true");

        const response = await fetch(`/api/admin/students?${params}`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("failed");

        const payload = await response.json();

        setStudentResults(payload.students ?? []);
      } catch {
        setStudentResults([]);
      } finally {
        setSearchingStudents(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!modalOpen) return;

    const timer = setTimeout(() => searchStudents(studentSearch), 300);

    return () => clearTimeout(timer);
  }, [modalOpen, studentSearch, searchStudents]);

  /* ---------------- open modals ---------------- */

  function openCreate() {
    setEditing(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
    });
    setSelectedChildren([]);
    setStudentSearch("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(parent: Parent) {
    setEditing(parent);
    setForm({
      firstName: parent.fullName.split(" ")[0] ?? "",
      lastName: parent.lastName ?? "",
      email: parent.email ?? "",
      phone: parent.phone ?? "",
      gender: parent.gender ?? "",
      dateOfBirth: parent.dateOfBirth
        ? parent.dateOfBirth.slice(0, 10)
        : "",
    });
    setSelectedChildren(
      parent.children.map((child) => ({
        id: child.id,
        fullName: `${child.firstName} ${child.lastName}`,
        matricule: child.matricule,
        className: "",
        parentId: parent.id,
        parentName: parent.fullName,
      }))
    );
    setStudentSearch("");
    setFormError("");
    setModalOpen(true);
  }

  /* ---------------- save ---------------- */

  async function save() {
    setFormError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First name and last name are required.");
      return;
    }

    if (!form.email.trim()) {
      setFormError("An email address is required.");
      return;
    }

    if (selectedChildren.length === 0) {
      setFormError(
        "A parent must be linked to at least one student. Search for the child above."
      );
      return;
    }

    setSaving(true);

    try {
      const endpoint = editing
        ? `/api/admin/parents/${editing.id}`
        : "/api/admin/parents";

      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          children: selectedChildren.map((child) => ({
            studentId: child.id,
            name: child.fullName,
          })),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(payload.error ?? "Unable to save the parent.");
        return;
      }

      setModalOpen(false);
      setToast(
        payload.warning
          ? payload.warning
          : editing
            ? "Parent account updated."
            : "Parent account created."
      );
      await load();
    } catch {
      setFormError("Unable to save the parent.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- delete ---------------- */

  async function remove() {
    if (!parentToDelete) return;

    setWorking(true);

    try {
      const response = await fetch(`/api/admin/parents/${parentToDelete.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete the parent.");
        return;
      }

      setToast("Parent account deleted.");
      setParentToDelete(null);
      setDetail(null);
      await load();
    } catch {
      setError("Unable to delete the parent.");
    } finally {
      setWorking(false);
    }
  }

  /* ---------------- derived data ---------------- */

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return parents.filter((parent) => {
      if (term) {
        const haystack = [
          parent.fullName,
          parent.email,
          parent.parentId,
          parent.phone ?? "",
          ...parent.children.map(
            (child) => `${child.firstName} ${child.lastName} ${child.matricule}`
          ),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      if (linkFilter === "LINKED" && parent.children.length === 0) return false;
      if (linkFilter === "UNLINKED" && parent.children.length > 0) return false;
      if (genderFilter && parent.gender !== genderFilter) return false;

      return true;
    });
  }, [parents, search, linkFilter, genderFilter]);

  const stats = useMemo(() => {
    const children = parents.reduce(
      (total, parent) => total + parent.children.length,
      0
    );

    return {
      total: parents.length,
      linked: parents.filter((parent) => parent.children.length > 0).length,
      children,
      withPhone: parents.filter((parent) => Boolean(parent.phone)).length,
    };
  }, [parents]);

  const activeFilters =
    (search ? 1 : 0) + (linkFilter ? 1 : 0) + (genderFilter ? 1 : 0);

  return (
    <AdminShell
      title="Parents"
      subtitle="Manage the parent accounts and the children linked to them."
    >
      <PageHeader
        title="Parents"
        subtitle="Parent accounts, their contact details and the students they follow."
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
          label="With children"
          value={stats.linked}
          icon={<GraduationCap size={20} />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Students followed"
          value={stats.children}
          icon={<UserRound size={20} />}
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="Phone numbers"
          value={stats.withPhone}
          icon={<Phone size={20} />}
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
              placeholder="Search a parent, email, phone or child…"
              className="pl-10"
            />
          </div>

          <Select
            value={linkFilter}
            onChange={(event) => setLinkFilter(event.target.value)}
          >
            <option value="">All parents</option>
            <option value="LINKED">With children</option>
            <option value="UNLINKED">Without children</option>
          </Select>

          <Select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
          >
            <option value="">All genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>

          {activeFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setLinkFilter("");
                setGenderFilter("");
              }}
            >
              <X size={16} />
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading the parents…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Users size={20} />}
              title={parents.length === 0 ? "No parent yet" : "No parent found"}
              message={
                parents.length === 0
                  ? "Create the first parent account to let families follow their children."
                  : "No parent matches the current filters."
              }
              action={
                parents.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Plus size={16} />
                    Add parent
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Children</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((parent) => (
                    <tr
                      key={parent.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                            {parent.fullName
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </span>

                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {parent.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {parent.parentId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <Mail size={13} className="text-gray-400" />
                          {parent.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Phone size={13} className="text-gray-400" />
                          {parent.phone ?? "No phone"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {parent.children.length === 0 ? (
                          <Badge tone="amber">Not linked</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {parent.children.slice(0, 3).map((child) => (
                              <Badge key={child.id} tone="purple">
                                {child.firstName} {child.lastName}
                              </Badge>
                            ))}
                            {parent.children.length > 3 ? (
                              <Badge tone="gray">
                                +{parent.children.length - 3}
                              </Badge>
                            ) : null}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetail(parent)}
                          >
                            View
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
                            onClick={() => setParentToDelete(parent)}
                          >
                            <Trash2 size={15} className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Showing {filtered.length} of {parents.length} parent(s)
            </div>
          </>
        )}
      </Card>

      {/* ---------------- create / edit ---------------- */}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit parent" : "Add parent"}
        subtitle="The parent receives a login code by email once the account is created."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
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

        <div className="space-y-5">
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

          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Children ({selectedChildren.length})
            </p>

            {selectedChildren.length === 0 ? (
              <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
                At least one child is required.
              </p>
            ) : (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedChildren.map((child) => (
                  <span
                    key={child.id}
                    className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-950 dark:text-purple-200"
                  >
                    {child.fullName}
                    {child.matricule ? ` · ${child.matricule}` : ""}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChildren(
                          selectedChildren.filter(
                            (item) => item.id !== child.id
                          )
                        )
                      }
                      aria-label={`Remove ${child.fullName}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search a student who is not linked to a parent yet…"
                className="pl-9"
              />
            </div>

            {searchingStudents ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Searching…
              </p>
            ) : studentResults.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                No unlinked student found.
              </p>
            ) : (
              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                {studentResults
                  .filter(
                    (student) =>
                      !selectedChildren.some((child) => child.id === student.id)
                  )
                  .map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() =>
                        setSelectedChildren([...selectedChildren, student])
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm transition hover:border-purple-400 hover:bg-purple-50 dark:border-gray-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/30"
                    >
                      <span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {student.fullName}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {student.matricule} · {student.className}
                        </span>
                      </span>
                      <Plus size={15} className="text-purple-700" />
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ---------------- detail ---------------- */}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.fullName ?? "Parent"}
        subtitle={detail?.parentId}
        size="md"
        footer={
          detail ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const parent = detail;
                  setDetail(null);
                  if (parent) openEdit(parent);
                }}
              >
                <Pencil size={15} />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => setParentToDelete(detail)}
              >
                <Trash2 size={15} />
                Delete
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white">{detail.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-gray-900 dark:text-white">
                  {detail.phone ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gender
                </p>
                <p className="text-gray-900 dark:text-white">
                  {detail.gender ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Added on
                </p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(detail.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Children ({detail.children.length})
              </p>

              {detail.children.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No child is linked to this parent yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {child.firstName} {child.lastName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {child.matricule}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(parentToDelete)}
        onClose={() => setParentToDelete(null)}
        onConfirm={remove}
        title="Delete parent account"
        message={
          parentToDelete
            ? `${parentToDelete.fullName} will be deleted. The linked students keep their records and become unlinked.`
            : ""
        }
        confirmLabel="Delete"
        loading={working}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
