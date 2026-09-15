import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireParentChild } from "@/lib/parent-child";
import { PASS_MARK, gradeOf, round2 } from "@/lib/grading";

/**
 * GET /api/parent/results?studentId=
 *
 * The child's marks grouped by term and sequence, with the publication
 * state of each term's results. A term whose results have not been
 * published by the administration is returned with its publication status
 * so the page can show a "pending publication" notice instead of raw marks.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const studentId = searchParams.get("studentId")?.trim() || "";

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required." },
        { status: 400 }
      );
    }

    const guard = await requireParentChild(studentId);
    if (!guard.ok) return guard.response;

    const { student } = guard;

    const [terms, marks, publications, reportCards] = await Promise.all([
      prisma.term.findMany({
        where: { academicYear: { classrooms: { some: { id: student.classroomId } } } },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          academicYear: { select: { id: true, name: true } },
          sequences: { orderBy: { order: "asc" }, select: { id: true, name: true, order: true } },
        },
      }),
      prisma.mark.findMany({
        where: { studentId },
        include: {
          subject: { select: { name: true, coefficient: true } },
          teacher: { select: { fullName: true } },
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
      prisma.resultPublication.findMany({
        where: { classroomId: student.classroomId },
        select: { termId: true, status: true, publishedAt: true },
      }),
      prisma.reportCard.findMany({
        where: { studentId },
        include: { term: { select: { name: true, academicYear: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const publicationByTerm = new Map(publications.map((p) => [p.termId, p]));

    const termResults = terms.map((term) => {
      const publication = publicationByTerm.get(term.id) ?? null;
      const published = publication?.status === "PUBLISHED";

      const termMarks = marks.filter(
        (mark) => mark.sequence.termId === term.id
      );

      const sequences = term.sequences.map((sequence) => {
        const sequenceMarks = termMarks.filter(
          (mark) => mark.sequence.id === sequence.id
        );

        const subjects = sequenceMarks
          .map((mark) => ({
            subject: mark.subject.name,
            coefficient: mark.subject.coefficient,
            teacher: mark.teacher.fullName,
            ca1: mark.ca1,
            ca2: mark.ca2,
            exam: mark.exam,
            average: mark.average,
            grade: mark.grade ?? gradeOf(mark.average),
            remark: mark.remark,
            passed: mark.average >= PASS_MARK,
          }))
          .sort((a, b) => a.subject.localeCompare(b.subject));

        return {
          id: sequence.id,
          name: sequence.name,
          subjects,
          average: sequenceMarks.length
            ? round2(
                sequenceMarks.reduce((total, mark) => total + mark.average, 0) /
                  sequenceMarks.length
              )
            : null,
          marks: sequenceMarks.length,
        };
      });

      return {
        id: term.id,
        name: term.name,
        academicYear: term.academicYear.name,
        sequences,
        marks: termMarks.length,
        average: termMarks.length
          ? round2(
              termMarks.reduce((total, mark) => total + mark.average, 0) /
                termMarks.length
            )
          : null,
        publication: publication
          ? { status: publication.status, publishedAt: publication.publishedAt }
          : { status: "NOT_PUBLISHED", publishedAt: null },
        published,
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule,
        class: student.classroom?.name ?? null,
        section: student.classroom?.section.name ?? null,
      },
      terms: termResults,
      reportCards: reportCards.map((card) => ({
        id: card.id,
        term: `${card.term.academicYear.name} · ${card.term.name}`,
        average: card.average,
        rank: card.rank,
        decision: card.decision,
        principalRemark: card.principalRemark,
        createdAt: card.createdAt,
      })),
      scale: { maxMark: 20, passMark: PASS_MARK },
    });
  } catch (error) {
    console.error("PARENT RESULTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the results." },
      { status: 500 }
    );
  }
}
