
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";

import AdminSidebar from "@/components/admin/SideBar";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import ParentSidebar from "@/components/parent/SideBar";

/* =========================================================
   TYPES
========================================================= */

type Group = {
  id: string;
  name: string;
  description?: string | null;
  memberCount?: number;
  messageCount?: number;
};

type Member = {
  id: string;
  name: string;
  role?: string;
  image?: string | null;
};

type Message = {
  id: string;
  message: string;
  createdAt: string;

  sender?: {
    id: string;
    name: string;
    role?: string;
    image?: string | null;
  };

  /*
   * This is kept as a fallback in case your API still
   * returns the Prisma "user" object.
   */
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string;
    image?: string | null;
  };
};

type SelectedGroup = {
  id: string;
  name: string;
  description?: string | null;
  memberCount?: number;
  messageCount?: number;
  members: Member[];
  messages: Message[];
};

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function getUserName(message: Message): string {
  /*
   * First use the clean sender.name returned by the fixed API.
   */
  if (message.sender?.name?.trim()) {
    return message.sender.name.trim();
  }

  /*
   * Fallback for an API that still returns:
   *
   * user: {
   *   firstName,
   *   lastName
   * }
   */
  if (message.user) {
    const firstName = message.user.firstName?.trim() || "";
    const lastName = message.user.lastName?.trim() || "";

    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }
  }

  return "Unknown User";
}

function getUserRole(message: Message): string {
  return (
    message.sender?.role ||
    message.user?.role ||
    ""
  );
}

function getInitials(name: string): string {
  const cleanName = name.trim();

  if (!cleanName) {
    return "U";
  }

  const parts = cleanName.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
}

/* =========================================================
   PAGE
========================================================= */

