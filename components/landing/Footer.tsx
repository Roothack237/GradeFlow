import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 transition-colors duration-300">

      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
          <div>
            <h2 className="text-3xl font-bold text-white">
              GradeFlow
            </h2>

            <p className="mt-5 leading-8 text-gray-400">
              Modern Student Result Management System with an AI Assistant
              for academic performance analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white">
              Quick Links
            </h3>

            <div className="mt-5 space-y-3">
              <Link
                href="/"
                className="block transition hover:text-violet-400"
              >
                Home
              </Link>

              <Link
                href="#features"
                className="block transition hover:text-violet-400"
              >
                Features
              </Link>

              <Link
                href="#about"
                className="block transition hover:text-violet-400"
              >
                About
              </Link>

              <Link
                href="#contact"
                className="block transition hover:text-violet-400"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-white">
              Features
            </h3>

            <div className="mt-5 space-y-3 text-gray-400">
              <p>AI Assistant</p>
              <p>Attendance</p>
              <p>Report Cards</p>
              <p>Analytics</p>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white">
              Legal
            </h3>

            <div className="mt-5 space-y-3 text-gray-400">
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-16 border-t border-gray-800 pt-8 text-center text-gray-500">
          © 2026 GradeFlow. All Rights Reserved.
        </div>

      </div>

    </footer>
  );
}