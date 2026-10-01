
import prisma from "@/lib/prisma";

import {
  gradeOf,
  remarkOf,
  decisionOf,
  round2,
} from "@/lib/grading";

import {
  isInactive,
  statusLabel,
} from "@/lib/student-status";

/**
 * =========================================================
 * SCHOOL PROFILE
 * =========================================================
 */

export const SCHOOL_PROFILE = {
  name: process.env.SCHOOL_NAME ?? "GradeFlow Secondary School",
  motto: process.env.SCHOOL_MOTTO ?? "",
  address: process.env.SCHOOL_ADDRESS ?? "",
  phone: process.env.SCHOOL_PHONE ?? "",
  email: process.env.SCHOOL_EMAIL ?? "",
  ministry: process.env.SCHOOL_MINISTRY ?? "",
  principalName: process.env.SCHOOL_PRINCIPAL_NAME ?? "",
  academicMasterName:
    process.env.SCHOOL_ACADEMIC_MASTER_NAME ?? "",
  logoPath: "public/images/logo.png",
};

/**
 * =========================================================
 * TYPES
 * =========================================================
 *
 * Current Mark model:
 *
 * Mark {
 *   id
 *   studentId
 *   subjectId
 *   teacherId
 *   termId
 *   sequenceId
 *   score
 * }
 */

export type SequenceMark = {
  sequenceId: string;
  sequenceName: string;
  order: number;

  /**
   * Actual score stored in Mark.score.
   */
  score: number | null;

  /**
   * Compatibility with the existing PDF renderer.
   *
   * For the current schema:
   * average === score
   */
  average: number | null;

  grade: string | null;
  remark: string | null;
};

export type SubjectLine = {
  subjectId: string;
  subject: string;
  code: string;
  coefficient: number;
  teacher: string | null;
  sequences: SequenceMark[];

  /**
   * Average of the available sequence scores.
   */
  average: number | null;

  /**
   * average × coefficient
   */
  points: number | null;

  grade: string | null;
  remark: string | null;
};

export type AttendanceSummary = {
  PRESENT: number;
  ABSENT: number;
  EXCUSED: number;
  total: number;
  rate: number | null;
  absentHours: number;
};

export type ReportCardData = {
  student: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    status: string;
    statusLabel: string;
    enrolled: boolean;
    parentName: string | null;
    parentPhone: string | null;
  };

  classroom: {
    id: string;
    name: string;
    sectionName: string | null;
    academicYearId: string;
    academicYearName: string;
  };

  term: {
    id: string;
    name: string;
    order: number;
  };

  sequences: {
    id: string;
    name: string;
    order: number;
  }[];

  subjects: SubjectLine[];

  totals: {
    coefficients: number;
    points: number;
    average: number | null;
    grade: string | null;
  };

  class: {
    size: number;
    ranked: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    position: number | null;
  };

  attendance: AttendanceSummary;

  marks: {
    expected: number;
    recorded: number;
    missing: number;
    complete: boolean;
  };

  decision: string | null;
  principalRemark: string | null;
  classTeacherRemark: string | null;

  reportCardId: string | null;
  pdfUrl: string | null;

  publication: {
    termStatus: string | null;
    published: boolean;
  };

  generatedAt: string;
};

export type BuildReportCardsOptions = {
  termId: string;
  classroomId?: string | null;
  sequenceId?: string | null;

  /**
   * Include suspended/dismissed students.
   *
   * Defaults to false.
   */
  includeInactive?: boolean;
};

/**
 * =========================================================
 * RE-EXPORT GRADING HELPERS
 * =========================================================
 */

export { remarkOf, decisionOf };

/**
 * =========================================================
 * BUILD TERM REPORT CARDS
 * =========================================================
 */

