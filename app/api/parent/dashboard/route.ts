import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession();

    const user = await prisma.user.findUnique({
      where: {
        id: session?.user?.id,
      },
      include: {
        parent: {
          include: {
            children: {
              include: {
                classroom: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      parent: user?.parent,
      children: user?.parent?.children || [],
      notifications: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}