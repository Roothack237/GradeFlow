"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Users,
} from "lucide-react";
/* =========================================================
   TYPES
========================================================= */

type Assignment = {
  id: string;
  teacherId?: string;
  classroomId: string;
  subjectId: string;
  sectionId?: string;

  classroom?: {
    id: string;
    name: string;
    academicYearId?: string;
    section?: {
      id: string;
      name: string;
    };
  };

  subject?: {
    id: string;
    name: string;
    code?: string | null;
    coefficient?: number | null;
  };

  section?: {
    id: string;
    name: string;
  };
};

type Sequence = {
  id: string;
  name: string;
  order?: number | null;
  termId: string;
};

type Term = {
  id: string;
  name: string;
  order?: number | null;
  isCurrent?: boolean;
  academicYearId?: string | null;
  sequences?: Sequence[];
};

type Student = {
  id: string;
  matricule?: string | null;
  firstName: string;
  lastName: string;
  gender?: string | null;
  classroomId?: string | null;
  score: string | number;
};

type ExistingMark = {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  termId: string;
  sequenceId: string;
  score: number;
};

type AssignmentsResponse = {
  success?: boolean;
  assignments?: Assignment[];
  error?: string;
  message?: string;
};

type TermsResponse = {
  success?: boolean;
  terms?: Term[];
  error?: string;
  message?: string;
};

