
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";

import { useSearchParams } from "next/navigation";

type Student = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
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
};

type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

type AttendanceMap = Record<string, AttendanceStatus>;

const TERM_OPTIONS = [
  {
    value: "FIRST_TERM",
    label: "First Term",
  },
  {
    value: "SECOND_TERM",
    label: "Second Term",
  },
  {
    value: "THIRD_TERM",
    label: "Third Term",
  },
];

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
}[] = [
  {
    value: "PRESENT",
    label: "Present",
  },
  {
    value: "ABSENT",
    label: "Absent",
  },
  {
    value: "EXCUSED",
    label: "Excused",
  },
];

export default function TeacherAttendancePage() {
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [term, setTerm] = useState("FIRST_TERM");

  // IMPORTANT:
  // Attendance starts EMPTY.
  // No student is automatically marked PRESENT.
  const [attendance, setAttendance] = useState<AttendanceMap>({});

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD CLASS + STUDENTS + SUBJECTS
  // =========================================================

  useEffect(() => {
    if (!classId) {
      setError("Class ID is missing.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `/api/teacher/class-students?classId=${encodeURIComponent(
            classId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("ATTENDANCE API ERROR:", data);

          throw new Error(
            data?.error ||
              data?.message ||
              `Server error (${response.status})`
          );
        }

        const loadedStudents: Student[] = Array.isArray(data.students)
          ? data.students
          : [];

        const loadedSubjects: Subject[] = Array.isArray(data.subjects)
          ? data.subjects
          : [];

        setStudents(loadedStudents);
        setSubjects(loadedSubjects);

        if (data.classroom) {
          setClassroom({
            id: data.classroom.id,
            name: data.classroom.name,
          });
        } else {
          setClassroom({
            id: classId,
            name: "Class",
          });
        }

        if (loadedSubjects.length > 0) {
          setSelectedSubjectId(loadedSubjects[0].id);
        }

        // IMPORTANT:
        // Do NOT automatically mark students as PRESENT.
        // Start with an empty attendance map.
        setAttendance({});
      } catch (err: any) {
        console.error("LOAD ATTENDANCE PAGE ERROR:", err);

        setError(
          err?.message ||
            "Failed to load attendance information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId]);

  // =========================================================
  // FILTER STUDENTS
  // =========================================================

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const fullName =
        `${student.firstName} ${student.lastName}`.toLowerCase();

      const reverseName =
        `${student.lastName} ${student.firstName}`.toLowerCase();

      const matricule =
        student.matricule?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        reverseName.includes(query) ||
        matricule.includes(query)
      );
    });
  }, [students, search]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;

    for (const student of students) {
      // IMPORTANT:
      // Do NOT use || "PRESENT" here.
      // If the student has not been marked, their status is undefined.
      const status = attendance[student.id];

      if (status === "PRESENT") {
        present++;
      }

      if (status === "ABSENT") {
        absent++;
      }

      if (status === "EXCUSED") {
        excused++;
      }
    }

    return {
      total: students.length,
      present,
      absent,
      excused,
    };
  }, [students, attendance]);

  // =========================================================
  // UNMARKED STUDENTS
  // =========================================================

  const unmarkedStudents = useMemo(() => {
    return students.filter(
      (student) => !attendance[student.id]
    );
  }, [students, attendance]);

  // =========================================================
  // CHANGE STUDENT STATUS
  // =========================================================

  const changeStatus = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }));

    setSuccess("");
    setError("");
  };

  // =========================================================
  // MARK ALL PRESENT
  // =========================================================

  const markAllPresent = () => {
    const updated: AttendanceMap = {};

    for (const student of students) {
      updated[student.id] = "PRESENT";
    }

    setAttendance(updated);

    setError("");
    setSuccess("All students marked as present.");
  };

  // =========================================================
  // SAVE ATTENDANCE
  // =========================================================

  const saveAttendance = async () => {
    try {
      setError("");
      setSuccess("");

      if (!classId) {
        setError("Class ID is missing.");
        return;
      }

      if (!selectedSubjectId) {
        setError("Please select a subject.");
        return;
      }

      if (!selectedDate) {
        setError("Please select an attendance date.");
        return;
      }

      if (!term) {
        setError("Please select a term.");
        return;
      }

      if (students.length === 0) {
        setError("There are no students in this class.");
        return;
      }

      // IMPORTANT:
      // Do not allow saving while some students have no status.
      if (unmarkedStudents.length > 0) {
        setError(
          `Please mark attendance for all students. ${unmarkedStudents.length} student${
            unmarkedStudents.length === 1 ? "" : "s"
          } ${
            unmarkedStudents.length === 1 ? "is" : "are"
          } still unmarked.`
        );
        return;
      }

      setSaving(true);

      const payload = {
        classroomId: classId,
        subjectId: selectedSubjectId,
        term,
        date: selectedDate,

        students: students.map((student) => ({
          studentId: student.id,

          // At this point every student must have a status.
          status: attendance[student.id],
        })),
      };

      console.log(
        "SAVE ATTENDANCE PAYLOAD:",
        payload
      );

      const response = await fetch(
        "/api/teacher/attendance/save",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log(
        "SAVE ATTENDANCE RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to save attendance."
        );
      }

      setSuccess(
        data?.message ||
          `Attendance saved successfully for ${students.length} students.`
      );
    } catch (err: any) {
      console.error(
        "SAVE ATTENDANCE PAGE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={22}
                    className="text-purple-600 dark:text-purple-400"
                  />

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Attendance
                  </h1>
                </div>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {classroom?.name || "Class"} • Record
                  student attendance
                </p>
              </div>
            </div>

            <button
              onClick={saveAttendance}
              disabled={
                saving ||
                students.length === 0
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Check size={17} />

                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{success}</span>
          </div>
        )}

        {/* ===================================================
            CONTROLS
        ==================================================== */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* SUBJECT */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>

              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) =>
                    setSelectedSubjectId(
                      e.target.value
                    )
                  }
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-purple-900/40"
                >
                  <option value="">
                    Select subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* DATE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Attendance Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-purple-900/40"
                />
              </div>
            </div>

            {/* TERM */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Term
              </label>

              <div className="relative">
                <select
                  value={term}
                  onChange={(e) =>
                    setTerm(e.target.value)
                  }
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-purple-900/40"
                >
                  {TERM_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* TOTAL */}

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </p>

              <Users
                size={18}
                className="text-gray-400"
              />
            </div>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {statistics.total}
            </p>
          </div>

          {/* PRESENT */}

          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700 dark:text-green-400">
                Present
              </p>

              <UserCheck
                size={18}
                className="text-green-600 dark:text-green-400"
              />
            </div>

            <p className="mt-2 text-2xl font-semibold text-green-700 dark:text-green-400">
              {statistics.present}
            </p>
          </div>

          {/* ABSENT */}

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-400">
                Absent
              </p>

              <UserX
                size={18}
                className="text-red-600 dark:text-red-400"
              />
            </div>

            <p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-400">
              {statistics.absent}
            </p>
          </div>

          {/* EXCUSED */}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Excused
              </p>

              <CheckCircle2
                size={18}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>

            <p className="mt-2 text-2xl font-semibold text-blue-700 dark:text-blue-400">
              {statistics.excused}
            </p>
          </div>
        </div>

        {/* ===================================================
            STUDENTS
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* TABLE HEADER */}

          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Student Attendance
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Mark attendance for each
                student.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* SEARCH */}

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search student..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-purple-900/40 sm:w-64"
                />
              </div>

              {/* MARK ALL */}

              <button
                onClick={markAllPresent}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Mark All Present
              </button>
            </div>
          </div>

          {/* =================================================
              EMPTY STATES
          ================================================== */}

          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Users
                size={40}
                className="mb-3 text-gray-300 dark:text-gray-600"
              />

              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                No students found
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are currently no
                students in this classroom.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Search
                size={40}
                className="mb-3 text-gray-300 dark:text-gray-600"
              />

              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                No matching students
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try another name or
                matricule.
              </p>
            </div>
          ) : (
            /* =================================================
               TABLE
            ================================================== */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                    <th className="px-5 py-4">
                      #
                    </th>

                    <th className="px-5 py-4">
                      Student
                    </th>

                    <th className="px-5 py-4">
                      Matricule
                    </th>

                    <th className="px-5 py-4">
                      Attendance Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student, index) => {
                      // IMPORTANT:
                      // No fallback to PRESENT.
                      // Undefined means nothing is selected.
                      const currentStatus =
                        attendance[student.id];

                      return (
                        <tr
                          key={student.id}
                          className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                          {/* NUMBER */}

                          <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>

                          {/* STUDENT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                {student.firstName
                                  ?.charAt(0)
                                  ?.toUpperCase()}

                                {student.lastName
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.firstName}{" "}
                                  {student.lastName}
                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {student.gender ||
                                    "Student"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* MATRICULE */}

                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {student.matricule}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {STATUS_OPTIONS.map(
                                (option) => {
                                  const active =
                                    currentStatus ===
                                    option.value;

                                  return (
                                    <button
                                      key={
                                        option.value
                                      }
                                      type="button"
                                      onClick={() =>
                                        changeStatus(
                                          student.id,
                                          option.value
                                        )
                                      }
                                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                        active
                                          ? "border-purple-600 bg-purple-600 text-white"
                                          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-800"
                                      }`}
                                    >
                                      {
                                        option.label
                                      }
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================== */}

          {students.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {filteredStudents.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {students.length}
                </span>{" "}
                students
              </p>

              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />

                    Save Attendance
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
