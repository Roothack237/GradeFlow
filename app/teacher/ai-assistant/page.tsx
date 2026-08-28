"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  Lightbulb,
  BarChart3,
  Users,
  ClipboardCheck,
} from "lucide-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const quickQuestions = [
  {
    icon: BarChart3,
    title: "Analyze class performance",
    question: "Analyze my class performance and identify areas that need improvement.",
  },
  {
    icon: Users,
    title: "Identify weak students",
    question: "Which students may need additional academic support?",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance insights",
    question: "Give me insights about my students' attendance.",
  },
  {
    icon: Lightbulb,
    title: "Teaching suggestions",
    question: "Give me suggestions to improve my teaching effectiveness.",
  },
];

export default function TeacherAIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello! I'm your GradeFlow AI Assistant. I can help you analyze student performance, attendance, and provide teaching recommendations. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  function sendMessage(messageText?: string) {
    const text = (messageText ?? input).trim();

    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: generateResponse(text),
      };

      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);
    }, 900);
  }

  function clearConversation() {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "Conversation cleared. What would you like me to help you with?",
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
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

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Assistant
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Get intelligent insights and recommendations for your classes.
            </p>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Trash2 size={17} />
            Clear Chat
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Quick Questions */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Quick Questions
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Choose a question to get started.
              </p>
            </div>

            <div className="space-y-3">
              {quickQuestions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => sendMessage(item.question)}
                    className="group w-full rounded-xl border border-gray-200 p-3 text-left transition hover:border-purple-300 hover:bg-purple-50 dark:border-gray-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                        <Icon size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                          {item.question}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI Info */}
            <div className="mt-5 rounded-xl bg-purple-50 p-4 dark:bg-purple-950/20">
              <div className="flex gap-3">
                <Sparkles
                  size={18}
                  className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400"
                />

                <div>
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                    GradeFlow AI
                  </p>

                  <p className="mt-1 text-xs leading-5 text-purple-700 dark:text-purple-300">
                    Ask questions about your students, classes, results,
                    attendance, and teaching strategies.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Chat */}
          <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-indigo-600 text-white">
                <Bot size={23} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  GradeFlow Assistant
                </h2>

                <div className="mt-0.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    AI Assistant Online
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-purple-700 text-white"
                        : "rounded-bl-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.role === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    <Bot size={18} />
                  </div>

                  <div className="rounded-2xl rounded-bl-md bg-gray-100 px-5 py-3 dark:bg-gray-800">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 focus-within:border-purple-400 dark:border-gray-700 dark:bg-gray-800"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask GradeFlow AI anything..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </form>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                AI-generated recommendations should be reviewed before making
                important academic decisions.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   TEMPORARY AI RESPONSE
   Replace this with your real AI API later.
========================================================= */

function generateResponse(question: string): string {
  const text = question.toLowerCase();

  if (text.includes("performance")) {
    return "Based on the available classroom information, I recommend reviewing students whose marks consistently fall below the class average. Pay particular attention to subjects where several students are struggling, as this may indicate a topic that needs to be retaught.";
  }

  if (text.includes("attendance")) {
    return "Attendance can strongly affect academic performance. I recommend identifying students with repeated absences or lateness, checking whether there is a pattern, and communicating with parents when attendance becomes a concern.";
  }

  if (text.includes("student") || text.includes("support")) {
    return "Students who consistently perform below expectations may benefit from additional exercises, one-on-one support, peer learning, and closer monitoring of their progress over the next assessment period.";
  }

  if (text.includes("teach") || text.includes("teaching")) {
    return "Consider combining short explanations with practical exercises, classroom discussions, quizzes, and regular formative assessments. Reviewing performance trends can help you determine which teaching approaches work best for your students.";
  }

  return "I can help you analyze class performance, attendance, student progress, and teaching strategies. For more accurate recommendations, connect the assistant to your GradeFlow student and academic data.";
}