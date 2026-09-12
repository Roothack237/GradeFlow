"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  AlertCircle,
  BookOpen,
  Loader2,
  Save,
  Search,
  Trophy,
  Users,
} from "lucide-react";

type SequenceName =
  | "First Sequence"
  | "Second Sequence"
  | "Third Sequence"
  | "Fourth Sequence"
  | "Fifth Sequence"
  | "Sixth Sequence";

type TermSequence = {
  id: string;
  name: string;
  order: number;
};

type TermOption = {
  id: string;
  name: string;
  order?: number;
  sequences?: TermSequence[];
};

type SequenceMarks = {
  first: string;
  second: string;
};

type Student = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  matricule: string;
  gender: string;
  marks: SequenceMarks;
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

type ClassroomOption = {
  id: string;
  name: string;
  sectionName: string;
};

type SubjectOption = {
  id: string;
  name: string;
  code: string;
};

type SavedMark = {
  id?: string;
  studentId?: string;
  subjectId?: string;
  sequenceId?: string;
  sequence?: string;
  sequenceName?: string;
  average?: number;
  ca1?: number;
  ca2?: number;
  exam?: number;
};

const DEFAULT_TERMS: TermOption[] = [];

function getSequencesForTerm(
  term: TermOption | null
): [SequenceName, SequenceName] {
  /*
   * IMPORTANT:
   * Use the REAL sequences returned by the database.
   *
   * We do not assume:
   * First Term  -> First/Second
   * Second Term -> Third/Fourth
   * Third Term  -> Fifth/Sixth
   *
   * The database is the source of truth.
   */

  if (term?.sequences && term.sequences.length >= 2) {
    const sortedSequences = [...term.sequences].sort(
      (a, b) => a.order - b.order
    );

    return [
      sortedSequences[0].name as SequenceName,
      sortedSequences[1].name as SequenceName,
    ];
  }

  /*
   * Fallback only in case the API does not return sequences.
   */
  const order = term?.order || 1;

  if (order === 2) {
    return ["Third Sequence", "Fourth Sequence"];
  }

  if (order === 3) {
    return ["Fifth Sequence", "Sixth Sequence"];
  }

  return ["First Sequence", "Second Sequence"];
}

function getSequenceKey(
  sequence: SequenceName
): keyof SequenceMarks {
  if (
    sequence === "First Sequence" ||
    sequence === "Third Sequence" ||
    sequence === "Fifth Sequence"
  ) {
    return "first";
  }

  return "second";
}

function getSequenceShortName(
  sequence: SequenceName
): string {
  const names: Record<SequenceName, string> = {
    "First Sequence": "1st",
    "Second Sequence": "2nd",
    "Third Sequence": "3rd",
    "Fourth Sequence": "4th",
    "Fifth Sequence": "5th",
    "Sixth Sequence": "6th",
  };

  return names[sequence];
}

