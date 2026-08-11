"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  return (
    <main className="min-h-screen bg-[#f7f5ff] dark:bg-gray-950">
      <div className="flex min-h-screen">

        {/* ================= LEFT SIDE ================= */}

        <section className="relative hidden w-[42%] overflow-hidden bg-gradient-to-br from-[#24105f] via-[#5425c8] to-[#7c3aed] lg:flex">

          {/* Decorative shapes */}
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-white/10" />
          <div className="absolute right-20 top-32 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12">

            {/* Logo */}

            <Link href="/" className="flex items-center gap-3">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <GraduationCap
                  size={34}
                  className="text-white"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  GradeFlow
                </h1>

                <p className="text-sm text-purple-200">
                  School Management System
                </p>
              </div>

            </Link>

            {/* Main content */}

            <div className="max-w-lg">

              <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-purple-100 backdrop-blur">
                ✦ Join GradeFlow
              </p>

              <h2 className="text-5xl font-bold leading-tight text-white">
                Stay Connected.
                <br />

                <span className="text-purple-200">
                  Stay Informed.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-purple-100">
                Create your parent account and stay updated on your
                childs academic performance, attendance and results.
              </p>

              {/* Benefits */}

              <div className="mt-10 space-y-5">

                <Benefit
                  title="View Academic Results"
                  description="Access your child's results and report cards."
                />

                <Benefit
                  title="Attendance Notifications"
                  description="Receive important attendance alerts automatically."
                />

                <Benefit
                  title="Stay Connected"
                  description="Communicate with teachers through GradeFlow."
                />

                <Benefit
                  title="AI-Powered Guidance"
                  description="Get intelligent insights about your child's performance."
                />

              </div>

            </div>

            <p className="text-sm text-purple-200">
              © 2026 GradeFlow. All rights reserved.
            </p>

          </div>
        </section>

        {/* ================= RIGHT SIDE ================= */}

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">

          <div className="w-full max-w-xl">

            {/* Mobile Logo */}

            <div className="mb-8 flex justify-center lg:hidden">

              <Link href="/" className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-700 text-white">
                  <GraduationCap size={28} />
                </div>

                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  GradeFlow
                </span>

              </Link>

            </div>

            {/* Header */}

            <div className="mb-8">

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <User size={27} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Create Your Account
              </h2>

              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Register as a parent to stay connected with your
                childs academic journey.
              </p>

            </div>

            {/* Parent badge */}

            <div className="mb-7 flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 dark:border-purple-900/50 dark:bg-purple-950/30">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                👨‍👩‍👧
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-950 dark:text-purple-200">
                  Parent Registration
                </p>

                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Your account will require administrator approval.
                </p>
              </div>

            </div>

            {/* Form */}

            <form className="space-y-5">

              {/* Full Name */}

              <InputField
                id="fullName"
                label="Full Name"
                placeholder="Enter your full name"
                icon={<User size={18} />}
              />

              {/* Email */}

              <InputField
                id="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                icon={<Mail size={18} />}
              />

              {/* Phone */}

              <InputField
                id="phone"
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                icon={<Phone size={18} />}
              />

              {/* Password */}

              <PasswordField
                id="password"
                label="Password"
                placeholder="Create a password"
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />

              {/* Confirm Password */}

              <PasswordField
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                showPassword={showConfirmPassword}
                setShowPassword={setShowConfirmPassword}
              />

              {/* Password requirements */}

              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">

                <p className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Password requirements
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                  <PasswordRequirement text="At least 8 characters" />

                  <PasswordRequirement text="One uppercase letter" />

                  <PasswordRequirement text="One lowercase letter" />

                  <PasswordRequirement text="One number" />

                </div>

              </div>

              {/* Terms */}

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) =>
                    setAgreeTerms(e.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600"
                />

                <span className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>

              </label>

              {/* Register button */}

              <button
                type="submit"
                disabled={!agreeTerms}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#5425c8] to-[#7c3aed] font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-300 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
              >
                Create Parent Account

                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

            </form>

            {/* Login */}

            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">

              Already have an account?{" "}

              <Link
                href="/login"
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                Sign in
              </Link>

            </p>

            {/* Security */}

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={15} />
              Your information is encrypted and securely stored.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}


/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  id,
  label,
  placeholder,
  icon,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
}) {
  return (
    <div>

      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>

      <div className="relative">

        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>

        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:border-purple-700 dark:focus:ring-purple-900/30"
        />

      </div>

    </div>
  );
}


/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  id,
  label,
  placeholder,
  showPassword,
  setShowPassword,
}: {
  id: string;
  label: string;
  placeholder: string;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
}) {
  return (
    <div>

      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>

      <div className="relative">

        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:border-purple-700 dark:focus:ring-purple-900/30"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-purple-600"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   PASSWORD REQUIREMENT
========================================================= */

function PasswordRequirement({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">

      <CheckCircle2
        size={14}
        className="text-purple-500"
      />

      {text}

    </div>
  );
}


/* =========================================================
   BENEFIT
========================================================= */

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-purple-100">
        <CheckCircle2 size={20} />
      </div>

      <div>

        <p className="font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-sm leading-5 text-purple-200">
          {description}
        </p>

      </div>

    </div>
  );
}