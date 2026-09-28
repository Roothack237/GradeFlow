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

// ======================================================
// TYPES
// ======================================================

type AvailabilityStatus =
| "PENDING"
| "APPROVED"
| "REJECTED";

type Availability = {
id: string;
teacherId: string;
dayOfWeek: number;
dayName: string;
startTime: string;
endTime: string;
status: AvailabilityStatus;
createdAt?: string;
updatedAt?: string;
};

// ======================================================
// DAYS
// ======================================================

const DAYS = [
{
value: 1,
label: "Monday",
},
{
value: 2,
label: "Tuesday",
},
{
value: 3,
label: "Wednesday",
},
{
value: 4,
label: "Thursday",
},
{
value: 5,
label: "Friday",
},
];

// ======================================================
// COMPONENT
// ======================================================

export default function TeacherAvailabilityPage() {
const [availability, setAvailability] =
useState<Availability[]>([]);

const [dayOfWeek, setDayOfWeek] =
useState<number>(1);

const [startTime, setStartTime] =
useState("08:00");

const [endTime, setEndTime] =
useState("10:00");

const [loading, setLoading] =
useState(true);

const [saving, setSaving] =
useState(false);

const [deletingId, setDeletingId] =
useState<string | null>(null);

const [message, setMessage] =
useState("");

const [error, setError] =
useState("");

// ====================================================
// LOAD AVAILABILITY
// ====================================================

async function loadAvailability() {
try {
setLoading(true);
setError("");


  const response = await fetch(
    "/api/teacher/availability",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load availability."
    );
  }

  // IMPORTANT:
  // The API returns:
  //
  // {
  //   success: true,
  //   teacher: {...},
  //   availability: [...]
  // }
  //
  // Therefore we need data.availability,
  // not data.

  if (Array.isArray(data.availability)) {
    setAvailability(data.availability);
  } else {
    setAvailability([]);
  }
} catch (err) {
  console.error(
    "Failed to load availability:",
    err
  );

  setAvailability([]);

  setError(
    err instanceof Error
      ? err.message
      : "Failed to load availability."
  );
} finally {
  setLoading(false);
}


}

useEffect(() => {
loadAvailability();
}, []);

// ====================================================
// SUBMIT AVAILABILITY
// ====================================================

async function handleSubmit(
e: React.FormEvent<HTMLFormElement>
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
        dayOfWeek,
        startTime,
        endTime,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to save availability."
    );
  }

  // The API returns:
  //
  // {
  //   success: true,
  //   message: "...",
  //   availability: {...}
  // }

  if (data.availability) {
    setAvailability((current) => [
      ...current,
      data.availability,
    ]);
  }

  setMessage(
    data.message ||
      "Availability submitted successfully. It is now pending admin review."
  );

  // Reset form
  setDayOfWeek(1);
  setStartTime("08:00");
  setEndTime("10:00");
} catch (err) {
  console.error(
    "Failed to save availability:",
    err
  );

  setError(
    err instanceof Error
      ? err.message
      : "Failed to save availability."
  );
} finally {
  setSaving(false);
}


}

// ====================================================
// DELETE AVAILABILITY
// ====================================================

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
      data.error ||
        "Failed to delete availability."
    );
  }

  setAvailability((current) =>
    current.filter(
      (item) => item.id !== id
    )
  );

  setMessage(
    data.message ||
      "Availability deleted successfully."
  );
} catch (err) {
  console.error(
    "Failed to delete availability:",
    err
  );

  setError(
    err instanceof Error
      ? err.message
      : "Failed to delete availability."
  );
} finally {
  setDeletingId(null);
}


}

// ====================================================
// STATUS BADGE
// ====================================================

function getStatusBadge(
status: AvailabilityStatus
) {
if (status === "APPROVED") {
return ( <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"> <CheckCircle2 size={14} />
Approved </span>
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

// ====================================================
// DAY LABEL
// ====================================================

function getDayLabel(dayValue: number) {
return (
DAYS.find(
(item) => item.value === dayValue
)?.label || "Unknown day"
);
}

// ====================================================
// RENDER
// ====================================================

return ( <div className="min-h-screen bg-gray-50 p-6"> <div className="mx-auto max-w-6xl">


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
            Tell the administration when you
            are available to teach.
          </p>
        </div>
      </div>
    </div>

    {/* Success message */}
    {message && (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        <CheckCircle2
          size={20}
          className="mt-0.5 shrink-0"
        />

        <span>{message}</span>
      </div>
    )}

    {/* Error message */}
    {error && (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )}

    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

      {/* ============================================
          ADD AVAILABILITY
      ============================================ */}

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
              value={dayOfWeek}
              onChange={(e) =>
                setDayOfWeek(
                  Number(e.target.value)
                )
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

          {/* Start Time */}
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
                min="08:00"
                max="15:00"
                value={startTime}
                onChange={(e) =>
                  setStartTime(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          {/* End Time */}
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
                min="08:00"
                max="15:00"
                value={endTime}
                onChange={(e) =>
                  setEndTime(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          {/* Submit */}
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

      {/* ============================================
          AVAILABILITY LIST
      ============================================ */}

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

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2
              size={28}
              className="animate-spin text-blue-600"
            />
          </div>

        ) : availability.length === 0 ? (

          /* Empty */
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

          /* List */
          <div className="divide-y divide-gray-100">

            {availability.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >

                <div>

                  {/* Day + status */}
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {getDayLabel(
                        item.dayOfWeek
                      )}
                    </h3>

                    {getStatusBadge(
                      item.status
                    )}
                  </div>

                  {/* Time */}
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />

                    <span>
                      {item.startTime} –{" "}
                      {item.endTime}
                    </span>
                  </div>

                </div>

                {/* Delete */}
                {item.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        item.id
                      )
                    }
                    disabled={
                      deletingId ===
                      item.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId ===
                    item.id ? (
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

                {/* Approved message */}
                {item.status ===
                  "APPROVED" && (
                  <span className="text-xs text-gray-400">
                    Approved availability
                  </span>
                )}

                {/* Rejected message */}
                {item.status ===
                  "REJECTED" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        item.id
                      )
                    }
                    disabled={
                      deletingId ===
                      item.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId ===
                    item.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}

                    Remove
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
