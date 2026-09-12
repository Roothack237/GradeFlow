"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  X,
  Clock,
  Loader2,
  Users,
  RefreshCw,
} from "lucide-react";

type Status =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type Availability = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  status: Status;
  note: string | null;
  teacher: {
    id: string;
    teacherId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
};

const days: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export default function AdminAvailabilityPage() {
  const [availability, setAvailability] =
    useState<Availability[]>([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<"ALL" | Status>("ALL");

  const [error, setError] = useState("");

  async function loadAvailability() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/availability"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load availability"
        );
      }

      setAvailability(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load availability"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  async function updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED"
  ) {
    try {
      setProcessing(id);
      setError("");

      const response = await fetch(
        `/api/admin/availability/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update availability"
        );
      }

      setAvailability((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update availability"
      );
    } finally {
      setProcessing(null);
    }
  }

  const filtered =
    filter === "ALL"
      ? availability
      : availability.filter(
          (item) => item.status === filter
        );

  const pendingCount = availability.filter(
    (item) => item.status === "PENDING"
  ).length;

  const approvedCount = availability.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const rejectedCount = availability.filter(
    (item) => item.status === "REJECTED"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <CalendarDays size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Teacher Availability
                </h1>

                <p className="text-sm text-gray-500">
                  Review teacher availability before
                  generating the timetable.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadAvailability}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {availability.length}
                </p>
              </div>

              <CalendarDays
                className="text-gray-400"
                size={25}
              />
            </div>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Pending
                </p>

                <p className="mt-1 text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>

              <Clock
                className="text-yellow-500"
                size={25}
              />
            </div>
          </div>

          <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Approved
                </p>

                <p className="mt-1 text-2xl font-bold text-green-600">
                  {approvedCount}
                </p>
              </div>

              <Check
                className="text-green-500"
                size={25}
              />
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Rejected
                </p>

                <p className="mt-1 text-2xl font-bold text-red-600">
                  {rejectedCount}
                </p>
              </div>

              <X
                className="text-red-500"
                size={25}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {(
            ["ALL", "PENDING", "APPROVED", "REJECTED"] as const
          ).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === item
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {item === "ALL"
                ? "All"
                : item.charAt(0) +
                  item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2
                size={32}
                className="animate-spin text-blue-600"
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Users
                size={45}
                className="mx-auto mb-4 text-gray-300"
              />

              <h3 className="font-semibold text-gray-700">
                No availability found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                There are no submissions matching this
                filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-500">
                      Teacher
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-500">
                      Day
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-500">
                      Time
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-500">
                      Note
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {item.teacher.fullName}
                        </div>

                        <div className="text-xs text-gray-500">
                          ID: {item.teacher.teacherId}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.teacher.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {days[item.day] ||
                          item.day}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock size={16} />

                          {item.startTime} –{" "}
                          {item.endTime}
                        </div>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-gray-500">
                        {item.note || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {item.status ===
                          "PENDING" && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Pending
                          </span>
                        )}

                        {item.status ===
                          "APPROVED" && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Approved
                          </span>
                        )}

                        {item.status ===
                          "REJECTED" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.status ===
                        "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                updateStatus(
                                  item.id,
                                  "APPROVED"
                                )
                              }
                              disabled={
                                processing ===
                                item.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {processing ===
                              item.id ? (
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check size={14} />
                              )}
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(
                                  item.id,
                                  "REJECTED"
                                )
                              }
                              disabled={
                                processing ===
                                item.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}