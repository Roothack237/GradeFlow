"use client";

import TeacherSidebar from "./TeacherSidebar";
import TeacherNavbar from "./TeacherNavbar";

export default function TeacherShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar />

      <div className="lg:ml-72">
        <TeacherNavbar
          title="Teacher Portal"
          subtitle="Manage your classes, attendance, marks and more"
          teacherName="Teacher"
        />

        <main className="min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}