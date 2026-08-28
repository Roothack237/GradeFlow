"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  Users,
  UserRound,
  Plus,
  MoreVertical,
  CheckCircle,
  Ban,
  Trash2,
  X,
  UserPlus,
  GraduationCap,
  CalendarDays,
  BookOpen,
  School,
  Layers,
} from "lucide-react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Account = {
  id: string | number;
  name: string;
  email: string;
  role: "Teacher" | "Parent" | "Student";
  status: "Active" | "Suspended";
};

type AccountCounts = {
  teachers: number;
  parents: number;
  students: number;
};

type ClassItem = {
  id: string;
  name: string;
  sectionId?: string;
  sectionName?: string;
};

type SectionItem = {
  id: string;
  name: string;
};

type SubjectItem = {
  id: string;
  name: string;
  code?: string;
};

type ChildForm = {
  name: string;
  classId: string;
};

type TeacherAssignment = {
  sectionId: string;
  classId: string;
  subjectId: string;
};

type AddType = "Teacher" | "Parent" | "Student";

const initialAccounts: Account[] = [];

const CLASSES_API = "/api/admin/classes";
const SECTIONS_API = "/api/admin/sections";
const SUBJECTS_API = "/api/admin/subjects";

export default function ManageAccountsPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [menuId, setMenuId] = useState<string | number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================================================
  // ADD ACCOUNT MODAL
  // =========================================================

  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<AddType | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    classId: "",
  });

  // =========================================================
  // PARENT CHILDREN
  // =========================================================

  const [children, setChildren] = useState<ChildForm[]>([
    {
      name: "",
      classId: "",
    },
  ]);

  // =========================================================
  // CLASSES
  // =========================================================

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // =========================================================
  // TEACHER ASSIGNMENTS
  // =========================================================

  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [teacherAssignments, setTeacherAssignments] =
    useState<TeacherAssignment[]>([
      {
        sectionId: "",
        classId: "",
        subjectId: "",
      },
    ]);

  // =========================================================
  // SUBMIT STATE
  // =========================================================

  const [submitting, setSubmitting] = useState(false);

  // =========================================================
  // SUCCESS MESSAGE
  // =========================================================

  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // ACCOUNT COUNTS
  // =========================================================

  const [accountCounts, setAccountCounts] =
    useState<AccountCounts>({
      students: 0,
      teachers: 0,
      parents: 0,
    });

  const [countsLoading, setCountsLoading] = useState(true);

  // =========================================================
  // LOAD ACCOUNT COUNTS
  // =========================================================

  const loadAccountCounts = useCallback(async () => {
    try {
      setCountsLoading(true);

      const response = await fetch(
        "/api/admin/accounts/counts",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load account counts"
        );
      }

      setAccountCounts({
        teachers: Number(data.teachers) || 0,
        parents: Number(data.parents) || 0,
        students: Number(data.students) || 0,
      });
    } catch (error) {
      console.error(
        "LOAD ACCOUNT COUNTS ERROR:",
        error
      );
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccountCounts();
  }, [loadAccountCounts]);

  // =========================================================
  // REFRESH COUNTS WHEN WINDOW GETS FOCUS
  // =========================================================

  useEffect(() => {
    const handleFocus = () => {
      loadAccountCounts();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadAccountCounts]);

  // =========================================================
  // LOAD CLASSES
  // =========================================================

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);

      const response = await fetch(CLASSES_API, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load classes"
        );
      }

      const classList = Array.isArray(data)
        ? data
        : Array.isArray(data.classes)
        ? data.classes
        : [];

      setClasses(
        classList.map((item: any) => ({
          id: String(item.id),
          name:
            item.name ||
            item.className ||
            item.label ||
            `Class ${item.id}`,
          sectionId: item.sectionId
            ? String(item.sectionId)
            : item.section?.id
            ? String(item.section.id)
            : undefined,
          sectionName:
            item.section?.name ||
            item.sectionName ||
            undefined,
        }))
      );
    } catch (error) {
      console.error(
        "LOAD CLASSES ERROR:",
        error
      );

      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // =========================================================
  // LOAD SECTIONS
  // =========================================================

  const loadSections = useCallback(async () => {
    try {
      setLoadingSections(true);

      const response = await fetch(SECTIONS_API, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load sections"
        );
      }

      const sectionList = Array.isArray(data)
        ? data
        : Array.isArray(data.sections)
        ? data.sections
        : [];

      setSections(
        sectionList.map((item: any) => ({
          id: String(item.id),
          name:
            item.name ||
            item.sectionName ||
            item.label ||
            "Unnamed Section",
        }))
      );
    } catch (error) {
      console.error(
        "LOAD SECTIONS ERROR:",
        error
      );

      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  }, []);

  // =========================================================
  // LOAD SUBJECTS
  // =========================================================

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);

      const response = await fetch(SUBJECTS_API, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load subjects"
        );
      }

      const subjectList = Array.isArray(data)
        ? data
        : Array.isArray(data.subjects)
        ? data.subjects
        : [];

      setSubjects(
        subjectList.map((item: any) => ({
          id: String(item.id),
          name:
            item.name ||
            item.subjectName ||
            item.label ||
            "Unnamed Subject",
          code: item.code || undefined,
        }))
      );
    } catch (error) {
      console.error(
        "LOAD SUBJECTS ERROR:",
        error
      );

      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  // =========================================================
  // LOAD TEACHER ASSIGNMENT DATA
  // =========================================================

  const loadTeacherAssignmentData = useCallback(async () => {
    await Promise.all([
      loadSections(),
      loadClasses(),
      loadSubjects(),
    ]);
  }, [
    loadSections,
    loadClasses,
    loadSubjects,
  ]);

  // =========================================================
  // GET CLASSES FOR SECTION
  // =========================================================

  function getClassesForSection(sectionId: string) {
    if (!sectionId) return [];

    return classes.filter(
      (classItem) =>
        classItem.sectionId === sectionId
    );
  }

  // =========================================================
  // ADD TEACHER ASSIGNMENT
  // =========================================================

  function addTeacherAssignment() {
    setTeacherAssignments((current) => [
      ...current,
      {
        sectionId: "",
        classId: "",
        subjectId: "",
      },
    ]);
  }

  // =========================================================
  // REMOVE TEACHER ASSIGNMENT
  // =========================================================

  function removeTeacherAssignment(index: number) {
    if (teacherAssignments.length === 1) return;

    setTeacherAssignments((current) =>
      current.filter(
        (_, assignmentIndex) =>
          assignmentIndex !== index
      )
    );
  }

  // =========================================================
  // UPDATE TEACHER ASSIGNMENT
  // =========================================================

  function updateTeacherAssignment(
    index: number,
    field: keyof TeacherAssignment,
    value: string
  ) {
    setTeacherAssignments((current) =>
      current.map((assignment, assignmentIndex) => {
        if (assignmentIndex !== index) {
          return assignment;
        }

        const updated = {
          ...assignment,
          [field]: value,
        };

        // When section changes, reset class
        if (field === "sectionId") {
          updated.classId = "";
        }

        return updated;
      })
    );
  }

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredAccounts = accounts.filter(
    (account) => {
      const matchesSearch =
        account.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        account.email
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        account.role === filter;

      return matchesSearch && matchesFilter;
    }
  );

  // =========================================================
  // ACTIVATE ACCOUNT
  // =========================================================

  function activateAccount(
    id: string | number
  ) {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id
          ? {
              ...account,
              status: "Active",
            }
          : account
      )
    );

    setMenuId(null);
  }

  // =========================================================
  // SUSPEND ACCOUNT
  // =========================================================

  function suspendAccount(
    id: string | number
  ) {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id
          ? {
              ...account,
              status: "Suspended",
            }
          : account
      )
    );

    setMenuId(null);
  }

  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  function deleteAccount(
    id: string | number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this account?"
    );

    if (!confirmed) return;

    setAccounts((current) =>
      current.filter(
        (account) => account.id !== id
      )
    );

    setMenuId(null);
    loadAccountCounts();
  }

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  function openAddModal(type: AddType) {
    setAddType(type);

    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      classId: "",
    });

    setChildren([
      {
        name: "",
        classId: "",
      },
    ]);

    setTeacherAssignments([
      {
        sectionId: "",
        classId: "",
        subjectId: "",
      },
    ]);

    setSuccessMessage("");
    setMenuId(null);
    setShowAddModal(true);

    if (
      type === "Parent" ||
      type === "Student"
    ) {
      loadClasses();
    }

    if (type === "Teacher") {
      loadTeacherAssignmentData();
    }
  }

  // =========================================================
  // CLOSE ADD MODAL
  // =========================================================

  function closeAddModal() {
    if (submitting) return;

    setShowAddModal(false);
    setAddType(null);

    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      classId: "",
    });

    setChildren([
      {
        name: "",
        classId: "",
      },
    ]);

    setTeacherAssignments([
      {
        sectionId: "",
        classId: "",
        subjectId: "",
      },
    ]);

    setSuccessMessage("");
  }

  // =========================================================
  // ADD CHILD
  // =========================================================

  function addChild() {
    setChildren((current) => [
      ...current,
      {
        name: "",
        classId: "",
      },
    ]);
  }

  // =========================================================
  // REMOVE CHILD
  // =========================================================

  function removeChild(index: number) {
    if (children.length === 1) return;

    setChildren((current) =>
      current.filter(
        (_, childIndex) =>
          childIndex !== index
      )
    );
  }

  // =========================================================
  // UPDATE CHILD
  // =========================================================

  function updateChild(
    index: number,
    field: keyof ChildForm,
    value: string
  ) {
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index
          ? {
              ...child,
              [field]: value,
            }
          : child
      )
    );
  }

  // =========================================================
  // SUBMIT ACCOUNT
  // =========================================================

  async function handleAddAccount(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!addType) return;

    // =========================================================
    // BASIC VALIDATION
    // =========================================================

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.dateOfBirth
    ) {
      alert(
        "Please complete the first name, last name and date of birth."
      );
      return;
    }

    if (
      addType === "Teacher" ||
      addType === "Parent"
    ) {
      if (!form.email.trim()) {
        alert("Email address is required.");
        return;
      }
    }

    if (
      addType === "Student" &&
      !form.classId
    ) {
      alert(
        "Please select a class for the student."
      );
      return;
    }

    // =========================================================
    // TEACHER ASSIGNMENT VALIDATION
    // =========================================================

    if (addType === "Teacher") {
      if (teacherAssignments.length === 0) {
        alert(
          "Please add at least one teaching assignment."
        );
        return;
      }

      const invalidAssignment =
        teacherAssignments.some(
          (assignment) =>
            !assignment.sectionId ||
            !assignment.classId ||
            !assignment.subjectId
        );

      if (invalidAssignment) {
        alert(
          "Please complete the section, class and subject for every teaching assignment."
        );
        return;
      }
    }

    // =========================================================
    // PARENT VALIDATION
    // =========================================================

    if (addType === "Parent") {
      const invalidChild = children.some(
        (child) =>
          !child.name.trim() ||
          !child.classId
      );

      if (invalidChild) {
        alert(
          "Please enter the name and class for every child."
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setSuccessMessage("");

      // =========================================================
      // SELECT API
      // =========================================================

      let endpoint = "";

      switch (addType) {
        case "Teacher":
          endpoint = "/api/admin/teachers";
          break;

        case "Parent":
          endpoint = "/api/admin/parents";
          break;

        case "Student":
          endpoint = "/api/admin/students";
          break;
      }

      // =========================================================
      // BUILD REQUEST BODY
      // =========================================================

      const body: Record<
        string,
        unknown
      > = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
      };

      // =========================================================
      // TEACHER
      // =========================================================

      if (addType === "Teacher") {
        body.email = form.email.trim();

        if (form.phone.trim()) {
          body.phone = form.phone.trim();
        }

        // IMPORTANT:
        // Multiple assignments can be sent.
        body.assignments =
          teacherAssignments.map(
            (assignment) => ({
              sectionId:
                assignment.sectionId,
              classId:
                assignment.classId,
              subjectId:
                assignment.subjectId,
            })
          );
      }

      // =========================================================
      // PARENT
      // =========================================================

      if (addType === "Parent") {
        body.email = form.email.trim();

        if (form.phone.trim()) {
          body.phone = form.phone.trim();
        }

        body.children = children.map(
          (child) => ({
            name: child.name.trim(),
            classId: child.classId,
          })
        );
      }

      // =========================================================
      // STUDENT
      // =========================================================

      if (addType === "Student") {
        body.classId = form.classId;
      }

      console.log(
        "================================="
      );
      console.log("CREATING ACCOUNT");
      console.log("TYPE:", addType);
      console.log("ENDPOINT:", endpoint);
      console.log("BODY:", body);
      console.log(
        "================================="
      );

      // =========================================================
      // SEND REQUEST
      // =========================================================

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      // =========================================================
      // READ RESPONSE
      // =========================================================

      const responseText =
        await response.text();

      console.log(
        "API STATUS:",
        response.status
      );

      console.log(
        "API RESPONSE:",
        responseText
      );

      let data: any = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error(
            "INVALID JSON FROM API:",
            responseText
          );

          throw new Error(
            `Server returned an invalid response (${response.status}).`
          );
        }
      }

      // =========================================================
      // API ERROR
      // =========================================================

      if (!response.ok) {
        const serverMessage =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
            ? data.message
            : typeof data?.details === "string"
            ? data.details
            : `Failed to add ${addType.toLowerCase()}.`;

        console.error(
          "ACCOUNT CREATION FAILED:",
          {
            status: response.status,
            endpoint,
            requestBody: body,
            response: data,
          }
        );

        throw new Error(serverMessage);
      }

      // =========================================================
      // SUCCESS
      // =========================================================

      console.log(
        `${addType} created successfully:`,
        data
      );

      if (
        addType === "Teacher" ||
        addType === "Parent"
      ) {
        setSuccessMessage(
          `${addType} account created successfully. A 4-digit access code has been sent to ${form.email.trim()}.`
        );
      } else {
        setSuccessMessage(
          "Student registered successfully. No access code was generated because students do not access the application."
        );
      }

      // =========================================================
      // ADD ACCOUNT TO TABLE
      // =========================================================

      if (data?.account) {
        setAccounts((previous) => [
          data.account,
          ...previous,
        ]);
      }

      // =========================================================
      // REFRESH COUNTS
      // =========================================================

      await loadAccountCounts();

      // =========================================================
      // CLEAR FORM
      // =========================================================

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        classId: "",
      });

      setChildren([
        {
          name: "",
          classId: "",
        },
      ]);

      setTeacherAssignments([
        {
          sectionId: "",
          classId: "",
          subjectId: "",
        },
      ]);

      // =========================================================
      // CLOSE MODAL
      // =========================================================

      setTimeout(() => {
        setShowAddModal(false);
        setAddType(null);
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        `ADD ${addType.toUpperCase()} ERROR:`,
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : `Unable to add ${addType.toLowerCase()}.`;

      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-72">
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          title="Account Management"
          subtitle="Manage students, teachers, and parents"
        />

        <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Manage Accounts
                </h1>

                <p className="mt-1 text-sm text-gray-900 dark:text-gray-400">
                  Manage teachers, parents and
                  students registered in
                  GradeFlow.
                </p>
              </div>
            </div>

            {/* =====================================================
                ACCOUNT CARDS
            ===================================================== */}

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {/* TEACHERS */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/accounts/teachers"
                  )
                }
                className="group w-full rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Users size={25} />
                  </div>

                  <Plus
                    size={20}
                    className="text-blue-600 transition group-hover:text-blue-700"
                  />
                </div>

                <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                  Teachers
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {countsLoading
                    ? "..."
                    : accountCounts.teachers}
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  View all teachers and add
                  new teachers
                </p>
              </button>

              {/* PARENTS */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/accounts/parents"
                  )
                }
                className="group w-full rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <UserRound size={25} />
                  </div>

                  <Plus
                    size={20}
                    className="text-purple-600 transition group-hover:text-purple-700"
                  />
                </div>

                <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                  Parents
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {countsLoading
                    ? "..."
                    : accountCounts.parents}
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  View all parents and add new
                  parents
                </p>
              </button>

              {/* STUDENTS */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/accounts/students"
                  )
                }
                className="group w-full rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:border-green-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <GraduationCap size={25} />
                  </div>

                  <Plus
                    size={20}
                    className="text-green-600 transition group-hover:text-green-700"
                  />
                </div>

                <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                  Students
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {countsLoading
                    ? "..."
                    : accountCounts.students}
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  View all students and add
                  new students
                </p>
              </button>
            </div>

            {/* =====================================================
                SEARCH AND FILTER
            ===================================================== */}

            <div className="mt-8 rounded-2xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    type="text"
                    placeholder="Search by name or email..."
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value)
                  }
                  className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="All">
                    All Accounts
                  </option>

                  <option value="Teacher">
                    Teachers
                  </option>

                  <option value="Parent">
                    Parents
                  </option>

                  <option value="Student">
                    Students
                  </option>
                </select>
              </div>
            </div>

            {/* =====================================================
                ACCOUNT TABLE
            ===================================================== */}

            <div className="mt-6 overflow-visible rounded-2xl border bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b px-6 py-5 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Accounts
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filteredAccounts.length}{" "}
                  account
                  {filteredAccounts.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4">
                        Name
                      </th>

                      <th className="px-6 py-4">
                        Role
                      </th>

                      <th className="px-6 py-4">
                        Email
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y dark:divide-gray-800">
                    {filteredAccounts.map(
                      (account) => (
                        <tr
                          key={account.id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                {account.name.charAt(
                                  0
                                )}
                              </div>

                              <span className="font-medium text-gray-900 dark:text-white">
                                {account.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {account.role}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {account.email ||
                              "—"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                account.status ===
                                "Active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  account.status ===
                                  "Active"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />

                              {account.status}
                            </span>
                          </td>

                          <td className="relative px-6 py-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuId(
                                  menuId ===
                                    account.id
                                    ? null
                                    : account.id
                                )
                              }
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                              <MoreVertical
                                size={19}
                              />
                            </button>

                            {menuId ===
                              account.id && (
                              <div className="absolute right-6 top-14 z-20 w-48 rounded-xl border bg-white p-2 text-left shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                {account.status !==
                                  "Active" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      activateAccount(
                                        account.id
                                      )
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                                  >
                                    <CheckCircle
                                      size={17}
                                    />

                                    Activate
                                    Account
                                  </button>
                                )}

                                {account.status ===
                                  "Active" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      suspendAccount(
                                        account.id
                                      )
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                  >
                                    <Ban
                                      size={17}
                                    />

                                    Suspend
                                    Account
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteAccount(
                                      account.id
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  <Trash2
                                    size={17}
                                  />

                                  Delete Account
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {filteredAccounts.length ===
                0 && (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                    <Users size={24} />
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                    No accounts found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your search or
                    filter.
                  </p>
                </div>
              )}
            </div>

            {/* =====================================================
                ADD ACCOUNT MODAL
            ===================================================== */}

            {showAddModal && addType && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
                onMouseDown={(e) => {
                  if (
                    e.target ===
                    e.currentTarget
                  ) {
                    closeAddModal();
                  }
                }}
              >
                <div
                  className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
                  onMouseDown={(e) =>
                    e.stopPropagation()
                  }
                >
                  <div className="absolute left-0 right-0 top-0 h-1.5 rounded-t-3xl bg-purple-700" />

                  {/* =================================================
                      HEADER
                  ================================================= */}

                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Add {addType}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {addType ===
                        "Student"
                          ? "Register a student in the school system."
                          : `Create a new ${addType.toLowerCase()} account.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeAddModal}
                      disabled={submitting}
                      className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  {/* =================================================
                      SUCCESS MESSAGE
                  ================================================= */}

                  {successMessage && (
                    <div className="mx-6 mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300">
                      <div className="flex items-start gap-3">
                        <CheckCircle
                          size={20}
                          className="mt-0.5 shrink-0"
                        />

                        <div>
                          <p className="font-semibold">
                            Account created
                          </p>

                          <p className="mt-1">
                            {successMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form
                    onSubmit={handleAddAccount}
                    className="space-y-6 p-6 sm:p-7"
                  >
                    {/* =================================================
                        BASIC INFORMATION
                    ================================================= */}

                    <div>
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          Personal Information
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Enter the basic information
                          for this account.
                        </p>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        {/* FIRST NAME */}

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            First Name
                          </label>

                          <input
                            type="text"
                            value={
                              form.firstName
                            }
                            onChange={(e) =>
                              setForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  firstName:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            placeholder="Enter first name"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                          />
                        </div>

                        {/* LAST NAME */}

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Last Name
                          </label>

                          <input
                            type="text"
                            value={
                              form.lastName
                            }
                            onChange={(e) =>
                              setForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  lastName:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            placeholder="Enter last name"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DATE OF BIRTH */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Date of Birth
                      </label>

                      <div className="relative">
                        <CalendarDays
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="date"
                          value={
                            form.dateOfBirth
                          }
                          onChange={(e) =>
                            setForm(
                              (previous) => ({
                                ...previous,
                                dateOfBirth:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 pl-11 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                        />
                      </div>
                    </div>

                    {/* =================================================
                        TEACHER / PARENT EMAIL
                    ================================================= */}

                    {(addType ===
                      "Teacher" ||
                      addType ===
                        "Parent") && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Email
                          </label>

                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                              setForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  email:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            placeholder="example@email.com"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                          />

                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            A 4-digit access code
                            will be generated
                            automatically and sent
                            to this email.
                          </p>
                        </div>

                        {/* PHONE */}

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Phone Number
                          </label>

                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) =>
                              setForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  phone:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            placeholder="Enter phone number"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                          />
                        </div>
                      </>
                    )}

                    {/* =================================================
                        TEACHER ASSIGNMENTS
                    ================================================= */}

                    {addType ===
                      "Teacher" && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              <BookOpen
                                size={21}
                              />
                            </div>

                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                Teaching Assignments
                              </h3>

                              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                Assign this teacher to
                                one or more sections,
                                classes and subjects.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={
                              addTeacherAssignment
                            }
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800"
                          >
                            <Plus size={16} />
                            Add Assignment
                          </button>
                        </div>

                        <div className="space-y-4">
                          {teacherAssignments.map(
                            (
                              assignment,
                              index
                            ) => {
                              const sectionClasses =
                                getClassesForSection(
                                  assignment.sectionId
                                );

                              return (
                                <div
                                  key={index}
                                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                                >
                                  <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        {index +
                                          1}
                                      </span>

                                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        Assignment{" "}
                                        {index +
                                          1}
                                      </span>
                                    </div>

                                    {teacherAssignments.length >
                                      1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeTeacherAssignment(
                                            index
                                          )
                                        }
                                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                        title="Remove assignment"
                                      >
                                        <Trash2
                                          size={
                                            17
                                          }
                                        />
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid gap-4 md:grid-cols-3">
                                    {/* SECTION */}

                                    <div>
                                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                        <Layers
                                          size={
                                            14
                                          }
                                        />
                                        Section
                                      </label>

                                      <select
                                        value={
                                          assignment.sectionId
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateTeacherAssignment(
                                            index,
                                            "sectionId",
                                            e
                                              .target
                                              .value
                                          )
                                        }
                                        required
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-950"
                                      >
                                        <option value="">
                                          {loadingSections
                                            ? "Loading sections..."
                                            : "Select section"}
                                        </option>

                                        {!loadingSections &&
                                          sections.length ===
                                            0 && (
                                            <option
                                              value=""
                                              disabled
                                            >
                                              No sections
                                              available
                                            </option>
                                          )}

                                        {sections.map(
                                          (
                                            section
                                          ) => (
                                            <option
                                              key={
                                                section.id
                                              }
                                              value={
                                                section.id
                                              }
                                            >
                                              {
                                                section.name
                                              }
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>

                                    {/* CLASS */}

                                    <div>
                                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                        <School
                                          size={
                                            14
                                          }
                                        />
                                        Class
                                      </label>

                                      <select
                                        value={
                                          assignment.classId
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateTeacherAssignment(
                                            index,
                                            "classId",
                                            e
                                              .target
                                              .value
                                          )
                                        }
                                        required
                                        disabled={
                                          !assignment.sectionId ||
                                          loadingClasses
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-950"
                                      >
                                        <option value="">
                                          {!assignment.sectionId
                                            ? "Select section first"
                                            : loadingClasses
                                            ? "Loading classes..."
                                            : "Select class"}
                                        </option>

                                        {assignment.sectionId &&
                                          sectionClasses.length ===
                                            0 && (
                                            <option
                                              value=""
                                              disabled
                                            >
                                              No classes in
                                              this section
                                            </option>
                                          )}

                                        {sectionClasses.map(
                                          (
                                            classItem
                                          ) => (
                                            <option
                                              key={
                                                classItem.id
                                              }
                                              value={
                                                classItem.id
                                              }
                                            >
                                              {
                                                classItem.name
                                              }
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>

                                    {/* SUBJECT */}

                                    <div>
                                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                        <BookOpen
                                          size={
                                            14
                                          }
                                        />
                                        Subject
                                      </label>

                                      <select
                                        value={
                                          assignment.subjectId
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateTeacherAssignment(
                                            index,
                                            "subjectId",
                                            e
                                              .target
                                              .value
                                          )
                                        }
                                        required
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-950"
                                      >
                                        <option value="">
                                          {loadingSubjects
                                            ? "Loading subjects..."
                                            : "Select subject"}
                                        </option>

                                        {!loadingSubjects &&
                                          subjects.length ===
                                            0 && (
                                            <option
                                              value=""
                                              disabled
                                            >
                                              No subjects
                                              available
                                            </option>
                                          )}

                                        {subjects.map(
                                          (
                                            subject
                                          ) => (
                                            <option
                                              key={
                                                subject.id
                                              }
                                              value={
                                                subject.id
                                              }
                                            >
                                              {
                                                subject.name
                                              }

                                              {subject.code
                                                ? ` (${subject.code})`
                                                : ""}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-blue-200 pt-4 text-xs text-gray-500 dark:border-blue-900/50 dark:text-gray-400">
                          <span>
                            {teacherAssignments.length}{" "}
                            assignment
                            {teacherAssignments.length !==
                            1
                              ? "s"
                              : ""}{" "}
                            added
                          </span>

                          <button
                            type="button"
                            onClick={
                              addTeacherAssignment
                            }
                            className="font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400"
                          >
                            + Add another
                            assignment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* =================================================
                        STUDENT CLASS
                    ================================================= */}

                    {addType ===
                      "Student" && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Class
                        </label>

                        <select
                          value={form.classId}
                          onChange={(e) =>
                            setForm(
                              (previous) => ({
                                ...previous,
                                classId:
                                  e.target
                                    .value,
                              })
                            )
                          }
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                        >
                          <option value="">
                            {loadingClasses
                              ? "Loading classes..."
                              : "Select class"}
                          </option>

                          {!loadingClasses &&
                            classes.length ===
                              0 && (
                              <option
                                value=""
                                disabled
                              >
                                No classes
                                available
                              </option>
                            )}

                          {classes.map(
                            (classItem) => (
                              <option
                                key={
                                  classItem.id
                                }
                                value={
                                  classItem.id
                                }
                              >
                                {classItem.name}
                              </option>
                            )
                          )}
                        </select>

                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Students are registered
                          for academic purposes and
                          do not receive an application
                          access code.
                        </p>
                      </div>
                    )}

                    {/* =================================================
                        NO PASSWORD SECTION
                    ================================================= */}

                    {(addType ===
                      "Teacher" ||
                      addType ===
                        "Parent") && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <CheckCircle
                              size={18}
                            />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                              No password required
                            </p>

                            <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-300">
                              The administrator does
                              not create or view the
                              password. The system
                              automatically generates a
                              4-digit access code and
                              sends it to the user's
                              email.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =================================================
                        PARENT CHILDREN
                    ================================================= */}

                    {addType ===
                      "Parent" && (
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 dark:border-purple-900/50 dark:bg-purple-950/20">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              <GraduationCap
                                size={21}
                              />
                            </div>

                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                Children
                              </h3>

                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Add the children
                                belonging to this parent
                                and assign each child to a
                                class.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={addChild}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-700 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-800"
                          >
                            <UserPlus
                              size={16}
                            />
                            Add Child
                          </button>
                        </div>

                        <div className="space-y-4">
                          {children.map(
                            (
                              child,
                              index
                            ) => (
                              <div
                                key={index}
                                className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                              >
                                <div className="mb-4 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                      {index +
                                        1}
                                    </span>

                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      Child{" "}
                                      {index +
                                        1}
                                    </span>
                                  </div>

                                  {children.length >
                                    1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeChild(
                                          index
                                        )
                                      }
                                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                    >
                                      <Trash2
                                        size={
                                          17
                                        }
                                      />
                                    </button>
                                  )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                      Child's Name
                                    </label>

                                    <input
                                      type="text"
                                      value={
                                        child.name
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateChild(
                                          index,
                                          "name",
                                          e.target
                                            .value
                                        )
                                      }
                                      placeholder="Enter child's full name"
                                      required
                                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                      Class
                                    </label>

                                    <select
                                      value={
                                        child.classId
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateChild(
                                          index,
                                          "classId",
                                          e.target
                                            .value
                                        )
                                      }
                                      required
                                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
                                    >
                                      <option value="">
                                        {loadingClasses
                                          ? "Loading classes..."
                                          : "Select class"}
                                      </option>

                                      {classes.map(
                                        (
                                          classItem
                                        ) => (
                                          <option
                                            key={
                                              classItem.id
                                            }
                                            value={
                                              classItem.id
                                            }
                                          >
                                            {
                                              classItem.name
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {children.length}{" "}
                            child
                            {children.length !==
                            1
                              ? "ren"
                              : ""}{" "}
                            added
                          </span>

                          <button
                            type="button"
                            onClick={addChild}
                            className="font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-400"
                          >
                            + Add another child
                          </button>
                        </div>
                      </div>
                    )}

                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
                      <button
                        type="button"
                        onClick={closeAddModal}
                        disabled={submitting}
                        className="rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={18} />
                            Add {addType}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}