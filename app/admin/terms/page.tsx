"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CalendarDays,
  Layers,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  X,
  Star,
  CheckCircle2,
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

type Sequence = {
  id: string;
  name: string;
  order: number;
  _count?: { marks: number; attendances: number };
};

type Term = {
  id: string;
  name: string;
  order: number;
  isCurrent: boolean;
  academicYearId: string;
  academicYear: { id: string; name: string };
  sequences: Sequence[];
  _count?: { reportCards: number; resultPublications: number };
};

type AcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
};

/* =========================================================
   PAGE
========================================================= */

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [termModal, setTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState({
    name: "",
    academicYearId: "",
    order: "",
    isCurrent: false,
  });

  const [sequenceModal, setSequenceModal] = useState(false);
  const [sequenceParent, setSequenceParent] = useState<Term | null>(null);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [sequenceForm, setSequenceForm] = useState({ name: "", order: "" });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [termToDelete, setTermToDelete] = useState<Term | null>(null);
  const [sequenceToDelete, setSequenceToDelete] = useState<{
    sequence: Sequence;
    term: Term;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------- load ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [termsRes, yearsRes] = await Promise.all([
        fetch("/api/admin/terms", { cache: "no-store" }),
        fetch("/api/admin/academic-years", { cache: "no-store" }),
      ]);

      if (!termsRes.ok) throw new Error("failed");

      const data = await termsRes.json();

      setTerms(data.terms ?? []);

      if (yearsRes.ok) {
        const yearData = await yearsRes.json();

        setYears(yearData.academicYears ?? []);
      }
    } catch {
      setError("Unable to load terms and sequences. Please try again.");
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

    return terms.filter((entry) => {
      if (yearFilter && entry.academicYearId !== yearFilter) return false;

      if (!term) return true;

      return (
        entry.name.toLowerCase().includes(term) ||
        entry.academicYear.name.toLowerCase().includes(term) ||
        entry.sequences.some((sequence) =>
          sequence.name.toLowerCase().includes(term)
        )
      );
    });
  }, [terms, search, yearFilter]);

  const stats = useMemo(() => {
    const sequences = terms.reduce(
      (sum, entry) => sum + entry.sequences.length,
      0
    );

    const marks = terms.reduce(
      (sum, entry) =>
        sum +
        entry.sequences.reduce(
          (inner, sequence) => inner + (sequence._count?.marks ?? 0),
          0
        ),
      0
    );

    const current = terms.find((entry) => entry.isCurrent);

    return {
      terms: terms.length,
      sequences,
      marks,
      current: current ? `${current.name} · ${current.academicYear.name}` : "—",
    };
  }, [terms]);

  /* ---------------- term actions ---------------- */

  function openCreateTerm() {
    const active = years.find((year) => year.isActive) ?? years[0];

    setEditingTerm(null);
    setTermForm({
      name: "",
      academicYearId: active?.id ?? "",
      order: "",
      isCurrent: false,
    });
    setFormError("");
    setTermModal(true);
  }

  function openEditTerm(term: Term) {
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      academicYearId: term.academicYearId,
      order: String(term.order),
      isCurrent: term.isCurrent,
    });
    setFormError("");
    setTermModal(true);
  }

  async function saveTerm() {
    setFormError("");

    if (!termForm.name.trim()) {
      setFormError("A term name is required.");
      return;
    }

    if (!editingTerm && !termForm.academicYearId) {
      setFormError("An academic year is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingTerm ? `/api/admin/terms/${editingTerm.id}` : "/api/admin/terms",
        {
          method: editingTerm ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: termForm.name.trim(),
            ...(editingTerm
              ? {}
              : { academicYearId: termForm.academicYearId }),
            ...(termForm.order ? { order: Number(termForm.order) } : {}),
            isCurrent: termForm.isCurrent,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(data.error ?? "Unable to save the term.");
        return;
      }

      setTermModal(false);
      setToast(editingTerm ? "Term updated." : "Term created.");
      await load();
    } catch {
      setFormError("Unable to save the term. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function makeCurrent(term: Term) {
    try {
      const response = await fetch(`/api/admin/terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to set the current term.");
        return;
      }

      setToast(`${term.name} is now the current term.`);
      await load();
    } catch {
      setError("Unable to set the current term.");
    }
  }

  async function confirmDeleteTerm() {
    if (!termToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/terms/${termToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to delete the term.");
        return;
      }

      setToast("Term deleted.");
      setTermToDelete(null);
      await load();
    } catch {
      setError("Unable to delete the term.");
    } finally {
      setDeleting(false);
    }
  }

  /* ---------------- sequence actions ---------------- */

  function openCreateSequence(term: Term) {
    setSequenceParent(term);
    setEditingSequence(null);
    setSequenceForm({ name: "", order: "" });
    setFormError("");
    setSequenceModal(true);
  }

  function openEditSequence(term: Term, sequence: Sequence) {
    setSequenceParent(term);
    setEditingSequence(sequence);
    setSequenceForm({ name: sequence.name, order: String(sequence.order) });
    setFormError("");
    setSequenceModal(true);
  }

  async function saveSequence() {
    setFormError("");

    if (!sequenceForm.name.trim()) {
      setFormError("A sequence name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingSequence
          ? `/api/admin/sequences/${editingSequence.id}`
          : "/api/admin/sequences",
        {
          method: editingSequence ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sequenceForm.name.trim(),
            ...(editingSequence ? {} : { termId: sequenceParent?.id }),
            ...(sequenceForm.order ? { order: Number(sequenceForm.order) } : {}),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(data.error ?? "Unable to save the sequence.");
        return;
      }

      setSequenceModal(false);
      setToast(editingSequence ? "Sequence updated." : "Sequence created.");
      await load();
    } catch {
      setFormError("Unable to save the sequence. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteSequence() {
    if (!sequenceToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/sequences/${sequenceToDelete.sequence.id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to delete the sequence.");
        return;
      }

      setToast("Sequence deleted.");
      setSequenceToDelete(null);
      await load();
    } catch {
      setError("Unable to delete the sequence.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Terms & Sequences"
      subtitle="Organise the academic calendar into terms and sequences."
    >
      <PageHeader
        title="Terms & Sequences"
        subtitle="Terms belong to an academic year; each term is split into sequences."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={openCreateTerm} disabled={years.length === 0}>
          <Plus size={16} />
          Add term
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Terms"
          value={stats.terms}
          icon={<CalendarRange size={20} />}
          tone="purple"
          loading={loading}
        />
        <StatCard
          label="Sequences"
          value={stats.sequences}
          icon={<Layers size={20} />}
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="Marks recorded"
          value={stats.marks}
          icon={<CheckCircle2 size={20} />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Current term"
          value={stats.current}
          icon={<Star size={20} />}
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
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search a term, year or sequence…"
              className="pl-10"
            />
          </div>

          <Select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
          >
            <option value="">All academic years</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
                {year.isActive ? " (active)" : ""}
              </option>
            ))}
          </Select>

          {search || yearFilter ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setYearFilter("");
              }}
            >
              <X size={16} />
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {loading ? (
        <Card title="Loading terms">
          <LoadingState label="Loading terms and sequences…" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays size={20} />}
            title="No terms found"
            message={
              terms.length === 0
                ? "Create a term inside an academic year to get started."
                : "No term matches the current filters."
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {filtered.map((term) => (
            <Card
              key={term.id}
              title={term.name}
              description={`${term.academicYear.name} · term ${term.order}${
                term._count
                  ? ` · ${term._count.reportCards} report card(s)`
                  : ""
              }`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {term.isCurrent ? (
                    <Badge tone="green">Current term</Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => makeCurrent(term)}
                    >
                      <Star size={14} />
                      Set current
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openCreateSequence(term)}
                  >
                    <Plus size={14} />
                    Sequence
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditTerm(term)}
                  >
                    <Pencil size={15} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTermToDelete(term)}
                  >
                    <Trash2 size={15} className="text-red-500" />
                  </Button>
                </div>
              }
            >
              {term.sequences.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No sequence yet. Add the sequences that split this term.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {term.sequences.map((sequence) => (
                    <div
                      key={sequence.id}
                      className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sequence.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Order {sequence.order} ·{" "}
                            {sequence._count?.marks ?? 0} mark(s) ·{" "}
                            {sequence._count?.attendances ?? 0} attendance
                          </p>
                        </div>

                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditSequence(term, sequence)}
                          >
                            <Pencil size={14} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSequenceToDelete({ sequence, term })
                            }
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- term modal ---------------- */}

      <Modal
        open={termModal}
        onClose={() => setTermModal(false)}
        title={editingTerm ? "Edit term" : "Add term"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTermModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveTerm} loading={saving}>
              {editingTerm ? "Save changes" : "Create term"}
            </Button>
          </div>
        }
      >
        {formError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </div>
        ) : null}

        <div className="space-y-4">
          <Field label="Term name" required>
            <Input
              value={termForm.name}
              onChange={(event) =>
                setTermForm({ ...termForm, name: event.target.value })
              }
              placeholder="e.g. First Term"
            />
          </Field>

          {!editingTerm ? (
            <Field label="Academic year" required>
              <Select
                value={termForm.academicYearId}
                onChange={(event) =>
                  setTermForm({
                    ...termForm,
                    academicYearId: event.target.value,
                  })
                }
              >
                <option value="">Select an academic year</option>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                    {year.isActive ? " (active)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field label="Order" hint="Leave empty to append the term.">
            <Input
              type="number"
              value={termForm.order}
              onChange={(event) =>
                setTermForm({ ...termForm, order: event.target.value })
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={termForm.isCurrent}
              onChange={(event) =>
                setTermForm({ ...termForm, isCurrent: event.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-purple-700 focus:ring-purple-500"
            />
            Make this the current term
          </label>
        </div>
      </Modal>

      {/* ---------------- sequence modal ---------------- */}

      <Modal
        open={sequenceModal}
        onClose={() => setSequenceModal(false)}
        title={editingSequence ? "Edit sequence" : "Add sequence"}
        subtitle={sequenceParent ? `In ${sequenceParent.name}` : undefined}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSequenceModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveSequence} loading={saving}>
              {editingSequence ? "Save changes" : "Create sequence"}
            </Button>
          </div>
        }
      >
        {formError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </div>
        ) : null}

        <div className="space-y-4">
          <Field label="Sequence name" required>
            <Input
              value={sequenceForm.name}
              onChange={(event) =>
                setSequenceForm({ ...sequenceForm, name: event.target.value })
              }
              placeholder="e.g. First Sequence"
            />
          </Field>

          <Field label="Order" hint="Leave empty to append the sequence.">
            <Input
              type="number"
              value={sequenceForm.order}
              onChange={(event) =>
                setSequenceForm({ ...sequenceForm, order: event.target.value })
              }
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(termToDelete)}
        onClose={() => setTermToDelete(null)}
        onConfirm={confirmDeleteTerm}
        title="Delete term"
        message={
          termToDelete
            ? `${termToDelete.name} and its sequences will be deleted. Terms that already hold marks, attendance or publications cannot be removed.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />

      <ConfirmDialog
        open={Boolean(sequenceToDelete)}
        onClose={() => setSequenceToDelete(null)}
        onConfirm={confirmDeleteSequence}
        title="Delete sequence"
        message={
          sequenceToDelete
            ? `${sequenceToDelete.sequence.name} will be deleted from ${sequenceToDelete.term.name}. Sequences that already hold marks or attendance cannot be removed.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