export default function ClassGroupsPage() {
  const { data: session, status } = useSession();

  const [groups, setGroups] = useState<Group[]>([]);

  const [selectedGroup, setSelectedGroup] =
    useState<SelectedGroup | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadingGroup, setLoadingGroup] =
    useState(false);

  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState("");

  /*
   * Admin and Parent sidebars are controlled.
   * Teacher sidebar manages its own state.
   */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = String(
    session?.user?.role ??
      session?.user?.roles?.[0] ??
      ""
  ).toUpperCase();

  /* =========================================================
     LOAD CLASS GROUPS
  ========================================================= */

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadGroups() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/class-groups",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load class groups"
          );
        }

        const data = await response.json();

        /*
         * The fixed API now returns:
         *
         * {
         *   id,
         *   name,
         *   description,
         *   memberCount,
         *   messageCount
         * }
         */
        const loadedGroups: Group[] = Array.isArray(
          data?.groups
        )
          ? data.groups
          : [];

        setGroups(loadedGroups);
      } catch (error) {
        console.error(
          "Failed to load class groups:",
          error
        );

        setGroups([]);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [status]);

  /* =========================================================
     LOAD SELECTED GROUP
  ========================================================= */

 async function openGroup(groupId: string) {
  try {
    setLoadingGroup(true);

    const response = await fetch(
      `/api/class-groups/${groupId}`,
      {
        cache: "no-store",
      }
    );

    // Read the API response even when it is an error
    const data = await response.json().catch(() => null);

    console.log("CLASS GROUP API STATUS:", response.status);
    console.log("CLASS GROUP API RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Failed to load group. Server returned ${response.status}.`
      );
    }

    const group = data?.group ?? data;

    const normalizedGroup: SelectedGroup = {
      ...group,

      members: Array.isArray(group?.members)
        ? group.members
        : [],

      messages: Array.isArray(group?.messages)
        ? group.messages
        : [],

      memberCount:
        typeof group?.memberCount === "number"
          ? group.memberCount
          : Array.isArray(group?.members)
          ? group.members.length
          : 0,

      messageCount:
        typeof group?.messageCount === "number"
          ? group.messageCount
          : Array.isArray(group?.messages)
          ? group.messages.length
          : 0,
    };

    console.log(
      "NORMALIZED CLASS GROUP:",
      normalizedGroup
    );

    setSelectedGroup(normalizedGroup);
  } catch (error) {
    console.error(
      "Failed to load group:",
      error
    );

    setSelectedGroup(null);
  } finally {
    setLoadingGroup(false);
  }
}

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  async function sendMessage() {
    const trimmed = message.trim();

    if (
      !trimmed ||
      !selectedGroup ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `/api/class-groups/${selectedGroup.id}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: trimmed,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to send message"
        );
      }

      const data = await response.json();

      setMessage("");

      /*
       * The fixed API returns:
       *
       * {
       *   message: {
       *     id,
       *     message,
       *     createdAt,
       *     sender: {
       *       id,
       *       name,
       *       role
       *     }
       *   }
       * }
       */
      if (data?.message) {
        setSelectedGroup((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            messages: [
              ...current.messages,
              data.message,
            ],

            messageCount:
              (current.messageCount ?? 0) + 1,
          };
        });
      } else {
        /*
         * Reload the group in case the API returns
         * no message object.
         */
        await openGroup(selectedGroup.id);
      }
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );
    } finally {
      setSending(false);
    }
  }

  /* =========================================================
     ENTER KEY
  ========================================================= */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  /* =========================================================
     LOADING SESSION
  ========================================================= */

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
      </div>
    );
  }

  /* =========================================================
     SIDEBAR
  ========================================================= */

  function renderSidebar() {
    if (
      role === "ADMIN" ||
      role === "SCHOOL_ADMIN"
    ) {
      return (
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      );
    }

    if (role === "TEACHER") {
      return <TeacherSidebar />;
    }

    if (role === "PARENT") {
      return (
        <ParentSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      );
    }

    return null;
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {renderSidebar()}

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="mb-6">
            <div className="flex items-center gap-3">

              {selectedGroup && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGroup(null)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Back to class groups"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedGroup
                    ? selectedGroup.name
                    : "Class Groups"}
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedGroup
                    ? selectedGroup.description ||
                      "Communicate with members of this class group."
                    : "Connect and communicate with your class community."}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          {selectedGroup ? (
            /* =================================================
               CHAT
            ================================================= */

            <div className="flex min-h-[calc(100vh-150px)] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

              {/* =================================================
                  GROUP HEADER
              ================================================= */}

              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Users size={22} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedGroup.name}
                    </h2>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">

                      <span className="flex items-center gap-1">
                        <Users size={13} />

                        {selectedGroup.memberCount ??
                          selectedGroup.members
                            ?.length ??
                          0}{" "}
                        {(
                          selectedGroup.memberCount ??
                          selectedGroup.members
                            ?.length ??
                          0
                        ) === 1
                          ? "member"
                          : "members"}
                      </span>

                      <span>
                        •
                      </span>

                      <span className="flex items-center gap-1">
                        <MessageCircle
                          size={13}
                        />

                        {selectedGroup.messageCount ??
                          selectedGroup.messages
                            ?.length ??
                          0}{" "}
                        {(
                          selectedGroup.messageCount ??
                          selectedGroup.messages
                            ?.length ??
                          0
                        ) === 1
                          ? "message"
                          : "messages"}
                      </span>

                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  MESSAGES
              ================================================= */}

              <div className="flex-1 space-y-4 overflow-y-auto p-5">

                {loadingGroup ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-purple-700" />
                  </div>
                ) : selectedGroup.messages?.length ? (

                  selectedGroup.messages.map(
                    (item) => {
                      /*
                       * IMPORTANT:
                       *
                       * We now get the real name using
                       * message.sender.name.
                       *
                       * There is also a fallback for
                       * message.user.firstName/lastName.
                       */
                      const senderName =
                        getUserName(item);

                      const senderRole =
                        getUserRole(item);

                      const initials =
                        getInitials(
                          senderName
                        );

                      return (
                        <div
                          key={item.id}
                          className="flex gap-3"
                        >

                          {/* AVATAR */}

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {initials}
                          </div>

                          {/* MESSAGE CONTENT */}

                          <div className="min-w-0 max-w-3xl">

                            {/* SENDER NAME */}

                            <div className="mb-1 flex flex-wrap items-center gap-2">

                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {senderName}
                              </span>

                              {senderRole && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  {senderRole}
                                </span>
                              )}

                            </div>

                            {/* MESSAGE BUBBLE */}

                            <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3 dark:bg-gray-800">

                              <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-200">
                                {item.message}
                              </p>

                            </div>

                            {/* TIME */}

                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatDate(
                                item.createdAt
                              )}
                            </p>

                          </div>
                        </div>
                      );
                    }
                  )

                ) : (

                  <div className="flex h-full flex-col items-center justify-center text-center">

                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <MessageCircle size={30} />
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      No messages yet
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                      Be the first person to send
                      a message in this class
                      group.
                    </p>

                  </div>
                )}

              </div>

              {/* =================================================
                  MESSAGE INPUT
              ================================================= */}

              <div className="border-t border-gray-200 p-4 dark:border-gray-800">

                <div className="flex items-end gap-3">

                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message..."
                    rows={2}
                    className="min-h-[50px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      !message.trim() ||
                      sending
                    }
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-[11px] text-gray-400">
                  Press Enter to send · Shift +
                  Enter for a new line
                </p>

              </div>
            </div>

          ) : (

            /* =================================================
               GROUP LIST
            ================================================= */

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {loading ? (

                <div className="col-span-full flex min-h-[300px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                </div>

              ) : groups.length === 0 ? (

                <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-center dark:border-gray-700 dark:bg-gray-900">

                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Users size={30} />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No class groups
                  </h2>

                  <p className="mt-1 max-w-md px-4 text-sm text-gray-500 dark:text-gray-400">
                    You do not have access to any
                    class groups yet.
                  </p>

                </div>

              ) : (

                groups.map((group) => {

                  const memberCount =
                    group.memberCount ?? 0;

                  const messageCount =
                    group.messageCount ?? 0;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        openGroup(group.id)
                      }
                      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
                    >

                      {/* ICONS */}

                      <div className="mb-4 flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-300">
                          <Users size={23} />
                        </div>

                        <MessageCircle
                          size={19}
                          className="text-gray-400 transition group-hover:text-purple-600"
                        />

                      </div>

                      {/* GROUP NAME */}

                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {group.name}
                      </h2>

                      {/* DESCRIPTION */}

                      {group.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                          {group.description}
                        </p>
                      )}

                      {/* =================================================
                          MEMBER + MESSAGE COUNTS
                      ================================================= */}

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">

                        {/* MEMBERS */}

                        <div className="flex items-center gap-1.5">

                          <Users size={15} />

                          <span>
                            {memberCount}{" "}
                            {memberCount === 1
                              ? "member"
                              : "members"}
                          </span>

                        </div>

                        {/* MESSAGES */}

                        <div className="flex items-center gap-1.5">

                          <MessageCircle
                            size={15}
                          />

                          <span>
                            {messageCount}{" "}
                            {messageCount === 1
                              ? "message"
                              : "messages"}
                          </span>

                        </div>

                      </div>

                    </button>
                  );
                })
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