function calculateTermAverage(
  marks: SequenceMarks
): number | null {
  const values = [marks.first, marks.second]
    .map((value) => (value === "" ? null : Number(value)))
    .filter(
      (value): value is number =>
        value !== null && !Number.isNaN(value)
    );

  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function formatAverage(
  average: number | null
): string {
  if (average === null) {
    return "—";
  }

  return average.toFixed(2);
}

function getPosition(
  studentId: string,
  students: Student[]
): number | null {
  const averages = students
    .map((student) => ({
      id: student.id,
      average: calculateTermAverage(student.marks),
    }))
    .filter(
      (
        item
      ): item is {
        id: string;
        average: number;
      } => item.average !== null
    )
    .sort((a, b) => b.average - a.average);

  const student = averages.find(
    (item) => item.id === studentId
  );

  if (!student) {
    return null;
  }

  return (
    averages.filter(
      (item) => item.average > student.average
    ).length + 1
  );
}

function formatPosition(
  position: number | null
): string {
  if (position === null) {
    return "—";
  }

  if (position >= 11 && position <= 13) {
    return `${position}th`;
  }

  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}

function normalizeTermName(name: string): string {
  const value = name.toLowerCase().trim();

  if (
    value.includes("first") ||
    value === "term 1" ||
    value === "1st term"
  ) {
    return "First Term";
  }

  if (
    value.includes("second") ||
    value === "term 2" ||
    value === "2nd term"
  ) {
    return "Second Term";
  }

  if (
    value.includes("third") ||
    value === "term 3" ||
    value === "3rd term"
  ) {
    return "Third Term";
  }

  return name;
}

/*
 * Get the REAL sequence record stored in the database.
 *
 * We use the sequence name to find the exact sequence
 * inside the selected term, then use its real database order.
 */
function getSelectedSequence(
  term: TermOption | null,
  sequence: SequenceName
): TermSequence | null {
  if (!term?.sequences) {
    return null;
  }

  return (
    term.sequences.find(
      (item) => item.name === sequence
    ) || null
  );
}

export default function TeacherMarksPageRoute() {
  return (
    <Suspense fallback={null}>
      <TeacherMarksPage />
    </Suspense>
  );
}

function TeacherMarksPage() {
  const searchParams = useSearchParams();

  const classIdFromUrl =
    searchParams.get("classId");

  const [assignments, setAssignments] =
    useState<TeacherAssignment[]>([]);

  const [terms, setTerms] =
    useState<TermOption[]>(DEFAULT_TERMS);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [classroom, setClassroom] =
    useState("");

  const [subject, setSubject] =
    useState("");

  /*
   * IMPORTANT:
   * Start empty.
   * We wait for the real term ID from the API.
   */
  const [termId, setTermId] =
    useState("");

  const [sequence, setSequence] =
    useState<SequenceName>("First Sequence");

  const [search, setSearch] =
    useState("");

  const [
    loadingAssignments,
    setLoadingAssignments,
  ] = useState(true);

  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(false);

  const [
    loadingMarks,
    setLoadingMarks,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const selectedTerm = useMemo(() => {
    return (
      terms.find(
        (term) => term.id === termId
      ) || null
    );
  }, [terms, termId]);

  /*
   * Get the actual two sequences belonging
   * to the selected term.
   */
  const availableSequences =
    useMemo(() => {
      return getSequencesForTerm(
        selectedTerm
      );
    }, [selectedTerm]);

  /*
   * Whenever the term changes, select the
   * first real sequence belonging to that term.
   */
  useEffect(() => {
    if (availableSequences.length > 0) {
      setSequence(
        availableSequences[0]
      );
    }
  }, [termId, availableSequences]);

  /*
   * Load teacher assignments.
   */
  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoadingAssignments(true);
        setError("");

        const response = await fetch(
          "/api/teacher/assignments",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to load teacher assignments"
          );
        }

        const teacherAssignments: TeacherAssignment[] =
          Array.isArray(data)
            ? data
            : data.assignments || [];

        setAssignments(
          teacherAssignments
        );

        if (classIdFromUrl) {
          const matchingAssignment =
            teacherAssignments.find(
              (assignment) =>
                assignment.classroom?.id ===
                classIdFromUrl
            );

          if (matchingAssignment) {
            setClassroom(
              classIdFromUrl
            );

            if (
              matchingAssignment.subject?.id
            ) {
              setSubject(
                matchingAssignment.subject.id
              );
            }
          }
        } else {
          const firstAssignment =
            teacherAssignments.find(
              (assignment) =>
                assignment.classroom?.id
            );

          if (
            firstAssignment?.classroom?.id
          ) {
            setClassroom(
              firstAssignment.classroom.id
            );

            if (
              firstAssignment.subject?.id
            ) {
              setSubject(
                firstAssignment.subject.id
              );
            }
          }
        }
      } catch (err) {
        console.error(
          "FETCH TEACHER ASSIGNMENTS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load assignments"
        );
      } finally {
        setLoadingAssignments(false);
      }
    }

    fetchAssignments();
  }, [classIdFromUrl]);

  /*
   * Load terms.
   */
  useEffect(() => {
    async function fetchTerms() {
      try {
        const response = await fetch(
          "/api/teacher/terms",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const apiTerms = Array.isArray(data)
          ? data
          : data.terms || [];

        if (
          Array.isArray(apiTerms) &&
          apiTerms.length > 0
        ) {
          const formattedTerms: TermOption[] =
            apiTerms
              .map(
                (term: {
                  id?: string;
                  name?: string;
                  order?: number;
                  sequences?: {
                    id?: string;
                    name?: string;
                    order?: number;
                  }[];
                }) => ({
                  id: term.id || "",
                  name: normalizeTermName(
                    term.name || ""
                  ),
                  order: term.order,

                  /*
                   * Keep the actual sequence
                   * records returned by the API.
                   */
                  sequences:
                    Array.isArray(
                      term.sequences
                    )
                      ? term.sequences
                          .filter(
                            (sequence) =>
                              sequence.id &&
                              sequence.name &&
                              typeof sequence.order ===
                                "number"
                          )
                          .map(
                            (sequence) => ({
                              id:
                                sequence.id!,
                              name:
                                sequence.name!,
                              order:
                                sequence.order!,
                            })
                          )
                          .sort(
                            (a, b) =>
                              a.order - b.order
                          )
                      : [],
                })
              )
              .filter(
                (term: TermOption) =>
                  term.id && term.name
              )
              .sort(
                (a, b) =>
                  (a.order || 0) -
                  (b.order || 0)
              )
              .slice(0, 3);

          if (
            formattedTerms.length > 0
          ) {
            setTerms(
              formattedTerms
            );

            /*
             * Use the REAL database term ID.
             */
            setTermId(
              formattedTerms[0].id
            );

            /*
             * Also immediately use the first
             * actual sequence from the database.
             */
            if (
              formattedTerms[0]
                .sequences &&
              formattedTerms[0]
                .sequences.length > 0
            ) {
              setSequence(
                formattedTerms[0]
                  .sequences[0]
                  .name as SequenceName
              );
            }
          }
        }
      } catch (err) {
        console.log(
          "Failed to load terms:",
          err
        );
      }
    }

    fetchTerms();
  }, []);

  const assignedClassrooms =
    useMemo<ClassroomOption[]>(() => {
      const map = new Map<
        string,
        ClassroomOption
      >();

      assignments.forEach(
        (assignment) => {
          const id =
            assignment.classroom?.id;

          if (!id) {
            return;
          }

          if (!map.has(id)) {
            map.set(id, {
              id,
              name:
                assignment.classroom?.name ||
                "Unknown Classroom",
              sectionName:
                assignment.section?.name ||
                "Unknown Section",
            });
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [assignments]);

  const assignedSubjects =
    useMemo<SubjectOption[]>(() => {
      const map = new Map<
        string,
        SubjectOption
      >();

      assignments
        .filter(
          (assignment) =>
            assignment.classroom?.id ===
            classroom
        )
        .forEach(
          (assignment) => {
            const id =
              assignment.subject?.id;

            if (!id) {
              return;
            }

            if (!map.has(id)) {
              map.set(id, {
                id,
                name:
                  assignment.subject?.name ||
                  "Unknown Subject",
                code:
                  assignment.subject?.code ||
                  "",
              });
            }
          }
        );

      return Array.from(
        map.values()
      );
    }, [assignments, classroom]);

  useEffect(() => {
    if (!classroom) {
      setSubject("");
      return;
    }

    const valid =
      assignedSubjects.some(
        (item) => item.id === subject
      );

    if (!valid) {
      setSubject(
        assignedSubjects[0]?.id || ""
      );
    }
  }, [
    classroom,
    assignedSubjects,
    subject,
  ]);

  /*
   * Load students + marks.
   */
  useEffect(() => {
    async function fetchStudentsAndMarks() {
      if (!classroom) {
        setStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        setLoadingMarks(true);
        setError("");
        setSuccessMessage("");

        const studentsResponse =
          await fetch(
            `/api/teacher/classes/${classroom}/students`,
            {
              cache: "no-store",
            }
          );

        const studentsData =
          await studentsResponse.json();

        if (!studentsResponse.ok) {
          throw new Error(
            studentsData?.error ||
              studentsData?.message ||
              "Failed to load students"
          );
        }

        const apiStudents =
          Array.isArray(studentsData)
            ? studentsData
            : studentsData.students || [];

        const formattedStudents: Student[] =
          apiStudents.map(
            (student: {
              id: string;
              fullName?: string;
              firstName?: string;
              lastName?: string;
              matricule?: string;
              gender?: string;
            }) => ({
              id: student.id,
              fullName:
                student.fullName ||
                `${student.firstName || ""} ${
                  student.lastName || ""
                }`.trim(),
              firstName:
                student.firstName || "",
              lastName:
                student.lastName || "",
              matricule:
                student.matricule || "",
              gender:
                student.gender || "",
              marks: {
                first: "",
                second: "",
              },
            })
          );

        /*
         * Load saved marks for selected term.
         */
        if (
          subject &&
          termId &&
          !termId.startsWith("term-")
        ) {
          try {
            const params =
              new URLSearchParams({
                classroomId: classroom,
                subjectId: subject,
                termId,
              });

            const marksResponse =
              await fetch(
                `/api/teacher/marks?${params.toString()}`,
                {
                  cache: "no-store",
                }
              );

            if (!marksResponse.ok) {
              const errorText =
                await marksResponse.text();

              console.error(
                "LOAD SAVED MARKS ERROR:",
                marksResponse.status,
                errorText
              );
            } else {
              const marksData =
                await marksResponse.json();

              const savedMarks: SavedMark[] =
                Array.isArray(marksData)
                  ? marksData
                  : marksData.marks || [];

              const [
                firstSequence,
                secondSequence,
              ] = getSequencesForTerm(
                selectedTerm
              );

              for (const student of formattedStudents) {
                const studentMarks =
                  savedMarks.filter(
                    (mark) =>
                      mark.studentId ===
                      student.id
                  );

                for (const mark of studentMarks) {
                  const savedSequence =
                    mark.sequenceName ||
                    mark.sequence ||
                    "";

                  const value =
                    mark.average ??
                    mark.ca1 ??
                    "";

                  if (
                    savedSequence ===
                    firstSequence
                  ) {
                    student.marks.first =
                      String(value);
                  }

                  if (
                    savedSequence ===
                    secondSequence
                  ) {
                    student.marks.second =
                      String(value);
                  }
                }
              }
            }
          } catch (marksError) {
            console.error(
              "LOAD SAVED MARKS ERROR:",
              marksError
            );
          }
        }

        setStudents(
          formattedStudents
        );
      } catch (err) {
        console.error(
          "FETCH TEACHER STUDENTS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load students"
        );

        setStudents([]);
      } finally {
        setLoadingStudents(false);
        setLoadingMarks(false);
      }
    }

    fetchStudentsAndMarks();
  }, [
    classroom,
    subject,
    termId,
    selectedTerm,
  ]);

  const selectedClassroom =
    useMemo(() => {
      return assignedClassrooms.find(
        (item) =>
          item.id === classroom
      );
    }, [
      assignedClassrooms,
      classroom,
    ]);

  const selectedSubject =
    useMemo(() => {
      return assignedSubjects.find(
        (item) =>
          item.id === subject
      );
    }, [
      assignedSubjects,
      subject,
    ]);

  const filteredStudents =
    useMemo(() => {
      const searchTerm =
        search
          .toLowerCase()
          .trim();

      if (!searchTerm) {
        return students;
      }

      return students.filter(
        (student) =>
          student.fullName
            .toLowerCase()
            .includes(searchTerm) ||
          student.matricule
            .toLowerCase()
            .includes(searchTerm)
      );
    }, [
      students,
      search,
    ]);

  function updateMark(
    id: string,
    value: string,
    sequenceName: SequenceName
  ) {
    const key =
      getSequenceKey(sequenceName);

    if (value === "") {
      setStudents((current) =>
        current.map((student) =>
          student.id === id
            ? {
                ...student,
                marks: {
                  ...student.marks,
                  [key]: "",
                },
              }
            : student
        )
      );

      return;
    }

    /*
     * Allow:
     * 10
     * 10.5
     * 0.5
     * 20
     */
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const numericValue =
      Number(value);

    if (
      numericValue < 0 ||
      numericValue > 20
    ) {
      return;
    }

    setStudents((current) =>
      current.map((student) =>
        student.id === id
          ? {
              ...student,
              marks: {
                ...student.marks,
                [key]: value,
              },
            }
          : student
      )
    );
  }

  async function handleSave() {
    if (!classroom) {
      alert(
        "Please select a classroom."
      );
      return;
    }

    if (!subject) {
      alert(
        "Please select a subject."
      );
      return;
    }

    if (!termId) {
      alert(
        "Please select a term."
      );
      return;
    }

    if (!selectedTerm) {
      alert(
        "Selected term could not be found."
      );
      return;
    }

    /*
     * IMPORTANT:
     *
     * Get the exact sequence from the
     * selected term's database records.
     */
    const selectedSequence =
      getSelectedSequence(
        selectedTerm,
        sequence
      );

    if (!selectedSequence) {
      setError(
        `Invalid sequence "${sequence}" for ${selectedTerm.name}.`
      );

      console.error(
        "SEQUENCE NOT FOUND IN SELECTED TERM:",
        {
          selectedTerm,
          sequence,
          availableSequences:
            selectedTerm.sequences,
        }
      );

      return;
    }

    /*
     * Verify the teacher is assigned to
     * the selected classroom + subject.
     */
    const validAssignment =
      assignments.some(
        (assignment) =>
          assignment.classroom?.id ===
            classroom &&
          assignment.subject?.id ===
            subject
      );

    if (!validAssignment) {
      alert(
        "You are not assigned to this subject."
      );
      return;
    }

    const sequenceKey =
      getSequenceKey(sequence);

    /*
     * This is the EXACT order stored in
     * the database for this sequence.
     *
     * Example:
     * First Sequence  -> 1
     * Second Sequence -> 2
     *
     * or whatever the database actually
     * returned.
     */
    const sequenceOrder =
      selectedSequence.order;

    /*
     * Debug information.
     */
    console.log(
      "========== SAVING MARKS =========="
    );

    console.log({
      classroomId: classroom,
      subjectId: subject,
      termId,
      term: selectedTerm.name,
      sequence,
      sequenceId:
        selectedSequence.id,
      sequenceOrder,
      sequenceKey,
      databaseSequences:
        selectedTerm.sequences,
    });

    const sequenceMarks =
      students.map(
        (student) => ({
          studentId: student.id,

          mark:
            student.marks[
              sequenceKey
            ] === ""
              ? null
              : Number(
                  student.marks[
                    sequenceKey
                  ]
                ),
        })
      );

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          "/api/teacher/marks",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              classroomId: classroom,
              subjectId: subject,

              /*
               * REAL DATABASE TERM ID
               */
              termId,

              term:
                selectedTerm.name,

              /*
               * REAL DATABASE SEQUENCE NAME
               */
              sequence,

              /*
               * REAL DATABASE SEQUENCE ID
               *
               * The API can ignore this if it
               * doesn't use it yet, but sending it
               * gives the backend the exact record.
               */
              sequenceId:
                selectedSequence.id,

              sequenceKey,

              /*
               * REAL DATABASE SEQUENCE ORDER
               */
              sequenceOrder,

              maxMark: 20,

              students:
                sequenceMarks,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "SAVE MARKS API ERROR:",
          {
            status: response.status,
            data,
            sequence,
            sequenceId:
              selectedSequence.id,
            sequenceOrder,
            termId,
          }
        );

        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to save marks"
        );
      }

      setSuccessMessage(
        `${sequence} for ${selectedTerm.name} saved successfully.`
      );
    } catch (err) {
      console.error(
        "SAVE MARKS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save marks."
      );
    } finally {
      setSaving(false);
    }
  }

  const enteredCount =
    students.filter((student) => {
      const key =
        getSequenceKey(sequence);

      return (
        student.marks[key] !== ""
      );
    }).length;

  const classAverage =
    useMemo(() => {
      const averages =
        students
          .map((student) =>
            calculateTermAverage(
              student.marks
            )
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      if (averages.length === 0) {
        return null;
      }

      return (
        averages.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / averages.length
      );
    }, [students]);

  if (loadingAssignments) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Loading your assigned classes...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
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
                Enter student marks by term and sequence.
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400">
            <Save
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>
              {successMessage}
            </span>
          </div>
        )}

        {/* FILTERS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* SECTION */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Section
              </label>

              <div className="flex min-h-[48px] items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {selectedClassroom?.sectionName ||
                  "Not assigned"}
              </div>
            </div>

            {/* CLASSROOM */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Classroom
              </label>

              <select
                value={classroom}
                onChange={(e) =>
                  setClassroom(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {assignedClassrooms.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}
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
                  setSubject(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {assignedSubjects.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.code
                        ? ` (${item.code})`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TERM */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Term
              </label>

              <select
                value={termId}
                onChange={(e) =>
                  setTermId(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {terms.map((term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mt-5 max-w-md">
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
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Name or matricule"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* MARKS */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* TITLE */}
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Users size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {selectedClassroom?.name ||
                    "Classroom"}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSubject?.name ||
                    "Subject"}{" "}
                  ·{" "}
                  {selectedTerm?.name ||
                    "Term"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                Mark: /20
              </div>

              <div className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                Term Average:{" "}
                {classAverage === null
                  ? "—"
                  : `${classAverage.toFixed(
                      2
                    )}/20`}
              </div>
            </div>
          </div>

          {/* SEQUENCES */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex flex-wrap gap-2">
              {availableSequences.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setSequence(item)
                    }
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                      sequence === item
                        ? "bg-purple-700 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          {/* LOADING */}
          {loadingStudents ||
          loadingMarks ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2
                  size={22}
                  className="animate-spin"
                />
                Loading students and marks...
              </div>
            </div>
          ) : students.length ===
            0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <Users
                size={40}
                className="mb-3 text-gray-400"
              />

              <h3 className="font-semibold text-gray-900 dark:text-white">
                No students found
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are no students in this classroom.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                      <th className="px-6 py-4">
                        Student
                      </th>

                      <th className="px-4 py-4">
                        Matricule
                      </th>

                      <th className="px-4 py-4 text-center">
                        {availableSequences[0]}
                        <br />
                        <span className="text-[10px] normal-case">
                          /20
                        </span>
                      </th>

                      <th className="px-4 py-4 text-center">
                        {availableSequences[1]}
                        <br />
                        <span className="text-[10px] normal-case">
                          /20
                        </span>
                      </th>

                      <th className="px-4 py-4 text-center">
                        Term Average
                      </th>

                      <th className="px-4 py-4 text-center">
                        Position
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredStudents.map(
                      (student) => {
                        const average =
                          calculateTermAverage(
                            student.marks
                          );

                        const position =
                          getPosition(
                            student.id,
                            students
                          );

                        const first =
                          availableSequences[0];

                        const second =
                          availableSequences[1];

                        return (
                          <tr
                            key={
                              student.id
                            }
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          >
                            <td className="px-6 py-5">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {
                                  student.fullName
                                }
                              </p>
                            </td>

                            <td className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
                              {
                                student.matricule
                              }
                            </td>

                            <td className="px-4 py-5">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  student
                                    .marks
                                    .first
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMark(
                                    student.id,
                                    e.target
                                      .value,
                                    first
                                  )
                                }
                                placeholder="0 - 20"
                                className="mx-auto block w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-medium outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                            </td>

                            <td className="px-4 py-5">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  student
                                    .marks
                                    .second
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMark(
                                    student.id,
                                    e.target
                                      .value,
                                    second
                                  )
                                }
                                placeholder="0 - 20"
                                className="mx-auto block w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-medium outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                            </td>

                            <td className="px-4 py-5 text-center">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {formatAverage(
                                  average
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-5 text-center">
                              {position !==
                              null ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                                  <Trophy
                                    size={
                                      14
                                    }
                                  />

                                  {formatPosition(
                                    position
                                  )}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}
              <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
                {filteredStudents.map(
                  (student) => {
                    const average =
                      calculateTermAverage(
                        student.marks
                      );

                    const position =
                      getPosition(
                        student.id,
                        students
                      );

                    const first =
                      availableSequences[0];

                    const second =
                      availableSequences[1];

                    return (
                      <div
                        key={
                          student.id
                        }
                        className="p-5"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {
                                student.fullName
                              }
                            </h3>

                            <p className="text-sm text-gray-500">
                              {
                                student.matricule
                              }
                            </p>
                          </div>

                          {position !==
                            null && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                              <Trophy
                                size={13}
                              />

                              {formatPosition(
                                position
                              )}
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="mb-1 block text-xs text-gray-500">
                            {first} /20
                          </label>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              student
                                .marks
                                .first
                            }
                            onChange={(
                              e
                            ) =>
                              updateMark(
                                student.id,
                                e.target
                                  .value,
                                first
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="mb-1 block text-xs text-gray-500">
                            {second} /20
                          </label>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              student
                                .marks
                                .second
                            }
                            onChange={(
                              e
                            ) =>
                              updateMark(
                                student.id,
                                e.target
                                  .value,
                                second
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Term Average
                            </span>

                            <span className="font-bold">
                              {formatAverage(
                                average
                              )}
                              /20
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}

          {/* SAVE */}
          <div className="flex flex-col justify-between gap-4 border-t border-gray-200 p-6 sm:flex-row sm:items-center dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-500">
                {filteredStudents.length}{" "}
                student
                {filteredStudents.length !==
                1
                  ? "s"
                  : ""}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {enteredCount}{" "}
                {sequence.toLowerCase()}{" "}
                marks entered
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                students.length ===
                  0 ||
                !classroom ||
                !subject ||
                !termId
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {saving
                ? "Sending..."
                : `Send ${sequence} to Admin`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}