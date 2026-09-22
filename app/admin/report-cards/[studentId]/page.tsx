import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function StudentReportCardPage({
  params,
}: Props) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
    include: {
      classroom: true,
    },
  });

  if (!student) {
    notFound();
  }

  const marks = await prisma.mark.findMany({
    where: {
      studentId,
    },
    include: {
      subject: true,
      term: true,
      sequence: true,
    },
    orderBy: [
      {
        subject: {
          name: "asc",
        },
      },
    ],
  });

  const subjectsMap = new Map<
    string,
    {
      subject: string;
      marks: number[];
    }
  >();

  marks.forEach((mark) => {
    const current = subjectsMap.get(mark.subjectId) || {
      subject: mark.subject.name,
      marks: [],
    };

    current.marks.push(mark.average || 0);

    subjectsMap.set(mark.subjectId, current);
  });

  const subjects = Array.from(subjectsMap.values()).map(
    (item) => ({
      subject: item.subject,
      average:
        item.marks.reduce((a, b) => a + b, 0) /
        item.marks.length,
    })
  );

  const total = subjects.reduce(
    (sum, subject) => sum + subject.average,
    0
  );

  const overallAverage =
    subjects.length > 0
      ? total / subjects.length
      : 0;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Student Report Card
          </h1>

          <p className="mt-2 text-gray-500">
            Academic Performance Summary
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">

          <div>
            <p className="text-sm text-gray-500">
              Student Name
            </p>

            <p className="font-semibold">
              {student.firstName} {student.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Matricule
            </p>

            <p className="font-semibold">
              {student.matricule}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Class
            </p>

            <p className="font-semibold">
              {student.classroom?.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Gender
            </p>

            <p className="font-semibold">
              {student.gender}
            </p>
          </div>

        </div>

        <div className="overflow-hidden rounded-xl border">

          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left">
                  Subject
                </th>

                <th className="px-4 py-3 text-center">
                  Average
                </th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((subject) => (
                <tr
                  key={subject.subject}
                  className="border-t"
                >
                  <td className="px-4 py-3">
                    {subject.subject}
                  </td>

                  <td className="px-4 py-3 text-center font-semibold">
                    {subject.average.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        <div className="mt-8 flex justify-end">

          <div className="rounded-xl bg-purple-50 p-6">

            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="text-xl font-bold">
              {total.toFixed(2)}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Overall Average
            </p>

            <p className="text-2xl font-bold text-purple-700">
              {overallAverage.toFixed(2)} / 20
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}