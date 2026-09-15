"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

export type ChildOption = {
  id: string;
  name: string;
  className: string;
  section: string;
  initials: string;
};

type ChildSelectorProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Shared child switcher for the parent pages. The list comes from the
 * parent dashboard API, so only the children linked to the signed-in
 * parent are ever shown.
 */
export default function ChildSelector({
  selectedId,
  onSelect,
}: ChildSelectorProps) {
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setChildren(
          (data.children ?? []).map(
            (child: {
              id: string;
              name: string;
              className: string;
              section: string;
              initials: string;
            }) => ({
              id: child.id,
              name: child.name,
              className: child.className,
              section: child.section,
              initials: child.initials,
            })
          )
        );
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (children.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        No child is linked to your account yet. Please contact the school
        administration.
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {children.map((child) => {
        const active = child.id === selectedId;

        return (
          <button
            key={child.id}
            type="button"
            onClick={() => onSelect(child.id)}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
              active
                ? "border-purple-500 bg-purple-50 shadow-sm dark:border-purple-600 dark:bg-purple-950/30"
                : "border-gray-200 bg-white hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                active
                  ? "bg-purple-700 text-white"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
              }`}
            >
              {child.initials || <UserRound size={18} />}
            </span>

            <span>
              <span className="block text-sm font-bold text-gray-900 dark:text-white">
                {child.name}
              </span>

              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {child.className} · {child.section}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
