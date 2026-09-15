import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side guard for every /parent route.
 *
 * Unauthenticated visitors and non-parent accounts are redirected before any
 * parent UI is rendered. The same check is repeated inside every Parent API
 * route — frontend protection alone is never treated as security.
 */
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/parent/dashboard");
  }

  if (session.user.role !== "PARENT") {
    redirect("/login?error=not-authorized");
  }

  return <>{children}</>;
}
