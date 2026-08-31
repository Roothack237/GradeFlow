"use client";

import { useEffect, useState } from "react";

import {
Check,
Save,
Users,
CalendarDays,
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
status: AttendanceStatus;
};

type Classroom = {
id: string;
name: string;
section?: {
name?: string;
} | null;
};

type Subject = {
id: string;
name: string;
code: string;
};

type ApiStudent = {
id: string;
firstName?: string;
lastName?: string;
name?: string;
matricule?: string;
};

export default function TeacherAttendancePage() {
const [classrooms, setClassrooms] = useState<Classroom[]>([]);
const [subjects, setSubjects] = useState<Subject[]>([]);
const [students, setStudents] = useState<Student[]>([]);

const [classroom, setClassroom] = useState("");
const [subject, setSubject] = useState("");
const [term, setTerm] = useState("First Term");
const [date, setDate] = useState(
new Date().toISOString().split("T")[0]
);

const [loadingClassrooms, setLoadingClassrooms] =
useState(true);
const [loadingSubjects, setLoadingSubjects] =
useState(true);
const [loadingStudents, setLoadingStudents] =
useState(false);

const [error, setError] = useState("");

/*

* =========================================================
* LOAD CLASSROOMS
* =========================================================
  */

useEffect(() => {
async function loadClassrooms() {
try {
setLoadingClassrooms(true);
setError("");


    const response = await fetch("/api/admin/classes");

    if (!response.ok) {
      throw new Error("Failed to load classrooms.");
    }

    const data: Classroom[] | { classes?: Classroom[] } =
      await response.json();

    const classroomList = Array.isArray(data)
      ? data
      : data.classes ?? [];

    setClassrooms(classroomList);

    if (classroomList.length > 0) {
      setClassroom(classroomList[0].id);
    }
  } catch (err) {
    console.error("FAILED TO LOAD CLASSROOMS:", err);
    setError("Unable to load classrooms.");
  } finally {
    setLoadingClassrooms(false);
  }
}

loadClassrooms();


}, []);

/*

* =========================================================
* LOAD SUBJECTS
* =========================================================
  */

useEffect(() => {
async function loadSubjects() {
try {
setLoadingSubjects(true);
setError("");


    const response = await fetch("/api/admin/subjects");

    if (!response.ok) {
      throw new Error("Failed to load subjects.");
    }

    const data: Subject[] | { subjects?: Subject[] } =
      await response.json();

    const subjectList = Array.isArray(data)
      ? data
      : data.subjects ?? [];

    setSubjects(subjectList);

    if (subjectList.length > 0) {
      setSubject(subjectList[0].id);
    }
  } catch (err) {
    console.error("FAILED TO LOAD SUBJECTS:", err);
    setError("Unable to load subjects.");
  } finally {
    setLoadingSubjects(false);
  }
}

loadSubjects();


}, []);

/*

* =========================================================
* LOAD STUDENTS WHEN CLASSROOM CHANGES
* =========================================================
  */

useEffect(() => {
if (!classroom) {
setStudents([]);
return;
}

async function loadStudents() {
  try {
    setLoadingStudents(true);
    setError("");

    const response = await fetch(
      `/api/admin/classes/${classroom}/students`
    );

    if (!response.ok) {
      throw new Error("Failed to load students.");
    }

    const data:
      | ApiStudent[]
      | { students?: ApiStudent[] } =
      await response.json();

    const studentList = Array.isArray(data)
      ? data
      : data.students ?? [];

    const formattedStudents: Student[] = studentList.map(
      (student) => ({
        id: student.id,
        name:
          student.name ||
          `${student.firstName ?? ""} ${
            student.lastName ?? ""
          }`.trim() ||
          "Unnamed Student",
        matricule: student.matricule ?? "N/A",
        status: "PRESENT",
      })
    );

    setStudents(formattedStudents);
  } catch (err) {
    console.error("FAILED TO LOAD STUDENTS:", err);
    setStudents([]);
    setError("Unable to load students for this classroom.");
  } finally {
    setLoadingStudents(false);
  }
}

loadStudents();


}, [classroom]);

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
? { ...student, status }
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
if (!classroom || !subject || !date) {
alert("Please select a classroom, subject and date.");
return;
}

if (students.length === 0) {
  alert("There are no students in this classroom.");
  return;
}

const payload = {
  classroomId: classroom,
  subjectId: subject,
  term,
  date,
  students: students.map((student) => ({
    studentId: student.id,
    status: student.status,
  })),
};

console.log("ATTENDANCE PAYLOAD:", payload);

/*
 * The API endpoint can be connected here once your
 * attendance API is ready.
 */

alert("Attendance saved successfully!");


}

