-- Admin-moderated forum (categories, posts, comments, reactions)
-- and Admin AI Assistant conversation history.

CREATE TYPE "ForumCategoryScope" AS ENUM ('ALL', 'STAFF', 'PARENTS');
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- ---------------------------------------------------------------
-- FORUM
-- ---------------------------------------------------------------

CREATE TABLE "ForumCategory" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "scope"       "ForumCategoryScope" NOT NULL DEFAULT 'ALL',
  "order"       INTEGER NOT NULL DEFAULT 0,
  "isLocked"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ForumCategory_name_key" ON "ForumCategory"("name");
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");
CREATE INDEX "ForumCategory_order_idx"       ON "ForumCategory"("order");

CREATE TABLE "ForumPost" (
  "id"         TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "isPinned"   BOOLEAN NOT NULL DEFAULT false,
  "isLocked"   BOOLEAN NOT NULL DEFAULT false,
  "isDeleted"  BOOLEAN NOT NULL DEFAULT false,
  "views"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ForumPost_categoryId_idx" ON "ForumPost"("categoryId");
CREATE INDEX "ForumPost_authorId_idx"   ON "ForumPost"("authorId");
CREATE INDEX "ForumPost_createdAt_idx"  ON "ForumPost"("createdAt");
CREATE INDEX "ForumPost_isPinned_idx"   ON "ForumPost"("isPinned");

ALTER TABLE "ForumPost"
  ADD CONSTRAINT "ForumPost_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumPost"
  ADD CONSTRAINT "ForumPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ForumComment" (
  "id"        TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ForumComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ForumComment_postId_idx"   ON "ForumComment"("postId");
CREATE INDEX "ForumComment_authorId_idx" ON "ForumComment"("authorId");

ALTER TABLE "ForumComment"
  ADD CONSTRAINT "ForumComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumComment"
  ADD CONSTRAINT "ForumComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ForumReaction" (
  "id"        TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'LIKE',
  "postId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ForumReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ForumReaction_postId_userId_type_key"
  ON "ForumReaction"("postId", "userId", "type");
CREATE INDEX "ForumReaction_postId_idx" ON "ForumReaction"("postId");

ALTER TABLE "ForumReaction"
  ADD CONSTRAINT "ForumReaction_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumReaction"
  ADD CONSTRAINT "ForumReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------
-- ADMIN AI ASSISTANT
-- ---------------------------------------------------------------

CREATE TABLE "AIConversation" (
  "id"        TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIConversation_userId_idx"    ON "AIConversation"("userId");
CREATE INDEX "AIConversation_updatedAt_idx" ON "AIConversation"("updatedAt");

ALTER TABLE "AIConversation"
  ADD CONSTRAINT "AIConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AIMessage" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role"           "AIMessageRole" NOT NULL,
  "content"        TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");
CREATE INDEX "AIMessage_createdAt_idx"      ON "AIMessage"("createdAt");

ALTER TABLE "AIMessage"
  ADD CONSTRAINT "AIMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
