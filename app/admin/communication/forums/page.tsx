import { redirect } from "next/navigation";

/**
 * The forum is moderated from /admin/forum, which reads the real forum tables.
 * This route is kept so old links keep working.
 */
export default function LegacyForumsPage() {
  redirect("/admin/forum");
}
