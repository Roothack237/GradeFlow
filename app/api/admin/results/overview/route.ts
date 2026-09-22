import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/results/overview
 *
 * Class and subject performance for a term or sequence.
 *
 * Current Mark model:
 *
 * - score
 * - studentId
 * - subjectId
 * - teacherId
 * - termId
 * - sequenceId
 *
 * Score scale: 0–20
 * Passing score: 10/20
 *
 * Query:
 * ?termId=
 * &sequenceId=
 * &classroomId=
 *
 * If neither termId nor sequenceId is supplied,
 * the current term is used.
 */

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    let termId = str(
      searchParams.get("termId")
    );

    const sequenceId = str(
      searchParams.get("sequenceId")
    );

    const classroomId = str(
      searchParams.get("classroomId")
    );

    // =========================================================
    // RESOLVE CURRENT TERM
    // =========================================================

    if (!termId && !sequenceId) {
      const currentTerm =
        await prisma.term.findFirst({
          where: {
            isCurrent: true,
          },

          select: {
            id: true,
          },
        });

      termId = currentTerm?.id ?? "";
    }

    // =========================================================
    // RESOLVE SEQUENCES
    // =========================================================

    let scopeSequenceIds: string[] = [];

    if (sequenceId) {
      const selectedSequence =
        await prisma.sequence.findUnique({
          where: {
            id: sequenceId,
          },

          select: {
            id: true,
            termId: true,
          },
        });

      if (!selectedSequence) {
        return NextResponse.json(
          {
            scope: {
              termId: termId || null,
              sequenceId,
              sequences: 0,
            },

            summary: {
              expected: 0,
              covered: 0,
              recorded: 0,
              missing: 0,
              completionRate: null,
              average: null,
              passRate: null,
              students: 0,
              classes: 0,
              subjects: 0,
            },

            classes: [],
            subjects: [],
            incomplete: [],
            incompleteTotal: 0,

            message:
              "Selected sequence was not found.",
          },
          {
            status: 404,
          }
        );
      }

      // Make sure the supplied term matches
      // the sequence's actual term.
      if (
        termId &&
        selectedSequence.termId !== termId
      ) {
        return NextResponse.json(
          {
            error:
              "The selected sequence does not belong to the selected term.",
          },
          {
            status: 400,
          }
        );
      }

      termId = selectedSequence.termId;

      scopeSequenceIds = [
        selectedSequence.id,
      ];
    } else if (termId) {
      const sequences =
        await prisma.sequence.findMany({
          where: {
            termId,
          },

          select: {
            id: true,
          },

          orderBy: {
            order: "asc",
          },
        });

      scopeSequenceIds = sequences.map(
        (sequence) => sequence.id
      );
    }

    // =========================================================
    // NO SEQUENCES
    // =========================================================

    if (!scopeSequenceIds.length) {
      return NextResponse.json({
        scope: {
          termId: termId || null,
          sequenceId: sequenceId || null,
          sequences: 0,
        },

        summary: {
          expected: 0,
          covered: 0,
          recorded: 0,
          missing: 0,
          completionRate: null,
          average: null,
          passRate: null,
          students: 0,
          classes: 0,
          subjects: 0,
        },

        classes: [],
        subjects: [],
        incomplete: [],
        incompleteTotal: 0,

        message:
          "No sequence found for this scope. Choose an academic term or sequence.",
      });
    }

    // =========================================================
    // LOAD CLASSES, STUDENTS, ASSIGNMENTS AND MARKS
    // =========================================================

    const [
      classrooms,
      students,
      assignments,
      marks,
    ] = await Promise.all([
      // -------------------------------------------------------
      // CLASSROOMS
      // -------------------------------------------------------

      prisma.classroom.findMany({
        where: classroomId
          ? {
              id: classroomId,
            }
          : {},

        select: {
          id: true,
          name: true,

          section: {
            select: {
              name: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      }),

      // -------------------------------------------------------
      // STUDENTS
      // -------------------------------------------------------

      prisma.student.findMany({
        where: classroomId
          ? {
              classroomId,
            }
          : {},

        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          classroomId: true,
        },

        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      }),

      // -------------------------------------------------------
      // TEACHER ASSIGNMENTS
      //
      // These determine which subjects are expected
      // for each class.
      // -------------------------------------------------------

      prisma.teacherAssignment.findMany({
        where: classroomId
          ? {
              classroomId,
            }
          : {},

        select: {
          classroomId: true,
          subjectId: true,
        },
      }),

      // -------------------------------------------------------
      // MARKS
      // -------------------------------------------------------

      prisma.mark.findMany({
        where: {
          sequenceId: {
            in: scopeSequenceIds,
          },

          ...(classroomId
            ? {
                student: {
                  classroomId,
                },
              }
            : {}),
        },

        select: {
          id: true,

          studentId: true,

          subjectId: true,

          teacherId: true,

          termId: true,

          sequenceId: true,

          score: true,

          sequence: {
            select: {
              id: true,
              name: true,
              order: true,
              termId: true,
            },
          },
        },
      }),
    ]);

    // =========================================================
    // SUBJECTS IN SCOPE
    // =========================================================

    const subjectIdsInScope =
      Array.from(
        new Set([
          ...marks.map(
            (mark) => mark.subjectId
          ),

          ...assignments.map(
            (assignment) =>
              assignment.subjectId
          ),
        ])
      );

    const subjects =
      subjectIdsInScope.length
        ? await prisma.subject.findMany({
            where: {
              id: {
                in: subjectIdsInScope,
              },
            },

            select: {
              id: true,
              name: true,
              code: true,
              coefficient: true,
            },

            orderBy: {
              name: "asc",
            },
          })
        : [];

    const subjectById = new Map(
      subjects.map((subject) => [
        subject.id,
        subject,
      ])
    );

    // =========================================================
    // STUDENTS BY CLASS
    // =========================================================

    const studentsByClass =
      new Map<
        string,
        typeof students
      >();

    for (const student of students) {
      if (!student.classroomId) {
        continue;
      }

      const list =
        studentsByClass.get(
          student.classroomId
        ) ?? [];

      list.push(student);

      studentsByClass.set(
        student.classroomId,
        list
      );
    }

    // =========================================================
    // QUICK STUDENT LOOKUP
    // =========================================================

    const studentById = new Map(
      students.map((student) => [
        student.id,
        student,
      ])
    );

    // =========================================================
    // CLASS + SUBJECT STATISTICS
    // =========================================================

    type ClassSubjectEntry = {
      total: number;
      count: number;
      passed: number;
      students: Set<string>;
    };

    const classSubjectStats =
      new Map<
        string,
        Map<string, ClassSubjectEntry>
      >();

    // =========================================================
    // SUBJECT STATISTICS
    // =========================================================

    type SubjectEntry = {
      total: number;
      count: number;
      passed: number;
      highest: number;
      lowest: number;
    };

    const subjectStats =
      new Map<
        string,
        SubjectEntry
      >();

    // =========================================================
    // GLOBAL STATISTICS
    // =========================================================

    let globalTotal = 0;
    let globalSum = 0;
    let globalPassed = 0;

    // =========================================================
    // PROCESS MARKS
    // =========================================================

    for (const mark of marks) {
      const student =
        studentById.get(
          mark.studentId
        );

      const classId =
        student?.classroomId;

      const score = mark.score;

      // -------------------------------------------------------
      // GLOBAL
      // -------------------------------------------------------

      globalTotal += 1;

      globalSum += score;

      if (score >= 10) {
        globalPassed += 1;
      }

      // -------------------------------------------------------
      // CLASS + SUBJECT
      // -------------------------------------------------------

      if (classId) {
        const perSubject =
          classSubjectStats.get(
            classId
          ) ??
          new Map<
            string,
            ClassSubjectEntry
          >();

        const entry =
          perSubject.get(
            mark.subjectId
          ) ?? {
            total: 0,
            count: 0,
            passed: 0,
            students:
              new Set<string>(),
          };

        entry.total += score;

        entry.count += 1;

        if (score >= 10) {
          entry.passed += 1;
        }

        entry.students.add(
          mark.studentId
        );

        perSubject.set(
          mark.subjectId,
          entry
        );

        classSubjectStats.set(
          classId,
          perSubject
        );
      }

      // -------------------------------------------------------
      // SUBJECT
      // -------------------------------------------------------

      const subjectEntry =
        subjectStats.get(
          mark.subjectId
        ) ?? {
          total: 0,
          count: 0,
          passed: 0,
          highest: score,
          lowest: score,
        };

      subjectEntry.total += score;

      subjectEntry.count += 1;

      if (score >= 10) {
        subjectEntry.passed += 1;
      }

      subjectEntry.highest =
        Math.max(
          subjectEntry.highest,
          score
        );

      subjectEntry.lowest =
        Math.min(
          subjectEntry.lowest,
          score
        );

      subjectStats.set(
        mark.subjectId,
        subjectEntry
      );
    }

    // =========================================================
    // EXPECTED SUBJECTS PER CLASS
    // =========================================================

    const expectedSubjectsByClass =
      new Map<
        string,
        Set<string>
      >();

    for (const assignment of assignments) {
      const set =
        expectedSubjectsByClass.get(
          assignment.classroomId
        ) ??
        new Set<string>();

      set.add(
        assignment.subjectId
      );

      expectedSubjectsByClass.set(
        assignment.classroomId,
        set
      );
    }

    // ---------------------------------------------------------
    // A SUBJECT THAT ALREADY HAS MARKS IS ALSO EXPECTED
    // ---------------------------------------------------------

    for (const [
      classId,
      perSubject,
    ] of classSubjectStats) {
      const set =
        expectedSubjectsByClass.get(
          classId
        ) ??
        new Set<string>();

      for (const subjectId of
        perSubject.keys()) {
        set.add(subjectId);
      }

      expectedSubjectsByClass.set(
        classId,
        set
      );
    }

    // =========================================================
    // INCOMPLETE RESULTS
    // =========================================================

    const incomplete: {
      classroomId: string;
      className: string;
      subjectId: string;
      subjectName: string;
      expected: number;
      recorded: number;
      missing: number;
      students: {
        id: string;
        name: string;
        matricule: string;
      }[];
    }[] = [];

    let expectedPairs = 0;
    let missingPairs = 0;

    for (const classroom of classrooms) {
      const classStudents =
        studentsByClass.get(
          classroom.id
        ) ?? [];

      const expectedSubjects =
        expectedSubjectsByClass.get(
          classroom.id
        ) ??
        new Set<string>();

      for (const subjectId of
        expectedSubjects) {
        expectedPairs +=
          classStudents.length;

        const recordedStudents =
          classSubjectStats
            .get(classroom.id)
            ?.get(subjectId)
            ?.students ??
          new Set<string>();

        const missingStudents =
          classStudents.filter(
            (student) =>
              !recordedStudents.has(
                student.id
              )
          );

        missingPairs +=
          missingStudents.length;

        if (
          missingStudents.length > 0
        ) {
          incomplete.push({
            classroomId:
              classroom.id,

            className:
              classroom.name,

            subjectId,

            subjectName:
              subjectById.get(
                subjectId
              )?.name ??
              "Unknown subject",

            expected:
              classStudents.length,

            recorded:
              recordedStudents.size,

            missing:
              missingStudents.length,

            students:
              missingStudents
                .slice(0, 10)
                .map(
                  (student) => ({
                    id: student.id,

                    name: `${student.firstName} ${student.lastName}`.trim(),

                    matricule:
                      student.matricule,
                  })
                ),
          });
        }
      }
    }

    // Largest missing first
    incomplete.sort(
      (a, b) =>
        b.missing - a.missing
    );

    // =========================================================
    // CLASS PERFORMANCE
    // =========================================================

    const classes =
      classrooms.map(
        (classroom) => {
          const classStudents =
            studentsByClass.get(
              classroom.id
            ) ?? [];

          const perSubject =
            classSubjectStats.get(
              classroom.id
            );

          const expectedSubjects =
            expectedSubjectsByClass.get(
              classroom.id
            ) ??
            new Set<string>();

          let total = 0;
          let sum = 0;
          let passed = 0;

          if (perSubject) {
            for (const entry of
              perSubject.values()) {
              total += entry.count;
              sum += entry.total;
              passed += entry.passed;
            }
          }

          const expected =
            classStudents.length *
            expectedSubjects.size;

          const recordedPairs =
            perSubject
              ? Array.from(
                  perSubject.values()
                ).reduce(
                  (
                    count,
                    entry
                  ) =>
                    count +
                    entry.students.size,
                  0
                )
              : 0;

          return {
            id: classroom.id,

            name: classroom.name,

            sectionName:
              classroom.section
                ?.name ?? null,

            students:
              classStudents.length,

            subjects:
              expectedSubjects.size,

            expected,

            recorded: total,

            covered:
              recordedPairs,

            missing: Math.max(
              0,
              expected -
                recordedPairs
            ),

            average: total
              ? Math.round(
                  (sum / total) *
                    100
                ) / 100
              : null,

            passRate: total
              ? Math.round(
                  (passed / total) *
                    1000
                ) / 10
              : null,

            completion: expected
              ? Math.round(
                  (recordedPairs /
                    expected) *
                    1000
                ) / 10
              : null,
          };
        }
      );

    // =========================================================
    // SUBJECT PERFORMANCE
    // =========================================================

    const subjectResults =
      subjects.map(
        (subject) => {
          const entry =
            subjectStats.get(
              subject.id
            );

          // -----------------------------------------------------
          // Expected students for this subject
          // -----------------------------------------------------

          const expected =
            classrooms.reduce(
              (
                count,
                classroom
              ) => {
                const expectedSubjects =
                  expectedSubjectsByClass.get(
                    classroom.id
                  ) ??
                  new Set<string>();

                if (
                  expectedSubjects.has(
                    subject.id
                  )
                ) {
                  return (
                    count +
                    (
                      studentsByClass.get(
                        classroom.id
                      )?.length ??
                      0
                    )
                  );
                }

                return count;
              },
              0
            );

          // -----------------------------------------------------
          // Students who have at least one mark
          // -----------------------------------------------------

          const covered =
            Array.from(
              classSubjectStats.values()
            ).reduce(
              (
                count,
                perSubject
              ) =>
                count +
                (
                  perSubject.get(
                    subject.id
                  )?.students
                    .size ?? 0
                ),
              0
            );

          return {
            id: subject.id,

            name: subject.name,

            code: subject.code,

            coefficient:
              subject.coefficient,

            recorded:
              entry?.count ?? 0,

            expected,

            covered,

            missing: Math.max(
              0,
              expected - covered
            ),

            average: entry?.count
              ? Math.round(
                  (entry.total /
                    entry.count) *
                    100
                ) / 100
              : null,

            passRate: entry?.count
              ? Math.round(
                  (entry.passed /
                    entry.count) *
                    1000
                ) / 10
              : null,

            highest:
              entry?.highest ??
              null,

            lowest:
              entry?.lowest ??
              null,
          };
        }
      );

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json({
      scope: {
        termId:
          termId || null,

        sequenceId:
          sequenceId || null,

        sequences:
          scopeSequenceIds.length,
      },

      summary: {
        expected:
          expectedPairs,

        covered:
          expectedPairs -
          missingPairs,

        recorded:
          globalTotal,

        missing:
          missingPairs,

        completionRate:
          expectedPairs
            ? Math.round(
                ((expectedPairs -
                  missingPairs) /
                  expectedPairs) *
                  1000
              ) / 10
            : null,

        average:
          globalTotal
            ? Math.round(
                (globalSum /
                  globalTotal) *
                  100
              ) / 100
            : null,

        passRate:
          globalTotal
            ? Math.round(
                (globalPassed /
                  globalTotal) *
                  1000
              ) / 10
            : null,

        students:
          students.length,

        classes:
          classrooms.length,

        subjects:
          subjects.length,
      },

      classes,

      subjects:
        subjectResults,

      incomplete,

      incompleteTotal:
        missingPairs,
    });
  } catch (error) {
    console.error(
      "ADMIN RESULTS OVERVIEW ERROR:",
      error
    );

    return serverError(
      "ADMIN RESULTS OVERVIEW ERROR",
      error
    );
  }
}