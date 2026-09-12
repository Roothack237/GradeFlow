"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserRound,
  School,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  Bell,
  History,
  ClipboardList,
  AlertTriangle,
  Info,
  ShieldAlert,
  GraduationCap,
  BarChart3,
  NotebookPen,
  Sparkles,
  MessagesSquare,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  TableWrap,
  Td,
  Th,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type DashboardData = {
  counts: {
    students: number;
    teachers: number;
    parents: number;
    classes: number;
    subjects: number;
  };
  academicYear: { id: string; name: string } | null;
  currentTerm: { id: string; name: string; academicYear: { name: string } } | null;
  attendance: {
    total: number;
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    rate: number | null;
  };
  performance: {
    overallAverage: number | null;
    passRate: number | null;
    marksRecorded: number;
    strongestSubject: { name: string; average: number } | null;
    weakestSubject: { name: string; average: number } | null;
    publishedResults: number;
  };
  recentMarks: {
    id: string;
    average: number;
    grade: string | null;
    updatedAt: string;
    student: { id: string; firstName: string; lastName: string };
    subject: { id: string; name: string };
    sequence: { id: string; name: string };
  }[];
  recentAttendance: {
    id: string;
    status: string;
    date: string;
    student: { id: string; firstName: string; lastName: string };
    subject: { id: string; name: string };
    teacher: { id: string; fullName: string };
  }[];
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    description: string;
    actorName: string | null;
    createdAt: string;
  }[];
  alerts: {
    tone: "warning" | "info" | "danger";
    title: string;
    message: string;
    href: string;
  }[];
};

/* =========================================================
   HELPERS
========================================================= */

