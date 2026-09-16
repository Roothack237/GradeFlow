# Student status (ACTIVE / SUSPENDED / DISMISSED) & report cards — 2026/2027

This document describes the change set added on top of the existing GradeFlow
implementation. Nothing was rebuilt and no existing architecture was replaced:
the models, routes, pages and helpers that already existed are reused.

---

## 1. Student status

### Schema (smallest possible change)

`prisma/schema.prisma` — the existing `AccountStatus` enum already had
`ACTIVE`, `SUSPENDED` and `PENDING`; **`DISMISSED` was added**:

```prisma
enum AccountStatus {
  ACTIVE
  SUSPENDED
  DISMISSED   // new
  PENDING
}
```

Migration: `prisma/migrations/20260916090000_student_dismissed_status/migration.sql`

```sql
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'DISMISSED' BEFORE 'PENDING';
```

Additive only — no table, column, row or relation is touched. The `Student`
model is unchanged.

### Where a status change is recorded

A status change writes **two** audit rows through the existing audit system
(`lib/audit.ts` → `AuditLog`):

| action | content |
|---|---|
| `STUDENT_UPDATED` | `Updated student <name> (changed the status to SUSPENDED)` |
| `STUDENT_STATUS_CHANGED` | the dedicated entry with the reason, the date, the administrator's name, the previous status and the new status |

`STUDENT_STATUS_CHANGED` already existed in the `AuditAction` union, so no new
audit action was introduced. The student detail endpoint (`GET
/api/admin/students/[id]`) returns that history as `statusHistory`, which the
admin UI renders in **Students → student → Academic status & history**.

Example record:

```
Student: John Doe   Status: SUSPENDED   Reason: Disciplinary issue
Date: 16/09/2026    Changed by: Ada Administrator
```

### Behaviour

| status | keeps history | on the class roll | marks / attendance sheets | class report cards |
|---|---|---|---|---|
| `ACTIVE` | yes | yes | yes | yes |
| `SUSPENDED` | yes | no | no (listed separately) | only on request, flagged “historical record” |
| `DISMISSED` | yes | no | no (listed separately) | only on request, flagged “historical record” |

Nothing is ever deleted: marks, attendance, report cards, the parent link and
the classroom remain attached to the student.

### API

`PATCH /api/admin/students/{id}`

```json
{ "status": "SUSPENDED", "reason": "Disciplinary issue" }
```

* `status` accepts `ACTIVE`, `SUSPENDED`, `DISMISSED`, `PENDING`.
* a `reason` is **required** for `SUSPENDED` / `DISMISSED` and optional when
  reactivating.

`GET /api/admin/students/{id}` now also returns `statusLabel` and
`statusHistory`.

### UI

* `/admin/students` — status badge per student, actions
  `[Suspend] [Dismiss]` / `[Reactivate] [Dismiss]` / `[Reactivate]` and a
  **View History** link for suspended/dismissed students, plus a status filter
  that includes Dismissed.
* `/admin/students/[id]` — status badge, the same actions in the header, an
  **Academic status & history** table.
* `/admin/accounts/students` — the same badge and actions (shared dialog).
* `/parent/children`, `/parent/children/[id]` — the family sees the status and
  a note that the academic history is preserved.

Confirmation dialogs are provided by
`components/admin/StudentStatusDialog.tsx` (“Suspend this student?” / “Are you
sure you want to suspend John Doe?” + required reason field).

---

## 2. Form 2 / Form 3 dataset for 2026/2027

`prisma/seed-form2-form3.ts` (idempotent, deterministic) creates or reuses:

* academic year **2026/2027** (active) with First/Second/Third Term and
  First…Sixth Sequence;
* the Anglophone section and the **Form 2** and **Form 3** classes of that year
  (existing `Form 2A`-style streams are reused, never duplicated);
* 8 subject assignments per class, with a teacher per subject (existing
  teachers are reused — staff is never duplicated);
* 12 students per class, every one of them linked to a parent; several parents
  have two or three children;
* **marks for every student × assigned subject × sequence × term** (CA1, CA2,
  exam, average, grade, remark, teacher, academic year);
* realistic attendance for the same scope;
* teacher availability (08:00–16:00, Monday–Friday) so the admin timetable
  generator can run.

Profiles are varied on purpose: excellent, good, average and weak students,
students strong in some subjects and weak in others, plus a slow progression
through the year — so the AI performance analysis and the report cards have
meaningful data.

```bash
npm run seed:form2form3     # npx tsx prisma/seed-form2-form3.ts
npm run verify:form2form3   # npx tsx prisma/verify-form2-form3.ts
```

