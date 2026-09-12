"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Check,
  ChevronDown,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
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

type AcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
};

type Sequence = {
  id: string;
  name: string;
  order: number;
  termId: string;
  _count?: { marks: number; attendances: number };
};

type Term = {
  id: string;
  name: string;
  order: number;
  isCurrent: boolean;
  academicYearId: string;
  academicYear?: { id: string; name: string };
  sequences: Sequence[];
  _count?: { marks: number; reportCards: number };
};

/* =========================================================
   PAGE
========================================================= */

function termMarks(term: Term) {
  return term.sequences.reduce(
    (total, sequence) => total + (sequence._count?.marks ?? 0),
    0
  );
}

export default function TermsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [termModal, setTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState({ name: "", order: "1" });
  const [savingTerm, setSavingTerm] = useState(false);
  const [termError, setTermError] = useState("");

  const [sequenceModal, setSequenceModal] = useState(false);
  const [sequenceTerm, setSequenceTerm] = useState<Term | null>(null);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [sequenceForm, setSequenceForm] = useState({ name: "", order: "1" });
  const [savingSequence, setSavingSequence] = useState(false);
  const [sequenceError, setSequenceError] = useState("");

  const [termToDelete, setTermToDelete] = useState<Term | null>(null);
  const [sequenceToDelete, setSequenceToDelete] = useState<Sequence | null>(null);
  const [working, setWorking] = useState(false);

  /* ---------------- load ---------------- */

  const loadYears = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/academic-years", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const payload = await response.json();
      const list: AcademicYear[] = payload.academicYears ?? payload.years ?? [];

      setYears(list);
      setSelectedYear(
        (current) =>
          current || list.find((year) => year.isActive)?.id || list[0]?.id || ""
      );
    } catch {
      setError("Unable to load the academic years.");
    }
  }, []);

  const loadTerms = useCallback(async () => {
    if (!selectedYear) {
      setTerms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [termsResponse, sequencesResponse] = await Promise.all([
        fetch(`/api/admin/terms?academicYearId=${selectedYear}`, {
          cache: "no-store",
        }),
        fetch(`/api/admin/sequences?academicYearId=${selectedYear}`, {
          cache: "no-store",
        }),
      ]);

      if (!termsResponse.ok || !sequencesResponse.ok) throw new Error("failed");

      const termsPayload = await termsResponse.json();
      const sequencesPayload = await sequencesResponse.json();

      const sequences: Sequence[] =
        sequencesPayload.sequences ?? sequencesPayload ?? [];

      const baseTerms: Term[] = termsPayload.terms ?? termsPayload ?? [];

      setTerms(
        baseTerms.map((term) => ({
          ...term,
          sequences: sequences
            .filter((sequence) => sequence.termId === term.id)
            .sort((a, b) => a.order - b.order),
        }))
      );
    } catch {
      setError("Unable to load the terms and sequences. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const refresh = useCallback(async () => {
    await Promise.all([loadYears(), loadTerms()]);
  }, [loadYears, loadTerms]);

  /* ---------------- terms ---------------- */

  function openCreateTerm() {
    setEditingTerm(null);
    setTermForm({ name: "", order: String(terms.length + 1) });
    setTermError("");
    setTermModal(true);
  }

  function openEditTerm(term: Term) {
    setEditingTerm(term);
    setTermForm({ name: term.name, order: String(term.order) });
    setTermError("");
    setTermModal(true);
  }

  async function saveTerm() {
    setTermError("");

    if (!termForm.name.trim()) {
      setTermError("A term name is required.");
      return;
    }

    if (!selectedYear) {
      setTermError("Select an academic year first.");
      return;
    }

    setSavingTerm(true);

    try {
      const response = await fetch(
        editingTerm ? `/api/admin/terms/${editingTerm.id}` : "/api/admin/terms",
        {
          method: editingTerm ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: termForm.name.trim(),
            order: Number(termForm.order) || 1,
            ...(editingTerm ? {} : { academicYearId: selectedYear }),
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setTermError(payload.error ?? "Unable to save the term.");
        return;
      }

      setTermModal(false);
      setToast(editingTerm ? "Term updated." : "Term created.");
      await refresh();
    } catch {
      setTermError("Unable to save the term.");
    } finally {
      setSavingTerm(false);
    }
  }

  async function setCurrentTerm(term: Term) {
    setWorking(true);

    try {
      const response = await fetch(`/api/admin/terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to set the current term.");
        return;
      }

      setToast(`${term.name} is now the current term.`);
      await loadTerms();
    } catch {
      setError("Unable to set the current term.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteTerm() {
    if (!termToDelete) return;

    setWorking(true);

    try {
      const response = await fetch(`/api/admin/terms/${termToDelete.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete the term.");
        return;
      }

      setToast("Term deleted.");
      setTermToDelete(null);
      await loadTerms();
    } catch {
      setError("Unable to delete the term.");
    } finally {
      setWorking(false);
    }
  }

  /* ---------------- sequences ---------------- */

  function openCreateSequence(term: Term) {
    setSequenceTerm(term);
    setEditingSequence(null);
    setSequenceForm({
      name: "",
      order: String((term.sequences?.length ?? 0) + 1),
    });
    setSequenceError("");
    setSequenceModal(true);
  }

  function openEditSequence(term: Term, sequence: Sequence) {
    setSequenceTerm(term);
    setEditingSequence(sequence);
    setSequenceForm({ name: sequence.name, order: String(sequence.order) });
    setSequenceError("");
    setSequenceModal(true);
  }

  async function saveSequence() {
    setSequenceError("");

    if (!sequenceForm.name.trim()) {
      setSequenceError("A sequence name is required.");
      return;
    }

    if (!sequenceTerm) return;

    setSavingSequence(true);

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
            order: Number(sequenceForm.order) || 1,
            ...(editingSequence ? {} : { termId: sequenceTerm.id }),
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSequenceError(payload.error ?? "Unable to save the sequence.");
        return;
      }

      setSequenceModal(false);
      setToast(editingSequence ? "Sequence updated." : "Sequence created.");
      await loadTerms();
    } catch {
      setSequenceError("Unable to save the sequence.");
    } finally {
      setSavingSequence(false);
    }
  }

  async function deleteSequence() {
    if (!sequenceToDelete) return;

    setWorking(true);

    try {
      const response = await fetch(
        `/api/admin/sequences/${sequenceToDelete.id}`,
        { method: "DELETE" }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete the sequence.");
        return;
      }

      setToast("Sequence deleted.");
      setSequenceToDelete(null);
      await loadTerms();
    } catch {
      setError("Unable to delete the sequence.");
    } finally {
      setWorking(false);
    }
  }

  /* ---------------- derived ---------------- */

  const stats = useMemo(() => {
    const sequences = terms.reduce(
      (total, term) => total + term.sequences.length,
      0
    );

    const current = terms.find((term) => term.isCurrent);

    return {
      terms: terms.length,
      sequences,
      current: current?.name ?? "—",
      withMarks: terms.filter((term) =>
        term.sequences.some((sequence) => (sequence._count?.marks ?? 0) > 0)
      ).length,
    };
  }, [terms]);

  return (
    <AdminShell
      title="Terms & Sequences"
      subtitle="Organise the academic year into terms and sequences."
    >
      <PageHeader
        title="Terms & Sequences"
        subtitle="Terms group the sequences, and results can be published per term or per sequence."
      >
        <Button variant="secondary" onClick={refresh} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={openCreateTerm} disabled={!selectedYear}>
          <Plus size={16} />
          New term
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
          label="Current term"
          value={stats.current}
          icon={<Star size={20} />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Terms with marks"
          value={stats.withMarks}
          icon={<Check size={20} />}
          tone="amber"
          loading={loading}
        />
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      ) : null}

      <Card bodyClassName="p-4" className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Academic year">
            <Select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
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
        </div>
      </Card>

      {loading ? (
        <Card title="Terms">
          <LoadingState label="Loading the terms…" />
        </Card>
      ) : terms.length === 0 ? (
        <Card title="Terms">
          <EmptyState
            icon={<CalendarRange size={20} />}
            title="No term yet"
            message="Create the first term for the selected academic year."
            action={
              <Button onClick={openCreateTerm} disabled={!selectedYear}>
                <Plus size={16} />
                New term
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {terms.map((term) => {
            const isOpen = expanded[term.id] !== false;

            return (
              <Card key={term.id} bodyClassName="p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {term.name}
                      </p>

                      {term.isCurrent ? (
                        <Badge tone="green">
                          <Star size={11} /> Current
                        </Badge>
                      ) : null}

                      <Badge tone="gray">Order {term.order}</Badge>

                      <Badge tone="purple">
                        {term.sequences.length} sequence(s)
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {term.academicYear?.name ?? ""} ·{" "}
                      {termMarks(term)} mark(s) ·{" "}
                      {term._count?.reportCards ?? 0} report card(s)
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {!term.isCurrent ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentTerm(term)}
                        loading={working}
                      >
                        <Star size={14} />
                        Set current
                      </Button>
                    ) : null}

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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpanded({ ...expanded, [term.id]: !isOpen })
                      }
                      title={isOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {isOpen ? (
                  term.sequences.length === 0 ? (
                    <div className="p-4">
                      <EmptyState
                        icon={<Layers size={20} />}
                        title="No sequence in this term"
                        message="Add a sequence so teachers can record marks."
                      />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                          <tr>
                            <th className="px-4 py-2">Sequence</th>
                            <th className="px-4 py-2">Order</th>
                            <th className="px-4 py-2">Marks</th>
                            <th className="px-4 py-2">Attendance</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {term.sequences.map((sequence) => (
                            <tr key={sequence.id}>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                {sequence.name}
                              </td>
                              <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                {sequence.order}
                              </td>
                              <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                {sequence._count?.marks ?? 0}
                              </td>
                              <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                {sequence._count?.attendances ?? 0}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      openEditSequence(term, sequence)
                                    }
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setSequenceToDelete(sequence)
                                    }
                                  >
                                    <Trash2 size={14} className="text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------- term modal ---------------- */}

      <Modal
        open={termModal}
        onClose={() => setTermModal(false)}
        title={editingTerm ? "Edit term" : "New term"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTermModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveTerm} loading={savingTerm}>
              {editingTerm ? "Save changes" : "Create term"}
            </Button>
          </div>
        }
      >
        {termError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {termError}
          </div>
        ) : null}

        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={termForm.name}
              onChange={(event) =>
                setTermForm({ ...termForm, name: event.target.value })
              }
              placeholder="e.g. First Term"
            />
          </Field>

          <Field label="Order" hint="Lower numbers appear first.">
            <Input
              type="number"
              min={1}
              value={termForm.order}
              onChange={(event) =>
                setTermForm({ ...termForm, order: event.target.value })
              }
            />
          </Field>
        </div>
      </Modal>

      {/* ---------------- sequence modal ---------------- */}

      <Modal
        open={sequenceModal}
        onClose={() => setSequenceModal(false)}
        title={editingSequence ? "Edit sequence" : "New sequence"}
        subtitle={sequenceTerm?.name}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSequenceModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveSequence} loading={savingSequence}>
              {editingSequence ? "Save changes" : "Create sequence"}
            </Button>
          </div>
        }
      >
        {sequenceError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {sequenceError}
          </div>
        ) : null}

        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={sequenceForm.name}
              onChange={(event) =>
                setSequenceForm({ ...sequenceForm, name: event.target.value })
              }
              placeholder="e.g. First Sequence"
            />
          </Field>

          <Field label="Order" hint="Lower numbers appear first.">
            <Input
              type="number"
              min={1}
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
        onConfirm={deleteTerm}
        title="Delete term"
        message={
          termToDelete
            ? `${termToDelete.name} and its ${termToDelete.sequences.length} sequence(s) will be deleted. Terms that already hold results or report cards cannot be removed.`
            : ""
        }
        confirmLabel="Delete"
        loading={working}
      />

      <ConfirmDialog
        open={Boolean(sequenceToDelete)}
        onClose={() => setSequenceToDelete(null)}
        onConfirm={deleteSequence}
        title="Delete sequence"
        message={
          sequenceToDelete
            ? `${sequenceToDelete.name} will be deleted. Sequences that already hold marks or attendance cannot be removed.`
            : ""
        }
        confirmLabel="Delete"
        loading={working}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
