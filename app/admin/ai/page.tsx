"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Textarea,
  Toast,
} from "@/components/admin/ui";

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: number;
  lastMessage: { content: string; role: string } | null;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

const SUGGESTIONS = [
  "What is the school average and pass rate for the current term?",
  "Which classes are performing below the school average?",
  "How is attendance this term and which students should we follow up?",
  "Which subjects have the weakest results?",
];

/* =========================================================
   PAGE
========================================================= */

export default function AiAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [configured, setConfigured] = useState(true);
  const [input, setInput] = useState("");

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- history ---------------- */

  const loadConversations = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError("");

      const response = await fetch("/api/admin/ai/conversations", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();

      setConfigured(Boolean(data.configured));
      setConversations(data.conversations ?? []);
    } catch {
      setError("Unable to load the conversation history.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /* ---------------- thread ---------------- */

  const openConversation = useCallback(async (id: string) => {
    try {
      setLoadingThread(true);
      setActiveId(id);
      setError("");

      const response = await fetch(`/api/admin/ai/conversations/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();

      setMessages(data.messages ?? []);
    } catch {
      setError("Unable to load this conversation.");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  /* ---------------- send ---------------- */

  async function send(question?: string) {
    const content = (question ?? input).trim();

    if (!content || sending) return;

    setSending(true);
    setError("");
    setInput("");

    const optimisticId = `local-${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: optimisticId,
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId: activeId ?? undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.error ??
            "The assistant could not answer. Please check the AI configuration."
        );
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticId)
        );
        setInput(content);
        return;
      }

      setActiveId(data.conversationId);
      setMessages((current) => [...current, data.reply]);
      await loadConversations();
    } catch {
      setError("The assistant could not answer. Please try again.");
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticId)
      );
    } finally {
      setSending(false);
    }
  }

  async function startNew() {
    setActiveId(null);
    setMessages([]);
    setError("");
    setInput("");
  }

  async function confirmDelete() {
    if (!toDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/ai/conversations/${toDelete.id}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to delete the conversation.");
        return;
      }

      if (activeId === toDelete.id) {
        setActiveId(null);
        setMessages([]);
      }

      setToast("Conversation deleted.");
      setToDelete(null);
      await loadConversations();
    } catch {
      setError("Unable to delete the conversation.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="AI Assistant"
      subtitle="Ask questions about the school data. The assistant only sees the aggregate figures the server selects."
    >
      <PageHeader
        title="AI Assistant"
        subtitle="Conversations are stored in the database for this administrator."
      >
        <Button variant="secondary" onClick={loadConversations} loading={loadingHistory}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={startNew}>
          <MessageSquarePlus size={16} />
          New conversation
        </Button>
      </PageHeader>

      {!configured ? (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />

            <div className="text-sm text-amber-900 dark:text-amber-200">
              <p className="font-semibold">The AI provider is not configured</p>
              <p className="mt-1">
                Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">AI_API_KEY</code>{" "}
                on the server to enable real answers. Optionally set{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">AI_BASE_URL</code> and{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">AI_MODEL</code>.
                Until then the assistant returns an explicit configuration error
                instead of inventing an answer.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={loadConversations} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ---------------- conversation list ---------------- */}

        <Card title="History" bodyClassName="p-3">
          {loadingHistory ? (
            <p className="p-3 text-sm text-gray-500 dark:text-gray-400">
              Loading conversations…
            </p>
          ) : conversations.length === 0 ? (
            <p className="p-3 text-sm text-gray-500 dark:text-gray-400">
              No conversation yet. Ask the assistant a question to start one.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group rounded-xl border p-3 transition ${
                    activeId === conversation.id
                      ? "border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30"
                      : "border-gray-200 hover:border-purple-300 dark:border-gray-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {conversation.lastMessage?.content ?? "No message yet"}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {conversation.messages} message(s) ·{" "}
                      {new Date(conversation.updatedAt).toLocaleDateString("en-GB")}
                    </p>
                  </button>

                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete(conversation)}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ---------------- chat ---------------- */}

        <Card bodyClassName="p-0">
          <div className="flex h-[560px] flex-col">
            <div className="flex items-center gap-2 border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <Bot size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  GradeFlow admin assistant
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Answers are based on the aggregate school figures only.
                </p>
              </div>

              <Badge tone={configured ? "green" : "amber"}>
                {configured ? "Ready" : "Not configured"}
              </Badge>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {loadingThread ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading the conversation…
                </p>
              ) : messages.length === 0 ? (
                <div className="space-y-4">
                  <EmptyState
                    icon={<Sparkles size={20} />}
                    title="Ask about your school"
                    message="The assistant reads aggregated figures built by the server: enrolment, performance, attendance and publications."
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion)}
                        disabled={sending}
                        className="rounded-xl border border-gray-200 p-3 text-left text-sm text-gray-700 transition hover:border-purple-400 hover:bg-purple-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:border-purple-700 dark:hover:bg-purple-950/30"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "USER" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role !== "USER" ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        <Bot size={16} />
                      </div>
                    ) : null}

                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                        message.role === "USER"
                          ? "bg-purple-700 text-white"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.role === "USER" ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                        <UserIcon size={16} />
                      </div>
                    ) : null}
                  </div>
                ))
              )}

              {sending ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Bot size={16} className="animate-pulse" />
                  The assistant is analysing the school data…
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-end gap-3">
                <Textarea
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about enrolment, performance, attendance…"
                  disabled={sending}
                />

                <Button onClick={() => send()} loading={sending} disabled={!input.trim()}>
                  <Send size={16} />
                  Send
                </Button>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <ShieldCheck size={12} />
                Only aggregated school figures are sent to the provider — never
                raw student records.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete conversation"
        message={
          toDelete
            ? `"${toDelete.title}" and its messages will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
