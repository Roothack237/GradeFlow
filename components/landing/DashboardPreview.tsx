import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  Brain,
  TrendingUp,
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="bg-white py-28 transition-colors duration-300 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6">

        {/* Section Header */}
        <div className="text-center">
          <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Dashboard Preview
          </span>

          <h2 className="mt-5 text-5xl font-bold text-gray-900 dark:text-white">
            Everything in One Place
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            GradeFlow provides administrators, teachers and parents with a
            beautiful dashboard that makes managing academic activities simple.
          </p>
        </div>

        {/* Dashboard */}
        <div className="mt-20 rounded-3xl border border-gray-200 bg-gray-50 p-8 shadow-2xl transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">

          {/* Top Cards */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            <Card
              title="Students"
              value="620"
              icon={<Users className="text-violet-700 dark:text-violet-400" />}
            />

            <Card
              title="Teachers"
              value="38"
              icon={
                <GraduationCap className="text-violet-700 dark:text-violet-400" />
              }
            />

            <Card
              title="Subjects"
              value="18"
              icon={
                <BookOpen className="text-violet-700 dark:text-violet-400" />
              }
            />

            <Card
              title="Notifications"
              value="12"
              icon={<Bell className="text-violet-700 dark:text-violet-400" />}
            />

          </div>

          {/* Bottom Section */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">

            {/* Performance */}
            <div className="rounded-2xl bg-white p-6 shadow transition-colors duration-300 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Academic Performance
                </h3>

                <TrendingUp className="text-green-600 dark:text-green-400" />
              </div>

              <div className="mt-8 flex h-52 items-end gap-4">
                <div
                  className="w-full rounded-xl bg-violet-300 dark:bg-violet-700"
                  style={{ height: "50%" }}
                />

                <div
                  className="w-full rounded-xl bg-violet-500 dark:bg-violet-600"
                  style={{ height: "75%" }}
                />

                <div
                  className="w-full rounded-xl bg-violet-700 dark:bg-violet-500"
                  style={{ height: "90%" }}
                />

                <div
                  className="w-full rounded-xl bg-violet-400 dark:bg-violet-600"
                  style={{ height: "65%" }}
                />

                <div
                  className="w-full rounded-xl bg-violet-600 dark:bg-violet-500"
                  style={{ height: "80%" }}
                />
              </div>
            </div>

            {/* Recent Results */}
            <div className="rounded-2xl bg-white p-6 shadow transition-colors duration-300 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Recent Results
              </h3>

              <div className="mt-6 space-y-4">
                <Row subject="Mathematics" average="15.4" />
                <Row subject="Physics" average="14.2" />
                <Row subject="Chemistry" average="16.8" />
                <Row subject="English" average="13.6" />
              </div>
            </div>

            {/* AI */}
            <div className="rounded-2xl bg-violet-700 p-6 text-white shadow dark:bg-violet-800">

              <div className="flex items-center gap-3">
                <Brain />

                <h3 className="font-semibold">
                  AI Assistant
                </h3>
              </div>

              <p className="mt-6 leading-8 text-violet-50">
                Class 5 Science has improved by{" "}
                <span className="font-bold">12%</span>{" "}
                compared to last term.

                <br />
                <br />

                Mathematics remains the weakest subject in Form 2.

                <br />
                <br />

                <span className="font-semibold">
                  Recommendation:
                </span>{" "}
                Schedule additional revision sessions.
              </p>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

/* Card */
function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow transition-colors duration-300 dark:bg-gray-800">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </h2>
        </div>

        {icon}

      </div>
    </div>
  );
}

/* Result Row */
function Row({
  subject,
  average,
}: {
  subject: string;
  average: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors duration-300 dark:bg-gray-700">

      <p className="text-gray-900 dark:text-gray-100">
        {subject}
      </p>

      <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
        {average}/20
      </span>

    </div>
  );
}