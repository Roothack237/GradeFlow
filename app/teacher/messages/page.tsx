"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  CheckCheck,
  MessageSquare,
  User,
} from "lucide-react";

type Conversation = {
  id: number;
  parent: string;
  student: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
};

type Message = {
  id: number;
  sender: "teacher" | "parent";
  text: string;
  time: string;
};

const conversations: Conversation[] = [
  {
    id: 1,
    parent: "Mrs. Johnson",
    student: "Sarah Johnson",
    avatar: "J",
    lastMessage: "Thank you for the update, teacher.",
    time: "10:42 AM",
    unread: 2,
  },
  {
    id: 2,
    parent: "Mr. Williams",
    student: "Peter Williams",
    avatar: "W",
    lastMessage: "I will discuss this with him.",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 3,
    parent: "Mrs. Smith",
    student: "Mary Smith",
    avatar: "S",
    lastMessage: "Could you please send me her results?",
    time: "Monday",
    unread: 1,
  },
  {
    id: 4,
    parent: "Mr. Anderson",
    student: "David Anderson",
    avatar: "A",
    lastMessage: "Good afternoon teacher.",
    time: "Sunday",
    unread: 0,
  },
];

const conversationMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      sender: "parent",
      text: "Good morning teacher. I wanted to ask about Sarah's Mathematics performance.",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "teacher",
      text: "Good morning Mrs. Johnson. Sarah is doing fairly well, but she needs to practice algebra more consistently.",
      time: "10:34 AM",
    },
    {
      id: 3,
      sender: "parent",
      text: "Thank you. Is there anything specific she should work on at home?",
      time: "10:38 AM",
    },
    {
      id: 4,
      sender: "teacher",
      text: "I recommend reviewing the recent exercises and completing a few additional algebra problems each evening.",
      time: "10:40 AM",
    },
    {
      id: 5,
      sender: "parent",
      text: "Thank you for the update, teacher.",
      time: "10:42 AM",
    },
  ],

  2: [
    {
      id: 1,
      sender: "teacher",
      text: "Good afternoon Mr. Williams. Peter has missed several Mathematics lessons recently.",
      time: "Yesterday",
    },
    {
      id: 2,
      sender: "parent",
      text: "Thank you for letting me know. I will discuss this with him.",
      time: "Yesterday",
    },
  ],

  3: [
    {
      id: 1,
      sender: "parent",
      text: "Good morning teacher. Could you please send me Mary's latest results?",
      time: "Monday",
    },
  ],

  4: [
    {
      id: 1,
      sender: "parent",
      text: "Good afternoon teacher.",
      time: "Sunday",
    },
  ],
};

export default function TeacherMessagesPage() {
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const messages = conversationMessages[selectedId] ?? [];

  const filteredConversations = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.parent.toLowerCase().includes(value) ||
        conversation.student.toLowerCase().includes(value) ||
        conversation.lastMessage.toLowerCase().includes(value)
    );
  }, [search]);

  function handleSendMessage() {
    if (!message.trim()) return;

    console.log("Sending message:", {
      conversationId: selectedId,
      message,
    });

    setMessage("");
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        {/* Page Header */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <MessageSquare size={21} />
            </div>

            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Communication
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Parent Messages
          </h1>

          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Communicate directly with parents and guardians.
          </p>
        </div>

        {/* Messages Container */}
        <div className="grid h-[calc(100vh-235px)] min-h-[600px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[330px_1fr]">
          {/* Conversation List */}
          <aside className="flex min-h-0 flex-col border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r">
            {/* Search */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parents..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Conversation Count */}
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Conversations
              </p>
            </div>

            {/* Conversations */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No conversations found.
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const active = conversation.id === selectedId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={`w-full border-b border-gray-100 p-4 text-left transition dark:border-gray-800 ${
                        active
                          ? "bg-purple-50 dark:bg-purple-950/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full font-bold ${
                              active
                                ? "bg-purple-700 text-white"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            }`}
                          >
                            {conversation.avatar}
                          </div>

                          {conversation.unread > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {conversation.unread}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {conversation.parent}
                            </p>

                            <span className="shrink-0 text-[10px] text-gray-400">
                              {conversation.time}
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                            Parent of {conversation.student}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <section className="flex min-h-0 flex-col">
            {/* Chat Header */}
            {selectedConversation && (
              <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {selectedConversation.avatar}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.parent}
                    </h2>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Parent of {selectedConversation.student}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="More options"
                >
                  <MoreVertical size={19} />
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-gray-50/70 p-5 dark:bg-gray-950/30 sm:p-6">
              {messages.map((item) => {
                const teacher = item.sender === "teacher";

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 ${
                      teacher ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!teacher && (
                      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 sm:flex">
                        <User size={15} />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] ${
                        teacher ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                          teacher
                            ? "rounded-br-md bg-purple-700 text-white"
                            : "rounded-bl-md bg-white text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {item.text}
                      </div>

                      <div
                        className={`mt-1 flex items-center gap-1 text-[10px] text-gray-400 ${
                          teacher ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>{item.time}</span>

                        {teacher && (
                          <CheckCheck
                            size={13}
                            className="text-purple-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 focus-within:border-purple-400 dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-purple-600 dark:hover:bg-gray-700"
                  aria-label="Attach file"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                Messages are shared securely with the selected parent.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}