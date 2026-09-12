import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side guard for every /admin route.
 *
 * This runs before any Admin page is rendered, so an unauthenticated or
 * non-admin visitor is redirected instead of receiving admin UI. The same
 * check is repeated inside every Admin API route — frontend protection alone
 * is never treated as security.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/login?error=not-authorized");
  }

  return <>{children}</>;
}