/*

* =========================================================
* SUMMARY COUNTS
* =========================================================
  */

const presentCount = students.filter(
(student) => student.status === "PRESENT"
).length;

const absentCount = students.filter(
(student) => student.status === "ABSENT"
).length;

const lateCount = students.filter(
(student) => student.status === "LATE"
).length;

const excusedCount = students.filter(
(student) => student.status === "EXCUSED"
).length;

const selectedClassroom = classrooms.find(
(item) => item.id === classroom
);

return ( <div className="min-h-[calc(100vh-5rem)] bg-gray-50 p-5 sm:p-8 dark:bg-gray-950"> <div className="mx-auto max-w-7xl">


    {/* Page Header */}
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
            Record and manage student attendance.
          </p>
        </div>
      </div>
    </div>

    {/* Error */}
    {error && (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        {error}
      </div>
    )}

    {/* Selection Card */}
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
            Select the class, subject and date.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* Classroom */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Classroom
          </label>

          <select
            value={classroom}
            onChange={(event) =>
              setClassroom(event.target.value)
            }
            disabled={loadingClassrooms}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {loadingClassrooms ? (
              <option>Loading classrooms...</option>
            ) : classrooms.length === 0 ? (
              <option>No classrooms available</option>
            ) : (
              classrooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.section?.name
                    ? ` - ${item.section.name}`
                    : ""}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subject
          </label>

          <select
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
            disabled={loadingSubjects}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {loadingSubjects ? (
              <option>Loading subjects...</option>
            ) : subjects.length === 0 ? (
              <option>No subjects available</option>
            ) : (
              subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Term */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Term
          </label>

          <select
            value={term}
            onChange={(event) =>
              setTerm(event.target.value)
            }
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option>First Term</option>
            <option>Second Term</option>
            <option>Third Term</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
    </div>

    {/* Summary */}
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

    {/* Students */}
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

      {/* Students Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
            <Users size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {selectedClassroom?.name ??
                "Select a classroom"}
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
            students.length === 0 || loadingStudents
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/30"
        >
          <Check size={16} />
          Mark All Present
        </button>
      </div>

      {/* Loading */}
      {loadingStudents && (
        <div className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" />

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading students...
          </p>
        </div>
      )}

      {/* Empty */}
      {!loadingStudents && students.length === 0 && (
        <div className="p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />

          <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
            No students found
          </p>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select another classroom or make sure students
            have been assigned to this class.
          </p>
        </div>
      )}

      {/* Student Rows */}
      {!loadingStudents && students.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {student.name}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {student.matricule}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusButton
                  label="Present"
                  active={student.status === "PRESENT"}
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
                  active={student.status === "ABSENT"}
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
                  active={student.status === "LATE"}
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
                  active={student.status === "EXCUSED"}
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

      {/* Save */}
      <div className="flex justify-end border-t border-gray-200 p-6 dark:border-gray-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={
            students.length === 0 ||
            !classroom ||
            !subject
          }
          className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={18} />
          Save Attendance
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
return ( <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"> <p className="text-sm text-gray-500 dark:text-gray-400">
{label} </p>

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
{label} </button>
);
}