`prisma/verify-form2-form3.ts` walks every Form 2 / Form 3 student through
their assigned subjects and all six sequences, reports
students · subjects · expected marks · actual marks · missing marks, prints the
missing (student, subject) pairs and exits non-zero when something is missing.

---

## 3. Report cards

### Data

`lib/report-card.ts` — `buildTermReportCards({ termId, classroomId, includeInactive })`
reads everything from PostgreSQL (students, assignments, subjects, marks,
attendance, stored report cards, publication state) and computes, per student:

* subject average = mean of the sequence averages recorded in the term
* term average = Σ(subject average × coefficient) / Σ(coefficients)
* rank inside the class (equal averages share the same rank)
* grade from `lib/grading.ts` (`A ≥ 16 … F < 8`), remark, promotion decision
* attendance summary (present / absent / late / excused + rate)
* mark completeness (expected vs recorded), so a card never pretends to be
  complete

### Template

`lib/report-card-pdf.ts` renders the report card with `pdf-lib` — **A4
portrait**, the same structure on every page:

```
outer double border
  logo · school header (name, address, phone, e-mail, motto) · year & term
  TERM REPORT CARD band
  student block (name, matricule, class, section, parent, class size, status)
  subjects table: per-sequence CA1 / CA2 / Exam / Avg, then Coef, Term Avg,
                  Coef×Avg, Grade, Remarks (teacher name under each subject)
  TOTAL row: coefficients, per-sequence points + average, term average,
             total points, grade, position in class
  TERM SUMMARY | CLASS PERFORMANCE (class average, highest, lowest, position)
  ATTENDANCE / DISCIPLINE | ENROLMENT (year, term, status, attendance rate)
  CLASS TEACHER'S REMARK | PRINCIPAL'S REMARK + promotion decision
  GRADING SCALE legend + pass mark
  signatures: Class Teacher · Academic Master · Principal
  footer: generated-by line + page x of y
```

The school's letterhead is **not** invented: it is read from environment
variables (`SCHOOL_NAME`, `SCHOOL_MOTTO`, `SCHOOL_ADDRESS`, `SCHOOL_PHONE`,
`SCHOOL_EMAIL`, `SCHOOL_MINISTRY`, `SCHOOL_PRINCIPAL_NAME`,
`SCHOOL_ACADEMIC_MASTER_NAME`) and defaults to `GradeFlow Secondary School`.
The logo is `public/images/logo.png`.

Data the template asked for that GradeFlow does **not** store is left blank
rather than filled with a made-up value (signature images, principal's name
unless configured, and — for older classes — attendance recorded outside the
term).

### Endpoints

| method & path | purpose |
|---|---|
| `GET /api/admin/reports/report-cards?termId=&classroomId=[&includeInactive=]` | students of the class + marks, averages, ranks, stored card |
| `POST /api/admin/reports/report-cards` `{ termId, classroomId, includeInactive? }` | computes the cards, stores them in `ReportCard`, writes one PDF per student under `public/report-cards/<year>/<class>/` and notifies the parents |
| `GET /api/admin/reports/report-cards/pdf?termId=&classroomId=[&studentId=][&includeInactive=][&inline=1]` | streams the class set (one page per student) or a single student's card |

* One report card per student, in the class list order: page 1 = student 1, …
* Students with no mark at all for the term are skipped — no empty card.
* `Content-Disposition` uses `Form2_Report_Cards_2026_2027.pdf` /
  `Report_Card_<student>_<term>_<year>.pdf`.
* Only actively enrolled students are included by default. Suspended /
  dismissed students are generated only when `includeInactive=true` (their
  card is marked “historical record, not currently enrolled”), and their
  earlier report cards stay available through the stored PDF.
* Parents only receive the PDF URL once the class results are published
  (`ResultPublication.status = PUBLISHED`) — the same rule the marks already
  follow.

### Reports page

`/admin/reports` gained a **Report cards** tab:

```
Reports → Report cards
  Academic Year  [ 2026/2027 ▼ ]      (defaults to 2026/2027 / active year)
  Class          [ Form 2 ▼ ]         (classes of that year, from the DB)
  Term           [ First Term ▼ ]     (terms of that year)
  [x] Include suspended & dismissed students (history)
  → students list: status · marks n/m · average · rank · decision
  [Preview class set] [Download class PDF] [Generate report cards]
  → per student: [👁 preview] [Download]
```

Publication state is shown as a banner so the admin knows whether parents can
already open the cards.

---

## 4. Files changed

See the summary in the pull request: schema + one migration, `lib/student-status.ts`,
`lib/report-card.ts`, `lib/report-card-pdf.ts`, `lib/grading.ts`, the student
and report-card API routes, the three admin screens that manage students, the
two parent screens that show report cards, and the two seed/verification
scripts.
