"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  NotebookPen,
  TrendingUp,
  UserRound,
  Mail,
  Phone,
  Trash2,
  RefreshCw,
  Award,
  School,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  TableWrap,
  Td,
  Th,
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type StudentDetail = {
  student: {
    id: string;
    matricule: string;
    fullName: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    status: string;
    className: string | null;
    sectionName: string | null;
    createdAt: string;
  };
  parent: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    parentId: string;
  } | null;
  marks: {
    id: string;
    ca1: number;
    ca2: number;
    exam: number;
    average: number;
    grade: string | null;
    remark: string | null;
    subject: { id: string; name: string; code: string; coefficient: number };
    sequence: { id: string; name: string; term: { id: string; name: string } };
    teacher: { id: string; fullName: string };
  }[];
  subjects: {
    subjectId: string;
    subject: string;
    code: string;
    coefficient: number;
    marks: number;
    average: number;
  }[];
  overallAverage: number | null;
  attendances: {
    id: string;
    date: string;
    status: string;
    subject: { name: string };
    sequence: { name: string };
  }[];
  attendanceSummary: Record<string, number>;
  reportCards: {
    id: string;
    average: number;
    rank: number | null;
    decision: string | null;
    principalRemark: string | null;
    published: boolean;
    term: { name: string; academicYear: { name: string } };
  }[];
};

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

