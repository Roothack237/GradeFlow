"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import AdminNavbar from "@/components/admin/NavBar";
import LogoutButton from "@/components/LogoutButton";

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  status: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /*
   * ============================================
   * LOAD PROFILE
   * ============================================
   */
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/profile", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      console.log("PROFILE API RESPONSE:", response.status, data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `Failed to load profile (${response.status})`
        );
      }

      const user: UserProfile = data.user;

      setProfile(user);

      /*
       * IMPORTANT:
       * We use the existing firstName, lastName
       * and phone states.
       *
       * There is no setFormData anymore.
       */
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    } catch (err) {
      console.error("PROFILE LOAD ERROR:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================
   * UPDATE PROFILE
   * ============================================
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirstName) {
      setError("First name is required.");
      return;
    }

    if (!cleanLastName) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          phone: cleanPhone,
        }),
      });

      const data = await response.json();

      console.log("PROFILE UPDATE RESPONSE:", response.status, data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to update profile"
        );
      }

      const updatedUser: UserProfile = data.user;

      setProfile(updatedUser);

      setFirstName(updatedUser.firstName || "");
      setLastName(updatedUser.lastName || "");
      setPhone(updatedUser.phone || "");

      setSuccess(
        data.message || "Profile updated successfully."
      );

      /*
       * Remove success message after 4 seconds.
       */
      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================
   * INITIALS
   * ============================================
   */
  function getInitials() {
    const first = profile?.firstName?.charAt(0) || "";
    const last = profile?.lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "U";
  }

  /*
   * ============================================
   * DISPLAY ROLE
   * ============================================
   */
  function getRoleLabel(role: string) {
    switch (role) {
      case "ADMIN":
        return "School Administrator";

      case "TEACHER":
        return "Teacher";

      case "PARENT":
        return "Parent";

      default:
        return role;
    }
  }

  /*
   * ============================================
   * LOADING STATE
   * ============================================
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
            <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
          </div>

          <div className="text-center">
            <p className="font-medium text-gray-900 dark:text-white">
              Loading profile
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please wait...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================
   * ERROR / NO PROFILE STATE
   * ============================================
   */
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <User className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
            Unable to load profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-500">
            {error || "Something went wrong while loading your profile."}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================
   * MAIN PAGE
   * ============================================
   */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* =========================================
          ADMIN SIDEBAR
      ========================================== */}
      <AdminSidebar />

      {/* =========================================
          MAIN AREA
      ========================================== */}
      <div className="lg:ml-64">
        {/* =======================================
            ADMIN NAVBAR
        ======================================== */}
        <AdminNavbar />

        <main className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {/* ===================================
                PAGE HEADER
            ==================================== */}
            <div className="mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                    Account Settings
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    My Profile
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage your personal information and account details.
                  </p>
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Account secured
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================
                PROFILE CARD
            ==================================== */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {/* =================================
                  PROFILE HERO
              ================================== */}
              <div className="relative overflow-hidden border-b border-gray-200 px-6 py-8 dark:border-gray-800 sm:px-8">
                {/* Decorative background */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-100/70 blur-3xl dark:bg-purple-900/20" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                  {/* Avatar */}
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 ring-4 ring-purple-50 dark:bg-purple-900/30 dark:ring-purple-950/40">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {getInitials()}
                      </span>
                    )}
                  </div>

                  {/* Profile identity */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                        {profile.firstName} {profile.lastName}
                      </h2>

                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {profile.role}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {getRoleLabel(profile.role)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {profile.email}
                      </span>

                      <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block dark:bg-gray-700" />

                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            profile.status.toLowerCase() === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />

                        <span className="capitalize">
                          {profile.status.toLowerCase()}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================
                  FORM
              ================================== */}
              <form
                onSubmit={handleSubmit}
                className="space-y-8 p-6 sm:p-8"
              >
                {/* Success message */}
                {success && (
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-semibold">
                        Changes saved
                      </p>

                      <p className="mt-0.5">
                        {success}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                    <p className="font-semibold">
                      Unable to save changes
                    </p>

                    <p className="mt-0.5">
                      {error}
                    </p>
                  </div>
                )}

                {/* =================================
                    PERSONAL INFORMATION
                ================================== */}
                <section>
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Personal Information
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Update the information associated with your account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* First Name */}
                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        First Name
                      </label>

                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(event) =>
                          setFirstName(event.target.value)
                        }
                        placeholder="Enter first name"
                        autoComplete="given-name"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Last Name
                      </label>

                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(event) =>
                          setLastName(event.target.value)
                        }
                        placeholder="Enter last name"
                        autoComplete="family-name"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                </section>

                {/* =================================
                    CONTACT INFORMATION
                ================================== */}
                <section className="border-t border-gray-200 pt-8 dark:border-gray-800">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Contact Information
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Your email is linked to your GradeFlow account.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                        <input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 pl-11 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Email addresses cannot be changed from this page.
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Phone Number
                      </label>

                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(event) =>
                            setPhone(event.target.value)
                          }
                          placeholder="Enter phone number"
                          autoComplete="tel"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* =================================
                    ACCOUNT INFORMATION
                ================================== */}
                <section className="border-t border-gray-200 pt-8 dark:border-gray-800">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Account Information
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Basic information about your GradeFlow account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Role */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Account Role
                          </p>

                          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                            {getRoleLabel(profile.role)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                          <span
                            className={`h-3 w-3 rounded-full ${
                              profile.status.toLowerCase() === "active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Account Status
                          </p>

                          <p className="mt-0.5 text-sm font-semibold capitalize text-gray-900 dark:text-white">
                            {profile.status.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* =================================
                    SAVE
                ================================== */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your changes will be saved to your GradeFlow account.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ===================================
                MOBILE LOGOUT
            ==================================== */}
            <div className="mt-6 lg:hidden">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  Account
                </p>

                <LogoutButton />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}