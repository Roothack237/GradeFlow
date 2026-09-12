"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Database,
  GraduationCap,
  KeyRound,
  Mail,
  RefreshCw,
  School,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/admin/ui";

type SettingsPayload = {
  profile: { id: string; fullName: string; email: string; role: string };
  academic: {
    years: {
      id: string;
      name: string;
      isActive: boolean;
      startDate: string;
      endDate: string;
    }[];
    currentTerm: {
      id: string;
      name: string;
      order: number;
      academicYear: { name: string };
      _count: { sequences: number };
    } | null;
  };
  data: Record<string, number>;
  integrations: {
    ai: boolean;
    email: boolean;
    provider: string;
    model: string;
  };
  security: {
    adminApiGuarded: boolean;
    roleCheck: string;
    sessionProvider: string;
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      setData(await response.json());
    } catch {
      setError("Unable to load the settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell
      title="Settings"
      subtitle="School configuration, data volume and integration status."
    >
      <PageHeader
        title="Settings"
        subtitle="Everything shown here is read from the database or the server environment."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </PageHeader>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {loading && !data ? (
        <Card title="Loading the settings">
          <LoadingState />
        </Card>
      ) : data ? (
        <div className="space-y-6">
          {/* ---------- profile ---------- */}

          <Card
            title="Administrator account"
            description="Your session is issued by the existing NextAuth credentials provider."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Name
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {data.profile.fullName}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {data.profile.email}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                <p className="mt-1">
                  <Badge tone="purple">{data.profile.role}</Badge>
                </p>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck size={14} />
              Every admin API verifies <code>role === ADMIN</code> on the server
              and returns 401 for anonymous requests and 403 for other roles.
            </p>
          </Card>

          {/* ---------- academic ---------- */}

          <Card title="Academic configuration">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CalendarRange size={14} />
                  Current term
                </p>

                {data.academic.currentTerm ? (
                  <>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {data.academic.currentTerm.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {data.academic.currentTerm.academicYear.name} ·{" "}
                      {data.academic.currentTerm._count.sequences} sequence(s)
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    No current term is set.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <BadgeCheck size={14} />
                  Active academic year
                </p>

                {data.academic.years.find((year) => year.isActive) ? (
                  <>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {data.academic.years.find((year) => year.isActive)?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(
                        data.academic.years.find((year) => year.isActive)!
                          .startDate
                      ).toLocaleDateString("en-GB")}{" "}
                      →{" "}
                      {new Date(
                        data.academic.years.find((year) => year.isActive)!.endDate
                      ).toLocaleDateString("en-GB")}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    No academic year is active.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2">Academic year</th>
                    <th className="px-4 py-2">Period</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.academic.years.map((year) => (
                    <tr key={year.id}>
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {year.name}
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                        {new Date(year.startDate).toLocaleDateString("en-GB")} →{" "}
                        {new Date(year.endDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-2">
                        {year.isActive ? (
                          <Badge tone="green">Active</Badge>
                        ) : (
                          <Badge tone="gray">Inactive</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ---------- data volume ---------- */}

          <Card
            title="Data stored"
            description="Live row counts from the GradeFlow PostgreSQL database."
          >
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {[
                { key: "students", label: "Students", icon: <GraduationCap size={16} /> },
                { key: "teachers", label: "Teachers", icon: <Users size={16} /> },
                { key: "parents", label: "Parents", icon: <Users size={16} /> },
                { key: "classrooms", label: "Classes", icon: <School size={16} /> },
                { key: "subjects", label: "Subjects", icon: <BookOpen size={16} /> },
                { key: "marks", label: "Marks", icon: <BookOpen size={16} /> },
                { key: "attendance", label: "Attendance", icon: <Database size={16} /> },
                { key: "notifications", label: "Notifications", icon: <Mail size={16} /> },
                { key: "auditLogs", label: "Audit entries", icon: <KeyRound size={16} /> },
              ].map((entry) => (
                <div
                  key={entry.key}
                  className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                >
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {entry.icon}
                    {entry.label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {data.data[entry.key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* ---------- integrations ---------- */}

          <Card
            title="Integrations"
            description="Optional services. Secrets are never displayed — only whether they are configured."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <Sparkles size={16} />
                    AI assistant
                  </p>

                  {data.integrations.ai ? (
                    <Badge tone="green">
                      <CheckCircle2 size={12} /> Configured
                    </Badge>
                  ) : (
                    <Badge tone="amber">
                      <XCircle size={12} /> Not configured
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Provider: {data.integrations.provider}
                  <br />
                  Model: {data.integrations.model}
                </p>

                {!data.integrations.ai ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Set <code>AI_API_KEY</code> on the server to enable the
                    assistant. Until then it returns an explicit error instead of
                    inventing an answer.
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <Mail size={16} />
                    Email delivery
                  </p>

                  {data.integrations.email ? (
                    <Badge tone="green">
                      <CheckCircle2 size={12} /> Configured
                    </Badge>
                  ) : (
                    <Badge tone="amber">
                      <XCircle size={12} /> Not configured
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Teacher and parent login codes are emailed when{" "}
                  <code>EMAIL_USER</code> and <code>EMAIL_APP_PASSWORD</code> are
                  set. Without them the accounts are still created and the code is
                  returned to the administrator who created them.
                </p>
              </div>
            </div>
          </Card>

          {/* ---------- platform ---------- */}

          <Card title="Platform">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Database size={14} />
                  Database
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  PostgreSQL · Prisma ORM
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Server size={14} />
                  Session provider
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {data.security.sessionProvider}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <ShieldCheck size={14} />
                  Authorization
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {data.security.roleCheck}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </AdminShell>
  );
}
