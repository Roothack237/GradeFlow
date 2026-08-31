import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ============================================================
// GET ONE PARENT
// ============================================================

export async function GET(
request: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
try {
const { id } = await params;


const parent = await prisma.parent.findUnique({
  where: {
    id,
  },
  include: {
    children: {
      include: {
        classroom: {
          include: {
            section: true,
          },
        },
      },
    },
    user: true,
  },
});

if (!parent) {
  return NextResponse.json(
    { error: "Parent not found." },
    { status: 404 }
  );
}

return NextResponse.json({
  parent,
});


} catch (error) {
console.error("GET PARENT ERROR:", error);


return NextResponse.json(
  { error: "Failed to fetch parent." },
  { status: 500 }
);


}
}

// ============================================================
// UPDATE ONE PARENT
// ============================================================

export async function PUT(
request: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
try {
const { id } = await params;


const body = await request.json();

const {
  firstName,
  lastName,
  email,
  phone,
  gender,
  dateOfBirth,
  children,
} = body;

// --------------------------------------------------------
// VALIDATION
// --------------------------------------------------------

if (!firstName?.trim()) {
  return NextResponse.json(
    { error: "First name is required." },
    { status: 400 }
  );
}

if (!lastName?.trim()) {
  return NextResponse.json(
    { error: "Last name is required." },
    { status: 400 }
  );
}

if (!email?.trim()) {
  return NextResponse.json(
    { error: "Email is required." },
    { status: 400 }
  );
}

if (!Array.isArray(children) || children.length === 0) {
  return NextResponse.json(
    { error: "At least one child is required." },
    { status: 400 }
  );
}

// --------------------------------------------------------
// FIND PARENT
// --------------------------------------------------------

const existingParent = await prisma.parent.findUnique({
  where: {
    id,
  },
  include: {
    children: true,
    user: true,
  },
});

if (!existingParent) {
  return NextResponse.json(
    { error: "Parent not found." },
    { status: 404 }
  );
}

// --------------------------------------------------------
// CHECK EMAIL
// --------------------------------------------------------

const existingUser = await prisma.user.findUnique({
  where: {
    email: email.trim(),
  },
});

if (
  existingUser &&
  existingUser.id !== existingParent.userId
) {
  return NextResponse.json(
    {
      error: "Another user is already using this email.",
    },
    { status: 409 }
  );
}

// --------------------------------------------------------
// VERIFY CHILDREN
// --------------------------------------------------------

const studentIds: string[] = [];

for (const child of children) {
  if (!child.studentId) {
    return NextResponse.json(
      {
        error: `Please verify child "${child.name || "Unknown"}" before saving.`,
      },
      { status: 400 }
    );
  }

  const student = await prisma.student.findUnique({
    where: {
      id: child.studentId,
    },
  });

  if (!student) {
    return NextResponse.json(
      {
        error: `Student "${child.name || "Unknown"}" was not found.`,
      },
      { status: 400 }
    );
  }

  studentIds.push(student.id);
}

// --------------------------------------------------------
// PREVENT DUPLICATE CHILDREN
// --------------------------------------------------------

const uniqueStudentIds = [...new Set(studentIds)];

if (uniqueStudentIds.length !== studentIds.length) {
  return NextResponse.json(
    {
      error: "The same child cannot be assigned more than once.",
    },
    { status: 400 }
  );
}

// --------------------------------------------------------
// UPDATE EVERYTHING IN ONE TRANSACTION
// --------------------------------------------------------

const updatedParent = await prisma.$transaction(
  async (tx) => {
    // Remove old children from this parent
    await tx.student.updateMany({
      where: {
        parentId: existingParent.id,
      },
      data: {
        parentId: null,
      },
    });

    // Assign the new children
    await tx.student.updateMany({
      where: {
        id: {
          in: uniqueStudentIds,
        },
      },
      data: {
        parentId: existingParent.id,
      },
    });

    // Update User
    await tx.user.update({
      where: {
        id: existingParent.userId,
      },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
      },
    });

    // Update Parent
    const parent = await tx.parent.update({
      where: {
        id: existingParent.id,
      },
      data: {
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth)
          : null,
      },
    });

    return parent;
  }
);

// --------------------------------------------------------
// FETCH COMPLETE UPDATED PARENT
// --------------------------------------------------------

const completeParent = await prisma.parent.findUnique({
  where: {
    id: updatedParent.id,
  },
  include: {
    children: {
      include: {
        classroom: {
          include: {
            section: true,
          },
        },
      },
    },
    user: true,
  },
});

return NextResponse.json({
  success: true,
  message: "Parent updated successfully.",
  parent: completeParent,
});


} catch (error) {
console.error("UPDATE PARENT ERROR:", error);


return NextResponse.json(
  {
    error:
      error instanceof Error
        ? error.message
        : "Failed to update parent.",
  },
  { status: 500 }
);


}
}

// ============================================================
// DELETE ONE PARENT
// ============================================================

export async function DELETE(
request: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
try {
const { id } = await params;


const parent = await prisma.parent.findUnique({
  where: {
    id,
  },
  include: {
    children: true,
  },
});

if (!parent) {
  return NextResponse.json(
    { error: "Parent not found." },
    { status: 404 }
  );
}

await prisma.$transaction(async (tx) => {
  // Remove parent relationship from children
  await tx.student.updateMany({
    where: {
      parentId: parent.id,
    },
    data: {
      parentId: null,
    },
  });

  // Delete parent
  await tx.parent.delete({
    where: {
      id: parent.id,
    },
  });

  // Delete associated user account
  await tx.user.delete({
    where: {
      id: parent.userId,
    },
  });
});

return NextResponse.json({
  success: true,
  message: "Parent deleted successfully.",
});


} catch (error) {
console.error("DELETE PARENT ERROR:", error);


return NextResponse.json(
  {
    error:
      error instanceof Error
        ? error.message
        : "Failed to delete parent.",
  },
  { status: 500 }
);

}
}
