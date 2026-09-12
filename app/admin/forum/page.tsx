"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Lock,
  LockOpen,
  MessageSquare,
  MessagesSquare,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Textarea,
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: string;
  order: number;
  isLocked: boolean;
  _count: { posts: number };
};

type Post = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  views: number;
  createdAt: string;
  category: { id: string; name: string };
  author: { id: string; firstName: string; lastName: string; role: string };
  _count: { comments: number; reactions: number };
};

type PostDetail = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  views: number;
  createdAt: string;
  category: { id: string; name: string; scope: string };
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
  comments: {
    id: string;
    body: string;
    isDeleted: boolean;
    createdAt: string;
    author: { id: string; firstName: string; lastName: string; role: string };
  }[];
  _count: { reactions: number };
};

type ForumPayload = {
  categories: Category[];
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    categories: number;
    posts: number;
    pinned: number;
    locked: number;
    removed: number;
    comments: number;
    removedComments: number;
  };
};

const SCOPE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  STAFF: "School staff",
  PARENTS: "Parents only",
};

/* =========================================================
   PAGE
========================================================= */

export default function ForumModerationPage() {
  const [data, setData] = useState<ForumPayload | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    scope: "ALL",
    order: "",
    isLocked: false,
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [formError, setFormError] = useState("");

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | PostDetail | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  /* ---------------- debounce ---------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- load ---------------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (stateFilter) params.set("state", stateFilter);
      if (roleFilter) params.set("authorRole", roleFilter);

      const response = await fetch(`/api/admin/forum?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      setData(await response.json());
    } catch {
      setError("Unable to load the forum. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, stateFilter, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- post detail ---------------- */

  const openPost = useCallback(async (id: string) => {
    try {
      setLoadingDetail(true);

      const response = await fetch(`/api/admin/forum/posts/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const payload = await response.json();

      setDetail(payload.post);
    } catch {
      setError("Unable to load this post.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  /* ---------------- post moderation ---------------- */

  async function updatePost(
    id: string,
    changes: { isPinned?: boolean; isLocked?: boolean; isDeleted?: boolean },
    successMessage: string
  ) {
    setWorking(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/forum/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to update the post.");
        return;
      }

      setToast(successMessage);
      await load();

      if (detail?.id === id) await openPost(id);
    } catch {
      setError("Unable to update the post.");
    } finally {
      setWorking(false);
    }
  }

  async function deletePost() {
    if (!postToDelete) return;

    setWorking(true);

    try {
      const response = await fetch(`/api/admin/forum/posts/${postToDelete.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete the post.");
        return;
      }

      setToast("Post permanently deleted.");
      setPostToDelete(null);
      setDetail(null);
      await load();
    } catch {
      setError("Unable to delete the post.");
    } finally {
      setWorking(false);
    }
  }

  async function moderateComment(id: string, isDeleted: boolean) {
    setWorking(true);

    try {
      const response = await fetch(`/api/admin/forum/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to update the comment.");
        return;
      }

      setToast(isDeleted ? "Comment hidden." : "Comment restored.");

      if (detail) await openPost(detail.id);

      await load();
    } catch {
      setError("Unable to update the comment.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteComment() {
    if (!commentToDelete) return;

    setWorking(true);

    try {
      const response = await fetch(
        `/api/admin/forum/comments/${commentToDelete}`,
        { method: "DELETE" }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete the comment.");
        return;
      }

      setToast("Comment permanently deleted.");
      setCommentToDelete(null);

      if (detail) await openPost(detail.id);

      await load();
    } catch {
      setError("Unable to delete the comment.");
    } finally {
      setWorking(false);
    }
  }

  /* ---------------- categories ---------------- */

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      scope: "ALL",
      order: "",
      isLocked: false,
    });
    setFormError("");
    setCategoryModal(true);
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      scope: category.scope,
      order: String(category.order),
      isLocked: category.isLocked,
    });
    setFormError("");
    setCategoryModal(true);
  }

  async function saveCategory() {
    setFormError("");

    if (!categoryForm.name.trim()) {
      setFormError("A category name is required.");
      return;
    }

    setSavingCategory(true);

    try {
      const response = await fetch(
        editingCategory
          ? `/api/admin/forum/categories/${editingCategory.id}`
          : "/api/admin/forum",
        {
          method: editingCategory ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
            scope: categoryForm.scope,
            ...(categoryForm.order ? { order: Number(categoryForm.order) } : {}),
            ...(editingCategory ? { isLocked: categoryForm.isLocked } : {}),
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(payload.error ?? "Unable to save the category.");
        return;
      }

      setCategoryModal(false);
      setToast(editingCategory ? "Category updated." : "Category created.");
      await load();
    } catch {
      setFormError("Unable to save the category.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory() {
    if (!categoryToDelete) return;

    setWorking(true);

    try {
      const response = await fetch(
        `/api/admin/forum/categories/${categoryToDelete.id}`,
        { method: "DELETE" }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete the category.");
        return;
      }

      setToast("Category deleted.");
      setCategoryToDelete(null);
      await load();
    } catch {
      setError("Unable to delete the category.");
    } finally {
      setWorking(false);
    }
  }

  const activeFilters =
    (search ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (stateFilter ? 1 : 0) +
    (roleFilter ? 1 : 0);

  return (
    <AdminShell
      title="Forum moderation"
      subtitle="Moderate the school forum: categories, posts and comments."
    >
      <PageHeader
        title="Forum"
        subtitle="Everything below comes from the forum tables in the database."
      >
        <Button variant="secondary" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>

        <Button onClick={openCreateCategory}>
          <Plus size={16} />
          New category
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Posts"
          value={data?.summary.posts ?? 0}
          icon={<MessagesSquare size={20} />}
          tone="purple"
          loading={loading && !data}
          hint={`${data?.summary.categories ?? 0} categor(ies)`}
        />
        <StatCard
          label="Comments"
          value={data?.summary.comments ?? 0}
          icon={<MessageSquare size={20} />}
          tone="blue"
          loading={loading && !data}
          hint={
            data?.summary.removedComments
              ? `${data.summary.removedComments} hidden`
              : undefined
          }
        />
        <StatCard
          label="Pinned"
          value={data?.summary.pinned ?? 0}
          icon={<Pin size={20} />}
          tone="emerald"
          loading={loading && !data}
        />
        <StatCard
          label="Removed"
          value={data?.summary.removed ?? 0}
          icon={<Trash2 size={20} />}
          tone={data?.summary.removed ? "red" : "gray"}
          loading={loading && !data}
          hint={`${data?.summary.locked ?? 0} locked`}
        />
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {/* ---------------- categories ---------------- */}

      <Card
        title="Categories"
        description="Categories group the posts and control who can read them."
        className="mb-6"
      >
        {loading && !data ? (
          <LoadingState label="Loading the categories…" />
        ) : (data?.categories.length ?? 0) === 0 ? (
          <EmptyState
            icon={<MessagesSquare size={20} />}
            title="No category yet"
            message="Create the first forum category."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data?.categories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {SCOPE_LABEL[category.scope] ?? category.scope} ·{" "}
                      {category._count.posts} post(s) · order {category.order}
                    </p>
                  </div>

                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCategory(category)}
                    >
                      <Pencil size={14} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategoryToDelete(category)}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>

                {category.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {category.description}
                  </p>
                ) : null}

                {category.isLocked ? (
                  <div className="mt-2">
                    <Badge tone="amber">
                      <Lock size={11} /> Locked
                    </Badge>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---------------- filters ---------------- */}

      <Card bodyClassName="p-4" className="mb-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search a post title or body…"
              className="pl-10"
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {(data?.categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={stateFilter}
            onChange={(event) => {
              setStateFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All posts</option>
            <option value="OPEN">Open</option>
            <option value="PINNED">Pinned</option>
            <option value="LOCKED">Locked</option>
            <option value="REMOVED">Removed</option>
          </Select>

          <Select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All authors</option>
            <option value="TEACHER">Teachers</option>
            <option value="PARENT">Parents</option>
            <option value="ADMIN">Administrators</option>
          </Select>

          {activeFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setStateFilter("");
                setRoleFilter("");
                setPage(1);
              }}
            >
              <X size={16} />
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {/* ---------------- posts ---------------- */}

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-5">
            <LoadingState label="Loading the posts…" />
          </div>
        ) : !data || data.posts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<MessagesSquare size={20} />}
              title="No post found"
              message={
                activeFilters
                  ? "No post matches the current filters."
                  : "Posts created by teachers and parents will appear here."
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.posts.map((post) => (
                <div key={post.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isPinned ? (
                          <Badge tone="emerald">
                            <Pin size={11} /> Pinned
                          </Badge>
                        ) : null}

                        {post.isLocked ? (
                          <Badge tone="amber">
                            <Lock size={11} /> Locked
                          </Badge>
                        ) : null}

                        {post.isDeleted ? (
                          <Badge tone="red">Removed</Badge>
                        ) : null}

                        <Badge tone="purple">{post.category.name}</Badge>

                        <Badge tone="gray">
                          {post.author.role.toLowerCase()}
                        </Badge>
                      </div>

                      <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                        {post.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                        {post.body}
                      </p>

                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {post.author.firstName} {post.author.lastName} ·{" "}
                        {new Date(post.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {post._count.comments} comment(s) ·{" "}
                        {post._count.reactions} reaction(s) · {post.views} view(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPost(post.id)}
                        loading={loadingDetail}
                      >
                        <Eye size={14} />
                        Open
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title={post.isPinned ? "Unpin" : "Pin"}
                        onClick={() =>
                          updatePost(
                            post.id,
                            { isPinned: !post.isPinned },
                            post.isPinned ? "Post unpinned." : "Post pinned."
                          )
                        }
                      >
                        {post.isPinned ? (
                          <PinOff size={15} />
                        ) : (
                          <Pin size={15} />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title={post.isLocked ? "Unlock" : "Lock"}
                        onClick={() =>
                          updatePost(
                            post.id,
                            { isLocked: !post.isLocked },
                            post.isLocked ? "Post unlocked." : "Post locked."
                          )
                        }
                      >
                        {post.isLocked ? (
                          <LockOpen size={15} />
                        ) : (
                          <Lock size={15} />
                        )}
                      </Button>

                      {post.isDeleted ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Restore"
                          onClick={() =>
                            updatePost(
                              post.id,
                              { isDeleted: false },
                              "Post restored."
                            )
                          }
                        >
                          <RotateCcw size={15} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Remove"
                          onClick={() =>
                            updatePost(
                              post.id,
                              { isDeleted: true },
                              "Post removed."
                            )
                          }
                        >
                          <Trash2 size={15} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* ---------------- post detail ---------------- */}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Post"}
        subtitle={
          detail
            ? `${detail.category.name} · ${
                SCOPE_LABEL[detail.category.scope] ?? detail.category.scope
              } · ${detail.author.firstName} ${detail.author.lastName} (${
                detail.author.role
              })`
            : undefined
        }
        size="lg"
        footer={
          detail ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  updatePost(
                    detail.id,
                    { isPinned: !detail.isPinned },
                    detail.isPinned ? "Post unpinned." : "Post pinned."
                  )
                }
                loading={working}
              >
                {detail.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                {detail.isPinned ? "Unpin" : "Pin"}
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  updatePost(
                    detail.id,
                    { isLocked: !detail.isLocked },
                    detail.isLocked ? "Post unlocked." : "Post locked."
                  )
                }
                loading={working}
              >
                {detail.isLocked ? <LockOpen size={15} /> : <Lock size={15} />}
                {detail.isLocked ? "Unlock" : "Lock"}
              </Button>

              {detail.isDeleted ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    updatePost(detail.id, { isDeleted: false }, "Post restored.")
                  }
                  loading={working}
                >
                  <RotateCcw size={15} />
                  Restore
                </Button>
              ) : null}

              <Button
                variant="danger"
                onClick={() => setPostToDelete(detail)}
                loading={working}
              >
                <Trash2 size={15} />
                Delete permanently
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {detail.isPinned ? <Badge tone="emerald">Pinned</Badge> : null}
              {detail.isLocked ? <Badge tone="amber">Locked</Badge> : null}
              {detail.isDeleted ? <Badge tone="red">Removed</Badge> : null}
              <Badge tone="gray">
                {new Date(detail.createdAt).toLocaleString("en-GB")}
              </Badge>
              <Badge tone="blue">{detail.views} view(s)</Badge>
            </div>

            <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
              {detail.body}
            </p>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Comments ({detail.comments.length})
              </p>

              {detail.comments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No comment on this post yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-xl border p-3 ${
                        comment.isDeleted
                          ? "border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {comment.author.firstName} {comment.author.lastName} (
                            {comment.author.role.toLowerCase()}) ·{" "}
                            {new Date(comment.createdAt).toLocaleString("en-GB")}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                            {comment.body}
                          </p>
                          {comment.isDeleted ? (
                            <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                              Hidden from the forum
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={comment.isDeleted ? "Restore" : "Hide"}
                            onClick={() =>
                              moderateComment(comment.id, !comment.isDeleted)
                            }
                          >
                            {comment.isDeleted ? (
                              <RotateCcw size={14} />
                            ) : (
                              <Eye size={14} className="text-amber-500" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete permanently"
                            onClick={() => setCommentToDelete(comment.id)}
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ---------------- category modal ---------------- */}

      <Modal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        title={editingCategory ? "Edit category" : "New category"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategory} loading={savingCategory}>
              {editingCategory ? "Save changes" : "Create category"}
            </Button>
          </div>
        }
      >
        {formError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </div>
        ) : null}

        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, name: event.target.value })
              }
              placeholder="e.g. Announcements"
            />
          </Field>

          <Field label="Description">
            <Textarea
              rows={3}
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  description: event.target.value,
                })
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Visible to">
              <Select
                value={categoryForm.scope}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, scope: event.target.value })
                }
              >
                <option value="ALL">Everyone</option>
                <option value="STAFF">School staff</option>
                <option value="PARENTS">Parents only</option>
              </Select>
            </Field>

            <Field label="Order" hint="Lower numbers appear first.">
              <Input
                type="number"
                value={categoryForm.order}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, order: event.target.value })
                }
              />
            </Field>
          </div>

          {editingCategory ? (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={categoryForm.isLocked}
                onChange={(event) =>
                  setCategoryForm({
                    ...categoryForm,
                    isLocked: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-purple-700 focus:ring-purple-500"
              />
              Lock this category — nobody can create a new post in it
            </label>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={deleteCategory}
        title="Delete category"
        message={
          categoryToDelete
            ? `"${categoryToDelete.name}" will be deleted. Categories that still contain posts cannot be removed.`
            : ""
        }
        confirmLabel="Delete"
        loading={working}
      />

      <ConfirmDialog
        open={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={deletePost}
        title="Delete post permanently"
        message={
          postToDelete
            ? `"${postToDelete.title}" and all of its comments and reactions will be permanently deleted. Use "Remove" instead if you only want to hide it.`
            : ""
        }
        confirmLabel="Delete permanently"
        loading={working}
      />

      <ConfirmDialog
        open={Boolean(commentToDelete)}
        onClose={() => setCommentToDelete(null)}
        onConfirm={deleteComment}
        title="Delete comment permanently"
        message="This comment will be removed from the database. Use the hide action instead if you want to keep the record."
        confirmLabel="Delete permanently"
        loading={working}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
