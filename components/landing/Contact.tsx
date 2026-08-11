import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <section
      id="contact"
      className="bg-white py-24 transition-colors duration-300 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="text-center">

          <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Contact Us
          </span>

          <h2 className="mt-5 text-5xl font-bold text-gray-900 dark:text-white">
            Wed Love To Hear From You
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Have questions about GradeFlow? Reach out and we will gladly assist
            you.
          </p>

        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">

          {/* Contact Information */}
          <div className="space-y-8">

            {/* Email */}
            <div className="flex gap-5 rounded-2xl bg-violet-50 p-6 transition-colors duration-300 dark:bg-gray-900">
              <Mail className="text-violet-700 dark:text-violet-400" />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Email
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  gradeflow@gmail.com
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-5 rounded-2xl bg-violet-50 p-6 transition-colors duration-300 dark:bg-gray-900">
              <Phone className="text-violet-700 dark:text-violet-400" />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Phone
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  +237 XXX XXX XXX
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex gap-5 rounded-2xl bg-violet-50 p-6 transition-colors duration-300 dark:bg-gray-900">
              <MapPin className="text-violet-700 dark:text-violet-400" />

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Address
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  Cameroon
                </p>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <form className="rounded-3xl bg-gray-50 p-8 shadow transition-colors duration-300 dark:bg-gray-900">

            <div className="grid gap-6">

              <input
                type="text"
                placeholder="Full Name"
                className="rounded-xl border border-gray-200 bg-white p-4 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-400"
              />

              <input
                type="email"
                placeholder="Email Address"
                className="rounded-xl border border-gray-200 bg-white p-4 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-400"
              />

              <textarea
                rows={6}
                placeholder="Message"
                className="rounded-xl border border-gray-200 bg-white p-4 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-400"
              />

              <button
                type="submit"
                className="rounded-xl bg-violet-700 py-4 font-semibold text-white transition hover:bg-violet-800"
              >
                Send Message
              </button>

            </div>

          </form>

        </div>

      </div>
    </section>
  );
}