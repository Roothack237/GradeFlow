import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "No image selected" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Only JPG, PNG, and WebP images are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          message: "Image must be smaller than 5MB",
        },
        { status: 400 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Parent profile not found" },
        { status: 404 }
      );
    }

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
        ? "png"
        : "webp";

    const fileName = `${randomUUID()}.${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(
      uploadDirectory,
      fileName
    );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/profiles/${fileName}`;

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image: imageUrl,
      },
    });

    return NextResponse.json({
      message: "Profile picture updated successfully",
      image: imageUrl,
    });
  } catch (error) {
    console.error("PROFILE IMAGE UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to upload profile picture",
      },
      { status: 500 }
    );
  }
}