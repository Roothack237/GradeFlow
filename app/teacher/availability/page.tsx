"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

type AvailabilityStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type Availability = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  note?: string | null;
};

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

export default function TeacherAvailabilityPage() {
  const [availability, setAvailability] = useState<
    Availability[]
  >([]);

  const [day, setDay] = useState("MONDAY");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAvailability() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/teacher/availability"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load availability"
        );
      }

      setAvailability(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load availability"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (startTime >= endTime) {
        setError(
          "End time must be after start time."
        );
        return;
      }

      const response = await fetch(
        "/api/teacher/availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            day,
            startTime,
            endTime,
            note: note.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save availability"
        );
      }

      setAvailability((current) => [
        ...current,
        data,
      ]);

      setMessage(
        "Availability submitted successfully. It is now pending admin review."
      );

      setNote("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save availability"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/teacher/availability?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete availability"
        );
      }

      setAvailability((current) =>
        current.filter((item) => item.id !== id)
      );

      setMessage("Availability deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete availability"
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getStatusBadge(
    status: AvailabilityStatus
  ) {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 size={14} />
          Approved
        </span>
      );
    }

    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
          <XCircle size={14} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
        <Clock3 size={14} />
        Pending
      </span>
    );
  }

  function getDayLabel(dayValue: string) {
    return (
      DAYS.find(
        (item) => item.value === dayValue
      )?.label || dayValue
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <CalendarDays size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Availability
              </h1>

              <p className="text-sm text-gray-500">
                Tell the administration when you are
                available to teach.
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Add availability */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Availability
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add a period when you can teach.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Day */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Day
                </label>

                <select
                  value={day}
                  onChange={(e) =>
                    setDay(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {DAYS.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start time */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Time
                </label>

                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) =>
                      setStartTime(e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {/* End time */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End Time
                </label>

                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) =>
                      setEndTime(e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Note{" "}
                  <span className="font-normal text-gray-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
                  }
                  rows={3}
                  placeholder="Example: Available for practical classes..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Submit Availability
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Availability list */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Submitted Availability
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your availability is reviewed by the
                administration before being used for
                timetable generation.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2
                  size={28}
                  className="animate-spin text-blue-600"
                />
              </div>
            ) : availability.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDays
                  size={42}
                  className="mx-auto mb-4 text-gray-300"
                />

                <h3 className="font-medium text-gray-700">
                  No availability submitted
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Add your available teaching periods
                  using the form.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {availability.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {getDayLabel(item.day)}
                        </h3>

                        {getStatusBadge(
                          item.status
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />

                        <span>
                          {item.startTime} –{" "}
                          {item.endTime}
                        </span>
                      </div>

                      {item.note && (
                        <p className="mt-2 text-sm text-gray-500">
                          {item.note}
                        </p>
                      )}
                    </div>

                    {item.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        disabled={
                          deletingId === item.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}

                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}