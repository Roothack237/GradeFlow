"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Users,
  UserRound,
  Plus,
  MoreVertical,
  CheckCircle,
  Ban,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

type Account = {
  id: number;
  name: string;
  email: string;
  role: "Teacher" | "Parent";
  status: "Active" | "Suspended";
};

const initialAccounts: Account[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Teacher",
    status: "Active",
  },
  {
    id: 2,
    name: "Mary Smith",
    email: "mary@example.com",
    role: "Parent",
    status: "Active",
  },
  {
    id: 3,
    name: "Peter Johnson",
    email: "peter@example.com",
    role: "Teacher",
    status: "Suspended",
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "Parent",
    status: "Active",
  },
];

export default function ManageAccountsPage() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [menuId, setMenuId] = useState<number | null>(null);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(search.toLowerCase()) ||
      account.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || account.role === filter;

    return matchesSearch && matchesFilter;
  });

  function activateAccount(id: number) {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id
          ? { ...account, status: "Active" }
          : account
      )
    );

    setMenuId(null);
  }

  function suspendAccount(id: number) {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id
          ? { ...account, status: "Suspended" }
          : account
      )
    );

    setMenuId(null);
  }

  function deleteAccount(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this account?"
    );

    if (!confirmed) return;

    setAccounts((current) =>
      current.filter((account) => account.id !== id)
    );

    setMenuId(null);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-5 dark:bg-gray-950 sm:p-8">

      <div className="mx-auto max-w-7xl">

        {/* Back */}

        <Link
          href="/admin/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-purple-600"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        {/* Header */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Accounts
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage teachers and parents registered in GradeFlow.
            </p>
          </div>

        </div>

        {/* Account cards */}

        <div className="mt-8 grid gap-5 md:grid-cols-2">

          {/* Teachers */}

          <Link
            href="/admin/accounts/teachers/add"
            className="group rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <Users size={25} />
              </div>

              <Plus
                size={20}
                className="text-gray-400 transition group-hover:text-purple-600"
              />

            </div>

            <p className="mt-5 text-sm text-gray-500">
              Teachers
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
             0
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add a new teacher account
            </p>

          </Link>

          {/* Parents */}

          <Link
            href="/admin/accounts/parents/add"
            className="group rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <UserRound size={25} />
              </div>

              <Plus
                size={20}
                className="text-gray-400 transition group-hover:text-blue-600"
              />

            </div>

            <p className="mt-5 text-sm text-gray-500">
              Parents
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
             0
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add a new parent account
            </p>

          </Link>

          {/* Students */}

          <Link
            href="/admin/accounts/students/add"
            className="group rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <UserRound size={25} />
              </div>

              <Plus
                size={20}
                className="text-gray-400 transition group-hover:text-blue-600"
              />

            </div>

            <p className="mt-5 text-sm text-gray-500">
              Students
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add a new student account
            </p>

          </Link>

          <Link
              href="/admin/classes"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-start justify-between">
              <BookOpen className="mb-4 text-purple-600" size={28} />

              
              <Plus
                size={20}
                className="text-gray-400 transition group-hover:text-blue-600"
              />

            </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Classes
              </h3>

        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage school classes
              </p>
          </Link>



          
          

        </div>

        {/* Search and filter */}

        <div className="mt-8 rounded-2xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

          <div className="flex flex-col gap-4 md:flex-row">

            {/* Search */}

            <div className="relative flex-1">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by name or email..."
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-950"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={17} />
                </button>
              )}

            </div>

            {/* Filter */}

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="All">All Accounts</option>
              <option value="Teacher">Teachers</option>
              <option value="Parent">Parents</option>
            </select>

          </div>

        </div>

        {/* Account table */}

        <div className="mt-6 overflow-visible rounded-2xl border bg-white dark:border-gray-800 dark:bg-gray-900">

          <div className="border-b px-6 py-5 dark:border-gray-800">

            <h2 className="font-bold text-gray-900 dark:text-white">
              Accounts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredAccounts.length} account
              {filteredAccounts.length !== 1 ? "s" : ""} found
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

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

                {filteredAccounts.map((account) => (

                  <tr
                    key={account.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >

                    {/* Name */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {account.name.charAt(0)}
                        </div>

                        <span className="font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </span>

                      </div>

                    </td>

                    {/* Role */}

                    <td className="px-6 py-5">

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {account.role}
                      </span>

                    </td>

                    {/* Email */}

                    <td className="px-6 py-5 text-sm text-gray-500">
                      {account.email}
                    </td>

                    {/* Status */}

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          account.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            account.status === "Active"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />

                        {account.status}

                      </span>

                    </td>

                    {/* Actions */}

                    <td className="relative px-6 py-5 text-right">

                      <button
                        onClick={() =>
                          setMenuId(
                            menuId === account.id
                              ? null
                              : account.id
                          )
                        }
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <MoreVertical size={19} />
                      </button>

                      {menuId === account.id && (

                        <div className="absolute right-6 top-14 z-20 w-48 rounded-xl border bg-white p-2 text-left shadow-xl dark:border-gray-700 dark:bg-gray-900">

                          {/* Activate */}

                          {account.status !== "Active" && (

                            <button
                              onClick={() =>
                                activateAccount(account.id)
                              }
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                            >
                              <CheckCircle size={17} />
                              Activate Account
                            </button>

                          )}

                          {/* Suspend */}

                          {account.status === "Active" && (

                            <button
                              onClick={() =>
                                suspendAccount(account.id)
                              }
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                            >
                              <Ban size={17} />
                              Suspend Account
                            </button>

                          )}

                          {/* Delete */}

                          <button
                            onClick={() =>
                              deleteAccount(account.id)
                            }
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={17} />
                            Delete Account
                          </button>

                        </div>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {/* Empty state */}

          {filteredAccounts.length === 0 && (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <Users size={24} />
              </div>

              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                No accounts found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filter.
              </p>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}