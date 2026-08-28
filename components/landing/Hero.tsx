import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-violet-50 via-white to-purple-100 pt-32 transition-colors duration-300 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-between gap-16 px-4 sm:px-6 lg:flex-row lg:px-8">

        {/* Left Side */}
        <div className="max-w-2xl">

          <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Smart School Result Management Platform
          </span>

          <h1 className="mt-8 text-5xl font-extrabold leading-tight text-gray-900 transition-colors duration-300 dark:text-white lg:text-7xl">
            Smarter Results.
            <br />
            Better Decisions.
          </h1>

          <p className="mt-8 text-xl leading-9 text-gray-600 transition-colors duration-300 dark:text-gray-300">
            GradeFlow is a modern Student Result Management System with an AI
            Assistant that helps schools manage attendance, results, report
            cards, and academic performance effortlessly.
          </p>

          <div className="mt-10 flex flex-wrap gap-5">

            <Link
              href="/login"
              className="rounded-xl bg-violet-700 px-8 py-4 text-lg font-semibold text-white shadow-xl transition hover:bg-violet-800"
            >
              Get Started
            </Link>

            <Link
              href="#features"
              className="rounded-xl border border-violet-700 px-8 py-4 text-lg font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-950"
            >
              Learn More
            </Link>

          </div>

          <div className="mt-12 flex gap-6 sm:gap-10">

            <div>
              <h2 className="text-3xl font-bold text-violet-700 dark:text-violet-400 sm:text-4xl">
                100%
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Secure
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-violet-700 dark:text-violet-400 sm:text-4xl">
                AI
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Powered Assistant
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-violet-700 dark:text-violet-400 sm:text-4xl">
                24/7
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Available
              </p>
            </div>

          </div>

        </div>

        {/* Right Side */}
        <div className="relative">

          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-300 blur-3xl opacity-30 dark:bg-violet-700" />

          <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-purple-300 blur-3xl opacity-30 dark:bg-purple-700" />

          <div className="relative rounded-3xl border border-white/60 bg-white p-6 shadow-2xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-900">
            <Image
              src="/images/dash.png"
              alt="Dashboard Preview"
              width={700}
              height={450}
              className="rounded-2xl"
              priority
            />
          </div>

        </div>

      </div>
    </section>
  );
}