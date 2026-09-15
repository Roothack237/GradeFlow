"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";
import ChildSelector from "@/components/parent/ChildSelector";

type TimetableData = {
  student: { id: string; name: string };
  class: string | null;
  section: string | null;
  published: boolean;
  term: string | null;
  entries: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string | null;
    subject: string;
    teacher: string;
  }[];
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export default function ParentTimetablePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [data, setData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTimetable = useCallback(async (studentId: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/parent/timetable?studentId=${encodeURIComponent(studentId)}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load the timetable.");
      }

      setData(payload);
    } catch (err) {
      console.error("Parent Timetable Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load the timetable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (childId) loadTimetable(childId);
  }, [childId, loadTimetable]);

  const byDay = (day: string) =>
    (data?.entries ?? [])
      .filter((entry) => entry.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Timetable"
          subtitle="The weekly class schedule of your children."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Timetable
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The class timetable appears here once the administration
                publishes it.
              </p>
            </div>

            <ChildSelector selectedId={childId} onSelect={setChildId} />

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm">Loading the timetable...</span>
                </div>
              </div>
            )}

            {!loading && data && childId && (
              <>
                {!data.published ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                    <CalendarDays
                      size={40}
                      className="mx-auto text-gray-300 dark:text-gray-600"
                    />

                    <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                      Timetable not published yet
                    </h2>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {data.class
                        ? `The timetable of ${data.class} will appear here as soon as the administration publishes it.`
                        : "Your child has no class assigned yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-300">
                      {data.class} · {data.term} — published schedule
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                      {DAYS.map((day) => {
                        const entries = byDay(day);

                        return (
                          <section
                            key={day}
                            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                          >
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                              <CalendarDays
                                size={15}
                                className="text-purple-600 dark:text-purple-400"
                              />
                              {DAY_LABELS[day]}
                            </h2>

                            {entries.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
                                No lessons
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {entries.map((entry) => (
                                  <article
                                    key={entry.id}
                                    className="rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 to-white p-3.5 dark:border-gray-800 dark:from-purple-950/30 dark:to-gray-900"
                                  >
                                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                      {entry.startTime} – {entry.endTime}
                                    </p>

                                    <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white">
                                      {entry.subject}
                                    </p>

                                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                      <UserRound size={11} />
                                      {entry.teacher}
                                    </p>

                                    {entry.room && (
                                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <MapPin size={11} />
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
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