/* =========================================================
   PAGE
========================================================= */

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/students/${params.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 404 ? "Student not found." : "failed"
        );
      }

      setData(await response.json());
    } catch (loadError) {
      setError(
        loadError instanceof Error && loadError.message === "Student not found."
          ? "This student no longer exists."
          : "Unable to load this student. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeStudent() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/students/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("failed");

      router.push("/admin/students");
    } catch {
      setError("Unable to delete this student.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <AdminShell
      title="Student Profile"
      subtitle="Academic record, attendance and family information."
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-purple-700 dark:text-gray-400"
        >
          <ArrowLeft size={16} />
          Back to students
        </Link>
      </div>

      {loading ? (
        <Card title="Loading student">
          <LoadingState />
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data ? (
        <div className="space-y-6">
          {/* PROFILE HEADER */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-xl font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                  {data.student.firstName[0]}
                  {data.student.lastName[0]}
                </span>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.student.fullName}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-mono text-xs">
                      {data.student.matricule}
                    </span>
                    <span>·</span>
                    <span>
                      {data.student.gender === "FEMALE" ? "Female" : "Male"}
                    </span>
                    <span>·</span>
                    <span>{formatDate(data.student.dateOfBirth)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="purple">
                      <School size={12} />
                      {data.student.className ?? "No class"}
                    </Badge>

                    {data.student.sectionName ? (
                      <Badge tone="blue">{data.student.sectionName}</Badge>
                    ) : null}

                    <Badge
                      tone={
                        data.student.status === "ACTIVE"
                          ? "green"
                          : data.student.status === "SUSPENDED"
                            ? "red"
                            : "amber"
                      }
                    >
                      {data.student.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={load}>
                  <RefreshCw size={16} />
                  Refresh
                </Button>

                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* STATS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Overall average"
              value={data.overallAverage ?? "—"}
              icon={<Award size={20} />}
              tone="purple"
              hint={`${data.marks.length} mark(s) recorded`}
            />
            <StatCard
              label="Attendance rate"
              value={`${data.attendanceSummary.rate ?? 0}%`}
              icon={<CalendarCheck size={20} />}
              tone="emerald"
              hint={`${data.attendanceSummary.total ?? 0} record(s)`}
            />
            <StatCard
              label="Absences"
              value={data.attendanceSummary.ABSENT ?? 0}
              icon={<CalendarCheck size={20} />}
              tone="red"
            />
            <StatCard
              label="Subjects assessed"
              value={data.subjects.length}
              icon={<NotebookPen size={20} />}
              tone="blue"
            />
          </div>

          {/* PARENT + PERFORMANCE */}

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Parent / Guardian">
              {data.parent ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <UserRound size={20} />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {data.parent.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {data.parent.parentId}
                      </p>
                    </div>
                  </div>

                  {data.parent.email ? (
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Mail size={15} />
                      <span className="truncate">{data.parent.email}</span>
                    </p>
                  ) : null}

                  {data.parent.phone ? (
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone size={15} />
                      {data.parent.phone}
                    </p>
                  ) : null}

                  <Link
                    href={`/admin/parents/${data.parent.id}`}
                    className="inline-block text-sm font-semibold text-purple-700 hover:underline dark:text-purple-300"
                  >
                    View parent profile →
                  </Link>
                </div>
              ) : (
                <EmptyState
                  icon={<UserRound size={20} />}
                  title="No parent linked"
                  message="Link a parent or guardian from the students list so results reach the family."
                />
              )}
            </Card>

            <Card
              title="Performance by subject"
              description="Average of every mark recorded."
              className="xl:col-span-2"
            >
              {data.subjects.length === 0 ? (
                <EmptyState
                  icon={<TrendingUp size={20} />}
                  title="No marks yet"
                  message="Subject performance appears once teachers record marks."
                />
              ) : (
                <div className="space-y-3">
                  {data.subjects.map((subject) => (
                    <div key={subject.subjectId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {subject.subject}
                          <span className="ml-2 text-xs text-gray-400">
                            coef {subject.coefficient}
                          </span>
                        </span>

                        <span className="font-semibold text-gray-900 dark:text-white">
                          {subject.average}
                        </span>
                      </div>

                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${
                            subject.average >= 70
                              ? "bg-emerald-500"
                              : subject.average >= 10
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, subject.average))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* MARKS */}

          <Card
            title="Marks"
            description="Every mark recorded by the teachers."
            bodyClassName=""
          >
            {data.marks.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<NotebookPen size={20} />}
                  title="No marks recorded"
                  message="Marks entered by teachers will appear here."
                />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>Sequence</Th>
                    <Th className="text-right">CA1</Th>
                    <Th className="text-right">CA2</Th>
                    <Th className="text-right">Exam</Th>
                    <Th className="text-right">Average</Th>
                    <Th>Teacher</Th>
                  </tr>
                </thead>

                <tbody>
                  {data.marks.map((mark) => (
                    <tr key={mark.id}>
                      <Td className="font-medium">{mark.subject.name}</Td>
                      <Td className="text-xs text-gray-500 dark:text-gray-400">
                        {mark.sequence.term.name} · {mark.sequence.name}
                      </Td>
                      <Td className="text-right">{mark.ca1}</Td>
                      <Td className="text-right">{mark.ca2}</Td>
                      <Td className="text-right">{mark.exam}</Td>
                      <Td className="text-right font-semibold">
                        {mark.average}
                        {mark.grade ? (
                          <span className="ml-2 text-xs text-gray-400">
                            {mark.grade}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="text-xs text-gray-500 dark:text-gray-400">
                        {mark.teacher.fullName}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          {/* ATTENDANCE */}

          <Card
            title="Recent attendance"
            description="The 60 most recent attendance records."
            bodyClassName=""
          >
            {data.attendances.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CalendarCheck size={20} />}
                  title="No attendance recorded"
                  message="Attendance recorded by teachers will appear here."
                />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Subject</Th>
                    <Th>Sequence</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>

                <tbody>
                  {data.attendances.map((record) => (
                    <tr key={record.id}>
                      <Td className="whitespace-nowrap">
                        {formatDate(record.date)}
                      </Td>
                      <Td>{record.subject.name}</Td>
                      <Td className="text-xs text-gray-500 dark:text-gray-400">
                        {record.sequence.name}
                      </Td>
                      <Td>
                        <Badge tone={ATTENDANCE_TONES[record.status] ?? "gray"}>
                          {record.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          {/* REPORT CARDS */}

          <Card
            title="Report cards"
            description="Term results and publication state."
            bodyClassName=""
          >
            {data.reportCards.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Award size={20} />}
                  title="No report cards"
                  message="Report cards are generated once a term's results are reviewed."
                />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Term</Th>
                    <Th>Academic year</Th>
                    <Th className="text-right">Average</Th>
                    <Th className="text-right">Rank</Th>
                    <Th>Decision</Th>
                    <Th>Publication</Th>
                  </tr>
                </thead>

                <tbody>
                  {data.reportCards.map((card) => (
                    <tr key={card.id}>
                      <Td className="font-medium">{card.term.name}</Td>
                      <Td>{card.term.academicYear.name}</Td>
                      <Td className="text-right font-semibold">
                        {card.average}
                      </Td>
                      <Td className="text-right">{card.rank ?? "—"}</Td>
                      <Td>{card.decision ?? "—"}</Td>
                      <Td>
                        <Badge tone={card.published ? "green" : "amber"}>
                          {card.published ? "Published" : "Not published"}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete student"
        message={`Delete ${data?.student.fullName ?? "this student"}? Marks, attendance and report cards will be removed too.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={removeStudent}
        onClose={() => setConfirmDelete(false)}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
