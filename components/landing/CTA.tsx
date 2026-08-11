import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-violet-50 py-28 transition-colors duration-300 dark:bg-gray-950">

      <div className="mx-auto max-w-5xl rounded-[40px] bg-white p-16 text-center shadow-2xl transition-colors duration-300 dark:bg-gray-900">

        <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
          Ready to Transform Academic Management?
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
          Simplify result processing, attendance tracking, communication,
          and academic performance analysis with GradeFlow.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-6">

          <Link
            href="/login"
            className="rounded-xl bg-violet-700 px-8 py-4 font-semibold text-white transition hover:bg-violet-800"
          >
            Get Started
          </Link>

          <Link
            href="#contact"
            className="rounded-xl border border-violet-700 px-8 py-4 font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-400 dark:text-violet-400 dark:hover:bg-violet-950"
          >
            Contact Us
          </Link>

        </div>

      </div>

    </section>
  );
}