"use client";

import { useMemo, useState } from "react";
import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type ForumType = "ADMIN_TEACHER" | "TEACHER_PARENT";

type Conversation = {
  id: string;
  name: string;
  role: string;
  type: ForumType;
  lastMessage: string;
  time: string;
  unread: number;
  initials: string;
};

type Message = {
  id: string;
  sender: string;
  role: string;
  message: string;
  time: string;
  isMine: boolean;
};

const conversations: Conversation[] = [
  {
    id: "1",
    name: "John Kamga",
    role: "Mathematics Teacher",
    type: "ADMIN_TEACHER",
    lastMessage: "I have uploaded the students' marks.",
    time: "10:42 AM",
    unread: 2,
    initials: "JK",
  },
  {
    id: "2",
    name: "Sarah Mbarga",
    role: "English Teacher",
    type: "ADMIN_TEACHER",
    lastMessage: "Can we discuss the timetable?",
    time: "Yesterday",
    unread: 0,
    initials: "SM",
  },
  {
    id: "3",
    name: "Mr. Daniel",
    role: "Parent",
    type: "TEACHER_PARENT",
    lastMessage: "Thank you for the update.",
    time: "Yesterday",
    unread: 1,
    initials: "MD",
  },
  {
    id: "4",
    name: "Mrs. Grace",
    role: "Parent",
    type: "TEACHER_PARENT",
    lastMessage: "My daughter will be absent tomorrow.",
    time: "Monday",
    unread: 0,
    initials: "MG",
  },
];

const initialMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      sender: "John Kamga",
      role: "Mathematics Teacher",
      message:
        "Good morning. I have finished entering the Mathematics marks for Form 5.",
      time: "10:35 AM",
      isMine: false,
    },
    {
      id: "m2",
      sender: "Admin",
      role: "Administrator",
      message:
        "Good morning John. Thank you. Have you checked that all students have their CA and exam marks?",
      time: "10:38 AM",
      isMine: true,
    },
    {
      id: "m3",
      sender: "John Kamga",
      role: "Mathematics Teacher",
      message:
        "Yes, everything has been checked. I have uploaded the students' marks.",
      time: "10:42 AM",
      isMine: false,
    },
  ],
  "2": [
    {
      id: "m4",
      sender: "Sarah Mbarga",
      role: "English Teacher",
      message:
        "Can we discuss the timetable for next week's classes?",
      time: "Yesterday",
      isMine: false,
    },
  ],
  "3": [
    {
      id: "m5",
      sender: "Mr. Daniel",
      role: "Parent",
      message:
        "I wanted to ask about my son's recent Mathematics performance.",
      time: "Yesterday",
      isMine: false,
    },
    {
      id: "m6",
      sender: "Admin",
      role: "Administrator",
      message:
        "Thank you for reaching out. I will ask his Mathematics teacher to review his performance.",
      time: "Yesterday",
      isMine: true,
    },
    {
      id: "m7",
      sender: "Mr. Daniel",
      role: "Parent",
      message: "Thank you for the update.",
      time: "Yesterday",
      isMine: false,
    },
  ],
  "4": [
    {
      id: "m8",
      sender: "Mrs. Grace",
      role: "Parent",
      message:
        "My daughter will be absent tomorrow because of a family matter.",
      time: "Monday",
      isMine: false,
    },
  ],
};

