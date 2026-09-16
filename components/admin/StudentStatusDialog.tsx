"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, ShieldOff, XCircle } from "lucide-react";

import {
  Button,
  ErrorState,
  Field,
  Modal,
  Textarea,
} from "@/components/admin/ui";
import {
  STUDENT_STATUS_DESCRIPTIONS,
  STATUS_ACTION_TARGET,
  actionLabel,
  requiresReason,
  type StudentStatusAction,
} from "@/lib/student-status";

/**
 * Confirmation dialog used by the admin student management screens to
 * suspend, dismiss or reactivate a student.
 *
 * A reason is mandatory to suspend or dismiss (it is stored in the audit log
 * together with the date and the administrator's name), and optional when
 * reactivating a student.
 */

export type StudentStatusTarget = {
  id: string;
  fullName: string;
  matricule?: string | null;
  className?: string | null;
  status: string;
};

const ACTION_COPY: Record<
  StudentStatusAction,
  { title: string; confirm: string; tone: "danger" | "primary" | "secondary"; icon: React.ReactNode }
> = {
  SUSPEND: {
    title: "Suspend this student?",
    confirm: "Suspend student",
    tone: "danger",
    icon: <ShieldOff size={16} />,
  },
  DISMISS: {
    title: "Dismiss this student?",
    confirm: "Dismiss student",
    tone: "danger",
    icon: <XCircle size={16} />,
  },
  REACTIVATE: {
    title: "Reactivate this student?",
    confirm: "Reactivate student",
    tone: "primary",
    icon: <RotateCcw size={16} />,
  },
};

export default function StudentStatusDialog({
  student,
  action,
  onClose,
  onDone,
}: {
  student: StudentStatusTarget | null;
  action: StudentStatusAction | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  if (!student || !action) return null;

  /* The form state is reset by remounting, keyed on the target, so no state
     is written from an effect. */
  return (
    <StatusForm
      key={`${student.id}:${action}`}
      student={student}
      action={action}
      onClose={onClose}
      onDone={onDone}
    />
  );
}

function StatusForm({
  student,
  action,
  onClose,
  onDone,
}: {
  student: StudentStatusTarget;
  action: StudentStatusAction;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const copy = ACTION_COPY[action];
  const target = STATUS_ACTION_TARGET[action];
  const reasonRequired = requiresReason(action);

  async function confirm() {
    if (reasonRequired && !reason.trim()) {
      setError("Please give a reason for this decision.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: STATUS_ACTION_TARGET[action],
          reason: reason.trim() || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to change the student status.");
        return;
      }

      onDone(
        `${student.fullName} is now ${target}.${
          reason.trim() ? " The reason was recorded." : ""
        }`
      );
      onClose();
    } catch {
      setError("Unable to change the student status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={copy.title}
      subtitle={
        student.className
          ? `${student.className}${student.matricule ? ` · ${student.matricule}` : ""}`
          : undefined
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button
            variant={copy.tone === "danger" ? "danger" : "primary"}
            onClick={confirm}
            loading={saving}
          >
            {copy.icon}
            {copy.confirm}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorState message={error} /> : null}

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to {actionLabel(action).toLowerCase()}{" "}
          <strong className="text-gray-900 dark:text-white">
            {student.fullName}
          </strong>
          ?
        </p>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-white">
            Status becomes {target}
          </p>
          <p className="mt-1">{STUDENT_STATUS_DESCRIPTIONS[target]}</p>
          <p className="mt-1">
            Marks, attendance, results, report cards, the parent link and the
            academic history are all preserved.
          </p>
        </div>

        <Field
          label={reasonRequired ? "Reason (required)" : "Reason (optional)"}
          hint={
            reasonRequired
              ? "Recorded with the date and your name in the audit log."
              : "Recorded with the date and your name in the audit log."
          }
        >
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              action === "SUSPEND"
                ? "e.g. Disciplinary issue"
                : action === "DISMISS"
                  ? "e.g. Withdrawn by the family"
                  : "e.g. Suspension lifted by the principal"
            }
          />
        </Field>

        {action === "SUSPEND" || action === "DISMISS" ? (
          <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            The student keeps every historical record. They are removed from the
            current class roll, their marks and attendance sheets, and the
            report card generation of the current term — but never deleted.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
