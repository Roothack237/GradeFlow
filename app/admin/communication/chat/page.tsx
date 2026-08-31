"use client";

import { useEffect, useRef, useState } from "react";

import Sidebar from "@/components/admin/SideBar";
import Navbar from "@/components/admin/NavBar";

type Message = {
  id: number;
  role: "user" | "ella";
  content: string;
  time: string;
};

const suggestedQuestions = [
  "Which students are performing poorly?",
  "Which classes have low attendance?",
  "Give me recommendations to improve student performance.",
  "Which subjects have the highest failure rate?",
];

const initialMessages: Message[] = [
  {
    id: 1,
    role: "ella",
    content:
      "Hello! I'm Ella, your GradeFlow AI assistant. I can help you analyze student performance, attendance, results, classes, and other school data. How can I help you today?",
    time: "Now",
  },
];

export default function EllaAIPage() {
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  // =========================================================
  // GET CURRENT TIME
  // =========================================================

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // GENERATE DEMO RESPONSE
  // =========================================================

  const generateDemoResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();

    if (
      lowerQuestion.includes("poorly") ||
      lowerQuestion.includes("weak")
    ) {
      return "I can help identify students who are performing below the expected level. Once Ella is connected to your GradeFlow student and results data, I will analyze averages, subject performance, and trends to identify students who may need additional support.";
    }

    if (
      lowerQuestion.includes("attendance") ||
      lowerQuestion.includes("absent")
    ) {
      return "I can analyze attendance records and identify students or classes with frequent absences. I can also highlight students who exceed your school's attendance threshold and may require follow-up.";
    }

    if (
      lowerQuestion.includes("failure") ||
      lowerQuestion.includes("fail")
    ) {
      return "I can analyze examination and continuous-assessment results to identify subjects with high failure rates. I can also compare performance between classes and recommend areas that require attention.";
    }

    if (
      lowerQuestion.includes("recommend") ||
      lowerQuestion.includes("improve")
    ) {
      return "Based on GradeFlow data, Ella can provide recommendations such as targeted revision, additional exercises, student intervention, parent communication, attendance follow-up, and teaching strategies for subjects where performance is low.";
    }

    return "That's a good question. I'm currently running in demo mode. Once connected to the GradeFlow AI backend, Ella will be able to analyze your school's real student, attendance, result, and academic-management data and provide a detailed answer.";
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = async (
    messageText?: string
  ) => {
    const text = (messageText ?? input).trim();

    if (!text || sending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      time: getCurrentTime(),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");
    setSending(true);

    // Demo AI delay
    setTimeout(() => {
      const ellaMessage: Message = {
        id: Date.now() + 1,
        role: "ella",
        content: generateDemoResponse(text),
        time: getCurrentTime(),
      };

      setMessages((previous) => [
        ...previous,
        ellaMessage,
      ]);

      setSending(false);
    }, 900);
  };

  // =========================================================
  // HANDLE ENTER
  // =========================================================

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // =========================================================
  // CLEAR CHAT
  // =========================================================

  const clearChat = () => {
    setMessages(initialMessages);
    setInput("");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="lg:ml-72">
        {/* NAVBAR */}
        <Navbar title="Ella AI" />

        <main className="p-5 sm:p-8">

          {/* PAGE HEADER */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-3">

                {/* ELLA ICON */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-sm">
                  ✨
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ella AI
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your intelligent GradeFlow assistant
                  </p>
                </div>

              </div>
            </div>

            {/* CLEAR CHAT */}
            <button
              type="button"
              onClick={clearChat}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Clear conversation
            </button>

          </div>

          {/* AI STATUS */}
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
                ✨
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                    Ella AI Assistant
                  </p>

                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Online
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">
                  Ella can help administrators understand
                  academic performance, attendance, results,
                  and school data.
                </p>
              </div>

            </div>
          </div>

          {/* CHAT CARD */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            {/* CHAT HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

              <div className="flex items-center gap-3">

                <div className="relative">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg dark:bg-blue-900/30">
                    ✨
                  </div>

                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Ella
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    GradeFlow AI Assistant
                  </p>
                </div>

              </div>

            </div>

            {/* MESSAGE AREA */}
            <div className="h-520px overflow-y-auto p-5 sm:p-6">

              <div className="mx-auto max-w-4xl space-y-5">

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex max-w-[85%] gap-3 sm:max-w-[75%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >

                      {/* AVATAR */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                          message.role === "user"
                            ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {message.role === "user"
                          ? "👤"
                          : "✨"}
                      </div>

                      {/* MESSAGE */}
                      <div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                            message.role === "user"
                              ? "rounded-tr-md bg-blue-600 text-white"
                              : "rounded-tl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {message.content}
                        </div>

                        <p
                          className={`mt-1.5 text-[11px] text-gray-400 ${
                            message.role === "user"
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {message.time}
                        </p>

                      </div>

                    </div>
                  </div>
                ))}

                {/* TYPING INDICATOR */}
                {sending && (
                  <div className="flex justify-start">

                    <div className="flex gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm dark:bg-blue-900/30">
                        ✨
                      </div>

                      <div className="rounded-2xl rounded-tl-md bg-gray-100 px-5 py-4 dark:bg-gray-800">

                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{
                              animationDelay: "150ms",
                            }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{
                              animationDelay: "300ms",
                            }}
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />

              </div>
            </div>

            {/* SUGGESTED QUESTIONS */}
            <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">

              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Suggested questions
              </p>

              <div className="flex gap-2 overflow-x-auto pb-1">

                {suggestedQuestions.map(
                  (question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() =>
                        sendMessage(question)
                      }
                      disabled={sending}
                      className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    >
                      {question}
                    </button>
                  )
                )}

              </div>
            </div>

            {/* INPUT */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">

              <div className="flex items-end gap-3">

                <textarea
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  rows={1}
                  placeholder="Ask Ella anything about your school..."
                  className="max-h-32 min-h-48px flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800"
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Send message"
                >
                  ➤
                </button>

              </div>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                Ella AI can make mistakes. Verify important
                information before making decisions.
              </p>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}