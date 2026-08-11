"use client";

import { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

type AuthMode = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        {/* LEFT SIDE */}
        <div className="hidden w-[42%] flex-col justify-between bg-gradient-to-br from-[#24105f] via-[#5425c8] to-[#7c3aed] p-10 text-white md:flex">

          <div>
            {/* Logo */}
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <GraduationCap size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">GradeFlow</h2>
                <p className="text-sm text-purple-200">
                  School Management System
                </p>
              </div>
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Smarter Education,
              <span className="mt-1 block text-purple-200">
                Better Results.
              </span>
            </h1>

            <p className="mt-6 max-w-sm leading-7 text-purple-100">
              A complete school result management platform designed to
              simplify academic management and improve communication.
            </p>
          </div>

          <div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck size={24} />
                <span className="font-semibold">
                  Secure & Trusted
                </span>
              </div>

              <p className="text-sm leading-6 text-purple-100">
                Your academic information is protected with secure
                authentication and controlled access.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-purple-200">
              © 2026 GradeFlow. All rights reserved.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full overflow-y-auto p-7 sm:p-10 md:w-[58%]">

          {mode === "login" ? (
            <LoginForm
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              onLogin={() => setMode("login")}
            />
          )}

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function LoginForm({
  showPassword,
  setShowPassword,
  onRegister,
}: {
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  onRegister: () => void;
}) {
  return (
    <div className="mx-auto max-w-md">

      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          <Lock size={24} />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome Back! 👋
        </h2>

        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Sign in to continue to your account.
        </p>
      </div>

      {/* Roles */}
      <div className="mb-7 rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/40">
        <p className="font-semibold text-purple-900 dark:text-purple-200">
          One Login, Three Roles
        </p>

        <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
          Use your credentials to access GradeFlow as an Administrator,
          Teacher, or Parent.
        </p>
      </div>

      <form className="space-y-5">

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
            Email or Login Code
          </label>

          <div className="relative">
            <Mail
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Enter email or login code"
              className="h-14 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-900/30"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Password
            </label>

            <button
              type="button"
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <Lock
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
  type={showPassword ? "text" : "password"}
  placeholder="Enter your password"
  className="h-14 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-12 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
/>

<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
>
  {showPassword ? (
    <EyeOff size={19} />
  ) : (
    <Eye size={19} />
  )}
</button>
          </div>
        </div>

        {/* Remember */}
        <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-purple-600"
          />
          Remember me
        </label>

        {/* Login button */}
        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-700 to-purple-600 font-semibold text-white shadow-lg shadow-purple-200 transition hover:scale-[1.01] hover:from-purple-800 hover:to-purple-700 dark:shadow-none"
        >
          Sign In
          <span className="ml-3 text-xl">→</span>
        </button>

      </form>

      {/* Register */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Dont have an account?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-semibold text-purple-600 hover:text-purple-700"
        >
          Register as Parent
        </button>
      </p>
    </div>
  );
}

/* =========================================================
   REGISTER
========================================================= */

function RegisterForm({
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onLogin,
}: {
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  onLogin: () => void;
}) {
  return (
    <div className="mx-auto max-w-md">

      <div className="mb-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          <User size={24} />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create an Account
        </h2>

        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Register as a parent to stay connected with your childs
          academic progress.
        </p>
      </div>

      <form className="space-y-4">

        {/* Full name */}
        <InputField
          label="Full Name"
          icon={<User size={18} />}
          placeholder="Enter your full name"
        />

        {/* Email */}
        <InputField
          label="Email Address"
          icon={<Mail size={18} />}
          type="email"
          placeholder="Enter your email address"
        />

        {/* Phone */}
        <InputField
          label="Phone Number"
          icon={<Phone size={18} />}
          type="tel"
          placeholder="Enter your phone number"
        />

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="h-13 w-full rounded-xl border border-gray-200 pl-11 pr-12 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
            Confirm Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className="h-13 w-full rounded-xl border border-gray-200 pl-11 pr-12 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded accent-purple-600"
          />

          <span>
            I agree to the{" "}
            <button
              type="button"
              className="font-medium text-purple-600"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="font-medium text-purple-600"
            >
              Privacy Policy
            </button>
          </span>
        </label>

        {/* Register */}
        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-700 to-purple-600 font-semibold text-white shadow-lg shadow-purple-200 transition hover:scale-[1.01] dark:shadow-none"
        >
          Register
          <span className="ml-3 text-xl">→</span>
        </button>

      </form>

      <p className="mt-7 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onLogin}
          className="font-semibold text-purple-600 hover:text-purple-700"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function InputField({
  label,
  icon,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>

        <input
          type={type}
          placeholder={placeholder}
          className="h-13 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}