"use client";

import { useState } from "react";

type SlotStatus = "available" | "preferred" | "unavailable";

interface AvailabilityModalProps {
  open: boolean;
  onClose: () => void;
  selectedDay: string;
  selectedHour: string;
  onSave: (status: SlotStatus) => void;
}

export default function AvailabilityModal({
  open,
  onClose,
  selectedDay,
  selectedHour,
  onSave,
}: AvailabilityModalProps) {
  const [status, setStatus] =
    useState<SlotStatus>("available");

  const [startTime, setStartTime] =
    useState(selectedHour);

  const [endTime, setEndTime] =
    useState("09:00");

  const [notes, setNotes] = useState("");

  if (!open) return null;

  const handleSave = () => {
    onSave(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Availability
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add a new availability period.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Day */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Day
            </label>

            <select
              value={selectedDay}
              disabled
              className="w-full rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option>{selectedDay}</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Availability Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as SlotStatus
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="available">
                Available
              </option>

              <option value="preferred">
                Preferred
              </option>

              <option value="unavailable">
                Unavailable
              </option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Time
            </label>

            <input
              type="time"
              value={startTime}
              onChange={(e) =>
                setStartTime(e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Time
            </label>

            <input
              type="time"
              value={endTime}
              onChange={(e) =>
                setEndTime(e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Preference / Notes
            </label>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Example: Prefer morning classes."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium dark:border-gray-700 dark:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-medium text-white hover:bg-purple-800"
          >
            Add Availability
          </button>
        </div>
      </div>
    </div>
  );
}