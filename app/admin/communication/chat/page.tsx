import { redirect } from "next/navigation";

/**
 * The AI assistant lives at /admin/ai where it is backed by the configured
 * provider and stores its conversation history in the database.
 */
export default function LegacyChatPage() {
  redirect("/admin/ai");
}
