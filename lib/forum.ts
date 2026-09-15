import { auth } from "@/auth";

import prisma from "@/lib/prisma";

/**
 * Shared forum helpers. Forum categories are scoped:
 *   - ALL      → every signed-in user (teachers and parents)
 *   - STAFF    → teachers and administrators only
 *   - PARENTS  → parents and administrators only
 */

export function categoryVisibleTo(scope: string, role: string): boolean {
  if (scope === "ALL") return true;
  if (scope === "STAFF") return role === "TEACHER" || role === "ADMIN";
  if (scope === "PARENTS") return role === "PARENT" || role === "ADMIN";
  return false;
}

/** The signed-in, non-suspended user with their profile name, or null. */
export async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      teacher: { select: { fullName: true } },
      parent: { select: { fullName: true } },
      administrator: { select: { fullName: true } },
    },
  });

  if (!user || user.status === "SUSPENDED") return null;

  return user;
}

export function displayName(user: {
  firstName: string;
  lastName: string;
  teacher?: { fullName: string } | null;
  parent?: { fullName: string } | null;
  administrator?: { fullName: string } | null;
}): string {
  return (
    user.teacher?.fullName ??
    user.parent?.fullName ??
    user.administrator?.fullName ??
    `${user.firstName} ${user.lastName}`
  );
}
