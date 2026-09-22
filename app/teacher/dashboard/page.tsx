"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

import TeacherSidebar from "@/components/teacher/TeacherSidebar";

// =========================================================
// TYPES
// =========================================================

type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  image?: string | null;
};

type Student = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  coefficient: number;
};

type Classroom = {
  id: string;
  name: string;
  students: Student[];
};

type Section = {
  id: string;
  name: string;
};

type TeacherAssignment = {
  id: string;
  section: Section;
  classroom: Classroom;
  subject: Subject;
};

// =========================================================
// SMALL COMPONENTS
// =========================================================

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function TeacherDashboardPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        // ---------------------------------------------------
        // 1. Check session
        // ---------------------------------------------------

        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to load session");
        }

        const session = await sessionResponse.json();

        if (!session?.user) {
          throw new Error("You are not authenticated");
        }

        if (session.user.role !== "TEACHER") {
          throw new Error("Teacher access only");
        }

        // ---------------------------------------------------
        // 2. Load teacher profile
        // ---------------------------------------------------

        const profileResponse = await fetch("/api/teacher/profile", {
          cache: "no-store",
        });

        if (!profileResponse.ok) {
          throw new Error("Failed to load teacher profile");
        }

        const profileData = await profileResponse.json();

        const profile =
          profileData?.teacher ??
          profileData?.profile ??
          profileData;

        setTeacher(profile);

        // ---------------------------------------------------
        // 3. Load teacher assignments
        // ---------------------------------------------------

        const assignmentsResponse = await fetch(
          "/api/teacher/assignments",
          {
            cache: "no-store",
          }
        );

        const assignmentsData = await assignmentsResponse.json();

        if (!assignmentsResponse.ok) {
          throw new Error(
            assignmentsData?.error ||
              "Failed to load teaching assignments"
          );
        }

        setAssignments(assignmentsData?.assignments || []);
      } catch (err) {
        console.error("TEACHER DASHBOARD ERROR:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // =======================================================
  // UNIQUE CLASSES
  // =======================================================

  const uniqueClasses = useMemo(() => {
    const classMap = new Map<
      string,
      {
        id: string;
        name: string;
        section: Section;
        subjects: Subject[];
        students: Student[];
      }
    >();

    assignments.forEach((assignment) => {
      const classroom = assignment.classroom;

      if (!classroom) return;

      if (!classMap.has(classroom.id)) {
        classMap.set(classroom.id, {
          id: classroom.id,
          name: classroom.name,
          section: assignment.section,
          subjects: [],
          students: classroom.students || [],
        });
      }

      const currentClass = classMap.get(classroom.id)!;

      const alreadyHasSubject = currentClass.subjects.some(
        (subject) => subject.id === assignment.subject.id
      );

      if (!alreadyHasSubject) {
        currentClass.subjects.push(assignment.subject);
      }

      // Make sure students are available even if another
      // assignment for the same class contains them.
      if (
        (!currentClass.students ||
          currentClass.students.length === 0) &&
        classroom.students?.length
      ) {
        currentClass.students = classroom.students;
      }
    });

    return Array.from(classMap.values());
  }, [assignments]);

  // =======================================================
  // UNIQUE STUDENTS
  // =======================================================

  const uniqueStudents = useMemo(() => {
    const studentMap = new Map<string, Student>();

    uniqueClasses.forEach((classroom) => {
      classroom.students.forEach((student) => {
        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, student);
        }
      });
    });

    return Array.from(studentMap.values());
  }, [uniqueClasses]);

  // =======================================================
  // UNIQUE SUBJECTS
  // =======================================================

  const uniqueSubjects = useMemo(() => {
    const subjectMap = new Map<string, Subject>();

    assignments.forEach((assignment) => {
      if (!subjectMap.has(assignment.subject.id)) {
        subjectMap.set(assignment.subject.id, assignment.subject);
      }
    });

    return Array.from(subjectMap.values());
  }, [assignments]);

  // =======================================================
  // TEACHER NAME
  // =======================================================

  const teacherName = useMemo(() => {
    if (!teacher) return "Teacher";

    if (teacher.fullName) {
      return teacher.fullName;
    }

    return `${teacher.firstName || ""} ${
      teacher.lastName || ""
    }`.trim();
  }, [teacher]);

  // =======================================================
  // TOGGLE CLASS
  // =======================================================

  function toggleClass(classId: string) {
    setExpandedClass((current) =>
      current === classId ? null : classId
    );
  }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <TeacherSidebar />

        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading teacher dashboard...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <TeacherSidebar />

        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-gray-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <Activity className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =======================================================
  // DASHBOARD
  // =======================================================

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* SIDEBAR */}
      <TeacherSidebar />

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Teacher Dashboard
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Welcome, {teacherName}
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your classes, students, attendance and academic
                performance.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="My Classes"
              value={uniqueClasses.length}
              icon={<BookOpen className="h-5 w-5" />}
              description="Classes assigned to you"
            />

            <StatCard
              title="My Students"
              value={uniqueStudents.length}
              icon={<Users className="h-5 w-5" />}
              description="Students in your classes"
            />

            <StatCard
              title="My Subjects"
              value={uniqueSubjects.length}
              icon={<GraduationCap className="h-5 w-5" />}
              description="Subjects you teach"
            />

            <StatCard
              title="Assignments"
              value={assignments.length}
              icon={<ClipboardCheck className="h-5 w-5" />}
              description="Teaching assignments"
            />
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quickly access your teaching tools.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/teacher/attendance"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <ClipboardCheck className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  Attendance
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Mark and manage student attendance.
                </p>
              </Link>

              <Link
                href="/teacher/marks"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  Enter Marks
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter and manage student marks.
                </p>
              </Link>

              <Link
                href="/teacher/classes"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                  <Users className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  My Classes
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  View your assigned classes and students.
                </p>
              </Link>

              <Link
                href="/teacher/performance"
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  Performance
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Analyze student academic performance.
                </p>
              </Link>
            </div>
          </section>

          {/* =================================================
              MY CLASSES & STUDENTS
          ================================================= */}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Classes & Students
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Students belonging to the classes assigned to you.
              </p>
            </div>

            {uniqueClasses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
                <BookOpen className="mx-auto h-10 w-10 text-gray-400" />

                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
                  No classes assigned
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your assigned classes will appear here once the
                  administrator assigns them to you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {uniqueClasses.map((classroom) => {
                  const isExpanded =
                    expandedClass === classroom.id;

                  return (
                    <div
                      key={classroom.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    >
                      {/* CLASS HEADER */}
                      <button
                        type="button"
                        onClick={() => toggleClass(classroom.id)}
                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                            <BookOpen className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {classroom.name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Section: {classroom.section.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-4">
                          <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {classroom.students.length}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              students
                            </p>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* SUBJECTS */}
                      <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                        <div className="flex flex-wrap gap-2">
                          {classroom.subjects.map((subject) => (
                            <span
                              key={subject.id}
                              className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                            >
                              {subject.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* STUDENTS */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-800">
                          {classroom.students.length === 0 ? (
                            <div className="p-8 text-center">
                              <Users className="mx-auto h-8 w-8 text-gray-400" />

                              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                No students found in this class.
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[600px]">
                                <thead>
                                  <tr className="border-b border-gray-100 bg-gray-50 text-left dark:border-gray-800 dark:bg-gray-800/50">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      #
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      Student
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      Matricule
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      Gender
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      Status
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {classroom.students.map(
                                    (student, index) => (
                                      <tr
                                        key={student.id}
                                        className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                                      >
                                        {/* NUMBER */}
                                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                          {index + 1}
                                        </td>

                                        {/* STUDENT */}
                                        <td className="px-5 py-4">
                                          <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                              {student.firstName
                                                ?.charAt(0)
                                                .toUpperCase()}
                                              {student.lastName
                                                ?.charAt(0)
                                                .toUpperCase()}
                                            </div>

                                            <div>
                                              <p className="font-medium text-gray-900 dark:text-white">
                                                {student.firstName}{" "}
                                                {student.lastName}
                                              </p>

                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Student
                                              </p>
                                            </div>
                                          </div>
                                        </td>

                                        {/* MATRICULE */}
                                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                                          {student.matricule}
                                        </td>

                                        {/* GENDER */}
                                        <td className="px-5 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">
                                          {student.gender}
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-5 py-4">
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Active
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =================================================
              AI PERFORMANCE CARD
          ================================================= */}

          <section className="mt-8">
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 dark:border-purple-900/50 dark:from-purple-950/40 dark:to-gray-900">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      AI Performance Assistant
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                      Get intelligent insights about student performance,
                      identify strong and weak subjects, and receive
                      recommendations based on academic results.
                    </p>
                  </div>
                </div>

                <Link
                  href="/teacher/performance"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
                >
                  View Performance
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              FOOTER SPACE
          ================================================= */}

          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}