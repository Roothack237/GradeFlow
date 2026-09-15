"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  MapPin,
  BookOpen,
  GraduationCap,
  Loader2,
  RefreshCw,
} from "lucide-react";

type TimetableEntry = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: string;
  class: string;
  section: string;
  term: string;
};

type Publication = {
  id: string;
  class: string;
  term: string;
  publishedAt: string | null;
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export default function TeacherTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTimetable = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await fetch("/api/teacher/timetable", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load the timetable.");
      }

      setEntries(data.entries ?? []);
      setPublications(data.publications ?? []);
      setAcademicYear(data.academicYear?.name ?? "");
    } catch (err) {
      console.error("Teacher Timetable Error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load the timetable."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  /* Near-real-time: refresh the timetable every 30 seconds. */
  useEffect(() => {
    const interval = setInterval(loadTimetable, 30000);

    return () => clearInterval(interval);
  }, [loadTimetable]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();

    for (const day of DAYS) {
      map.set(day, []);
    }

    for (const entry of entries) {
      const list = map.get(entry.day) ?? [];
      list.push(entry);
      map.set(entry.day, list);
    }

    for (const day of DAYS) {
      map.get(day)?.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return map;
  }, [entries]);

  const totalLessons = entries.length;

  const weeklyHours = useMemo(() => {
    let minutes = 0;

    for (const entry of entries) {
      const [startH, startM] = entry.startTime.split(":").map(Number);
      const [endH, endM] = entry.endTime.split(":").map(Number);

      minutes += endH * 60 + endM - (startH * 60 + startM);
    }

    return (minutes / 60).toFixed(1);
  }, [entries]);

  if (loading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading your timetable...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Timetable
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {academicYear
                ? `Your published teaching schedule for ${academicYear}.`
                : "Your published teaching schedule."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadTimetable}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-700 dark:hover:text-purple-300"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle size={22} className="mt-0.5 text-red-600 dark:text-red-400" />

              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <BookOpen size={20} />
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {totalLessons}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Lessons per week
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <Clock3 size={20} />
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {weeklyHours} h
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Teaching hours per week
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <GraduationCap size={20} />
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(entries.map((entry) => entry.class)).size}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Classes in your schedule
            </p>
          </div>
        </div>

        {/* Published classes notice */}
        {publications.length > 0 && (
          <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-300">
            Published timetables:{" "}
            {publications
              .map((publication) => `${publication.class} (${publication.term})`)
              .join(", ")}
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
            <CalendarDays size={40} className="mx-auto text-gray-300 dark:text-gray-600" />

            <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
              No published timetable yet
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your schedule appears here once the administration generates and
              publishes the timetable for your classes.
            </p>
          </div>
        )}

        {/* Weekly schedule */}
        {entries.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {DAYS.map((day) => {
              const dayEntries = entriesByDay.get(day) ?? [];

              return (
                <section
                  key={day}
                  className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    <CalendarDays size={15} className="text-purple-600 dark:text-purple-400" />
                    {DAY_LABELS[day]}
                  </h2>

                  {dayEntries.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
                      No lessons
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dayEntries.map((entry) => (
                        <article
                          key={entry.id}
                          className="rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 to-white p-3.5 transition hover:border-purple-300 dark:border-gray-800 dark:from-purple-950/30 dark:to-gray-900 dark:hover:border-purple-700"
                        >
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            {entry.startTime} – {entry.endTime}
                          </p>

                          <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white">
                            {entry.subject}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {entry.class}
                          </p>

                          {entry.room && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin size={12} />
                              {entry.room}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
