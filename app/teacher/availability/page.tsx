"use client";

import { useState } from "react";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";
import {
  Clock3,
  Save,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

type Availability = {
  enabled: boolean;
  start: string;
  end: string;
};

const initialAvailability: Record<string, Availability> = {
  Monday: {
    enabled: true,
    start: "08:00",
    end: "16:00",
  },
  Tuesday: {
    enabled: true,
    start: "08:00",
    end: "16:00",
  },
  Wednesday: {
    enabled: true,
    start: "08:00",
    end: "12:00",
  },
  Thursday: {
    enabled: true,
    start: "08:00",
    end: "16:00",
  },
  Friday: {
    enabled: true,
    start: "08:00",
    end: "14:00",
  },
  Saturday: {
    enabled: false,
    start: "08:00",
    end: "12:00",
  },
  Sunday: {
    enabled: false,
    start: "08:00",
    end: "12:00",
  },
};

const days = Object.keys(initialAvailability);

export default function TeacherAvailabilityPage() {
  const [availability, setAvailability] =
    useState(initialAvailability);

  const [saved, setSaved] = useState(false);

  function updateDay(
    day: string,
    field: keyof Availability,
    value: boolean | string
  ) {
    setAvailability((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));

    setSaved(false);
  }

  function saveAvailability() {
    console.log("Teacher availability:", availability);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar />

      <div className="">
        <TeacherNavbar
          title="My Availability"
          subtitle="Set the days and hours when you are available to teach."
          teacherName="Teacher"
          onMenuClick={() => {}}
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                  <Clock3 size={22} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Teaching Availability
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your weekly teaching availability.
                  </p>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50 p-5 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex gap-3">
                <div className="mt-0.5 text-purple-600 dark:text-purple-400">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-purple-900 dark:text-purple-300">
                    Availability Information
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-purple-700 dark:text-purple-400">
                    Your availability helps the school administrator
                    create and adjust the timetable. Make sure your
                    available hours are accurate.
                  </p>
                </div>
              </div>
            </div>

            {/* Availability Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Weekly Availability
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enable a day and choose your available teaching hours.
                </p>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {days.map((day) => {
                  const dayAvailability = availability[day];

                  return (
                    <div
                      key={day}
                      className="p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* Day */}
                        <div className="flex items-center gap-4 lg:w-52">
                          <button
                            type="button"
                            onClick={() =>
                              updateDay(
                                day,
                                "enabled",
                                !dayAvailability.enabled
                              )
                            }
                            className={`relative h-6 w-11 rounded-full transition ${
                              dayAvailability.enabled
                                ? "bg-purple-700"
                                : "bg-gray-300 dark:bg-gray-700"
                            }`}
                            aria-label={`Toggle ${day} availability`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                dayAvailability.enabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>

                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {day}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {dayAvailability.enabled
                                ? "Available"
                                : "Unavailable"}
                            </p>
                          </div>
                        </div>

                        {/* Time Inputs */}
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label
                              htmlFor={`${day}-start`}
                              className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400"
                            >
                              START TIME
                            </label>

                            <input
                              id={`${day}-start`}
                              type="time"
                              value={dayAvailability.start}
                              disabled={!dayAvailability.enabled}
                              onChange={(e) =>
                                updateDay(
                                  day,
                                  "start",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          <div className="hidden pb-3 text-gray-400 sm:block">
                            —
                          </div>

                          <div className="flex-1">
                            <label
                              htmlFor={`${day}-end`}
                              className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400"
                            >
                              END TIME
                            </label>

                            <input
                              id={`${day}-end`}
                              type="time"
                              value={dayAvailability.end}
                              disabled={!dayAvailability.enabled}
                              onChange={(e) =>
                                updateDay(
                                  day,
                                  "end",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center gap-2">
                  {saved ? (
                    <>
                      <CheckCircle2
                        size={18}
                        className="text-green-600"
                      />

                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Availability saved successfully
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Remember to save your changes.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={saveAvailability}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800"
                >
                  <Save size={18} />
                  Save Availability
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}