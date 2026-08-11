import {
  BarChart3,
  Brain,
  CalendarDays,
  FileText,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Result Management",
    description:
      "Automatically calculate sequence, term and annual averages, rankings and report cards.",
  },
  {
    icon: CalendarDays,
    title: "Attendance Tracking",
    description:
      "Teachers record attendance digitally while parents receive absence notifications.",
  },
  {
    icon: FileText,
    title: "Digital Report Cards",
    description:
      "Generate professional PDF report cards and send them directly to parents.",
  },
  {
    icon: MessageSquare,
    title: "School Forums",
    description:
      "Connect administrators, teachers and parents through secure discussion forums.",
  },
  {
    icon: Brain,
    title: "AI Assistant",
    description:
      "Analyze academic performance and provide intelligent recommendations.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description:
      "Role-based authentication ensures every user accesses only their authorized resources.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-white py-24 transition-colors duration-300 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Section Header */}
        <div className="text-center">
          <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Features
          </span>

          <h2 className="mt-5 text-5xl font-bold text-gray-900 transition-colors duration-300 dark:text-white">
            Everything Your School Needs
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 transition-colors duration-300 dark:text-gray-300">
            GradeFlow centralizes academic management into one secure and
            intelligent platform.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Icon */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950">
                  <Icon className="h-8 w-8 text-violet-700 dark:text-violet-400" />
                </div>

                {/* Title */}
                <h3 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-4 leading-8 text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}