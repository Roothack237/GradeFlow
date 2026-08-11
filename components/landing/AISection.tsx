import {
  BrainCircuit,
  Sparkles,
} from "lucide-react";

export default function AISection() {
  return (
    <section
      id="ai"
      className="bg-linear-to-br from-violet-700 to-purple-900 py-28 text-white transition-colors duration-300 dark:from-violet-900 dark:to-gray-950"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 lg:flex-row">

        {/* Left */}
        <div className="flex-1">

          <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
            AI Assistant
          </span>

          <h2 className="mt-6 text-5xl font-bold leading-tight">
            Your Intelligent Academic Assistant
          </h2>

          <p className="mt-8 text-lg leading-9 text-violet-100 dark:text-violet-200">
            GradeFlow includes an AI assistant that helps administrators,
            teachers and parents make better academic decisions using real
            student performance data.
          </p>

          <div className="mt-10 space-y-6">

            <Feature
              title="Performance Analysis"
              text="Compare academic performance across sequences, terms and academic years."
            />

            <Feature
              title="Teaching Recommendations"
              text="Suggest strategies for improving classroom performance."
            />

            <Feature
              title="Parent Guidance"
              text="Help parents support their children's learning at home."
            />

            <Feature
              title="Natural Conversations"
              text="Ask questions in plain English and receive intelligent responses."
            />

          </div>

        </div>

        {/* Right */}
        <div className="flex-1 w-full">

          <div className="rounded-3xl border border-white/10 bg-white p-8 text-gray-900 shadow-2xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">

            {/* AI Header */}
            <div className="flex items-center gap-3">

              <BrainCircuit className="text-violet-700 dark:text-violet-400" />

              <h3 className="text-xl font-bold">
                GradeFlow AI
              </h3>

            </div>

            {/* Chat */}
            <div className="mt-8 space-y-5">

              <Bubble
                left
                text="How did Form 5 Science perform this term?"
              />

              <Bubble
                text="Form 5 Science achieved an average of 15.8/20, improving by 8% compared to last term. Mathematics remains the weakest subject."
              />

              <Bubble
                left
                text="How can teachers improve Mathematics?"
              />

              <Bubble
                text="Schedule weekly revision sessions, identify struggling students early and provide targeted exercises."
              />

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">

      <Sparkles className="mt-1 shrink-0 text-yellow-300" />

      <div>
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-violet-100 dark:text-violet-200">
          {text}
        </p>
      </div>

    </div>
  );
}

function Bubble({
  text,
  left = false,
}: {
  text: string;
  left?: boolean;
}) {
  return (
    <div
      className={`max-w-sm rounded-2xl p-4 ${
        left
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          : "ml-auto bg-violet-700 text-white dark:bg-violet-600"
      }`}
    >
      {text}
    </div>
  );
}