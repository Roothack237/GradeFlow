import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar />

      <div className="lg:pl-72">
        <TeacherNavbar
          title="Teacher Portal"
          subtitle="Manage your classes, attendance, marks and academic activities."
        />

        <main>{children}</main>
      </div>
    </div>
  );
}