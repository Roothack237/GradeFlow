const stats = [
  {
    number: "620+",
    label: "Students",
  },
  {
    number: "38",
    label: "Teachers",
  },
  {
    number: "18",
    label: "Subjects",
  },
  {
    number: "3",
    label: "Terms",
  },
  {
    number: "100%",
    label: "Secure Platform",
  },
];

export default function Statistics() {
  return (
    <section className="bg-white py-24 transition-colors duration-300 dark:bg-gray-950">

      <div className="mx-auto max-w-7xl px-6">

        <div className="rounded-[40px] bg-linear-to-r from-violet-700 to-purple-800 px-10 py-16 shadow-xl transition-all duration-300 dark:from-violet-900 dark:to-purple-950">

          <div className="grid gap-10 text-center md:grid-cols-3 lg:grid-cols-5">

            {stats.map((stat) => (
              <div key={stat.label}>

                <h2 className="text-5xl font-bold text-white">
                  {stat.number}
                </h2>

                <p className="mt-3 text-violet-100 dark:text-violet-200">
                  {stat.label}
                </p>

              </div>
            ))}

          </div>

        </div>

      </div>

    </section>
  );
}