import {
  CheckCircle2,
  Brain,
  Shield,
  Clock3,
} from "lucide-react";

export default function WhyChoose() {
  return (
    <section
      className="bg-violet-50 py-24 transition-colors duration-300 dark:bg-gray-900"
      id="about"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">

        {/* Left */}
        <div>
          <span className="rounded-full bg-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Why GradeFlow?
          </span>

          <h2 className="mt-6 text-5xl font-bold leading-tight text-gray-900 transition-colors duration-300 dark:text-white">
            Modern School Management
            <br />
            Built for Cameroon
          </h2>

          <p className="mt-8 text-lg leading-8 text-gray-600 transition-colors duration-300 dark:text-gray-300">
            GradeFlow helps secondary schools automate attendance,
            results, report cards and communication while providing
            intelligent AI insights that improve academic performance.
          </p>

          <div className="mt-10 space-y-6">

            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 text-violet-700 dark:text-violet-400" />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Faster Result Processing
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  Eliminate manual calculations and paperwork.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 text-violet-700 dark:text-violet-400" />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Automatic Report Cards
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  Generate beautiful PDF report cards instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 text-violet-700 dark:text-violet-400" />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Academic Assistant
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  Receive intelligent recommendations and performance analysis.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right */}
        <div className="grid gap-6 sm:grid-cols-2">

          <div className="rounded-3xl bg-white p-8 shadow-xl transition-colors duration-300 dark:bg-gray-800">
            <Brain className="h-12 w-12 text-violet-700 dark:text-violet-400" />

            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h3>

            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Analyze academic performance and generate recommendations.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl transition-colors duration-300 dark:bg-gray-800">
            <Shield className="h-12 w-12 text-violet-700 dark:text-violet-400" />

            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              Secure Platform
            </h3>

            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Protected authentication and secure data management.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl transition-colors duration-300 dark:bg-gray-800">
            <Clock3 className="h-12 w-12 text-violet-700 dark:text-violet-400" />

            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              Save Time
            </h3>

            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Automate attendance, grading and report generation.
            </p>
          </div>

          <div className="rounded-3xl bg-violet-700 p-8 text-white shadow-xl dark:bg-violet-800">
            <h2 className="text-5xl font-bold">99%</h2>

            <p className="mt-4">
              Reduction in manual work through automation.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}