export default function ForumsPage() {
  const [activeType, setActiveType] =
    useState<ForumType>("ADMIN_TEACHER");

  const [selectedId, setSelectedId] = useState("1");

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [messages, setMessages] =
    useState<Record<string, Message[]>>(initialMessages);

  const [showNewConversation, setShowNewConversation] =
    useState(false);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesType =
        conversation.type === activeType;

      const matchesSearch =
        conversation.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        conversation.lastMessage
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [activeType, search]);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedId
    ) ?? filteredConversations[0];

  const selectedMessages =
    selectedConversation
      ? messages[selectedConversation.id] ?? []
      : [];

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "Admin",
      role: "Administrator",
      message: message.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMine: true,
    };

    setMessages((previous) => ({
      ...previous,
      [selectedConversation.id]: [
        ...(previous[selectedConversation.id] ?? []),
        newMessage,
      ],
    }));

    setMessage("");
  };

  const handleChangeForum = (type: ForumType) => {
    setActiveType(type);

    const firstConversation = conversations.find(
      (conversation) => conversation.type === type
    );

    if (firstConversation) {
      setSelectedId(firstConversation.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="lg:ml-72">
        <Navbar title="Forums" />

        <main className="p-5 sm:p-8">
          {/* PAGE HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Forums
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Communicate with teachers and parents through
              dedicated forums.
            </p>
          </div>

          {/* FORUM TYPE TABS */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={() =>
                  handleChangeForum("ADMIN_TEACHER")
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeType === "ADMIN_TEACHER"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                Admin & Teachers
              </button>

              <button
                type="button"
                onClick={() =>
                  handleChangeForum("TEACHER_PARENT")
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeType === "TEACHER_PARENT"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                Teachers & Parents
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowNewConversation(true)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + New Conversation
            </button>
          </div>

          {/* MAIN FORUM */}
          <div className="grid min-h-[650px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[340px_1fr]">
            {/* CONVERSATION SIDEBAR */}
            <div className="border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r">
              {/* SEARCH */}
              <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search conversations..."
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pl-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />

                  <span className="absolute left-3 top-3 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>

              {/* CONVERSATION LIST */}
              <div className="max-h-[560px] overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No conversations found.
                  </div>
                ) : (
                  filteredConversations.map(
                    (conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          handleSelectConversation(
                            conversation.id
                          )
                        }
                        className={`flex w-full gap-3 border-b border-gray-100 p-4 text-left transition dark:border-gray-800 ${
                          selectedConversation?.id ===
                          conversation.id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        {/* AVATAR */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {conversation.initials}
                        </div>

                        {/* INFO */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {conversation.name}
                            </p>

                            <span className="shrink-0 text-[11px] text-gray-400">
                              {conversation.time}
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {conversation.role}
                          </p>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {conversation.lastMessage}
                            </p>

                            {conversation.unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                {conversation.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            </div>

            {/* CHAT PANEL */}
            <div className="flex min-h-[650px] flex-col">
              {selectedConversation ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {selectedConversation.initials}
                      </div>

                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.name}
                        </h2>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedConversation.role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      title="More options"
                    >
                      ⋮
                    </button>
                  </div>

                  {/* MESSAGES */}
                  <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50/70 p-5 dark:bg-gray-950/40">
                    {selectedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[65%] ${
                            msg.isMine
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          {!msg.isMine && (
                            <p className="mb-1 ml-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {msg.sender}
                            </p>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                              msg.isMine
                                ? "rounded-br-md bg-blue-600 text-white"
                                : "rounded-bl-md border border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                            }`}
                          >
                            {msg.message}
                          </div>

                          <p
                            className={`mt-1 text-[10px] text-gray-400 ${
                              msg.isMine
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MESSAGE INPUT */}
                  <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <textarea
                          value={message}
                          onChange={(e) =>
                            setMessage(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey
                            ) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows={2}
                          placeholder="Write a message..."
                          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-gray-400">
                      Press Enter to send · Shift + Enter for
                      a new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-900/30">
                      💬
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Select a conversation
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose a conversation to start
                      communicating.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* NEW CONVERSATION MODAL */}
      {showNewConversation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewConversation(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  New Conversation
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start a new forum conversation.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNewConversation(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recipient
                </label>

                <select className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option value="">
                    Select recipient
                  </option>
                  {conversations
                    .filter(
                      (conversation) =>
                        conversation.type === activeType
                    )
                    .map((conversation) => (
                      <option
                        key={conversation.id}
                        value={conversation.id}
                      >
                        {conversation.name} —{" "}
                        {conversation.role}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>

                <input
                  type="text"
                  placeholder="Enter conversation subject"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>

                <textarea
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() =>
                    setShowNewConversation(false)
                  }
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowNewConversation(false)
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}