"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Search,
  Save,
  Users,
  AlertCircle,
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  matricule: string;
  ca: string;
  exam: string;
};

const initialStudents: Student[] = [
  {
    id: "1",
    name: "Manuella Efendeh",
    matricule: "STU001",
    ca: "18",
    exam: "65",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    matricule: "STU002",
    ca: "15",
    exam: "58",
  },
  {
    id: "3",
    name: "Peter Williams",
    matricule: "STU003",
    ca: "12",
    exam: "49",
  },
  {
    id: "4",
    name: "Mary Smith",
    matricule: "STU004",
    ca: "17",
    exam: "71",
  },
  {
    id: "5",
    name: "Daniel Brown",
    matricule: "STU005",
    ca: "14",
    exam: "55",
  },
];

export default function TeacherMarksPage() {
  const [students, setStudents] =
    useState<Student[]>(initialStudents);

  const [classroom, setClassroom] = useState("Form 1 A");
  const [subject, setSubject] = useState("Mathematics");
  const [term, setTerm] = useState("First Term");
  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        student.matricule
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  }, [students, search]);

  function updateMark(
    id: string,
    field: "ca" | "exam",
    value: string
  ) {
    if (
      value !== "" &&
      (!/^\d*\.?\d*$/.test(value) ||
        Number(value) < 0 ||
        Number(value) > 100)
    ) {
      return;
    }

    setStudents((current) =>
      current.map((student) =>
        student.id === id
          ? {
              ...student,
              [field]: value,
            }
          : student
      )
    );
  }

  function getTotal(student: Student) {
    const ca = Number(student.ca) || 0;
    const exam = Number(student.exam) || 0;

    return ca + exam;
  }

  function getGrade(total: number) {
    if (total >= 80) return "A";
    if (total >= 70) return "B";
    if (total >= 60) return "C";
    if (total >= 50) return "D";
    return "F";
  }

  function handleSave() {
    console.log({
      classroom,
      subject,
      term,
      students,
    });

    alert("Marks saved successfully!");
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
              <BookOpen size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Marks
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter and manage student academic results.
              </p>
            </div>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Classroom
              </label>

              <select
                value={classroom}
                onChange={(e) =>
                  setClassroom(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>Form 1 A</option>
                <option>Form 1 B</option>
                <option>Form 2 A</option>
                <option>Form 2 B</option>
              </select>
            </div>

            {/* SUBJECT */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>Mathematics</option>
                <option>English Language</option>
                <option>Computer Science</option>
                <option>Physics</option>
                <option>Chemistry</option>
              </select>
            </div>

            {/* TERM */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Term
              </label>

              <select
                value={term}
                onChange={(e) =>
                  setTerm(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
            </div>

            {/* SEARCH */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Student
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Name or matricule"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MARKS CARD */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          {/* CARD HEADER */}
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Users size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {classroom}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subject} · {term}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              <AlertCircle size={16} />
              CA + Exam = 100
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-4 py-4">Matricule</th>
                  <th className="px-4 py-4 text-center">
                    CA / 30
                  </th>
                  <th className="px-4 py-4 text-center">
                    Exam / 70
                  </th>
                  <th className="px-4 py-4 text-center">
                    Total / 100
                  </th>
                  <th className="px-4 py-4 text-center">
                    Grade
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredStudents.map((student) => {
                  const total = getTotal(student);
                  const grade = getGrade(total);

                  return (
                    <tr
                      key={student.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </p>
                      </td>

                      <td className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
                        {student.matricule}
                      </td>

                      <td className="px-4 py-5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={student.ca}
                          onChange={(e) =>
                            updateMark(
                              student.id,
                              "ca",
                              e.target.value
                            )
                          }
                          className="mx-auto block w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </td>

                      <td className="px-4 py-5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={student.exam}
                          onChange={(e) =>
                            updateMark(
                              student.id,
                              "exam",
                              e.target.value
                            )
                          }
                          className="mx-auto block w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </td>

                      <td className="px-4 py-5 text-center">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {total}
                        </span>
                      </td>

                      <td className="px-4 py-5 text-center">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${
                            grade === "F"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          }`}
                        >
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
            {filteredStudents.map((student) => {
              const total = getTotal(student);
              const grade = getGrade(total);

              return (
                <div key={student.id} className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {student.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {student.matricule}
                      </p>
                    </div>

                    <span className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                      {grade}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        CA / 30
                      </label>

                      <input
                        type="text"
                        value={student.ca}
                        onChange={(e) =>
                          updateMark(
                            student.id,
                            "ca",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Exam / 70
                      </label>

                      <input
                        type="text"
                        value={student.exam}
                        onChange={(e) =>
                          updateMark(
                            student.id,
                            "exam",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Total
                      </label>

                      <div className="flex h-[38px] items-center justify-center rounded-lg bg-gray-100 font-bold dark:bg-gray-800 dark:text-white">
                        {total}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col justify-between gap-4 border-t border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredStudents.length} student
              {filteredStudents.length !== 1 ? "s" : ""}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800"
            >
              <Save size={18} />
              Save Marks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}