type MarksResponse = {
  success?: boolean;
  students?: Student[];
  marks?: ExistingMark[];
  error?: string;
  message?: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function TeacherMarksPage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClassroomId, setSelectedClassroomId] =
    useState("");

  const [selectedSubjectId, setSelectedSubjectId] =
    useState("");

  const [selectedTermId, setSelectedTermId] =
    useState("");

  const [selectedSequenceId, setSelectedSequenceId] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);

  const [loadingTerms, setLoadingTerms] =
    useState(true);

  const [loadingSequences, setLoadingSequences] =
    useState(false);

  const [loadingMarks, setLoadingMarks] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =======================================================
     DEBUG
  ======================================================= */

  useEffect(() => {
    console.log("========== MARKS PAGE DEBUG ==========");
    console.log("assignments:", assignments);
    console.log("terms:", terms);
    console.log("selectedClassroomId:", selectedClassroomId);
    console.log("selectedSubjectId:", selectedSubjectId);
    console.log("selectedTermId:", selectedTermId);
    console.log("sequences:", sequences);
    console.log("selectedSequenceId:", selectedSequenceId);
    console.log("students:", students);
    console.log("======================================");
  }, [
    assignments,
    terms,
    selectedClassroomId,
    selectedSubjectId,
    selectedTermId,
    sequences,
    selectedSequenceId,
    students,
  ]);

  /* =======================================================
     LOAD ASSIGNMENTS
  ======================================================= */

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    setLoadingAssignments(true);
    setError("");

    try {
      const response = await fetch(
        "/api/teacher/assignments",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: AssignmentsResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to load teacher assignments."
        );
      }

      const loadedAssignments = Array.isArray(
        data.assignments
      )
        ? data.assignments
        : [];

      setAssignments(loadedAssignments);

      if (loadedAssignments.length > 0) {
        const firstAssignment =
          loadedAssignments[0];

        const classroomId =
          firstAssignment.classroomId ||
          firstAssignment.classroom?.id ||
          "";

        const subjectId =
          firstAssignment.subjectId ||
          firstAssignment.subject?.id ||
          "";

        setSelectedClassroomId(classroomId);
        setSelectedSubjectId(subjectId);
      } else {
        setSelectedClassroomId("");
        setSelectedSubjectId("");
        setStudents([]);
      }
    } catch (err) {
      console.error(
        "LOAD ASSIGNMENTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load teacher assignments."
      );

      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  }

  /* =======================================================
     LOAD TERMS
     
     IMPORTANT:
     Sequences are loaded together with their term.
     
     We DO NOT call:
     /api/teacher/marks/sequences
  ======================================================= */

  useEffect(() => {
    loadTerms();
  }, []);

  async function loadTerms() {
    setLoadingTerms(true);

    try {
      const response = await fetch(
        "/api/teacher/marks/terms",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const rawText = await response.text();

      let data: TermsResponse = {};

      try {
        data = rawText
          ? JSON.parse(rawText)
          : {};
      } catch {
        throw new Error(
          `Terms API returned invalid JSON. Status: ${response.status}`
        );
      }

      console.log(
        "TERMS API RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to load terms. HTTP ${response.status}`
        );
      }

      const loadedTerms = Array.isArray(
        data.terms
      )
        ? data.terms
        : [];

      if (loadedTerms.length === 0) {
        setTerms([]);
        setSelectedTermId("");
        setSequences([]);
        setSelectedSequenceId("");

        setError(
          "No terms are available. Please make sure Term 1, Term 2 and Term 3 exist in the database."
        );

        return;
      }

      /* ---------------------------------------------------
         Sort terms
      --------------------------------------------------- */

      const sortedTerms = [...loadedTerms].sort(
        (a, b) =>
          (a.order ?? 0) -
          (b.order ?? 0)
      );

      setTerms(sortedTerms);

      /* ---------------------------------------------------
         Select current term if available.
         Otherwise select first term.
      --------------------------------------------------- */

      const currentTerm =
        sortedTerms.find(
          (term) => term.isCurrent === true
        ) ?? sortedTerms[0];

      setSelectedTermId(
        currentTerm?.id ?? ""
      );
    } catch (err) {
      console.error(
        "LOAD TERMS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load terms."
      );

      setTerms([]);
      setSelectedTermId("");
      setSequences([]);
      setSelectedSequenceId("");
    } finally {
      setLoadingTerms(false);
    }
  }

  /* =======================================================
     DERIVE SEQUENCES FROM SELECTED TERM
     
     NO API CALL HERE.
     
     Term 1:
       First Sequence
       Second Sequence

     Term 2:
       Third Sequence
       Fourth Sequence

     Term 3:
       Fifth Sequence
       Sixth Sequence
  ======================================================= */

  useEffect(() => {
    if (!selectedTermId) {
      setSequences([]);
      setSelectedSequenceId("");
      setStudents([]);
      return;
    }

    setLoadingSequences(true);

    const selectedTerm = terms.find(
      (term) =>
        term.id === selectedTermId
    );

    const termSequences =
      Array.isArray(
        selectedTerm?.sequences
      )
        ? [...selectedTerm.sequences]
        : [];

    const sortedSequences =
      termSequences
        .filter(
          (sequence) =>
            sequence.termId ===
            selectedTermId
        )
        .sort(
          (a, b) =>
            (a.order ?? 0) -
            (b.order ?? 0)
        );

    console.log(
      "SEQUENCES FOR SELECTED TERM:",
      selectedTerm?.name,
      sortedSequences
    );

    setSequences(sortedSequences);

    /* -----------------------------------------------------
       Automatically select first sequence
    ----------------------------------------------------- */

    if (sortedSequences.length > 0) {
      setSelectedSequenceId(
        sortedSequences[0].id
      );
    } else {
      setSelectedSequenceId("");

      if (selectedTerm) {
        setError(
          `No sequences are configured for ${selectedTerm.name}.`
        );
      }
    }

    setStudents([]);
    setLoadingSequences(false);
  }, [selectedTermId, terms]);

  /* =======================================================
     CLASSROOMS
  ======================================================= */

  const classrooms = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        sectionName?: string;
      }
    >();

    for (const assignment of assignments) {
      const classroomId =
        assignment.classroomId ||
        assignment.classroom?.id;

      if (!classroomId) {
        continue;
      }

      const classroomName =
        assignment.classroom?.name ||
        "Unnamed Classroom";

      const sectionName =
        assignment.classroom?.section?.name ||
        assignment.section?.name;

      if (!map.has(classroomId)) {
        map.set(classroomId, {
          id: classroomId,
          name: classroomName,
          sectionName,
        });
      }
    }

    return Array.from(map.values());
  }, [assignments]);

  /* =======================================================
     SUBJECTS FOR SELECTED CLASSROOM
  ======================================================= */

  const subjectsForSelectedClass =
    useMemo(() => {
      const map = new Map<
        string,
        {
          id: string;
          name: string;
          code?: string | null;
          coefficient?: number | null;
        }
      >();

      for (const assignment of assignments) {
        const classroomId =
          assignment.classroomId ||
          assignment.classroom?.id;

        if (
          classroomId !==
          selectedClassroomId
        ) {
          continue;
        }

        const subjectId =
          assignment.subjectId ||
          assignment.subject?.id;

        if (!subjectId) {
          continue;
        }

        if (!map.has(subjectId)) {
          map.set(subjectId, {
            id: subjectId,
            name:
              assignment.subject?.name ||
              "Unnamed Subject",
            code:
              assignment.subject?.code,
            coefficient:
              assignment.subject
                ?.coefficient,
          });
        }
      }

      return Array.from(map.values());
    }, [
      assignments,
      selectedClassroomId,
    ]);

  /* =======================================================
     SELECTED CLASSROOM
  ======================================================= */

  const selectedClassroom =
    useMemo(() => {
      return classrooms.find(
        (classroom) =>
          classroom.id ===
          selectedClassroomId
      );
    }, [
      classrooms,
      selectedClassroomId,
    ]);

  /* =======================================================
     SELECTED SUBJECT
  ======================================================= */

  const selectedSubject =
    useMemo(() => {
      return subjectsForSelectedClass.find(
        (subject) =>
          subject.id ===
          selectedSubjectId
      );
    }, [
      subjectsForSelectedClass,
      selectedSubjectId,
    ]);

  /* =======================================================
     SELECTED TERM
  ======================================================= */

  const selectedTerm =
    useMemo(() => {
      return terms.find(
        (term) =>
          term.id === selectedTermId
      );
    }, [
      terms,
      selectedTermId,
    ]);

  /* =======================================================
     SELECTED SEQUENCE
  ======================================================= */

  const selectedSequence =
    useMemo(() => {
      return sequences.find(
        (sequence) =>
          sequence.id ===
          selectedSequenceId
      );
    }, [
      sequences,
      selectedSequenceId,
    ]);

  /* =======================================================
     CLASSROOM CHANGE
  ======================================================= */

  function handleClassroomChange(
    classroomId: string
  ) {
    setSelectedClassroomId(
      classroomId
    );

    const firstAssignment =
      assignments.find(
        (assignment) => {
          const assignmentClassroomId =
            assignment.classroomId ||
            assignment.classroom?.id;

          return (
            assignmentClassroomId ===
            classroomId
          );
        }
      );

    const firstSubjectId =
      firstAssignment?.subjectId ||
      firstAssignment?.subject?.id ||
      "";

    setSelectedSubjectId(
      firstSubjectId
    );

    setStudents([]);
    setSuccess("");
    setError("");
  }

  /* =======================================================
     SUBJECT CHANGE
  ======================================================= */

  function handleSubjectChange(
    subjectId: string
  ) {
    setSelectedSubjectId(
      subjectId
    );

    setStudents([]);
    setSuccess("");
    setError("");
  }

  /* =======================================================
     TERM CHANGE
  ======================================================= */

  function handleTermChange(
    termId: string
  ) {
    console.log(
      "TERM CHANGED:",
      termId
    );

    setSelectedTermId(termId);

    /*
      The sequence effect will automatically
      find the sequences belonging to this term.
    */

    setSelectedSequenceId("");
    setStudents([]);
    setSuccess("");
    setError("");
  }

  /* =======================================================
     SEQUENCE CHANGE
  ======================================================= */

  function handleSequenceChange(
    sequenceId: string
  ) {
    console.log(
      "SEQUENCE CHANGED:",
      sequenceId
    );

    setSelectedSequenceId(
      sequenceId
    );

    setStudents([]);
    setSuccess("");
    setError("");
  }

  /* =======================================================
     LOAD MARKS
  ======================================================= */

  useEffect(() => {
    if (
      !selectedClassroomId ||
      !selectedSubjectId ||
      !selectedTermId ||
      !selectedSequenceId
    ) {
      setStudents([]);
      return;
    }

    const controller = new AbortController();

    loadMarks(controller.signal);

    return () => {
      controller.abort();
    };
  }, [
    selectedClassroomId,
    selectedSubjectId,
    selectedTermId,
    selectedSequenceId,
  ]);

  async function loadMarks(signal?: AbortSignal) {
    setLoadingMarks(true);
    setError("");

    try {
      const params =
        new URLSearchParams({
          classroomId:
            selectedClassroomId,
          subjectId:
            selectedSubjectId,
          termId:
            selectedTermId,
          sequenceId:
            selectedSequenceId,
        });

      const response = await fetch(
        `/api/teacher/marks?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal,
        }
      );

      const data: MarksResponse =
        await response.json();

      console.log(
        "MARKS API RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "Failed to load marks."
        );
      }

      const loadedStudents =
        Array.isArray(
          data.students
        )
          ? data.students
          : [];

      const loadedMarks =
        Array.isArray(data.marks)
          ? data.marks
          : [];

      /*
        Map existing marks by student.
      */

      const markMap =
        new Map<string, number>();

      for (const mark of loadedMarks) {
        markMap.set(
          mark.studentId,
          mark.score
        );
      }

      /*
        Add score to every student.
      */

      const rows: Student[] =
        loadedStudents.map(
          (student) => ({
            ...student,
            score: markMap.has(
              student.id
            )
              ? markMap.get(
                  student.id
                )!
              : "",
          })
        );

      setStudents(rows);
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "LOAD MARKS ERROR:",
        err
      );

      setStudents([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load marks."
      );
    } finally {
      setLoadingMarks(false);
    }
  }

  /* =======================================================
     UPDATE SCORE
  ======================================================= */

  function updateScore(
    studentId: string,
    value: string
  ) {
    /*
      Allow empty input.
    */

    if (value === "") {
      setStudents((previous) =>
        previous.map((student) =>
          student.id === studentId
            ? {
                ...student,
                score: "",
              }
            : student
        )
      );

      return;
    }

    const numericValue =
      Number(value);

    if (
      Number.isNaN(numericValue)
    ) {
      return;
    }

    /*
      Keep score between 0 and 20.
    */

    const boundedValue =
      Math.min(
        20,
        Math.max(
          0,
          numericValue
        )
      );

    setStudents((previous) =>
      previous.map((student) =>
        student.id === studentId
          ? {
              ...student,
              score:
                boundedValue,
            }
          : student
      )
    );
  }

  /* =======================================================
     SAVE MARKS
  ======================================================= */

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!selectedClassroomId) {
      setError(
        "Please select a classroom."
      );
      return;
    }

    if (!selectedSubjectId) {
      setError(
        "Please select a subject."
      );
      return;
    }

    if (!selectedTermId) {
      setError(
        "Please select a term."
      );
      return;
    }

    if (!selectedSequenceId) {
      setError(
        "Please select a sequence."
      );
      return;
    }

    if (students.length === 0) {
      setError(
        "There are no students to save."
      );
      return;
    }

    /*
      Validate every entered score.
    */

    for (const student of students) {
      if (student.score === "") {
        continue;
      }

      const numericScore =
        Number(student.score);

      if (
        Number.isNaN(
          numericScore
        ) ||
        numericScore < 0 ||
        numericScore > 20
      ) {
        setError(
          `Invalid score for ${student.firstName} ${student.lastName}. Score must be between 0 and 20.`
        );

        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        classroomId:
          selectedClassroomId,

        subjectId:
          selectedSubjectId,

        termId:
          selectedTermId,

        sequenceId:
          selectedSequenceId,

        students:
          students.map(
            (student) => ({
              studentId:
                student.id,

              score:
                student.score === ""
                  ? null
                  : Number(
                      student.score
                    ),
            })
          ),
      };

      console.log(
        "SAVE MARKS PAYLOAD:",
        payload
      );

      const response =
        await fetch(
          "/api/teacher/marks",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      console.log(
        "SAVE MARKS RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save marks."
        );
      }

      await loadMarks();
          setSuccess(data.message || "Marks saved successfully.");
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

  /* =======================================================
   GENERATE MARK SHEET
======================================================= */

     function handleGenerateMarkSheet() {
        setError("");
        setSuccess("");

        if (!selectedClassroomId) {
          setError("Please select a classroom.");
          return;
        }

        if (!selectedSubjectId) {
          setError("Please select a subject.");
          return;
        }

        if (!selectedTermId) {
          setError("Please select a term.");
          return;
        }

        if (!selectedSequenceId) {
          setError("Please select a sequence.");
          return;
        }

        if (students.length === 0) {
          setError("There are no students to generate a mark sheet.");
          return;
        }

        const params = new URLSearchParams({
          classroomId: selectedClassroomId,
          subjectId: selectedSubjectId,
          termId: selectedTermId,
          sequenceId: selectedSequenceId,
        });

        window.location.href =
          `/api/teacher/marks/mark-sheet?${params.toString()}`;
      }


  /* =======================================================
     FILTER STUDENTS
  ======================================================= */

  const filteredStudents =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return students;
      }

      return students.filter(
        (student) => {
          const fullName =
            `${student.firstName} ${student.lastName}`.toLowerCase();

          const matricule =
            student.matricule
              ?.toLowerCase() || "";

          return (
            fullName.includes(
              query
            ) ||
            matricule.includes(
              query
            )
          );
        }
      );
    }, [
      students,
      searchTerm,
    ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const enteredCount =
    useMemo(() => {
      return students.filter(
        (student) =>
          student.score !== ""
      ).length;
    }, [students]);

  const averageScore =
    useMemo(() => {
      const scoredStudents =
        students.filter(
          (student) =>
            student.score !== "" &&
            !Number.isNaN(
              Number(student.score)
            )
        );

      if (
        scoredStudents.length === 0
      ) {
        return null;
      }

      const total =
        scoredStudents.reduce(
          (sum, student) =>
            sum +
            Number(
              student.score
            ),
          0
        );

      return (
        total /
        scoredStudents.length
      ).toFixed(2);
    }, [students]);

  /* =======================================================
     REFRESH
  ======================================================= */

  async function handleRefresh() {
    setError("");
    setSuccess("");

    await loadAssignments();
    await loadTerms();
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <ClipboardList size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Enter Marks
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Record student scores by
                  subject, term and sequence.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loadingAssignments ||
              loadingTerms ||
              loadingMarks ||
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <RefreshCw
              size={16}
              className={
                loadingAssignments ||
                loadingTerms ||
                loadingMarks
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            <Check size={17} />
            {success}
          </div>
        )}

        {/* =================================================
            MARK SELECTION
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="mb-5 flex items-center gap-2">
            <BookOpen
              size={19}
              className="text-purple-600"
            />

            <h2 className="font-semibold">
              Mark Selection
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* =================================================
                CLASSROOM
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Classroom
              </label>

              <div className="relative">
                <select
                  value={
                    selectedClassroomId
                  }
                  onChange={(event) =>
                    handleClassroomChange(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingAssignments ||
                    classrooms.length === 0
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">
                    {loadingAssignments
                      ? "Loading classrooms..."
                      : classrooms.length === 0
                      ? "No classrooms"
                      : "Select classroom"}
                  </option>

                  {classrooms.map(
                    (classroom) => (
                      <option
                        key={
                          classroom.id
                        }
                        value={
                          classroom.id
                        }
                      >
                        {
                          classroom.name
                        }

                        {classroom.sectionName
                          ? ` - ${classroom.sectionName}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* =================================================
                SUBJECT
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Subject
              </label>

              <div className="relative">
                <select
                  value={
                    selectedSubjectId
                  }
                  onChange={(event) =>
                    handleSubjectChange(
                      event.target.value
                    )
                  }
                  disabled={
                    !selectedClassroomId ||
                    subjectsForSelectedClass.length ===
                      0
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">
                    {!selectedClassroomId
                      ? "Select classroom first"
                      : subjectsForSelectedClass.length ===
                        0
                      ? "No subjects assigned"
                      : "Select subject"}
                  </option>

                  {subjectsForSelectedClass.map(
                    (subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}

                        {subject.code
                          ? ` (${subject.code})`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* =================================================
                TERM
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Term
              </label>

              <div className="relative">
                <select
                  value={
                    selectedTermId
                  }
                  onChange={(event) =>
                    handleTermChange(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingTerms ||
                    terms.length === 0
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">
                    {loadingTerms
                      ? "Loading terms..."
                      : terms.length === 0
                      ? "No terms available"
                      : "Select term"}
                  </option>

                  {terms.map(
                    (term) => (
                      <option
                        key={term.id}
                        value={term.id}
                      >
                        {term.name}

                        {term.isCurrent
                          ? " • Current"
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* =================================================
                SEQUENCE
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Sequence
              </label>

              <div className="relative">
                <select
                  value={
                    selectedSequenceId
                  }
                  onChange={(event) =>
                    handleSequenceChange(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingSequences ||
                    !selectedTermId ||
                    sequences.length === 0
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">
                    {loadingSequences
                      ? "Loading sequences..."
                      : !selectedTermId
                      ? "Select a term first"
                      : sequences.length === 0
                      ? "No sequences available"
                      : "Select sequence"}
                  </option>

                  {sequences.map(
                    (sequence) => (
                      <option
                        key={sequence.id}
                        value={sequence.id}
                      >
                        {sequence.name}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              SELECTION SUMMARY
          ================================================= */}

          {(selectedClassroom ||
            selectedSubject ||
            selectedTerm ||
            selectedSequence) && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">

              {selectedClassroom && (
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  {
                    selectedClassroom.name
                  }
                </span>
              )}

              {selectedSubject && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {
                    selectedSubject.name
                  }
                </span>
              )}

              {selectedTerm && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                  {selectedTerm.name}
                </span>
              )}

              {selectedSequence && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  {
                    selectedSequence.name
                  }
                </span>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Students
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {students.length}
                </p>
              </div>

              <Users className="text-purple-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Marks Entered
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {enteredCount}

                  <span className="ml-1 text-sm font-normal text-gray-400">
                    / {students.length}
                  </span>
                </p>
              </div>

              <Check className="text-green-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Average
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {averageScore !== null
                    ? `${averageScore}/20`
                    : "—"}
                </p>
              </div>

              <BookOpen className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* =================================================
            MARKS TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="font-semibold">
                Student Marks
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter one score out of 20
                for each student.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              {/* SEARCH */}

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search student..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 sm:w-64 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              {/* SAVE */}

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  loadingMarks ||
                  students.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />

                    Save Marks
                  </>
                )}
              </button>

                {/* GENERATE MARK SHEET */}
             <button
                type="button"
                onClick={handleGenerateMarkSheet}
                disabled={
                  loadingMarks ||
                  students.length === 0 ||
                  !selectedClassroomId ||
                  !selectedSubjectId ||
                  !selectedTermId ||
                  !selectedSequenceId
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-900/50 dark:bg-gray-900 dark:text-purple-300 dark:hover:bg-purple-950/30"
              >
                <Download size={16} />
                Generate Mark Sheet
              </button>

            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loadingMarks && (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2
                  size={30}
                  className="animate-spin text-purple-600"
                />

                <p className="text-sm">
                  Loading students and marks...
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              EMPTY SELECTION
          ================================================= */}

          {!loadingMarks &&
            (!selectedClassroomId ||
              !selectedSubjectId ||
              !selectedTermId ||
              !selectedSequenceId) && (
              <div className="flex min-h-[250px] items-center justify-center px-6">
                <div className="text-center">
                  <ClipboardList
                    size={42}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <h3 className="font-semibold">
                    Select your mark settings
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-gray-500">
                    Choose a classroom,
                    subject, term and
                    sequence to load
                    the students.
                  </p>
                </div>
              </div>
            )}

          {/* =================================================
              NO STUDENTS
          ================================================= */}

          {!loadingMarks &&
            selectedClassroomId &&
            selectedSubjectId &&
            selectedTermId &&
            selectedSequenceId &&
            students.length === 0 && (
              <div className="flex min-h-[250px] items-center justify-center px-6">
                <div className="text-center">
                  <Users
                    size={42}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <h3 className="font-semibold">
                    No students found
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-gray-500">
                    There are currently no
                    students assigned to
                    this classroom.
                  </p>
                </div>
              </div>
            )}

          {/* =================================================
              TABLE
          ================================================= */}

          {!loadingMarks &&
            students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">

                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        #
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Matricule
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Student
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Score / 20
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                    {filteredStudents.map(
                      (
                        student,
                        index
                      ) => {
                        const hasScore =
                          student.score !== "";

                        return (
                          <tr
                            key={
                              student.id
                            }
                            className="transition hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                          >

                            <td className="px-5 py-4 text-sm text-gray-500">
                              {index + 1}
                            </td>

                            <td className="px-5 py-4 text-sm font-medium">
                              {student.matricule ||
                                "—"}
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-medium">
                                {
                                  student.firstName
                                }{" "}
                                {
                                  student.lastName
                                }
                              </div>

                              {student.gender && (
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {
                                    student.gender
                                  }
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <input
                                type="number"
                                min={0}
                                max={20}
                                step="0.01"
                                value={
                                  student.score
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateScore(
                                    student.id,
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="0 - 20"
                                className="w-28 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800"
                              />
                            </td>

                            <td className="px-5 py-4">
                              {hasScore ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
                                  <Check
                                    size={13}
                                  />

                                  Entered
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  Not entered
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>

                {/* SEARCH EMPTY */}

                {filteredStudents.length ===
                  0 &&
                  students.length > 0 && (
                    <div className="p-10 text-center text-sm text-gray-500">
                      No students match
                      your search.
                    </div>
                  )}
              </div>
            )}

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loadingMarks &&
            students.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm dark:border-gray-800 dark:bg-gray-800/40 md:flex-row md:items-center md:justify-between">

                <p className="text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {
                      filteredStudents.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {students.length}
                  </span>{" "}
                  students
                </p>

                <p className="text-gray-500">
                  Score range:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    0 – 20
                  </span>
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}