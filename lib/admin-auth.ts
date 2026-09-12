import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * The authenticated administrator, resolved from the database on every
 * request. The session cookie alone is never trusted: the account is
 * re-checked so that a demoted or suspended admin loses access immediately.
 */
export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  status: string;
  image: string | null;
};

export type AdminGuard =
  | { ok: true; user: AdminUser }
  | { ok: false; response: NextResponse };

/**
 * Guards an Admin API route.
 *
 * - 401 when there is no valid session.
 * - 403 when the signed-in user is not an ADMIN, or is suspended.
 *
 * Usage:
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   const { user } = guard;
 */
export async function requireAdmin(): Promise<AdminGuard> {
  let userId: string | undefined;

  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (error) {
    console.error("ADMIN GUARD SESSION ERROR:", error);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unable to verify your session. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      image: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Account not found." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      ),
    };
  }

  if (user.status === "SUSPENDED") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This administrator account is suspended." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
    },
  };
}
