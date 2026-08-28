"use client";

import { useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  BriefcaseBusiness,
  BookOpen,
  Users,
  ShieldCheck,
  Lock,
  Pencil,
  Save,
  X,
  GraduationCap,
} from "lucide-react";

export default function TeacherProfilePage() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "Manuella",
    lastName: "Efendeh",
    email: "teacher@gradeflow.com",
    phone: "+237 6 77 00 00 00",
    gender: "Female",
    dateOfBirth: "2003-05-15",
    teacherId: "TCH001",
    department: "Sciences",
    specialization: "Computer Science",
  });

  const [draft, setDraft] = useState(profile);

  const handleChange = (
    field: keyof typeof draft,
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const handleSave = () => {
    setProfile(draft);
    setEditing(false);
    alert("Profile updated successfully!");
  };

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your personal and professional information.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              <Pencil size={17} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Overview */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <div className="bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 px-6 py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white text-2xl font-bold text-purple-700 shadow-lg">
                {initials}
              </div>

              <div className="text-white">
                <h2 className="text-2xl font-bold">
                  {fullName}
                </h2>

                <p className="mt-1 text-purple-100">
                  {profile.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                    Teacher
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                    ID: {profile.teacherId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

            <ProfileSummary
              icon={<Mail size={19} />}
              label="Email"
              value={profile.email}
            />

            <ProfileSummary
              icon={<Phone size={19} />}
              label="Phone"
              value={profile.phone}
            />

            <ProfileSummary
              icon={<BriefcaseBusiness size={19} />}
              label="Department"
              value={profile.department}
            />

            <ProfileSummary
              icon={<BookOpen size={19} />}
              label="Specialization"
              value={profile.specialization}
            />

          </div>
        </section>

        {/* Personal Information */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <SectionHeader
            icon={<UserRound size={20} />}
            title="Personal Information"
            subtitle="Your basic personal details"
          />

          <div className="grid gap-6 p-6 md:grid-cols-2">

            <ProfileField
              label="First Name"
              value={draft.firstName}
              editing={editing}
              onChange={(value) =>
                handleChange("firstName", value)
              }
            />

            <ProfileField
              label="Last Name"
              value={draft.lastName}
              editing={editing}
              onChange={(value) =>
                handleChange("lastName", value)
              }
            />

            <ProfileField
              label="Email Address"
              value={draft.email}
              editing={editing}
              onChange={(value) =>
                handleChange("email", value)
              }
              type="email"
            />

            <ProfileField
              label="Phone Number"
              value={draft.phone}
              editing={editing}
              onChange={(value) =>
                handleChange("phone", value)
              }
            />

            <ProfileField
              label="Gender"
              value={draft.gender}
              editing={editing}
              onChange={(value) =>
                handleChange("gender", value)
              }
            />

            <ProfileField
              label="Date of Birth"
              value={draft.dateOfBirth}
              editing={editing}
              onChange={(value) =>
                handleChange("dateOfBirth", value)
              }
              type="date"
            />

          </div>
        </section>

        {/* Professional Information */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <SectionHeader
            icon={<GraduationCap size={20} />}
            title="Professional Information"
            subtitle="Your teaching and academic information"
          />

          <div className="grid gap-6 p-6 md:grid-cols-2">

            <ProfileField
              label="Teacher ID"
              value={profile.teacherId}
              editing={false}
              onChange={() => {}}
            />

            <ProfileField
              label="Department"
              value={draft.department}
              editing={editing}
              onChange={(value) =>
                handleChange("department", value)
              }
            />

            <ProfileField
              label="Specialization"
              value={draft.specialization}
              editing={editing}
              onChange={(value) =>
                handleChange("specialization", value)
              }
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assigned Classes
              </label>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  Form 1 A
                </span>

                <span className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  Form 2 A
                </span>

                <span className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  Form 3 B
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* Teaching Overview */}
        <section className="mb-6 grid gap-6 md:grid-cols-3">

          <InfoCard
            icon={<Users size={21} />}
            title="Classes"
            value="3"
            description="Assigned classes"
          />

          <InfoCard
            icon={<BookOpen size={21} />}
            title="Subjects"
            value="2"
            description="Subjects currently teaching"
          />

          <InfoCard
            icon={<CalendarDays size={21} />}
            title="Experience"
            value="4 Years"
            description="Teaching experience"
          />

        </section>

        {/* Security */}
        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

          <SectionHeader
            icon={<ShieldCheck size={20} />}
            title="Account Security"
            subtitle="Manage your account security settings"
          />

          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <Lock size={20} />
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Password
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last changed 30 days ago
                </p>
              </div>

            </div>

            <button
              type="button"
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Change Password
            </button>

          </div>
        </section>

        {/* Edit Actions */}
        {editing && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              <Save size={17} />
              Save Changes
            </button>

          </div>
        )}

      </div>
    </main>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 p-6 dark:border-gray-800">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>

    </div>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
  label,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      ) : (
        <div className="rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {value}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PROFILE SUMMARY
========================================================= */

function ProfileSummary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>

    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          {icon}
        </div>

        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>

      </div>

      <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>

    </div>
  );
}