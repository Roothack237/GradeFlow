"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
};

type Assignment = {
  id: string;
  classroom?: { id: string; name: string } | null;
  subject?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not provided";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, assignmentsResponse] = await Promise.all([
        fetch("/api/teacher/profile", { cache: "no-store" }),
        fetch("/api/teacher/assignments", { cache: "no-store" }),
      ]);

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Failed to load your profile.");
      }

      setProfile(profileData.teacher);

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();

        setAssignments(
          Array.isArray(assignmentsData)
            ? assignmentsData
            : assignmentsData.assignments ?? []
        );
      }
    } catch (err) {
      console.error("Teacher Profile Error:", err);

      setError(err instanceof Error ? err.message : "Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function startEditing() {
    if (!profile) return;

    setDraft({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? "",
      gender: profile.gender ?? "",
      dateOfBirth: profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().slice(0, 10)
        : "",
    });

    setSuccess("");
    setEditing(true);
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save your profile.");
      }

      setProfile(data.teacher);
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading your profile...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <AlertCircle size={32} className="mx-auto text-red-600 dark:text-red-400" />
          <p className="mt-3 text-sm text-red-700 dark:text-red-400">
            {error || "Teacher profile not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your personal and professional information.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              <Pencil size={16} />
              Edit profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
            {success}
          </div>
        )}

        {editing ? (
          /* ---- Edit form ---- */
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  First name
                </label>

                <input
                  type="text"
                  value={draft.firstName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, firstName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Last name
                </label>

                <input
                  type="text"
                  value={draft.lastName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, lastName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </label>

                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Phone
                </label>

                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Gender
                </label>

                <select
                  value={draft.gender}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, gender: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Not provided</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date of birth
                </label>

                <input
                  type="date"
                  value={draft.dateOfBirth}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, dateOfBirth: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save changes
              </button>

              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ---- Read-only profile ---- */
          <div className="space-y-5">
            {/* Identity card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700 to-violet-600 text-2xl font-bold text-white">
                  {profile.firstName.charAt(0)}
                  {profile.lastName.charAt(0)}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.fullName}
                  </h2>

                  <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                    Teacher · {assignments.length} assignments
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Mail size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      {profile.email}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Phone size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      {profile.phone || "Not provided"}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <UserRound size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      {profile.gender || "Not provided"}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <CalendarDays size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      {formatDate(profile.dateOfBirth)}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <ShieldCheck size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      Teacher ID: {profile.teacherId}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <BriefcaseBusiness size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      {new Set(assignments.map((a) => a.classroom?.name)).size} classes
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
                Teaching assignments
              </h3>

              {assignments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No assignment has been recorded for you yet. The administration
                  assigns classes and subjects to teachers.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                        <GraduationCap size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {assignment.subject?.name ?? "Subject"}
                        </p>

                        <p className="truncate text-xs text-gray-400">
                          {assignment.classroom?.name ?? "Class"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
