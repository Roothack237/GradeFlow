"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  collapsed?: boolean;
};

export default function LogoutButton({
  collapsed = false,
}: LogoutButtonProps) {
  async function handleLogout() {
    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition ${
        collapsed ? "justify-center" : ""
      }`}
      title={collapsed ? "Logout" : undefined}
    >
      <LogOut className="h-5 w-5 shrink-0" />

      {!collapsed && <span>Logout</span>}
    </button>
  );
}