export async function buildTermReportCards(
  options: BuildReportCardsOptions
): Promise<{
  cards: ReportCardData[];
  term: {
    id: string;
    name: string;
  } | null;
}> {
  const {
    termId,
    classroomId,
    sequenceId,
    includeInactive = false,
  } = options;

  /**
   * -------------------------------------------------------
   * 1. LOAD TERM
   * -------------------------------------------------------
   */

  const term = await prisma.term.findUnique({
    where: {
      id: termId,
    },

    select: {
      id: true,
      name: true,
      order: true,

      academicYear: {
        select: {
          id: true,
          name: true,
        },
      },

      sequences: {
        orderBy: {
          order: "asc",
        },

        select: {
          id: true,
          name: true,
          order: true,
        },
      },
    },
  });

  if (!term) {
    return {
      cards: [],
      term: null,
    };
  }

  /**
   * All sequences belonging to the selected term.
   *
   * Term 1:
   * First Sequence + Second Sequence
   *
   * Term 2:
   * Third Sequence + Fourth Sequence
   *
   * Term 3:
   * Fifth Sequence + Sixth Sequence
   */

  const selectedSequences = sequenceId
    ? term.sequences.filter((sequence) => sequence.id === sequenceId)
    : term.sequences;

  const sequenceIds = selectedSequences.map(
    (sequence) => sequence.id
  );

  /**
   * If the term has no sequences, there cannot be marks.
   */

  if (!sequenceIds.length) {
    return {
      cards: [],
      term: {
        id: term.id,
        name: term.name,
      },
    };
  }

  /**
   * -------------------------------------------------------
   * 2. LOAD CLASSROOMS + STUDENTS + ASSIGNMENTS
   * -------------------------------------------------------
   */

  const classrooms = await prisma.classroom.findMany({
    where: classroomId
      ? {
          id: classroomId,
          academicYearId: term.academicYear.id,
        }
      : {
          academicYearId: term.academicYear.id,
        },

    select: {
      id: true,
      name: true,
      academicYearId: true,

      section: {
        select: {
          name: true,
        },
      },

      students: {
        where: includeInactive
          ? {}
          : {
              status: {
                not: "DISMISSED",
              },
            },

        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          status: true,
          createdAt: true,

          parent: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },

        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      },

      assignments: {
        select: {
          subjectId: true,

          teacher: {
            select: {
              fullName: true,
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              coefficient: true,
            },
          },
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });

  if (!classrooms.length) {
    return {
      cards: [],
      term: {
        id: term.id,
        name: term.name,
      },
    };
  }

  const classroomIds = classrooms.map(
    (classroom) => classroom.id
  );

  const studentIds = classrooms.flatMap(
    (classroom) =>
      classroom.students.map(
        (student) => student.id
      )
  );

  if (!studentIds.length) {
    return {
      cards: [],
      term: {
        id: term.id,
        name: term.name,
      },
    };
  }

  /**
   * -------------------------------------------------------
   * 3. LOAD MARKS / SUBJECTS / ATTENDANCE /
   *    REPORT CARDS / PUBLICATION
   * -------------------------------------------------------
   */

  const [
    marks,
    subjects,
    attendanceGroups,
    existingCards,
    termPublications,
  ] = await Promise.all([
    /**
     * MARKS
     */
    prisma.mark.findMany({
      where: {
        termId: term.id,

        sequenceId: {
          in: sequenceIds,
        },

        studentId: {
          in: studentIds,
        },
      },

      select: {
        id: true,
        studentId: true,
        subjectId: true,
        teacherId: true,
        termId: true,
        sequenceId: true,
        score: true,

        teacher: {
          select: {
            fullName: true,
          },
        },
      },
    }),

    /**
     * SUBJECTS
     */
    prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        coefficient: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    /**
     * ATTENDANCE
     *
     * LATE has been completely removed.
     */
    prisma.attendance.groupBy({
      by: [
        "studentId",
        "status",
      ],

      where: {
        sequenceId: {
          in: sequenceIds,
        },

        studentId: {
          in: studentIds,
        },
      },

      _count: {
        _all: true,
      },
    }),

    /**
     * EXISTING REPORT CARDS
     */
    prisma.reportCard.findMany({
      where: {
        termId,

        studentId: {
          in: studentIds,
        },
      },

      select: {
        id: true,
        studentId: true,
        average: true,
        position: true,
        decision: true,
        principalRemark: true,
        pdfUrl: true,
      },
    }),

    /**
     * PUBLICATION STATUS
     */
    prisma.resultPublication.findMany({
      where: {
        termId,

        classroomId: {
          in: classroomIds,
        },
      },

      select: {
        classroomId: true,
        status: true,
      },
    }),
  ]);

  /**
   * -------------------------------------------------------
   * 4. INDEX DATA
   * -------------------------------------------------------
   */

  const subjectById = new Map(
    subjects.map(
      (subject) => [
        subject.id,
        subject,
      ]
    )
  );

  const cardByStudent = new Map(
    existingCards.map(
      (card) => [
        card.studentId,
        card,
      ]
    )
  );

  const publicationByClass = new Map(
    termPublications.map(
      (publication) => [
        publication.classroomId,
        publication.status,
      ]
    )
  );

  /**
   * -------------------------------------------------------
   * MARKS INDEX
   * -------------------------------------------------------
   *
   * student
   *   ↓
   * subject
   *   ↓
   * sequence
   * -------------------------------------------------------
   */

  type MarkRow = (typeof marks)[number];

  const marksByStudent = new Map<
    string,
    Map<string, Map<string, MarkRow>>
  >();

  for (const mark of marks) {
    let perSubject =
      marksByStudent.get(
        mark.studentId
      );

    if (!perSubject) {
      perSubject = new Map();
      marksByStudent.set(
        mark.studentId,
        perSubject
      );
    }

    let perSequence =
      perSubject.get(
        mark.subjectId
      );

    if (!perSequence) {
      perSequence = new Map();

      perSubject.set(
        mark.subjectId,
        perSequence
      );
    }

    perSequence.set(
      mark.sequenceId,
      mark
    );
  }

  /**
   * -------------------------------------------------------
   * ATTENDANCE INDEX
   * -------------------------------------------------------
   */

  const attendanceByStudent =
    new Map<string, AttendanceSummary>();

  for (const row of attendanceGroups) {
    const entry =
      attendanceByStudent.get(
        row.studentId
      ) ?? emptyAttendance();

    const status =
      row.status as keyof AttendanceSummary;

    if (
      status === "PRESENT" ||
      status === "ABSENT" ||
      status === "EXCUSED"
    ) {
      entry[status] += row._count._all;
    }

    attendanceByStudent.set(
      row.studentId,
      entry
    );
  }

  /**
   * -------------------------------------------------------
   * 5. BUILD ONE REPORT CARD PER STUDENT
   * -------------------------------------------------------
   */

  const cards: ReportCardData[] = [];

  for (const classroom of classrooms) {
    /**
     * SUBJECT ASSIGNMENTS FOR THIS CLASS
     */

    const assignmentSubjects =
      new Map<
        string,
        {
          subject: (typeof subjects)[number];
          teacher: string | null;
        }
      >();

    for (const assignment of classroom.assignments) {
      if (
        !assignmentSubjects.has(
          assignment.subjectId
        )
      ) {
        assignmentSubjects.set(
          assignment.subjectId,
          {
            subject:
              subjectById.get(
                assignment.subjectId
              ) ??
              assignment.subject,

            teacher:
              assignment.teacher?.fullName ??
              null,
          }
        );
      }
    }

    /**
     * STUDENTS USED FOR CLASS RANKING
     */

    const ranked: {
      studentId: string;
      average: number;
    }[] = [];

    const built: ReportCardData[] = [];

    /**
     * EACH STUDENT
     */

    for (const student of classroom.students) {
      const perSubject =
        marksByStudent.get(
          student.id
        ) ??
        new Map<
          string,
          Map<string, MarkRow>
        >();

      /**
       * SUBJECT IDS
       *
       * Include:
       * 1. Subjects assigned to the classroom
       * 2. Subjects for which this student has marks
       */

      const subjectIds =
        new Set<string>([
          ...assignmentSubjects.keys(),
          ...perSubject.keys(),
        ]);

      const lines: SubjectLine[] = [];

      /**
       * EACH SUBJECT
       */

      for (const subjectId of subjectIds) {
        const info =
          assignmentSubjects.get(
            subjectId
          ) ??
          (() => {
            const subject =
              subjectById.get(
                subjectId
              );

            if (!subject) {
              return null;
            }

            return {
              subject,
              teacher: null as string | null,
            };
          })();

        if (!info) {
          continue;
        }

        const perSequence =
          perSubject.get(
            subjectId
          ) ??
          new Map<string, MarkRow>();

        /**
         * BUILD SEQUENCE MARKS
         */

        const sequenceMarks: SequenceMark[] =
          selectedSequences.map(
            (sequence) => {
              const mark =
                perSequence.get(
                  sequence.id
                );

              const score =
                mark?.score ?? null;

              return {
                sequenceId:
                  sequence.id,

                sequenceName:
                  sequence.name,

                order:
                  sequence.order,

                score,

                average: score,

                grade:
                  score === null
                    ? null
                    : gradeOf(score),

                remark:
                  score === null
                    ? null
                    : remarkOf(score),
              };
            }
          );

        /**
         * AVAILABLE SCORES
         */

        const recorded =
          sequenceMarks.filter(
            (entry) =>
              entry.score !== null
          );

        /**
         * SUBJECT AVERAGE
         */

        const average =
          recorded.length > 0
            ? round2(
                recorded.reduce(
                  (sum, entry) =>
                    sum +
                    (entry.score ?? 0),
                  0
                ) /
                  recorded.length
              )
            : null;

        /**
         * TEACHER
         */

        const teacherName =
          info.teacher ??
          Array.from(
            perSequence.values()
          ).find(
            (entry) =>
              entry.teacher?.fullName
          )?.teacher?.fullName ??
          null;

        /**
         * SUBJECT LINE
         */

        const coefficient =
          Number(
            info.subject.coefficient ?? 1
          );

        lines.push({
          subjectId,

          subject:
            info.subject.name,

          code:
            info.subject.code,

          coefficient,

          teacher:
            teacherName,

          sequences:
            sequenceMarks,

          average,

          points:
            average === null
              ? null
              : round2(
                  average *
                    coefficient
                ),

          grade:
            average === null
              ? null
              : gradeOf(average),

          remark:
            average === null
              ? null
              : remarkOf(average),
        });
      }

      /**
       * Sort subjects alphabetically.
       */

      lines.sort(
        (a, b) =>
          a.subject.localeCompare(
            b.subject
          )
      );

      /**
       * Only subjects with marks contribute
       * to the term average.
       */

      const scored =
        lines.filter(
          (line) =>
            line.average !== null
        );

      /**
       * TERM WEIGHTED AVERAGE
       *
       * Σ(subject average × coefficient)
       * ---------------------------------
       * Σ(coefficients)
       */

      const coefficients =
        scored.reduce(
          (sum, line) =>
            sum +
            Number(
              line.coefficient ?? 1
            ),
          0
        );

      const points =
        round2(
          scored.reduce(
            (sum, line) =>
              sum +
              (line.points ?? 0),
            0
          )
        );

      const termAverage =
        coefficients > 0
          ? round2(
              points /
                coefficients
            )
          : null;

      /**
       * MARK COMPLETION
       */

      const studentMarks =
        marks.filter(
          (mark) =>
            mark.studentId ===
              student.id &&
            mark.termId ===
              term.id &&
            sequenceIds.includes(
              mark.sequenceId
            )
        );

      const recordedMarks =
        studentMarks.length;

      const expected =
        subjectIds.size *
        selectedSequences.length;

      const missing =
        Math.max(
          0,
          expected -
            recordedMarks
        );

      const attendance =
        finaliseAttendance(
          attendanceByStudent.get(
            student.id
          ) ??
            emptyAttendance()
        );

      const storedCard =
        cardByStudent.get(
          student.id
        ) ?? null;

      /**
       * BUILD REPORT CARD
       */

      const card: ReportCardData = {
        student: {
          id:
            student.id,

          matricule:
            student.matricule,

          firstName:
            student.firstName,

          lastName:
            student.lastName,

          fullName:
            `${student.firstName} ${student.lastName}`.trim(),

          gender:
            student.gender,

          dateOfBirth:
            student.dateOfBirth
              ? student.dateOfBirth.toISOString()
              : "",

          status:
            student.status,

          statusLabel:
            statusLabel(
              student.status
            ),

          enrolled:
            student.status ===
            "ACTIVE",

          parentName:
            student.parent
              ?.fullName ??
            null,

          parentPhone:
            student.parent
              ?.phone ??
            null,
        },

        classroom: {
          id:
            classroom.id,

          name:
            classroom.name,

          sectionName:
            classroom.section
              ?.name ??
            null,

          academicYearId:
            classroom.academicYearId,

          academicYearName:
            term.academicYear.name,
        },

        term: {
          id:
            term.id,

          name:
            term.name,

          order:
            term.order,
        },

        sequences:
          selectedSequences,

        subjects:
          lines,

        totals: {
          coefficients,

          points,

          average:
            termAverage,

          grade:
            termAverage === null
              ? null
              : gradeOf(
                  termAverage
                ),
        },

        class: {
          size:
            classroom.students
              .length,

          ranked: 0,

          average: null,

          highest: null,

          lowest: null,

          position: null,
        },

        attendance,

        marks: {
          expected,

          recorded:
            recordedMarks,

          missing,

          complete:
            recordedMarks >=
              expected &&
            expected > 0,
        },

        decision:
          storedCard?.decision ??
          decisionOf(
            termAverage
          ),

        principalRemark:
          storedCard
            ?.principalRemark ??
          null,

        classTeacherRemark:
          remarkOf(
            termAverage
          ),

        reportCardId:
          storedCard?.id ??
          null,

        pdfUrl:
          storedCard?.pdfUrl ??
          null,

        publication: {
          termStatus:
            publicationByClass.get(
              classroom.id
            ) ?? null,

          published:
            publicationByClass.get(
              classroom.id
            ) ===
            "PUBLISHED",
        },

        generatedAt:
          new Date().toISOString(),
      };

      /**
       * Student participates in ranking
       * only when a term average exists.
       */

      if (
        termAverage !== null
      ) {
        ranked.push({
          studentId:
            student.id,

          average:
            termAverage,
        });
      }

      built.push(card);
    }

    /**
     * -----------------------------------------------------
     * 6. CLASS RANKING
     * -----------------------------------------------------
     *
     * Equal averages receive the same position.
     *
     * Example:
     *
     * 18 → 1
     * 18 → 1
     * 16 → 3
     */

    ranked.sort(
      (a, b) =>
        b.average -
        a.average
    );

    const averages =
      ranked.map(
        (entry) =>
          entry.average
      );

    const classAverage =
      averages.length > 0
        ? round2(
            averages.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
              averages.length
          )
        : null;

    for (const card of built) {
      const studentAverage =
        card.totals.average;

      const position =
        studentAverage === null
          ? null
          : ranked.filter(
              (entry) =>
                entry.average >
                studentAverage
            ).length + 1;

      card.class = {
        size:
          classroom.students.length,

        ranked:
          ranked.length,

        average:
          classAverage,

        highest:
          averages.length > 0
            ? Math.max(
                ...averages
              )
            : null,

        lowest:
          averages.length > 0
            ? Math.min(
                ...averages
              )
            : null,

        position,
      };

      cards.push(card);
    }
  }

  /**
   * -------------------------------------------------------
   * 7. RETURN
   * -------------------------------------------------------
   */

  return {
    cards,

    term: {
      id:
        term.id,

      name:
        term.name,
    },
  };
}

/**
 * =========================================================
 * ATTENDANCE HELPERS
 * =========================================================
 */

function emptyAttendance(): AttendanceSummary {
  return {
    PRESENT: 0,
    ABSENT: 0,
    EXCUSED: 0,
    total: 0,
    rate: null,
    absentHours: 0,
  };
}

/**
 * Fills derived attendance fields.
 */

export function finaliseAttendance(
  summary: AttendanceSummary
): AttendanceSummary {
  const total =
    summary.PRESENT +
    summary.ABSENT +
    summary.EXCUSED;

  return {
    ...summary,

    total,

    rate:
      total > 0
        ? round2(
            (summary.PRESENT /
              total) *
              100
          )
        : null,

    absentHours:
      summary.ABSENT,
  };
}

export { isInactive };
