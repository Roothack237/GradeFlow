# GradeFlow — Full Implementation Plan (Phases 1–16)

Date: 2026-09-15 · Branch: `arena/01a0a33b-gradeflow`

## 1. Schema inspection summary (existing models reused — no duplicates)

| Model | Status | Used for |
|---|---|---|
| `AcademicYear`, `Term`, `Sequence` | ✅ exist | Phase 7 hierarchy (already migrated & seeded) |
| `Section` (ANGLOPHONE / FRANCOPHONE) | ✅ exists | Phase 8 section filtering (`classroom.sectionId`) |
| `Classroom` (+ `academicYearId`) | ✅ exists | Phases 5, 7, 8 |
| `Subject`, `TeacherAssignment` | ✅ exists | Phase 6 associations (subject ↔ class ↔ teacher) |
| `Student`, `Mark`, `Attendance`, `ReportCard` | ✅ exist | Phases 2, 3, 13, 15 |
| `Notification` (+ `lib/notifications.ts`) | ✅ exists | Phases 10, 11, 12, 13 — **the only notification system** |
| `ForumCategory`, `ForumPost`, `ForumComment`, `ForumReaction` | ✅ exist | Phase 11 (scope: ALL / STAFF / PARENTS) |
| `AIConversation`, `AIMessage` | ✅ exist | Phases 2–4 chat persistence |
| `Timetable` | ⚠️ missing `room` | Phase 10 |
| — | ⚠️ missing publish workflow | Phase 10 (follows the existing `ResultPublication` pattern) |

### Prisma changes required (additive only)

1. `Timetable.room String?` — room label shown on teacher/parent timetables.
2. New `TimetablePublication` model — `termId + classroomId` unique, `status PublicationStatus`, `publishedBy`, `publishedAt`, `notes` (mirrors `ResultPublication`).

No other tables are created. No changes to `auth.ts`.

## 2. Phase-by-phase work

| Phase | Work |
|---|---|
| **1 Gemini** | `lib/gemini.ts` using official `@google/genai` SDK + `GEMINI_API_KEY`. Exposes `generateTeacherAnalysis()`, `generateParentAnalysis()`, `generateAdminAnalysis()` + low-level `askGemini()`. Contexts built from Prisma in `lib/ai-context.ts` (`buildTeacherAiContext`, `buildParentAiContext`, extended admin context). |
| **2 Teacher AI** | `POST /api/ai/teacher` — teacher-guarded, real class/subject/mark/attendance context, conversation persisted in `AIConversation`/`AIMessage`. `app/teacher/ai-assistant` wired to it (removes the canned-response placeholder). |
| **3 Parent AI** | `POST /api/ai/parent` — parent-guarded, real child data (marks, attendance, report cards). New `app/parent/ella-ai` page. |
| **4 Admin AI** | `POST /api/ai/admin` — admin-guarded, school-wide context. Existing `/api/admin/ai/chat` switched to the same Gemini layer so the admin AI page works with `GEMINI_API_KEY`. |
| **5 Classes** | Already DB-connected (`/api/admin/classes` GET/POST, `[id]` GET/PATCH/DELETE, students). Verified CRUD + detail pages; class detail page upgraded (Phase 8). |
| **6 Subjects** | Already DB-connected (`/api/admin/subjects`, `/api/admin/teacher-assignments` for subject ↔ class ↔ teacher). Verified. |
| **7 Hierarchy** | `Academic Year → Terms → Sections → Classes → (detail)` — `[id]` page shows real terms; new `[id]/terms/[termId]` shows sections; new `[id]/terms/[termId]/sections/[sectionId]` lists classes. Old static `sections/anglophone|francophone` placeholders replaced by a DB-driven `[sectionId]` page. |
| **8 Sections** | Class lists filtered by `classroom.section` + academic year from Prisma. Class detail page = info, subjects, teachers, students, attendance stats, performance, timetable. |
| **9 Teacher dashboard** | Mock pages replaced with DB-backed versions: timetable, messages→communication (forums), notifications, analytics, performance, AI assistant, profile. |
| **10 Timetable** | `TimetablePublication` + `POST /api/admin/timetable/publish` (publish/unpublish + room assignment) → notifies affected teachers. `POST /api/admin/timetable/entries` manual create/update. `GET /api/teacher/timetable` returns published entries (subject, class, day, start, end, room). Parent timetable shows the child's class timetable. |
| **11 Communication** | Forum categories seeded (Anglophone/Francophone General + Staff, scoped). New role-scoped endpoints `/api/forum`, `/api/forum/posts/[id]`, `/api/forum/reactions`. Teacher communication page + parent communication page; parents blocked from STAFF forums server-side; near-real-time updates via polling; notifications on replies. |
| **12 Notifications** | `notifyAdmins()` helper; teacher marks/attendance/availability submissions notify admins ("Mr. Smith submitted Form 4 Mathematics marks."). |
| **13 Absence alerts** | After attendance save: per student+subject, hours ABSENT / LATE counted in the active year; at ≥ 5 h → `ATTENDANCE_ALERT` notifications to parent, subject teacher(s) and admins (deduped via `relatedType`/`relatedId` on the existing Notification model). |
| **14 Parent dashboard** | New pages: results, attendance, timetable, report-cards, notifications, communication, ella-ai. Sidebar items all resolve. `/api/parent/dashboard` fixed (real section, real attendance rate, real notifications). |
| **15 Analytics** | `GET /api/teacher/analytics` (class/subject averages, pass rate, best/at-risk students, attendance + mark trends) behind the teacher analytics & performance pages. New `/admin/analytics` page + `GET /api/admin/analytics` (school performance, class & section comparisons, attendance issues, teacher workload). |
| **16 Testing** | Idempotent `prisma/dev-seed.ts` demo dataset; `next build`; route smoke tests via curl with real sessions; fix-all loop. |

## 3. Preserved invariants

- Purple GradeFlow branding, Poppins font, dark/light mode, responsive layouts (existing portals' design language reused).
- `auth.ts` untouched.
- Existing seed remains additive; demo data lives in a separate idempotent `dev-seed.ts`.
- All analytics from Prisma aggregates; Gemini only ever receives server-built context.
