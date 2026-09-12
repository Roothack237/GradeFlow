
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Save,
  Users,
  CalendarDays,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED";

type Student = {
  id: string;
  name: string;
  matricule: string;
  gender?: string;
  status: AttendanceStatus;
};

type TeacherAssignment = {
  id: string;
  section?: {
    id?: string;
    name?: string;
  } | null;
  classroom?: {
    id?: string;
    name?: string;
  } | null;
  subject?: {
    id?: string;
    name?: string;
    code?: string;
  } | null;
};

type ApiStudent = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  matricule?: string;
  gender?: string;
};

export default function TeacherAttendancePageRoute() {
  return (
    <Suspense fallback={null}>
      <TeacherAttendancePage />
    </Suspense>
  );
}

function TeacherAttendancePage() {
  const searchParams = useSearchParams();

  /*
   * The class comes from:
   * /teacher/attendance?classId=XXXX
   */
  const classId = searchParams.get("classId");

  const [assignment, setAssignment] =
    useState<TeacherAssignment | null>(null);

  const [assignments, setAssignments] = useState<
    TeacherAssignment[]
  >([]);

  const [students, setStudents] = useState<Student[]>([]);

  const [term, setTerm] = useState("First Term");

  /*
   * Date is automatically today's date.
   */
  const [date] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loadingAssignment, setLoadingAssignment] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD TEACHER ASSIGNMENTS
   * =========================================================
   */
  useEffect(() => {
    async function loadTeacherAssignments() {
      try {
        setLoadingAssignment(true);
        setError("");

        const response = await fetch(
          "/api/teacher/assignments",
          {
            cache: "no-store",
          }
        );

        const text = await response.text();

        let data: any;

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load your teacher assignments."
          );
        }

        /*
         * The assignments API may return:
         *
         * [...]
         *
         * OR:
         *
         * { assignments: [...] }
         */
        const assignmentList: TeacherAssignment[] =
          Array.isArray(data)
            ? data
            : data.assignments ?? [];

        setAssignments(assignmentList);

        /*
         * Find the assignment belonging to the class
         * passed in the URL.
         */
        if (classId) {
          const matchingAssignment =
            assignmentList.find(
              (item) =>
                item.classroom?.id === classId
            );

          if (!matchingAssignment) {
            setError(
              "Access denied. This class is not assigned to you."
            );
            setAssignment(null);
            return;
          }

          setAssignment(matchingAssignment);
        } else {
          setError(
            "No classroom was specified for attendance."
          );
        }
      } catch (err) {
        console.error(
          "FAILED TO LOAD TEACHER ASSIGNMENTS:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your assignments."
        );
      } finally {
        setLoadingAssignment(false);
      }
    }

    loadTeacherAssignments();
  }, [classId]);

  /*
   * =========================================================
   * LOAD STUDENTS
   * =========================================================
   */
  useEffect(() => {
    if (!classId || !assignment) {
      setStudents([]);
      return;
    }

    async function loadStudents() {
      try {
        setLoadingStudents(true);
        setError("");

        const response = await fetch(
          `/api/teacher/classes/${classId}/students`,
          {
            cache: "no-store",
          }
        );

        const text = await response.text();

        let data: any;

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load students."
          );
        }

        const studentList: ApiStudent[] =
          Array.isArray(data)
            ? data
            : data.students ?? [];

        const formattedStudents: Student[] =
          studentList.map((student) => ({
            id: student.id,

            name:
              student.fullName ||
              student.name ||
              `${student.firstName ?? ""} ${
                student.lastName ?? ""
              }`.trim() ||
              "Unnamed Student",

            matricule:
              student.matricule ?? "N/A",

            gender:
              student.gender ?? "",

            status: "PRESENT",
          }));

        setStudents(formattedStudents);
      } catch (err) {
        console.error(
          "FAILED TO LOAD STUDENTS:",
          err
        );

        setStudents([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [classId, assignment]);

  /*
   * =========================================================
   * OTHER SUBJECTS ASSIGNED TO THIS TEACHER FOR THIS CLASS
   * =========================================================
   */
  const classAssignments = useMemo(() => {
    if (!classId) {
      return [];
    }

    return assignments.filter(
      (item) =>
        item.classroom?.id === classId
    );
  }, [assignments, classId]);

  /*
   * =========================================================
   * UPDATE ATTENDANCE STATUS
   * =========================================================
   */
  function updateStatus(
    studentId: string,
    status: AttendanceStatus
  ) {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? {
              ...student,
              status,
            }
          : student
      )
    );
  }

  /*
   * =========================================================
   * MARK ALL PRESENT
   * =========================================================
   */
  function markAllPresent() {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        status: "PRESENT",
      }))
    );
  }

  /*
   * =========================================================
   * SAVE ATTENDANCE
   * =========================================================
   */
  async function handleSave() {
    if (!assignment || !classId) {
      alert(
        "You are not assigned to this classroom."
      );
      return;
    }

    if (students.length === 0) {
      alert(
        "There are no students in this classroom."
      );
      return;
    }

    /*
     * For now we use the subject from the teacher's
     * assignment.
     */
    const subjectId =
      assignment.subject?.id;

    if (!subjectId) {
      alert(
        "No subject assignment was found for this classroom."
      );
      return;
    }

    const payload = {
      classroomId: classId,
      subjectId,
      term,
      date,

      students: students.map((student) => ({
        studentId: student.id,
        status: student.status,
      })),
    };

    console.log(
      "TEACHER ATTENDANCE PAYLOAD:",
      payload
    );

    /*
     * Connect this to your attendance API when ready.
     */
    try {
      setSaving(true);

      /*
       * Example:
       *
       * const response = await fetch(
       *   "/api/teacher/attendance",
       *   {
       *     method: "POST",
       *     headers: {
       *       "Content-Type": "application/json",
       *     },
       *     body: JSON.stringify(payload),
       *   }
       * );
       *
       * if (!response.ok) {
       *   ...
       * }
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      alert(
        "Attendance saved successfully!"
      );
    } catch (err) {
      console.error(
        "SAVE ATTENDANCE ERROR:",
        err
      );

      alert(
        "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * SUMMARY COUNTS
   * =========================================================
   */
  const presentCount = students.filter(
    (student) =>
      student.status === "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) =>
      student.status === "ABSENT"
  ).length;

  const lateCount = students.filter(
    (student) =>
      student.status === "LATE"
  ).length;

  const excusedCount = students.filter(
    (student) =>
      student.status === "EXCUSED"
  ).length;

  /*
   * =========================================================
   * DISPLAY VALUES
   * =========================================================
   */
  const sectionName =
    assignment?.section?.name ||
    "Not assigned";

  const classroomName =
    assignment?.classroom?.name ||
    "Not assigned";

  const subjectName =
    assignment?.subject?.name ||
    "Not assigned";

  const subjectCode =
    assignment?.subject?.code || "";

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loadingAssignment) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={35}
            className="animate-spin text-purple-700"
          />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your attendance assignment...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR / ACCESS DENIED
   * =========================================================
   */
  if (error || !assignment) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-gray-50 p-5 sm:p-8 dark:bg-gray-950">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-4">
              <ShieldCheck
                size={28}
                className="shrink-0 text-red-600"
              />

              <div>
                <h1 className="text-lg font-bold text-red-700 dark:text-red-400">
                  Attendance Access Denied
                </h1>

                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error ||
                    "This classroom is not assigned to you."}
                </p>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Please return to your assigned classes
                  and open attendance from there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 p-5 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}
        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <Users size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Record attendance for your assigned class.
              </p>
            </div>

          </div>
        </div>

        {/* =====================================================
            ATTENDANCE DETAILS
        ===================================================== */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="mb-5 flex items-center gap-3">

            <CalendarDays
              size={20}
              className="text-purple-600"
            />

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Attendance Details
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                These details are automatically based on your assignment.
              </p>
            </div>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* SECTION */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Section
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {sectionName}
              </div>
            </div>

            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Class
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {classroomName}
              </div>
            </div>

            {/* TERM */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Term
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {term}
              </div>
            </div>

            {/* DATE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {date}
              </div>
            </div>

          </div>

          {/* SUBJECT */}
          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject
            </label>

            <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              {subjectName}

              {subjectCode && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({subjectCode})
                </span>
              )}
            </div>

          </div>

          {/* ASSIGNED SUBJECTS INFO */}
          {classAssignments.length > 1 && (
            <div className="mt-4 rounded-xl bg-purple-50 p-4 text-sm text-purple-700 dark:bg-purple-950/20 dark:text-purple-300">
              You have {classAssignments.length} subject assignments
              for this class. Attendance is currently being recorded
              for <strong>{subjectName}</strong>.
            </div>
          )}

        </div>

        {/* =====================================================
            SUMMARY
        ===================================================== */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Present"
            value={presentCount}
            className="text-green-600"
          />

          <SummaryCard
            label="Absent"
            value={absentCount}
            className="text-red-600"
          />

          <SummaryCard
            label="Late"
            value={lateCount}
            className="text-yellow-600"
          />

          <SummaryCard
            label="Excused"
            value={excusedCount}
            className="text-blue-600"
          />

        </div>

        {/* =====================================================
            STUDENTS
        ===================================================== */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

          {/* STUDENTS HEADER */}
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Users size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {classroomName}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loadingStudents
                    ? "Loading students..."
                    : `${students.length} students`}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={markAllPresent}
              disabled={
                students.length === 0 ||
                loadingStudents
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              <Check size={16} />
              Mark All Present
            </button>

          </div>

          {/* LOADING */}
          {loadingStudents && (
            <div className="p-10 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" />

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Loading students...
              </p>

            </div>
          )}

          {/* EMPTY */}
          {!loadingStudents &&
            students.length === 0 && (
              <div className="p-10 text-center">

                <Users className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />

                <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
                  No students found
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  There are currently no students registered
                  in {classroomName}.
                </p>

              </div>
            )}

          {/* STUDENTS */}
          {!loadingStudents &&
            students.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">

                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >

                    {/* STUDENT INFO */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {student.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">

                        <span>
                          Matricule: {student.matricule}
                        </span>

                        {student.gender && (
                          <span>
                            Gender: {student.gender}
                          </span>
                        )}

                      </div>
                    </div>

                    {/* STATUS BUTTONS */}
                    <div className="flex flex-wrap gap-2">

                      <StatusButton
                        label="Present"
                        active={
                          student.status === "PRESENT"
                        }
                        activeClass="bg-green-600 text-white"
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "PRESENT"
                          )
                        }
                      />

                      <StatusButton
                        label="Absent"
                        active={
                          student.status === "ABSENT"
                        }
                        activeClass="bg-red-600 text-white"
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "ABSENT"
                          )
                        }
                      />

                      <StatusButton
                        label="Late"
                        active={
                          student.status === "LATE"
                        }
                        activeClass="bg-yellow-500 text-white"
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "LATE"
                          )
                        }
                      />

                      <StatusButton
                        label="Excused"
                        active={
                          student.status === "EXCUSED"
                        }
                        activeClass="bg-blue-600 text-white"
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "EXCUSED"
                          )
                        }
                      />

                    </div>

                  </div>
                ))}

              </div>
            )}

          {/* SAVE */}
          <div className="flex justify-end border-t border-gray-200 p-6 dark:border-gray-800">

            <button
              type="button"
              onClick={handleSave}
              disabled={
                students.length === 0 ||
                !assignment ||
                saving
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Attendance
                </>
              )}

            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

/*
 * =========================================================
 * SUMMARY CARD
 * =========================================================
 */
function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${className}`}
      >
        {value}
      </p>

    </div>
  );
}

/*
 * =========================================================
 * STATUS BUTTON
 * =========================================================
 */
function StatusButton({
  label,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? activeClass
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
