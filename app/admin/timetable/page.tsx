"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  BookOpen,
  Trash2,
  X,
} from "lucide-react";

type TimetableEntry = {
  id: number;
  day: string;
  className: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
};

export default function TimetablePage() {
  const [showForm, setShowForm] = useState(false);

  const [entries, setEntries] = useState<TimetableEntry[]>([
    {
      id: 1,
      day: "Monday",
      className: "Form 1 A",
      subject: "Mathematics",
      teacher: "John Smith",
      startTime: "08:00",
      endTime: "09:00",
      room: "Room 101",
    },
    {
      id: 2,
      day: "Monday",
      className: "Form 1 A",
      subject: "English Language",
      teacher: "Mary Johnson",
      startTime: "09:00",
      endTime: "10:00",
      room: "Room 101",
    },
  ]);

  const [form, setForm] = useState({
    day: "Monday",
    className: "",
    subject: "",
    teacher: "",
    startTime: "",
    endTime: "",
    room: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.day ||
      !form.className ||
      !form.subject ||
      !form.teacher ||
      !form.startTime ||
      !form.endTime
    ) {
      return;
    }

    const newEntry: TimetableEntry = {
      id: Date.now(),
      ...form,
    };

    setEntries([...entries, newEntry]);

    setForm({
      day: "Monday",
      className: "",
      subject: "",
      teacher: "",
      startTime: "",
      endTime: "",
      room: "",
    });

    setShowForm(false);
  }

  function deleteEntry(id: number) {
    if (!window.confirm("Delete this timetable entry?")) {
      return;
    }

    setEntries(
      entries.filter((entry) => entry.id !== id)
    );
  }

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Timetable
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Create and manage the school timetable.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
          >
            <Plus size={18} />
            Add Timetable Entry
          </button>

        </div>

        {/* Add Entry Form */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Timetable Entry
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Schedule a subject for a class.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >

              {/* Day */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Day
                </label>

                <select
                  value={form.day}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      day: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Class
                </label>

                <select
                  value={form.className}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      className: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select class</option>
                  <option value="Form 1 A">Form 1 A</option>
                  <option value="Form 1 B">Form 1 B</option>
                  <option value="Form 2 A">Form 2 A</option>
                  <option value="Form 2 B">Form 2 B</option>
                  <option value="Form 3 A">Form 3 A</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subject
                </label>

                <select
                  value={form.subject}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">
                    English Language
                  </option>
                  <option value="Computer Science">
                    Computer Science
                  </option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
              </div>

              {/* Teacher */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Teacher
                </label>

                <select
                  value={form.teacher}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      teacher: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select teacher</option>
                  <option value="John Smith">John Smith</option>
                  <option value="Mary Johnson">
                    Mary Johnson
                  </option>
                  <option value="Peter Williams">
                    Peter Williams
                  </option>
                </select>
              </div>

              {/* Start */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Start Time
                </label>

                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startTime: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* End */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  End Time
                </label>

                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endTime: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Room */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Room
                </label>

                <input
                  value={form.room}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      room: e.target.value,
                    })
                  }
                  placeholder="e.g. Room 101"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 lg:col-span-3">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 font-medium dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white hover:bg-purple-800"
                >
                  Add to Timetable
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Timetable */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <CalendarDays
                size={21}
                className="text-purple-600"
              />

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Weekly Timetable
                </h2>

                <p className="text-sm text-gray-500">
                  2026/2027 Academic Year
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">

            {days.map((day) => {
              const dayEntries = entries.filter(
                (entry) => entry.day === day
              );

              return (
                <div
                  key={day}
                  className="p-6"
                >

                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                    {day}
                  </h3>

                  {dayEntries.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No classes scheduled.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                        >

                          <div className="flex items-start justify-between">

                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {entry.subject}
                              </h4>

                              <p className="mt-1 text-sm font-medium text-purple-600">
                                {entry.className}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                deleteEntry(entry.id)
                              }
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>

                          <div className="mt-4 space-y-2 text-sm text-gray-500">

                            <div className="flex items-center gap-2">
                              <Clock size={15} />
                              {entry.startTime} - {entry.endTime}
                            </div>

                            <div className="flex items-center gap-2">
                              <UserRound size={15} />
                              {entry.teacher}
                            </div>

                            <div className="flex items-center gap-2">
                              <MapPin size={15} />
                              {entry.room || "No room assigned"}
                            </div>

                          </div>

                        </div>
                      ))}

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>

      </div>
    </main>
  );
}