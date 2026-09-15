"use client";

import ForumBrowser from "@/components/forum/ForumBrowser";

export default function TeacherMessagesPage() {
  return (
    <main className="p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Communication
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            School forums — general and staff discussions. Posts and replies are
            stored in the database and update in near real time.
          </p>
        </div>

        <ForumBrowser portal="teacher" />
      </div>
    </main>
  );
}