const ATTENDANCE_TONES: Record<string, "green" | "red" | "amber" | "blue"> = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "amber",
  EXCUSED: "blue",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function percentage(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await fetch("/api/admin/dashboard/stats", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load dashboard statistics.");
      }

      setData(await response.json());
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load the dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts;

  return (
    <AdminShell
      title="Administrator Dashboard"
      subtitle="Monitor and manage your school from one place."
    >
      <PageHeader
        title="School Overview"
        subtitle="Live figures from your school database."
      >
        <Button
          variant="secondary"
          onClick={() => load(true)}
          loading={refreshing}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </PageHeader>

      {/* ERROR */}

      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {/* LOADING */}

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </div>

          <Card title="Loading dashboard">
            <LoadingState />
          </Card>
        </div>
      ) : null}

      {data ? (
        <div className="space-y-6">
          {/* ACADEMIC PERIOD */}

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 p-5 text-white shadow-sm dark:border-purple-900">
            <GraduationCap size={26} />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-100">
                Active academic period
              </p>

              <p className="truncate text-lg font-bold">
                {data.academicYear?.name ?? "No active academic year"}
                {data.currentTerm ? ` · ${data.currentTerm.name}` : ""}
              </p>
            </div>

            <Link
              href="/admin/academic-years"
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
            >
              Manage
            </Link>
          </div>

          {/* ALERTS */}

          {data.alerts.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.alerts.map((alert) => {
                const Icon =
                  alert.tone === "danger"
                    ? ShieldAlert
                    : alert.tone === "warning"
                      ? AlertTriangle
                      : Info;

                const toneClass =
                  alert.tone === "danger"
                    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                    : alert.tone === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300";

                return (
                  <Link
                    key={alert.title}
                    href={alert.href}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition hover:shadow-md ${toneClass}`}
                  >
                    <Icon size={20} className="mt-0.5 shrink-0" />

                    <div>
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="mt-0.5 text-xs opacity-90">
                        {alert.message}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {/* KEY NUMBERS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Students"
              value={counts?.students ?? 0}
              icon={<Users size={20} />}
              tone="purple"
            />
            <StatCard
              label="Teachers"
              value={counts?.teachers ?? 0}
              icon={<UserRound size={20} />}
              tone="blue"
            />
            <StatCard
              label="Parents"
              value={counts?.parents ?? 0}
              icon={<Users size={20} />}
              tone="emerald"
            />
            <StatCard
              label="Classes"
              value={counts?.classes ?? 0}
              icon={<School size={20} />}
              tone="amber"
            />
            <StatCard
              label="Subjects"
              value={counts?.subjects ?? 0}
              icon={<BookOpen size={20} />}
              tone="gray"
            />
          </div>

          {/* ATTENDANCE + PERFORMANCE */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="Attendance overview"
              description="All attendance records currently stored."
              action={
                <Link href="/admin/attendance">
                  <Button variant="secondary" size="sm">
                    View attendance
                  </Button>
                </Link>
              }
            >
              {data.attendance.total === 0 ? (
                <EmptyState
                  icon={<CalendarCheck size={20} />}
                  title="No attendance recorded yet"
                  message="Attendance appears here once teachers start recording it."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Attendance rate
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {percentage(data.attendance.rate)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Present + late over {data.attendance.total} records
                      </p>
                    </div>

                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <p>Present: {data.attendance.PRESENT}</p>
                      <p>Absent: {data.attendance.ABSENT}</p>
                      <p>Late: {data.attendance.LATE}</p>
                      <p>Excused: {data.attendance.EXCUSED}</p>
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    {(
                      [
                        ["PRESENT", "bg-emerald-500"],
                        ["LATE", "bg-amber-500"],
                        ["EXCUSED", "bg-blue-500"],
                        ["ABSENT", "bg-red-500"],
                      ] as const
                    ).map(([status, colour]) => {
                      const share =
                        (data.attendance[status] / data.attendance.total) * 100;

                      return share > 0 ? (
                        <div
                          key={status}
                          className={`float-left h-full ${colour}`}
                          style={{ width: `${share}%` }}
                          title={`${status}: ${data.attendance[status]}`}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </Card>

            <Card
              title="Academic performance"
              description="Based on every mark recorded by teachers."
              action={
                <Link href="/admin/results">
                  <Button variant="secondary" size="sm">
                    Review results
                  </Button>
                </Link>
              }
            >
              {data.performance.marksRecorded === 0 ? (
                <EmptyState
                  icon={<TrendingUp size={20} />}
                  title="No marks recorded yet"
                  message="Class, subject and student averages appear once marks exist."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Overall average
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {data.performance.overallAverage ?? "—"}
                      <span className="text-sm font-medium text-gray-400">
                        {" "}
                        / 100
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Pass rate
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {percentage(data.performance.passRate)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Strongest subject
                    </p>
                    <p className="mt-1 truncate font-semibold text-gray-900 dark:text-white">
                      {data.performance.strongestSubject
                        ? `${data.performance.strongestSubject.name} (${data.performance.strongestSubject.average})`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Needs attention
                    </p>
                    <p className="mt-1 truncate font-semibold text-gray-900 dark:text-white">
                      {data.performance.weakestSubject
                        ? `${data.performance.weakestSubject.name} (${data.performance.weakestSubject.average})`
                        : "—"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* RECENT RESULTS + ATTENDANCE */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="Recent results"
              description="The latest marks entered by teachers."
              bodyClassName=""
            >
              {data.recentMarks.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<NotebookPen size={20} />}
                    title="No results yet"
                    message="Marks entered by teachers will appear here."
                  />
                </div>
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Student</Th>
                      <Th>Subject</Th>
                      <Th>Sequence</Th>
                      <Th className="text-right">Average</Th>
                      <Th>Entered</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentMarks.map((mark) => (
                      <tr key={mark.id}>
                        <Td className="font-medium">
                          {mark.student.firstName} {mark.student.lastName}
                        </Td>
                        <Td>{mark.subject.name}</Td>
                        <Td className="text-xs text-gray-500 dark:text-gray-400">
                          {mark.sequence.name}
                        </Td>
                        <Td className="text-right font-semibold">
                          {mark.average}
                          {mark.grade ? (
                            <span className="ml-2 text-xs text-gray-400">
                              {mark.grade}
                            </span>
                          ) : null}
                        </Td>
                        <Td className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(mark.updatedAt)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>

            <Card
              title="Recent attendance"
              description="The most recent attendance activity."
              bodyClassName=""
            >
              {data.recentAttendance.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<CalendarCheck size={20} />}
                    title="No attendance yet"
                    message="Attendance recorded by teachers will appear here."
                  />
                </div>
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Student</Th>
                      <Th>Subject</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentAttendance.map((record) => (
                      <tr key={record.id}>
                        <Td className="font-medium">
                          {record.student.firstName} {record.student.lastName}
                        </Td>
                        <Td>{record.subject.name}</Td>
                        <Td>
                          <Badge
                            tone={ATTENDANCE_TONES[record.status] ?? "gray"}
                          >
                            {record.status}
                          </Badge>
                        </Td>
                        <Td className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(record.date)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>
          </div>

          {/* NOTIFICATIONS + ACTIVITY */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="Your notifications"
              description="Messages sent to the administrator account."
              action={
                <Link href="/admin/notifications">
                  <Button variant="secondary" size="sm">
                    Open centre
                  </Button>
                </Link>
              }
            >
              {data.notifications.length === 0 ? (
                <EmptyState
                  icon={<Bell size={20} />}
                  title="No notifications"
                  message="System and school notifications will appear here."
                />
              ) : (
                <ul className="space-y-3">
                  {data.notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.isRead ? "bg-gray-300" : "bg-purple-600"
                        }`}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Recent system activity"
              description="Actions recorded in the administrator audit trail."
              action={
                <Link href="/admin/activity">
                  <Button variant="secondary" size="sm">
                    View log
                  </Button>
                </Link>
              }
            >
              {data.recentActivity.length === 0 ? (
                <EmptyState
                  icon={<History size={20} />}
                  title="No activity recorded yet"
                  message="Creating students, publishing results and moderating the forum is logged here."
                />
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                        <ClipboardList size={15} />
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {entry.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {entry.actorName ?? "System"} ·{" "}
                          {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* QUICK LINKS */}

          <Card title="Quick actions">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  href: "/admin/students",
                  label: "Manage students",
                  icon: <Users size={18} />,
                },
                {
                  href: "/admin/results",
                  label: "Review results",
                  icon: <NotebookPen size={18} />,
                },
                {
                  href: "/admin/reports",
                  label: "Generate reports",
                  icon: <BarChart3 size={18} />,
                },
                {
                  href: "/admin/ai",
                  label: "Ask the AI assistant",
                  icon: <Sparkles size={18} />,
                },
                {
                  href: "/admin/notifications",
                  label: "Send announcement",
                  icon: <Bell size={18} />,
                },
                {
                  href: "/admin/forum",
                  label: "Moderate forum",
                  icon: <MessagesSquare size={18} />,
                },
                {
                  href: "/admin/attendance",
                  label: "Attendance records",
                  icon: <CalendarCheck size={18} />,
                },
                {
                  href: "/admin/predictions",
                  label: "Performance analysis",
                  icon: <TrendingUp size={18} />,
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-700 transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:text-gray-200 dark:hover:border-purple-800"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    {action.icon}
                  </span>
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </AdminShell>
  );
}
