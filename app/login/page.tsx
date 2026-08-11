"use client";

import Link from "next/link";
import { GraduationCap, Loader2, Eye, EyeOff} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [showCredential, setShowCredential] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    credential: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Authenticate using NextAuth
      const result = await signIn("credentials", {
        email: form.email,
        credential: form.credential,
        redirect: false,
      });

      // Authentication failed
      if (!result || result.error) {
        setError("Invalid email or password/login code.");
        setLoading(false);
        return;
      }

      /*
       * Authentication succeeded.
       * Get the current session to determine the user's role.
       */
      const response = await fetch("/api/auth/session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Unable to retrieve your account information.");
        setLoading(false);
        return;
      }

      const session = await response.json();

      const role = session?.user?.role;

      console.log("Authenticated role:", role);

      // Redirect according to role
      switch (role) {
        case "ADMIN":
          router.replace("/admin/dashboard");
          break;

        case "TEACHER":
          router.replace("/teacher/dashboard");
          break;

        case "PARENT":
          router.replace("/parent/dashboard");
          break;

        default:
          setError(
            "Your account role could not be determined. Please contact the administrator."
          );
          setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);

      setError("Something went wrong while signing in.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10 dark:bg-gray-950">

      <div className="w-full max-w-md">
          <div className="absolute right-6 top-6">
    <ThemeToggle />
  </div>
        {/* Logo */}
        <div className="mb-8 text-center">

          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-700 text-white">
              <GraduationCap size={27} />
            </div>

            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              GradeFlow
            </span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to your GradeFlow account
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-950"
              />
            </div>

            {/* Password / Login Code */}
            <div>

              <label
                htmlFor="credential"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password / Login Code
              </label>

              <div className="relative">

                <input
                  id="credential"
                  name="credential"
                  type={showCredential ? "text" : "password"}
                  value={form.credential}
                  onChange={handleChange}
                  placeholder="Enter your password or login code"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-950"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCredential(!showCredential)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={
                    showCredential
                      ? "Hide credential"
                      : "Show credential"
                  }
                >
                  {showCredential ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Administrators use their password. Teachers and
                parents use the login code sent to their email.
              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

          </form>

        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Your school administrator manages GradeFlow accounts.
        </p>

      </div>

    </main>
  );
}

