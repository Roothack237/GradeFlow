import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        {
          error: "Only teachers can generate mark sheets.",
        },
        {
          status: 403,
        }
      );
    }

    // =========================================================
    // 2. GET TEACHER
    // =========================================================

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          error: "Teacher profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================================
    // 3. GET PARAMETERS
    // =========================================================

    const { searchParams } = new URL(request.url);

    const classroomId = searchParams.get("classroomId");
    const subjectId = searchParams.get("subjectId");
    const termId = searchParams.get("termId");
    const sequenceId = searchParams.get("sequenceId");

    if (!classroomId || !subjectId || !termId || !sequenceId) {
      return NextResponse.json(
        {
          error:
            "classroomId, subjectId, termId and sequenceId are required.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // 4. VERIFY TEACHER ASSIGNMENT
    // =========================================================

    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classroomId,
        subjectId,
      },
      include: {
        classroom: {
          include: {
            academicYear: true,
          },
        },
        subject: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this classroom and subject.",
        },
        {
          status: 403,
        }
      );
    }

    // =========================================================
    // 5. VERIFY TERM
    // =========================================================

    const term = await prisma.term.findUnique({
      where: {
        id: termId,
      },
    });

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================================
    // 6. VERIFY SEQUENCE
    // =========================================================

    const sequence = await prisma.sequence.findUnique({
      where: {
        id: sequenceId,
      },
    });

    if (!sequence) {
      return NextResponse.json(
        {
          error: "Sequence not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (sequence.termId !== termId) {
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

    // =========================================================
    // 7. GET STUDENTS
    // =========================================================

    const students = await prisma.student.findMany({
      where: {
        classroomId,
      },
      select: {
        id: true,
        matricule: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    });

    // =========================================================
    // 8. GET MARKS
    // =========================================================

    const studentIds = students.map((student) => student.id);

    const marks =
      studentIds.length > 0
        ? await prisma.mark.findMany({
            where: {
              subjectId,
              termId,
              sequenceId,
              studentId: {
                in: studentIds,
              },
            },
            select: {
              studentId: true,
              score: true,
            },
          })
        : [];

    // =========================================================
    // 9. CREATE MARK LOOKUP
    // =========================================================

    const markMap = new Map<string, number>();

    for (const mark of marks) {
      markMap.set(mark.studentId, mark.score);
    }

    // =========================================================
    // 10. CREATE PDF
    // =========================================================

    const pdfDoc = await PDFDocument.create();

    const regularFont = await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

    const boldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

    // Landscape A4
    const pageWidth = 841.89;
    const pageHeight = 595.28;

    let page = pdfDoc.addPage([
      pageWidth,
      pageHeight,
    ]);

    const margin = 40;

    // =========================================================
    // HELPER FUNCTIONS
    // =========================================================

    function drawHeader() {
      const centerX = pageWidth / 2;

      page.drawText(
        "ALL NATIONS SECONDARY SCHOOL",
        {
          x:
            centerX -
            boldFont.widthOfTextAtSize(
              "ALL NATIONS SECONDARY SCHOOL",
              18
            ) /
              2,
          y: 545,
          size: 18,
          font: boldFont,
          color: rgb(0.25, 0.1, 0.5),
        }
      );

      page.drawText(
        "MARK SHEET",
        {
          x:
            centerX -
            boldFont.widthOfTextAtSize(
              "MARK SHEET",
              15
            ) /
              2,
          y: 518,
          size: 15,
          font: boldFont,
        }
      );

      page.drawText(
        `Academic Year: ${assignment.classroom.academicYear.name}`,
        {
          x: margin,
          y: 485,
          size: 10,
          font: regularFont,
        }
      );

      page.drawText(
        `Class: ${assignment.classroom.name}`,
        {
          x: 300,
          y: 485,
          size: 10,
          font: regularFont,
        }
      );

      page.drawText(
        `Subject: ${assignment.subject.name}`,
        {
          x: 500,
          y: 485,
          size: 10,
          font: regularFont,
        }
      );

      page.drawText(
        `Code: ${assignment.subject.code}`,
        {
          x: 700,
          y: 485,
          size: 10,
          font: regularFont,
        }
      );

      page.drawText(
        `Term: ${term.name}`,
        {
          x: margin,
          y: 465,
          size: 10,
          font: regularFont,
        }
      );

      page.drawText(
        `Sequence: ${sequence.name}`,
        {
          x: 300,
          y: 465,
          size: 10,
          font: regularFont,
        }
      );

      // Horizontal line
      page.drawLine({
        start: {
          x: margin,
          y: 450,
        },
        end: {
          x: pageWidth - margin,
          y: 450,
        },
        thickness: 1,
      });
    }

    function drawTableHeader(y: number) {
      const columns = [
        {
          title: "No.",
          x: margin,
          width: 45,
        },
        {
          title: "MATRICULE",
          x: margin + 45,
          width: 130,
        },
        {
          title: "STUDENT NAME",
          x: margin + 175,
          width: 330,
        },
        {
          title: "SCORE / 20",
          x: margin + 505,
          width: 100,
        },
        {
          title: "STATUS",
          x: margin + 605,
          width: 155,
        },
      ];

      const rowHeight = 28;

      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: pageWidth - margin * 2,
        height: rowHeight,
        color: rgb(0.93, 0.91, 0.97),
        borderWidth: 1,
        borderColor: rgb(0.75, 0.75, 0.75),
      });

      for (const column of columns) {
        page.drawText(column.title, {
          x: column.x + 6,
          y: y - 18,
          size: 9,
          font: boldFont,
        });
      }

      // Vertical lines
      for (const column of columns) {
        page.drawLine({
          start: {
            x: column.x,
            y,
          },
          end: {
            x: column.x,
            y: y - rowHeight,
          },
          thickness: 0.6,
          color: rgb(0.7, 0.7, 0.7),
        });
      }

      page.drawLine({
        start: {
          x: pageWidth - margin,
          y,
        },
        end: {
          x: pageWidth - margin,
          y: y - rowHeight,
        },
        thickness: 0.6,
        color: rgb(0.7, 0.7, 0.7),
      });

      return y - rowHeight;
    }

    function drawStudentRow(
      y: number,
      index: number,
      matricule: string,
      studentName: string,
      score: number | undefined
    ) {
      const rowHeight = 25;

      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: pageWidth - margin * 2,
        height: rowHeight,
        borderWidth: 0.5,
        borderColor: rgb(0.8, 0.8, 0.8),
      });

      const scoreText =
        score !== undefined
          ? score.toFixed(2)
          : "—";

      const status =
        score === undefined
          ? "NOT ENTERED"
          : score >= 10
          ? "PASS"
          : "FAIL";

      page.drawText(String(index), {
        x: margin + 12,
        y: y - 17,
        size: 9,
        font: regularFont,
      });

      page.drawText(matricule || "—", {
        x: margin + 51,
        y: y - 17,
        size: 9,
        font: regularFont,
      });

      page.drawText(studentName, {
        x: margin + 181,
        y: y - 17,
        size: 9,
        font: regularFont,
      });

      page.drawText(scoreText, {
        x: margin + 530,
        y: y - 17,
        size: 9,
        font: boldFont,
      });

      page.drawText(status, {
        x: margin + 615,
        y: y - 17,
        size: 9,
        font: regularFont,
      });

      // Vertical lines
      const verticalPositions = [
        margin,
        margin + 45,
        margin + 175,
        margin + 505,
        margin + 605,
        pageWidth - margin,
      ];

      for (const x of verticalPositions) {
        page.drawLine({
          start: {
            x,
            y,
          },
          end: {
            x,
            y: y - rowHeight,
          },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }

      return y - rowHeight;
    }

    // =========================================================
    // FIRST PAGE HEADER
    // =========================================================

    drawHeader();

    let currentY = drawTableHeader(440);

    // =========================================================
    // DRAW STUDENTS
    // =========================================================

    let studentNumber = 1;

    for (const student of students) {
      // Create another page when necessary
      if (currentY < 65) {
        page = pdfDoc.addPage([
          pageWidth,
          pageHeight,
        ]);

        drawHeader();

        currentY = drawTableHeader(440);
      }

      const score = markMap.get(student.id);

      const fullName =
        `${student.lastName} ${student.firstName}`.trim();

      currentY = drawStudentRow(
        currentY,
        studentNumber,
        student.matricule,
        fullName,
        score
      );

      studentNumber++;
    }

    // =========================================================
    // SUMMARY
    // =========================================================

    const enteredScores = students
      .map((student) => markMap.get(student.id))
      .filter(
        (score): score is number =>
          typeof score === "number"
      );

    const totalStudents = students.length;
    const enteredCount = enteredScores.length;

    const average =
      enteredCount > 0
        ? enteredScores.reduce(
            (sum, score) => sum + score,
            0
          ) / enteredCount
        : 0;

    if (currentY < 105) {
      page = pdfDoc.addPage([
        pageWidth,
        pageHeight,
      ]);

      drawHeader();

      currentY = drawTableHeader(440);

      page.drawText(
        `Total Students: ${totalStudents}`,
        {
          x: margin,
          y: 55,
          size: 9,
          font: regularFont,
        }
      );
    } else {
      page.drawText(
        `Total Students: ${totalStudents}`,
        {
          x: margin,
          y: currentY - 20,
          size: 9,
          font: regularFont,
        }
      );

      page.drawText(
        `Marks Entered: ${enteredCount}`,
        {
          x: 220,
          y: currentY - 20,
          size: 9,
          font: regularFont,
        }
      );

      page.drawText(
        `Class Average: ${average.toFixed(2)} / 20`,
        {
          x: 400,
          y: currentY - 20,
          size: 9,
          font: boldFont,
        }
      );

      page.drawText(
        "Teacher's Signature: __________________________",
        {
          x: 520,
          y: currentY - 55,
          size: 9,
          font: regularFont,
        }
      );

      page.drawText(
        `Generated on: ${new Date().toLocaleDateString(
          "en-GB"
        )}`,
        {
          x: margin,
          y: currentY - 55,
          size: 9,
          font: regularFont,
        }
      );
    }

    // =========================================================
    // SAVE PDF
    // =========================================================

    const pdfBytes = await pdfDoc.save();

    const safeClassroom = assignment.classroom.name
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();

    const safeSubject = assignment.subject.name
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();

    const safeSequence = sequence.name
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();

    const fileName =
      `mark-sheet-${safeClassroom}-${safeSubject}-${safeSequence}.pdf`;

    // =========================================================
    // DOWNLOAD PDF
    // =========================================================

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/teacher/marks/mark-sheet ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to generate mark sheet.",
        message:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}