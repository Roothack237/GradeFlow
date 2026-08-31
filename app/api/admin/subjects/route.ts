import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
try {
const subjects = await prisma.subject.findMany({
orderBy: {
name: "asc",
},
});


return NextResponse.json(subjects);

} catch (error) {
console.error("GET SUBJECTS ERROR:", error);


return NextResponse.json(
  {
    error:
      error instanceof Error
        ? error.message
        : "Failed to load subjects",
  },
  { status: 500 }
);


}
}

export async function POST(request: Request) {
try {
const body = await request.json();


const {
  name,
  coefficient,
} = body;

if (!name || !coefficient) {
  return NextResponse.json(
    {
      error: "Name and coefficient are required",
    },
    { status: 400 }
  );
}

const generatedCode =
  name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_") +
  "_" +
  Date.now().toString().slice(-4);

const existingSubject =
  await prisma.subject.findUnique({
    where: {
      code: generatedCode,
    },
  });

if (existingSubject) {
  return NextResponse.json(
    {
      error: "Subject code already exists",
    },
    { status: 400 }
  );
}

const subject =
  await prisma.subject.create({
    data: {
      name,
      code: generatedCode,
      coefficient: Number(coefficient),
    },
  });

return NextResponse.json(
  {
    message: "Subject created successfully",
    subject,
  },
  { status: 201 }
);


} catch (error) {
console.error("CREATE SUBJECT ERROR:", error);


return NextResponse.json(
  {
    error:
      error instanceof Error
        ? error.message
        : "Failed to create subject",
  },
  { status: 500 }
);


}
}
