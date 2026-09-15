"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CalendarCheck,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import Sidebar from "@/components/parent/SideBar";
import Navbar from "@/components/parent/NavBar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickQuestions = [
  {
    icon: BookOpen,
    title: "Explain the report card",
    question:
      "Explain my child's latest report card in simple terms: strengths, weaknesses and the decision.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance trends",
    question:
      "How is my child's attendance? Explain any absence or lateness trends I should worry about.",
  },
  {
    icon: Sparkles,
    title: "How can I help at home?",
    question:
      "Based on my child's marks, which subjects need support and what can we do at home?",
  },
  {
    icon: AlertTriangle,
    title: "Risk areas",
    question: "Are there any risk areas I should discuss with the teachers?",
  },
];

export default function ParentEllaAiPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm Ella, your GradeFlow AI assistant. I can explain your children's report cards, marks and attendance, and suggest ways to support them at home. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/ai/parent")
      .then((response) => response.json())
      .then((data) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = (messageText ?? input).trim();

      if (!text || isTyping) return;

      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: "user", content: text },
      ]);

      setInput("");
      setIsTyping(true);
      setError("");

      try {
        const response = await fetch("/api/ai/parent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, conversationId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ella could not answer.");
        }

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages((current) => [
          ...current,
          {
            id: data.reply?.id ?? `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply?.content ?? "",
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ella could not answer.");
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, conversationId]
  );

  function clearConversation() {
    setConversationId(null);
    setError("");

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Conversation cleared. What would you like to know next?",
      },
    ]);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Ella AI"
          subtitle="Your personal AI assistant for school matters."
        />

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    <Sparkles size={21} />
                  </div>

                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    AI Powered
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ella AI Assistant
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ella explains your children's real school data — never generic
                  advice.
                </p>
              </div>

              <button
                type="button"
                onClick={clearConversation}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-purple-700 dark:hover:text-purple-300"
              >
                <Trash2 size={16} />
                New conversation
              </button>
            </div>

            {/* Not configured notice */}
            {configured === false && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />

                  <p>
                    The AI assistant is not configured on this server yet. Set
                    the{" "}
                    <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/40">
                      GEMINI_API_KEY
                    </code>{" "}
                    environment variable to enable it.
                  </p>
                </div>
              </div>
            )}

            {/* Quick questions */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickQuestions.map((quick) => (
                <button
                  key={quick.title}
                  type="button"
                  onClick={() => sendMessage(quick.question)}
                  disabled={isTyping || configured === false}
                  className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-purple-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    <quick.icon size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {quick.title}
                    </p>

                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {quick.question}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Chat */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        message.role === "user"
                          ? "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                      }`}
                    >
                      {message.role === "user" ? <User size={17} /> : <Bot size={17} />}
                    </div>

                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-purple-700 text-white"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      <Bot size={17} />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                      <Loader2 size={15} className="animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Ella is reviewing your children's data...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Error */}
              {error && (
                <div className="border-t border-gray-100 px-5 py-3 text-sm text-red-600 dark:border-gray-800 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-3 border-t border-gray-100 p-4 dark:border-gray-800"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about your child's results, attendance..."
                  maxLength={2000}
                  disabled={isTyping || configured === false}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping || configured === false}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={17} />
                </button>
              </form>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
              Ella is powered by Gemini and only sees your own children's data.
              Always confirm important decisions with the school.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
