"use client";

import { useState } from "react";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";

const timetable = [
  {
    day: "Monday",
    lessons: [
      {
        time: "08:00 - 09:00",
        subject: "Mathematics",
        className: "Form 1 A",
        room: "Room 101",
      },
      {
        time: "10:00 - 11:00",
        subject: "Mathematics",
        className: "Form 2 B",
        room: "Room 204",
      },
      {
        time: "13:00 - 14:00",
        subject: "Computer Science",
        className: "Form 3 A",
        room: "Computer Lab",
      },
    ],
  },
  {
    day: "Tuesday",
    lessons: [
      {
        time: "08:00 - 09:00",
        subject: "Mathematics",
        className: "Form 2 A",
        room: "Room 202",
      },
      {
        time: "11:00 - 12:00",
        subject: "Mathematics",
        className: "Form 1 B",
        room: "Room 102",
      },
    ],
  },
  {
    day: "Wednesday",
    lessons: [
      {
        time: "09:00 - 10:00",
        subject: "Computer Science",
        className: "Form 3 B",
        room: "Computer Lab",
      },
      {
        time: "11:00 - 12:00",
        subject: "Mathematics",
        className: "Form 1 A",
        room: "Room 101",
      },
    ],
  },
  {
    day: "Thursday",
    lessons: [
      {
        time: "08:00 - 09:00",
        subject: "Mathematics",
        className: "Form 2 B",
        room: "Room 204",
      },
      {
        time: "10:00 - 11:00",
        subject: "Computer Science",
        className: "Form 3 A",
        room: "Computer Lab",
      },
      {
        time: "14:00 - 15:00",
        subject: "Mathematics",
        className: "Form 1 B",
        room: "Room 102",
      },
    ],
  },
  {
    day: "Friday",
    lessons: [
      {
        time: "08:00 - 09:00",
        subject: "Mathematics",
        className: "Form 1 A",
        room: "Room 101",
      },
      {
        time: "10:00 - 11:00",
        subject: "Mathematics",
        className: "Form 2 A",
        room: "Room 202",
      },
    ],
  },
];

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export default function TeacherTimetablePage() {
  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar />

      <div className="">
        <TeacherNavbar
          title="Timetable"
          subtitle="View and manage your teaching schedule."
          teacherName="Teacher"
          onMenuClick={() => {}}
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      My Timetable
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your weekly teaching schedule
                    </p>
                  </div>
                </div>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => current - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={19} />
                </button>

                <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  {weekOffset === 0
                    ? "This Week"
                    : weekOffset > 0
                      ? `Week +${weekOffset}`
                      : `Week ${weekOffset}`}
                </div>

                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => current + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Next week"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Weekly Classes
                    </p>

                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      12
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                    <Clock3 size={19} />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Teaching Hours
                    </p>

                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      12h
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                    <MapPin size={19} />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Rooms Used
                    </p>

                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      5
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              {/* Desktop Header */}
              <div className="hidden border-b border-gray-200 bg-gray-50 md:grid md:grid-cols-5 dark:border-gray-800 dark:bg-gray-800/50">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="border-r border-gray-200 px-4 py-4 text-center last:border-r-0 dark:border-gray-800"
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {day}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {day === "Monday"
                        ? "Aug 24"
                        : day === "Tuesday"
                          ? "Aug 25"
                          : day === "Wednesday"
                            ? "Aug 26"
                            : day === "Thursday"
                              ? "Aug 27"
                              : "Aug 28"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Timetable */}
              <div className="hidden md:grid md:grid-cols-5">
                {timetable.map((day) => (
                  <div
                    key={day.day}
                    className="min-h-[430px] border-r border-gray-200 p-3 last:border-r-0 dark:border-gray-800"
                  >
                    <div className="space-y-3">
                      {day.lessons.map((lesson, index) => (
                        <div
                          key={`${day.day}-${index}`}
                          className="rounded-xl border border-purple-100 bg-purple-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-purple-900/40 dark:bg-purple-950/20"
                        >
                          <p className="text-xs font-bold text-purple-700 dark:text-purple-400">
                            {lesson.time}
                          </p>

                          <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                            {lesson.subject}
                          </h3>

                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {lesson.className}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin size={13} />
                            {lesson.room}
                          </div>
                        </div>
                      ))}

                      {day.lessons.length === 0 && (
                        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-800">
                          No classes
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Timetable */}
              <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
                {timetable.map((day) => (
                  <div key={day.day} className="p-5">
                    <div className="mb-4">
                      <h2 className="font-bold text-gray-900 dark:text-white">
                        {day.day}
                      </h2>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {day.lessons.length} classes
                      </p>
                    </div>

                    <div className="space-y-3">
                      {day.lessons.map((lesson, index) => (
                        <div
                          key={`${day.day}-mobile-${index}`}
                          className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                {lesson.time}
                              </p>

                              <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">
                                {lesson.subject}
                              </h3>

                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {lesson.className}
                              </p>
                            </div>

                            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                              <CalendarDays size={17} />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin size={14} />
                            {lesson.room}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-600" />
                Teaching Session
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-700" />
                Free Period
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}