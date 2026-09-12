import { redirect } from "next/navigation";

/**
 * The admin area landing route. Everything lives under /admin/dashboard, so
 * this keeps /admin a valid entry point instead of a 404.
 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
