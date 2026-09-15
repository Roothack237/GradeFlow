"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Loader2,
  Lock,
  MessageCircle,
  MessagesSquare,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

/**
 * Shared forum browser used by the teacher and parent communication pages.
 *
 * The server decides which categories the signed-in role may see (parents
 * never receive staff forums), so this component only renders what the API
 * returns. Updates are polled every 10 seconds for near-real-time behavior.
 */

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: string;
  isLocked: boolean;
  posts: number;
};

type PostSummary = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  createdAt: string;
  category: { id: string; name: string; slug: string; scope: string };
  author: { id: string; name: string; role: string };
  comments: number;
  reactions: number;
};

type PostDetail = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  createdAt: string;
  category: { id: string; name: string; slug: string; scope: string };
  author: { id: string; name: string; role: string };
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string; role: string };
  }[];
  reactions: { likes: number; likedByMe: boolean };
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function roleBadge(role: string) {
  if (role === "ADMIN")
    return { label: "Admin", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" };
  if (role === "TEACHER")
    return { label: "Teacher", className: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" };
  return { label: "Parent", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" };
}

export default function ForumBrowser({ portal }: { portal: "teacher" | "parent" }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* Thread state */
  const [openPost, setOpenPost] = useState<PostDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSending, setCommentSending] = useState(false);

  /* New post state */
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ categoryId: "", title: "", body: "" });
  const [newPostSending, setNewPostSending] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadForum = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        if (!options?.silent) setRefreshing(true);

        const params = new URLSearchParams();

        if (categoryFilter !== "all") {
          params.set("categoryId", categoryFilter);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await fetch(`/api/forum?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load the forum.");
        }

        setCategories(data.categories ?? []);
        setPosts(data.posts ?? []);
        setError("");
      } catch (err) {
        console.error("Forum Error:", err);

        setError(err instanceof Error ? err.message : "Failed to load the forum.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryFilter, search]
  );

  useEffect(() => {
    loadForum();
  }, [loadForum]);

  /* Near-real-time updates. */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!openPost && !showNewPost) loadForum({ silent: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [loadForum, openPost, showNewPost]);

  /* Debounced search. */
  function handleSearchChange(value: string) {
    setSearch(value);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => loadForum({ silent: true }), 350);
  }

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === categoryFilter) ?? null,
    [categories, categoryFilter]
  );

  async function openThread(postId: string) {
    try {
      setThreadLoading(true);

      const response = await fetch(`/api/forum/posts/${postId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open the post.");
      }

      setOpenPost(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open the post.");
    } finally {
      setThreadLoading(false);
    }
  }

  async function submitComment() {
    if (!openPost || !commentBody.trim()) return;

    try {
      setCommentSending(true);

      const response = await fetch(`/api/forum/posts/${openPost.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish the comment.");
      }

      setCommentBody("");
      setOpenPost((current) =>
        current
          ? {
              ...current,
              comments: [...current.comments, data.comment],
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish the comment.");
    } finally {
      setCommentSending(false);
    }
  }

  async function toggleLike() {
    if (!openPost) return;

    try {
      const response = await fetch("/api/forum/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: openPost.id, type: "LIKE" }),
      });

      const data = await response.json();

      if (!response.ok) return;

      setOpenPost((current) =>
        current
          ? {
              ...current,
              reactions: { likes: data.count, likedByMe: data.liked },
            }
          : current
      );
    } catch (err) {
      console.error("Reaction error:", err);
    }
  }

  async function submitPost() {
    try {
      setNewPostSending(true);

      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish the post.");
      }

      setShowNewPost(false);
      setNewPost({ categoryId: activeCategory?.id ?? "", title: "", body: "" });
      await loadForum({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish the post.");
    } finally {
      setNewPostSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading the forums...</span>
        </div>
      </div>
    );
  }

  /* ---------- Thread view ---------- */

  if (openPost) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenPost(null)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100"
        >
          <ArrowLeft size={16} />
          Back to the forum
        </button>

        {threadLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Post */}
            <article className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  {openPost.category.name}
                </span>

                {openPost.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Pin size={12} /> Pinned
                  </span>
                )}

                {openPost.isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {openPost.title}
              </h1>

              <p className="mt-1 text-xs text-gray-400">
                {openPost.author.name} · {roleBadge(openPost.author.role).label} ·{" "}
                {timeAgo(openPost.createdAt)} · {openPost.views} views
              </p>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                {openPost.body}
              </p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleLike}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    openPost.reactions.likedByMe
                      ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                      : "border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700 dark:border-gray-800 dark:text-gray-300"
                  }`}
                >
                  <Heart
                    size={15}
                    className={openPost.reactions.likedByMe ? "fill-current" : ""}
                  />
                  {openPost.reactions.likes}
                </button>

                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                  <MessageCircle size={15} />
                  {openPost.comments.length} comments
                </span>
              </div>
            </article>

            {/* Comments */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Comments
              </h2>

              {openPost.comments.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No comment yet. Be the first to reply.
                </p>
              )}

              <div className="space-y-4">
                {openPost.comments.map((comment) => {
                  const badge = roleBadge(comment.author.role);

                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {comment.author.name}
                        </p>

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                        >
                          {badge.label}
                        </span>

                        <span className="text-xs text-gray-400">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                        {comment.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Comment form */}
              {!openPost.isLocked ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitComment();
                  }}
                  className="mt-5 flex items-end gap-3"
                >
                  <textarea
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="min-w-0 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />

                  <button
                    type="submit"
                    disabled={!commentBody.trim() || commentSending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white transition hover:bg-purple-800 disabled:opacity-50"
                  >
                    {commentSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-gray-800">
                  This post is locked; commenting is disabled.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Forum list view ---------- */

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Categories */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setCategoryFilter(category.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              categoryFilter === category.id
                ? "border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/20"
                : "border-gray-200 bg-white hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {category.scope === "STAFF" ? (
                  <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" />
                ) : (
                  <Users size={16} className="text-blue-600 dark:text-blue-400" />
                )}

                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {category.name}
                </p>
              </div>

              {category.isLocked && <Lock size={14} className="text-gray-400" />}
            </div>

            <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {category.description}
            </p>

            <p className="mt-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
              {category.posts} post{category.posts === 1 ? "" : "s"}
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadForum()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setNewPost((current) => ({
                ...current,
                categoryId: activeCategory?.id ?? categories[0]?.id ?? "",
              }));
              setShowNewPost(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            <Plus size={16} />
            New post
          </button>
        </div>
      </div>

      {/* New post form */}
      {showNewPost && (
        <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/50 dark:bg-purple-950/20">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Create a new post
            </h3>

            <button
              type="button"
              onClick={() => setShowNewPost(false)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Forum
              </label>

              <select
                value={newPost.categoryId}
                onChange={(event) =>
                  setNewPost((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {categories
                  .filter((category) => !category.isLocked)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Title
              </label>

              <input
                type="text"
                value={newPost.title}
                maxLength={150}
                onChange={(event) =>
                  setNewPost((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="A clear title for your post"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Message
              </label>

              <textarea
                value={newPost.body}
                rows={4}
                onChange={(event) =>
                  setNewPost((current) => ({ ...current, body: event.target.value }))
                }
                placeholder="Share your message with the community..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={submitPost}
              disabled={
                !newPost.title.trim() ||
                !newPost.body.trim() ||
                !newPost.categoryId ||
                newPostSending
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50"
            >
              {newPostSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Publish
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <MessagesSquare size={40} className="mx-auto text-gray-300 dark:text-gray-600" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No post{portal === "parent" ? " in the forums you have access to" : ""} yet.
            Start the conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const badge = roleBadge(post.author.role);

            return (
              <button
                key={post.id}
                type="button"
                onClick={() => openThread(post.id)}
                className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-purple-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {post.category.name}
                  </span>

                  {post.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <Pin size={12} /> Pinned
                    </span>
                  )}

                  {post.isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                </div>

                <h2 className="mt-2.5 text-base font-bold text-gray-900 dark:text-white">
                  {post.title}
                </h2>

                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {post.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    {post.author.name}
                  </span>

                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                  >
                    {badge.label}
                  </span>

                  <span>{timeAgo(post.createdAt)}</span>

                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={12} />
                    {post.comments}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <Heart size={12} />
                    {post.reactions}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
