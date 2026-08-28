"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

const links = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "AI Assistant", href: "#ai" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md ">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/images/logo.png"
            alt="GradeFlow"
            width={50}
            height={50}
            priority
            className="h-10 w-10 sm:h-12 sm:w-12"
          />

          <div>
            <h1 className="text-xl font-bold text-violet-700 sm:text-2xl">
              GradeFlow
            </h1>

            <p className="hidden text-xs text-gray-500 sm:block">
              Student Result Management
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="font-medium text-gray-700 transition hover:text-violet-700 dark:text-gray-800 dark:hover:text-violet-700"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />

          <Link
            href="/login"
            className="rounded-xl border border-violet-600 px-5 py-2 font-medium text-violet-700 transition hover:bg-violet-50 dark:hover:bg-violet-950/30"
          >
            Login
          </Link>

         
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 lg:hidden">

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <span className="text-2xl">✕</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-5 shadow-lg dark:border-gray-800 dark:bg-gray-950 lg:hidden">

          <nav className="flex flex-col gap-1">

            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 font-medium text-gray-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-violet-950/30 dark:hover:text-violet-400"
              >
                {link.name}
              </Link>
            ))}

          </nav>

          {/* Mobile Buttons */}
          <div className="mt-4 flex  justify-center">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl w-60 border text-xl border-violet-600 px-8 py-3 text-center font-medium text-violet-700 hover:text-gray-950 hover:bg-purple-900"
              >
                Login
              </Link>
          </div>
        </div>
      )}

    </header>
  );
}