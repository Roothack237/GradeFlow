"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CalendarCheck,
  Download,
  Layers,
  Lock,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
  PageHeader,
  Pagination,
  Select,
  StatCard,
  TableWrap,
  Td,
  Th,
  Toast,
} from "@/components/admin/ui";

/* =========================================================
   TYPES
========================================================= */

type Mark = {
  id: string;
  score: number;
  student: { id: string; name: string; matricule: string };
  classroom: { id: string; name: string; section?: { name: string } | null } | null;
  subject: { id: string; name: string; coefficient: number };
  sequence: { id: string; name: string; order: number };
  term: { id: string; name: string; academicYear: { name: string } };
  teacher: { id: string; fullName: string };
  publicationState: string;
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  studentName: string;
  matricule: string;
  className: string | null;
  sectionName: string | null;
  subjectName: string;
  teacherName: string;
  sequenceName: string;
  termName: string;
  academicYearName: string;
};

type AttendanceSummary = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
  total: number;
  rate: number | null;
};

type StudentPerformance = {
  id: string;
  name: string;
  matricule: string;
  className: string;
  subjects: number;
  marks: number;
  average: number;
};

type Overview = {
  scope: { termId: string | null; sequenceId: string | null; sequences: number };
  summary: {
    expected: number;
    covered: number;
    recorded: number;
    missing: number;
    completionRate: number | null;
    average: number | null;
    passRate: number | null;
    students: number;
    classes: number;
    subjects: number;
  };
  classes: {
    id: string;
    name: string;
    sectionName: string | null;
    students: number;
    subjects: number;
    expected: number;
    recorded: number;
    covered: number;
    missing: number;
    average: number | null;
    passRate: number | null;
    completion: number | null;
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
    recorded: number;
    expected: number;
    covered: number;
    missing: number;
    average: number | null;
    passRate: number | null;
    highest: number | null;
    lowest: number | null;
  }[];
  incomplete: {
    classroomId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    expected: number;
    recorded: number;
    missing: number;
    students: { id: string; name: string; matricule: string }[];
  }[];
  incompleteTotal: number;
  message?: string;
};

type PublicationState = {
  term: {
    id: string;
    name: string;
    isCurrent: boolean;
    academicYear: { id: string; name: string };
    sequences: { id: string; name: string; order: number }[];
  } | null;
  classes: {
    id: string;
    name: string;
    section: { id: string; name: string } | null;
    students: number;
    marks: number;
    termPublication: {
      status: string;
      publishedAt: string | null;
      notes: string | null;
      publishedBy: string | null;
    } | null;
    sequences: {
      id: string;
      name: string;
      order: number;
      publication: { status: string; publishedAt: string | null } | null;
    }[];
  }[];
  summary: {
    classes: number;
    sequences: number;
    sequencesPublished: number;
    sequencesPending: number;
    termsPublished: number;
    termsPending: number;
  };
  message?: string;
};

type Option = {
  id: string;
  name: string;
  sectionId?: string;
  sectionName?: string;
};
type TermOption = Option & {
  isCurrent: boolean;
  academicYear?: { name: string };
  sequences: { id: string; name: string }[];
};

const STATE_TONES: Record<string, "green" | "amber" | "gray" | "red" | "blue"> = {
  PUBLISHED: "green",
  SEQUENCE_PUBLISHED: "green",
  TERM_PUBLISHED: "blue",
  UNPUBLISHED: "red",
  NOT_PUBLISHED: "gray",
};

const STATE_LABELS: Record<string, string> = {
  PUBLISHED: "Published",
  SEQUENCE_PUBLISHED: "Published (sequence)",
  TERM_PUBLISHED: "Published (term)",
  UNPUBLISHED: "Unpublished",
  NOT_PUBLISHED: "Not published",
};

type PendingAction = {
  scope: "TERM" | "SEQUENCE";
  classroomId: string;
  className: string;
  sequenceId?: string;
  sequenceName?: string;
  action: "PUBLISH" | "UNPUBLISH";
};

type ExportMark = {
  score: number;
  student: { id: string; name: string; matricule: string };
  classroom: { id: string; name: string; section?: { name: string } | null } | null;
  subject: { id: string; name: string };
  sequence: { id: string; name: string };
  term: { id: string; name: string; academicYear: { name: string } };
  teacher: { fullName: string };
  publicationState: string;
};

type ExportPage<T> = {
  results?: T[];
  attendance?: T[];
  total?: number;
  summary?: Record<string, number | null>;
};

async function fetchAllExportRows<T>(
  endpoint: string,
  filters: URLSearchParams,
  collection: "results" | "attendance"
) {
  const rows: T[] = [];
  let summary: Record<string, number | null> | undefined;
  let total = 0;
  let page = 1;

  do {
    const params = new URLSearchParams(filters);
    params.set("page", String(page));
    params.set("pageSize", "200");

    const response = await fetch(`${endpoint}?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load all records for the PDF.");

    const data = (await response.json()) as ExportPage<T>;
    const batch = collection === "results" ? data.results ?? [] : data.attendance ?? [];
    rows.push(...batch);
    summary ??= data.summary;
    total = data.total ?? rows.length;
    if (batch.length === 0) break;
    page += 1;
  } while (rows.length < total);

  return { rows, summary };
}

async function downloadTablePdf(report: {
  title: string;
  context: string[];
  summary: string[];
  columns: string[];
  widths: number[];
  rows: string[][];
  filename: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [842, 595];
  const margin = 30;
  const rowHeight = 19;
  const textColor = rgb(0.12, 0.16, 0.22);
  const accent = rgb(0.16, 0.38, 0.34);
  let page = pdf.addPage(pageSize);
  let y = 0;
  const safeText = (value: unknown) => String(value ?? "-").replace(/[^\x20-\x7E]/g, " ");
  const tableWidth = pageSize[0] - margin * 2;
  const totalWeight = report.widths.reduce((sum, width) => sum + width, 0);
  const columnWidths = report.widths.map((width) => (tableWidth * width) / totalWeight);

  const fitText = (value: string, width: number, size: number) => {
    let text = safeText(value);
    while (text.length > 3 && regular.widthOfTextAtSize(text, size) > width - 8) {
      text = `${text.slice(0, -4)}...`;
    }
    return text;
  };

  const drawColumnHeadings = () => {
    let x = margin;
    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 4,
      width: tableWidth,
      height: rowHeight,
      color: rgb(0.91, 0.95, 0.94),
    });
    report.columns.forEach((heading, index) => {
      page.drawText(fitText(heading, columnWidths[index], 8), {
        x: x + 4,
        y: y - 9,
        size: 8,
        font: bold,
        color: accent,
      });
      x += columnWidths[index];
    });
    y -= rowHeight;
  };

  const startPage = (firstPage: boolean) => {
    if (!firstPage) page = pdf.addPage(pageSize);
    y = page.getHeight() - margin;
    page.drawText(safeText(report.title), {
      x: margin,
      y,
      size: 18,
      font: bold,
      color: textColor,
    });
    y -= 25;

    for (const line of report.context) {
      page.drawText(safeText(line), {
        x: margin,
        y,
        size: 8,
        font: regular,
        color: rgb(0.38, 0.42, 0.46),
        maxWidth: tableWidth,
      });
      y -= 13;
    }

    if (firstPage) {
      for (const line of report.summary) {
        page.drawText(safeText(line), {
          x: margin,
          y,
          size: 9,
          font: bold,
          color: textColor,
          maxWidth: tableWidth,
        });
        y -= 15;
      }
    }

    y -= 4;
    drawColumnHeadings();
  };

  startPage(true);

  if (report.rows.length === 0) {
    page.drawText("No records match the selected view.", {
      x: margin,
      y: y - 8,
      size: 9,
      font: regular,
      color: textColor,
    });
  }

  for (const row of report.rows) {
    if (y - rowHeight < margin + 16) startPage(false);

    let x = margin;
    row.forEach((cell, index) => {
      page.drawText(fitText(cell ?? "", columnWidths[index], 7.5), {
        x: x + 4,
        y: y - 9,
        size: 7.5,
        font: regular,
        color: textColor,
      });
      x += columnWidths[index];
    });
    page.drawLine({
      start: { x: margin, y: y - rowHeight + 3 },
      end: { x: pageSize[0] - margin, y: y - rowHeight + 3 },
      thickness: 0.4,
      color: rgb(0.88, 0.9, 0.91),
    });
    y -= rowHeight;
  }

  pdf.getPages().forEach((pdfPage, index, pages) => {
    pdfPage.drawText(`Generated ${new Date().toLocaleDateString("en-GB")} | Page ${index + 1} of ${pages.length}`, {
      x: margin,
      y: 14,
      size: 7,
      font: regular,
      color: rgb(0.45, 0.48, 0.5),
    });
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = report.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function downloadMarksMatrixPdf(report: {
  title: string;
  context: string[];
  summary: string[];
  subjects: { key: string; label: string }[];
  students: { label: string; marks: Map<string, string> }[];
  filename: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [1190, 842];
  const margin = 28;
  const rowHeight = 20;
  const nameColumnWidth = 190;
  const subjectColumnWidth = 72;
  const tableWidth = pageSize[0] - margin * 2;
  const subjectsPerPage = Math.max(
    1,
    Math.floor((tableWidth - nameColumnWidth) / subjectColumnWidth)
  );
  const studentsPerPage = Math.max(
    1,
    Math.floor((pageSize[1] - margin * 2 - 150) / rowHeight)
  );
  const subjectChunks = report.subjects.length
    ? Array.from(
        { length: Math.ceil(report.subjects.length / subjectsPerPage) },
        (_, index) =>
          report.subjects.slice(
            index * subjectsPerPage,
            (index + 1) * subjectsPerPage
          )
      )
    : [[]];
  const studentChunks = report.students.length
    ? Array.from(
        { length: Math.ceil(report.students.length / studentsPerPage) },
        (_, index) =>
          report.students.slice(
            index * studentsPerPage,
            (index + 1) * studentsPerPage
          )
      )
    : [[]];
  const safeText = (value: unknown) => String(value ?? "-").replace(/[^\x20-\x7E]/g, " ");
  const accent = rgb(0.16, 0.38, 0.34);
  const textColor = rgb(0.12, 0.16, 0.22);

  for (let subjectPage = 0; subjectPage < subjectChunks.length; subjectPage += 1) {
    const visibleSubjects = subjectChunks[subjectPage];
    for (let studentPage = 0; studentPage < studentChunks.length; studentPage += 1) {
      const page = pdf.addPage(pageSize);
      let y = page.getHeight() - margin;
      const students = studentChunks[studentPage];
      const subjectWidth = visibleSubjects.length
        ? (tableWidth - nameColumnWidth) / visibleSubjects.length
        : tableWidth - nameColumnWidth;

      page.drawText(safeText(report.title), {
        x: margin,
        y,
        size: 18,
        font: bold,
        color: textColor,
      });
      y -= 25;

      for (const line of report.context) {
        page.drawText(safeText(line), {
          x: margin,
          y,
          size: 8,
          font: regular,
          color: rgb(0.38, 0.42, 0.46),
          maxWidth: tableWidth,
        });
        y -= 12;
      }
      for (const line of report.summary) {
        page.drawText(safeText(line), {
          x: margin,
          y,
          size: 9,
          font: bold,
          color: textColor,
          maxWidth: tableWidth,
        });
        y -= 14;
      }
      if (subjectChunks.length > 1 || studentChunks.length > 1) {
        page.drawText(
          `Subject group ${subjectPage + 1}/${subjectChunks.length} | Student page ${studentPage + 1}/${studentChunks.length}`,
          { x: margin, y, size: 8, font: regular, color: accent }
        );
        y -= 14;
      }

      const headerY = y - rowHeight + 3;
      page.drawRectangle({
        x: margin,
        y: headerY,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.91, 0.95, 0.94),
      });
      page.drawText("Student", {
        x: margin + 5,
        y: y - 9,
        size: 9,
        font: bold,
        color: accent,
      });

      const fitText = (value: string, width: number, fontSize: number) => {
        let text = safeText(value);
        while (text.length > 3 && regular.widthOfTextAtSize(text, fontSize) > width - 8) {
          text = `${text.slice(0, -4)}...`;
        }
        return text;
      };

      visibleSubjects.forEach((subject, index) => {
        page.drawText(fitText(subject.label, subjectWidth, 8), {
          x: margin + nameColumnWidth + index * subjectWidth + 4,
          y: y - 9,
          size: 8,
          font: bold,
          color: accent,
        });
      });
      y -= rowHeight;

      if (students.length === 0) {
        page.drawText("No marks match the selected filters.", {
          x: margin + 5,
          y: y - 9,
          size: 9,
          font: regular,
          color: textColor,
        });
        y -= rowHeight;
      }

      students.forEach((student, rowIndex) => {
        const rowY = y - rowHeight + 3;
        if (rowIndex % 2 === 1) {
          page.drawRectangle({
            x: margin,
            y: rowY,
            width: tableWidth,
            height: rowHeight,
            color: rgb(0.97, 0.98, 0.98),
          });
        }
        page.drawText(fitText(student.label, nameColumnWidth, 8), {
          x: margin + 5,
          y: y - 9,
          size: 8,
          font: regular,
          color: textColor,
        });
        visibleSubjects.forEach((subject, index) => {
          const score = student.marks.get(subject.key) ?? "-";
          page.drawText(fitText(score, subjectWidth, 8), {
            x: margin + nameColumnWidth + index * subjectWidth + 4,
            y: y - 9,
            size: 8,
            font: regular,
            color: textColor,
          });
        });
        y -= rowHeight;
      });
    }
  }

  pdf.getPages().forEach((page, index, pages) => {
    page.drawText(`Generated ${new Date().toLocaleDateString("en-GB")} | Page ${index + 1} of ${pages.length}`, {
      x: margin,
      y: 14,
      size: 7,
      font: regular,
      color: rgb(0.45, 0.48, 0.5),
    });
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = report.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

/* =========================================================
   PAGE
========================================================= */

export default function ResultsPage() {
  const [tab, setTab] = useState<"REVIEW" | "PUBLICATION" | "ATTENDANCE">("REVIEW");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  /* ---------------- lookups ---------------- */

  const [terms, setTerms] = useState<TermOption[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);

  /* ---------------- review state ---------------- */

  const [termId, setTermId] = useState("");
  const [sequenceId, setSequenceId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [search, setSearch] = useState("");

  const [marks, setMarks] = useState<Mark[]>([]);
  const [summary, setSummary] = useState<{
    marks: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    passed: number;
    passRate: number | null;
  } | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- publication state ---------------- */

  const [publications, setPublications] = useState<PublicationState | null>(null);
  const [publishTermId, setPublishTermId] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [working, setWorking] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  /* ---------------- attendance state ---------------- */

  const [attendanceTermId, setAttendanceTermId] = useState("");
  const [attendanceSectionId, setAttendanceSectionId] = useState("");
  const [attendanceClassroomId, setAttendanceClassroomId] = useState("");
  const [attendanceSubjectId, setAttendanceSubjectId] = useState("");
  const [attendanceTeacherId, setAttendanceTeacherId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [attendanceFrom, setAttendanceFrom] = useState("");
  const [attendanceTo, setAttendanceTo] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const attendancePageSize = 25;

  /* ---------------- lookups load ---------------- */

  useEffect(() => {
    async function loadLookups() {
      try {
        const [termsRes, classesRes, subjectsRes, teachersRes] =
          await Promise.all([
            fetch("/api/admin/terms", { cache: "no-store" }),
            fetch("/api/admin/classes", { cache: "no-store" }),
            fetch("/api/admin/subjects", { cache: "no-store" }),
            fetch("/api/admin/teachers", { cache: "no-store" }),
          ]);

        if (termsRes.ok) {
          const data = await termsRes.json();
          const list: TermOption[] = data.terms ?? [];

          setTerms(list);

          const current = list.find((term) => term.isCurrent) ?? list[0];

          if (current) {
            setTermId((value) => value || current.id);
            setPublishTermId((value) => value || current.id);
          }
        }

        if (classesRes.ok) {
          const data = await classesRes.json();

          setClasses(
            (data.classes ?? []).map(
              (classroom: {
                id: string;
                name: string;
                section?: { id: string; name: string } | null;
              }) => ({
                id: classroom.id,
                name: classroom.name,
                sectionId: classroom.section?.id,
                sectionName: classroom.section?.name,
              })
            )
          );
        }

        if (subjectsRes.ok) {
          const data = await subjectsRes.json();

          setSubjects(
            (Array.isArray(data) ? data : (data.subjects ?? [])).map(
              (subject: { id: string; name: string }) => ({
                id: subject.id,
                name: subject.name,
              })
            )
          );
        }

        if (teachersRes.ok) {
          const data = await teachersRes.json();

          setTeachers(
            (data.teachers ?? []).map(
              (teacher: { id: string; fullName: string }) => ({
                id: teacher.id,
                name: teacher.fullName,
              })
            )
          );
        }
      } catch {
        /* non critical */
      }
    }

    loadLookups();
  }, []);

  const sequenceOptions = useMemo(() => {
    const term = terms.find((entry) => entry.id === termId);

    return term?.sequences ?? [];
  }, [terms, termId]);

  useEffect(() => {
    setSequenceId("");
  }, [termId]);

  /* ---------------- review load ---------------- */

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (termId) params.set("termId", termId);
      if (sequenceId) params.set("sequenceId", sequenceId);
      if (classroomId) params.set("classroomId", classroomId);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      if (teacherFilter) params.set("teacherId", teacherFilter);
      if (publicationFilter) params.set("publication", publicationFilter);
      if (search) params.set("search", search);

      const overviewParams = new URLSearchParams();

      if (termId) overviewParams.set("termId", termId);
      if (sequenceId) overviewParams.set("sequenceId", sequenceId);
      if (classroomId) overviewParams.set("classroomId", classroomId);

      const performanceParams = new URLSearchParams(params);
      performanceParams.delete("page");
      performanceParams.delete("pageSize");
      performanceParams.delete("publication");

      const [marksRes, overviewRes, allMarks] = await Promise.all([
        fetch(`/api/admin/results?${params}`, { cache: "no-store" }),
        fetch(`/api/admin/results/overview?${overviewParams}`, {
          cache: "no-store",
        }),
        page === 1
          ? fetchAllExportRows<ExportMark>(
              "/api/admin/results",
              performanceParams,
              "results"
            ).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (!marksRes.ok) throw new Error("failed");

      const data = await marksRes.json();

      setMarks(data.results ?? []);
      setSummary(data.summary ?? null);
      setTotal(data.total ?? 0);

      if (overviewRes.ok) setOverview(await overviewRes.json());

      if (page === 1) {
        if (!allMarks) {
          setStudentPerformance([]);
        } else {
          const filteredMarks = allMarks.rows.filter((mark) =>
            publicationFilter === "PUBLISHED"
              ? mark.publicationState === "SEQUENCE_PUBLISHED" ||
                mark.publicationState === "TERM_PUBLISHED"
              : publicationFilter === "NOT_PUBLISHED"
                ? mark.publicationState === "NOT_PUBLISHED" ||
                  mark.publicationState === "UNPUBLISHED"
                : true
          );
          const grouped = new Map<
            string,
            {
              name: string;
              matricule: string;
              className: string;
              scoreTotal: number;
              marks: number;
              subjects: Set<string>;
            }
          >();

          filteredMarks.forEach((mark) => {
            const id = `${mark.classroom?.id ?? "no-class"}:${mark.student.matricule}`;
            const current = grouped.get(id) ?? {
              name: mark.student.name,
              matricule: mark.student.matricule,
              className: mark.classroom?.name ?? "—",
              scoreTotal: 0,
              marks: 0,
              subjects: new Set<string>(),
            };
            current.scoreTotal += mark.score;
            current.marks += 1;
            current.subjects.add(mark.subject.name);
            grouped.set(id, current);
          });

          setStudentPerformance(
            Array.from(grouped, ([id, student]) => ({
              id,
              name: student.name,
              matricule: student.matricule,
              className: student.className,
              subjects: student.subjects.size,
              marks: student.marks,
              average: Math.round((student.scoreTotal / student.marks) * 100) / 100,
            })).sort((left, right) => left.name.localeCompare(right.name))
          );
        }
      }
    } catch {
      setError("Unable to load the results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    termId,
    sequenceId,
    classroomId,
    subjectFilter,
    teacherFilter,
    publicationFilter,
    search,
  ]);

  /* ---------------- publications load ---------------- */

  const loadPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (publishTermId) params.set("termId", publishTermId);

      const response = await fetch(`/api/admin/publications?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();
      setPublications({
        term: data.term,
        classes: (data.classes ?? []).map(
          (classroom: {
            id: string;
            name: string;
            section: { id: string; name: string } | null;
            studentCount: number;
            marksCount: number;
            termPublication: PublicationState["classes"][number]["termPublication"];
            sequences: PublicationState["classes"][number]["sequences"];
          }) => ({
            id: classroom.id,
            name: classroom.name,
            section: classroom.section,
            students: classroom.studentCount,
            marks: classroom.marksCount,
            termPublication: classroom.termPublication,
            sequences: classroom.sequences,
          })
        ),
        summary: {
          classes: data.summary?.totalClasses ?? 0,
          sequences: data.summary?.totalSequences ?? 0,
          sequencesPublished: data.summary?.publishedSequences ?? 0,
          sequencesPending:
            (data.summary?.totalSequences ?? 0) -
            (data.summary?.publishedSequences ?? 0),
          termsPublished: data.summary?.publishedClasses ?? 0,
          termsPending:
            (data.summary?.totalClasses ?? 0) -
            (data.summary?.publishedClasses ?? 0),
        },
      });
    } catch {
      setError("Unable to load the publication state. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [publishTermId]);

  const publicationSections = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; classes: PublicationState["classes"] }
    >();

    for (const classroom of publications?.classes ?? []) {
      const name = classroom.section?.name ?? "No section";
      const group = groups.get(name) ?? { name, classes: [] };
      group.classes.push(classroom);
      groups.set(name, group);
    }

    return Array.from(groups.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [publications]);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(attendancePage),
        pageSize: String(attendancePageSize),
      });

      if (attendanceTermId) params.set("termId", attendanceTermId);
      if (attendanceSectionId) params.set("sectionId", attendanceSectionId);
      if (attendanceClassroomId) params.set("classroomId", attendanceClassroomId);
      if (attendanceSubjectId) params.set("subjectId", attendanceSubjectId);
      if (attendanceTeacherId) params.set("teacherId", attendanceTeacherId);
      if (attendanceStatus) params.set("status", attendanceStatus);
      if (attendanceFrom) params.set("from", attendanceFrom);
      if (attendanceTo) params.set("to", attendanceTo);
      if (attendanceSearch) params.set("search", attendanceSearch);

      const response = await fetch(`/api/admin/attendance?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("failed");

      const data = await response.json();
      setAttendanceRecords(data.attendance ?? []);
      setAttendanceSummary(data.summary ?? null);
      setAttendanceTotal(data.total ?? 0);
    } catch {
      setError("Unable to load attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    attendancePage,
    attendanceTermId,
    attendanceSectionId,
    attendanceClassroomId,
    attendanceSubjectId,
    attendanceTeacherId,
    attendanceStatus,
    attendanceFrom,
    attendanceTo,
    attendanceSearch,
  ]);

  useEffect(() => {
    if (tab === "REVIEW") loadReview();
    else if (tab === "PUBLICATION") loadPublications();
    else loadAttendance();
  }, [tab, loadReview, loadPublications, loadAttendance]);

  /* ---------------- publish / unpublish ---------------- */

  async function applyPublication() {
    if (!pending) return;

    setWorking(true);
    setError("");

    try {
      const response = await fetch("/api/admin/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: pending.scope,
          action: pending.action,
          termId: publishTermId || publications?.term?.id,
          classroomId: pending.classroomId,
          sequenceId: pending.sequenceId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Unable to update the publication state.");
        setPending(null);
        return;
      }

      setToast(data.message ?? "Publication state updated.");
      setPending(null);
      await loadPublications();
    } catch {
      setError("Unable to update the publication state.");
    } finally {
      setWorking(false);
    }
  }

  async function downloadCurrentPdf() {
    setDownloadingPdf(true);
    setError("");

    try {
      const generated = new Date().toISOString().slice(0, 10);
      const filename = (name: string) =>
        `gradeflow-${name}-${generated}.pdf`;

      if (tab === "REVIEW") {
        const filters = new URLSearchParams();
        if (termId) filters.set("termId", termId);
        if (sequenceId) filters.set("sequenceId", sequenceId);
        if (classroomId) filters.set("classroomId", classroomId);
        if (subjectFilter) filters.set("subjectId", subjectFilter);
        if (teacherFilter) filters.set("teacherId", teacherFilter);
        if (publicationFilter) filters.set("publication", publicationFilter);
        if (search) filters.set("search", search);
        const exportPublicationFilter = filters.get("publication");
        filters.delete("publication");

        const { rows: allRows } = await fetchAllExportRows<ExportMark>(
          "/api/admin/results",
          filters,
          "results"
        );
        const rows = allRows.filter((mark) =>
          exportPublicationFilter === "PUBLISHED"
            ? mark.publicationState === "SEQUENCE_PUBLISHED" ||
              mark.publicationState === "TERM_PUBLISHED"
            : exportPublicationFilter === "NOT_PUBLISHED"
              ? mark.publicationState === "NOT_PUBLISHED" ||
                mark.publicationState === "UNPUBLISHED"
              : true
        );
        const scores = rows.map((mark) => mark.score);
        const scoreTotals = scores.reduce(
          (result, score) => ({
            sum: result.sum + score,
            passed: result.passed + Number(score >= 10),
            highest: Math.max(result.highest, score),
            lowest: Math.min(result.lowest, score),
          }),
          {
            sum: 0,
            passed: 0,
            highest: Number.NEGATIVE_INFINITY,
            lowest: Number.POSITIVE_INFINITY,
          }
        );
        const exportSummary = {
          marks: rows.length,
          average: scores.length
            ? Math.round((scoreTotals.sum / scores.length) * 100) / 100
            : null,
          highest: scores.length ? scoreTotals.highest : null,
          lowest: scores.length ? scoreTotals.lowest : null,
          passed: scoreTotals.passed,
          passRate: scores.length
            ? Math.round((scoreTotals.passed / scores.length) * 1000) / 10
            : null,
        };
        const selectedTerm = terms.find((term) => term.id === termId);
        const subjectColumns = new Map<string, string>();
        const studentRows = new Map<
          string,
          { label: string; marks: Map<string, string> }
        >();

        rows.forEach((mark) => {
          const subjectKey = `${mark.term.id}:${mark.sequence.id}:${mark.subject.id}`;
          subjectColumns.set(
            subjectKey,
            `${mark.subject.name} (${mark.sequence.name})`
          );

          const student = studentRows.get(mark.student.id) ?? {
            label: `${mark.student.name} (${mark.student.matricule})`,
            marks: new Map<string, string>(),
          };
          student.marks.set(subjectKey, String(mark.score));
          studentRows.set(mark.student.id, student);
        });

        const subjectMatrix = Array.from(subjectColumns, ([key, label]) => ({
          key,
          label,
        })).sort((left, right) => left.label.localeCompare(right.label));

        await downloadMarksMatrixPdf({
          title: "Results Review: Marks",
          context: [
            `Term: ${selectedTerm?.name ?? "All terms"} | Sequence: ${sequenceOptions.find((item) => item.id === sequenceId)?.name ?? "All sequences"}`,
            `Class: ${classes.find((item) => item.id === classroomId)?.name ?? "All classes"} | Subject: ${subjects.find((item) => item.id === subjectFilter)?.name ?? "All subjects"} | Teacher: ${teachers.find((item) => item.id === teacherFilter)?.name ?? "All teachers"}`,
            `Publication: ${publicationFilter || "All marks"} | Search: ${search || "None"}`,
          ],
          summary: [
            `Marks: ${exportSummary?.marks ?? rows.length} | Average: ${exportSummary?.average ?? "-"} | Highest: ${exportSummary?.highest ?? "-"} | Lowest: ${exportSummary?.lowest ?? "-"}`,
            `Passed: ${exportSummary?.passed ?? "-"} | Pass rate: ${exportSummary?.passRate === null || exportSummary?.passRate === undefined ? "-" : `${exportSummary.passRate}%`}`,
          ],
          subjects: subjectMatrix,
          students: Array.from(studentRows.values()).sort((left, right) =>
            left.label.localeCompare(right.label)
          ),
          filename: filename("review-marks"),
        });
      } else if (tab === "PUBLICATION") {
        if (!publications?.term) throw new Error("Publication data is not loaded yet.");

        const rows = publications.classes.flatMap((classroom) => {
          const termStatus = classroom.termPublication?.status ?? "PENDING";
          const termDate = classroom.termPublication?.publishedAt
            ? new Date(classroom.termPublication.publishedAt).toLocaleDateString("en-GB")
            : "-";

          if (classroom.sequences.length === 0) {
            return [[
              classroom.section?.name ?? "-",
              classroom.name,
              String(classroom.students),
              String(classroom.marks),
              termStatus,
              "-",
              "-",
              "-",
              termDate,
            ]];
          }

          return classroom.sequences.map((sequence) => [
            classroom.section?.name ?? "-",
            classroom.name,
            String(classroom.students),
            String(classroom.marks),
            termStatus,
            sequence.name,
            sequence.publication?.status ?? "PENDING",
            sequence.publication?.publishedAt
              ? new Date(sequence.publication.publishedAt).toLocaleDateString("en-GB")
              : "-",
            termDate,
          ]);
        });

        await downloadTablePdf({
          title: "Results Publication Status",
          context: [`Academic year: ${publications.term.academicYear.name} | Term: ${publications.term.name}`],
          summary: [
            `Classes: ${publications.summary.classes} | Sequences published: ${publications.summary.sequencesPublished}/${publications.summary.sequences} | Pending: ${publications.summary.sequencesPending}`,
            `Terms published: ${publications.summary.termsPublished}/${publications.summary.classes} | Terms pending: ${publications.summary.termsPending}`,
          ],
          columns: ["Section", "Class", "Students", "Marks", "Term status", "Sequence", "Sequence status", "Sequence date", "Term date"],
          widths: [0.8, 0.9, 0.6, 0.6, 0.9, 0.9, 1, 0.9, 0.8],
          rows,
          filename: filename("publication-status"),
        });
      } else {
        const filters = new URLSearchParams();
        if (attendanceTermId) filters.set("termId", attendanceTermId);
        if (attendanceSectionId) filters.set("sectionId", attendanceSectionId);
        if (attendanceClassroomId) filters.set("classroomId", attendanceClassroomId);
        if (attendanceSubjectId) filters.set("subjectId", attendanceSubjectId);
        if (attendanceTeacherId) filters.set("teacherId", attendanceTeacherId);
        if (attendanceStatus) filters.set("status", attendanceStatus);
        if (attendanceFrom) filters.set("from", attendanceFrom);
        if (attendanceTo) filters.set("to", attendanceTo);
        if (attendanceSearch) filters.set("search", attendanceSearch);

        const { rows, summary: exportSummary } = await fetchAllExportRows<AttendanceRecord>(
          "/api/admin/attendance",
          filters,
          "attendance"
        );

        await downloadTablePdf({
          title: "Student Attendance",
          context: [
            `Term: ${terms.find((term) => term.id === attendanceTermId)?.name ?? "All terms"} | Section: ${attendanceSections.find((section) => section.id === attendanceSectionId)?.name ?? "All sections"} | Class: ${classes.find((item) => item.id === attendanceClassroomId)?.name ?? "All classes"}`,
            `Subject: ${subjects.find((item) => item.id === attendanceSubjectId)?.name ?? "All subjects"} | Teacher: ${teachers.find((item) => item.id === attendanceTeacherId)?.name ?? "All teachers"} | Status: ${attendanceStatus || "All statuses"}`,
            `Dates: ${attendanceFrom || "Any"} to ${attendanceTo || "Any"} | Search: ${attendanceSearch || "None"}`,
          ],
          summary: [
            `Present: ${exportSummary?.PRESENT ?? 0} | Absent: ${exportSummary?.ABSENT ?? 0} | Late: ${exportSummary?.LATE ?? 0} | Excused: ${exportSummary?.EXCUSED ?? 0}`,
            `Presence rate: ${exportSummary?.rate === null || exportSummary?.rate === undefined ? "-" : `${exportSummary.rate}%`} | Records: ${exportSummary?.total ?? rows.length}`,
          ],
          columns: ["Date", "Section", "Class", "Term / sequence", "Subject", "Student", "Matricule", "Status", "Recorded by"],
          widths: [0.8, 0.9, 0.8, 1.1, 0.9, 1.1, 0.9, 0.7, 1],
          rows: rows.map((record) => [
            new Date(record.date).toLocaleDateString("en-GB"),
            record.sectionName ?? "-",
            record.className ?? "-",
            `${record.termName} / ${record.sequenceName}`,
            record.subjectName,
            record.studentName,
            record.matricule,
            record.status,
            record.teacherName,
          ]),
          filename: filename("attendance"),
        });
      }

      setToast("PDF downloaded.");
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to generate the PDF. Please try again."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  /* ---------------- derived ---------------- */

  const activeFilters =
    (termId ? 1 : 0) +
    (sequenceId ? 1 : 0) +
    (classroomId ? 1 : 0) +
    (subjectFilter ? 1 : 0) +
    (teacherFilter ? 1 : 0) +
    (publicationFilter ? 1 : 0) +
    (search ? 1 : 0);

  const uniqueSections = new Map<string, string>();
  classes.forEach((classroom) => {
    if (classroom.sectionId && classroom.sectionName) {
      uniqueSections.set(classroom.sectionId, classroom.sectionName);
    }
  });
  const attendanceSections = Array.from(uniqueSections, ([id, name]) => ({ id, name }));

  return (
    <AdminShell
      title="Results"
      subtitle="Review the marks recorded by teachers and publish results per term or per sequence."
    >
      <PageHeader
        title="Results"
        subtitle="Marks are reviewed here and published to families at the level you choose."
      >
        <Button
          variant="secondary"
          onClick={
            tab === "REVIEW"
              ? loadReview
              : tab === "PUBLICATION"
                ? loadPublications
                : loadAttendance
          }
          loading={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
        <Button
          variant="secondary"
          onClick={downloadCurrentPdf}
          loading={downloadingPdf}
          disabled={loading || downloadingPdf}
        >
          <Download size={16} />
          Download PDF
        </Button>
      </PageHeader>

      {/* ---------------- tabs ---------------- */}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("REVIEW")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "REVIEW"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <BarChart3 size={16} />
          Review marks
        </button>

        <button
          type="button"
          onClick={() => setTab("PUBLICATION")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "PUBLICATION"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <Megaphone size={16} />
          Publication — term & sequences
        </button>

        <button
          type="button"
          onClick={() => setTab("ATTENDANCE")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "ATTENDANCE"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <CalendarCheck size={16} />
          Attendance
        </button>
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorState
            message={error}
            onRetry={
              tab === "REVIEW"
                ? loadReview
                : tab === "PUBLICATION"
                  ? loadPublications
                  : loadAttendance
            }
          />
        </div>
      ) : null}

      {/* =========================================================
          REVIEW TAB
      ========================================================= */}

      {tab === "REVIEW" ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Marks in this view"
              value={summary?.marks ?? 0}
              icon={<BookOpen size={20} />}
              tone="purple"
              loading={loading && !summary}
              hint={total ? `${total} mark(s) match the filters` : undefined}
            />
            <StatCard
              label="Average"
              value={summary?.average ?? "—"}
              icon={<BarChart3 size={20} />}
              tone="blue"
              loading={loading && !summary}
              hint={
                summary
                  ? `highest ${summary.highest ?? "—"} · lowest ${summary.lowest ?? "—"}`
                  : undefined
              }
            />
            <StatCard
              label="Pass rate"
              value={
                summary?.passRate === null || summary?.passRate === undefined
                  ? "—"
                  : `${summary.passRate}%`
              }
              icon={<CheckCircle2 size={20} />}
              tone="emerald"
              loading={loading && !summary}
            />
            <StatCard
              label="Missing marks"
              value={overview?.summary.missing ?? 0}
              icon={<AlertTriangle size={20} />}
              tone={overview?.summary.missing ? "amber" : "gray"}
              loading={loading && !overview}
              hint={
                overview?.summary.completionRate === null ||
                overview?.summary.completionRate === undefined
                  ? undefined
                  : `${overview.summary.completionRate}% complete · ${overview.summary.covered}/${overview.summary.expected} entries`
              }
            />
          </div>

          {/* filters */}

          <Card bodyClassName="p-4" className="mb-5">
            <div className="grid gap-3 lg:grid-cols-4">
              <Field label="Term">
                <Select
                  value={termId}
                  onChange={(event) => {
                    setTermId(event.target.value);
                    setPage(1);
                  }}
                >
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.academicYear?.name
                        ? `${term.academicYear.name} · `
                        : ""}
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Sequence">
                <Select
                  value={sequenceId}
                  onChange={(event) => {
                    setSequenceId(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All sequences</option>
                  {sequenceOptions.map((sequence) => (
                    <option key={sequence.id} value={sequence.id}>
                      {sequence.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Class">
                <Select
                  value={classroomId}
                  onChange={(event) => {
                    setClassroomId(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All classes</option>
                  {classes.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Subject">
                <Select
                  value={subjectFilter}
                  onChange={(event) => {
                    setSubjectFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Teacher">
                <Select
                  value={teacherFilter}
                  onChange={(event) => {
                    setTeacherFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All teachers</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Publication">
                <Select
                  value={publicationFilter}
                  onChange={(event) => {
                    setPublicationFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All marks</option>
                  <option value="PUBLISHED">Published only</option>
                  <option value="NOT_PUBLISHED">Not published only</option>
                </Select>
              </Field>

              <Field label="Search student">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Name or matricule…"
                    className="pl-9"
                  />
                </div>
              </Field>

              {activeFilters ? (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSequenceId("");
                      setClassroomId("");
                      setSubjectFilter("");
                      setTeacherFilter("");
                      setPublicationFilter("");
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X size={16} />
                    Clear filters
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {/* marks table */}

          <Card bodyClassName="p-0">
            {loading ? (
              <div className="p-5">
                <LoadingState label="Loading the marks…" />
              </div>
            ) : marks.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<BookOpen size={20} />}
                  title="No mark found"
                  message={
                    activeFilters
                      ? "No mark matches the current filters."
                      : "Marks recorded by teachers will appear here for review."
                  }
                />
              </div>
            ) : (
              <>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Student</Th>
                      <Th>Class</Th>
                      <Th>Subject</Th>
                      <Th>{sequenceOptions.find((sequence) => sequence.id === sequenceId)?.name ?? "Sequence"}</Th>
                      <Th className="text-right">Mark</Th>
                      <Th>Teacher</Th>
                      <Th>Publication</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {marks.map((mark) => (
                      <tr
                        key={mark.id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <Td>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {mark.student.name}
                          </p>
                          <p className="font-mono text-[11px] text-gray-400">
                            {mark.student.matricule}
                          </p>
                        </Td>
                        <Td className="text-sm">
                          {mark.classroom?.name ?? "—"}
                        </Td>
                        <Td className="text-sm">
                          {mark.subject.name}
                          <span className="ml-1 text-[11px] text-gray-400">
                            ×{mark.subject.coefficient}
                          </span>
                        </Td>
                        <Td className="text-sm">
                          {mark.sequence.name}
                          <span className="block text-[11px] text-gray-400">
                            {mark.term.name}
                          </span>
                        </Td>
                        <Td className="text-sm">{mark.sequence.name}</Td>
                        <Td className="text-right font-semibold">{mark.score}</Td>
                        <Td className="text-xs text-gray-500 dark:text-gray-400">
                          {mark.teacher.fullName}
                        </Td>
                        <Td>
                          <Badge
                            tone={STATE_TONES[mark.publicationState] ?? "gray"}
                          >
                            {STATE_LABELS[mark.publicationState] ??
                              mark.publicationState.toLowerCase()}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                />
              </>
            )}
          </Card>

          {overview && (overview.classes.length > 0 || overview.subjects.length > 0) ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <Card title="Class performance">
                <div className="space-y-3">
                  {overview.classes.map((classroom) => (
                    <div
                      key={classroom.id}
                      className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {classroom.name}
                        </p>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {classroom.average ?? "—"}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${
                            (classroom.average ?? 0) >= 70
                              ? "bg-emerald-500"
                              : (classroom.average ?? 0) >= 10
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, classroom.average ?? 0))}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {classroom.students} student(s) · {classroom.subjects} subject(s) · {classroom.recorded} mark(s) · {classroom.passRate ?? "—"}% pass
                        {classroom.missing ? ` · ${classroom.missing} missing` : " · complete"}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Subject performance">
                <div className="space-y-3">
                  {overview.subjects.map((subject) => (
                    <div key={subject.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {subject.name}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {subject.average ?? "—"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${
                            (subject.average ?? 0) >= 70
                              ? "bg-emerald-500"
                              : (subject.average ?? 0) >= 10
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, subject.average ?? 0))}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {subject.recorded} mark(s) · {subject.passRate ?? "—"}% pass · highest {subject.highest ?? "—"} · lowest {subject.lowest ?? "—"}
                        {subject.missing ? ` · ${subject.missing} missing` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          <Card title="Student performance" className="mt-6" bodyClassName="p-0">
            {loading && studentPerformance.length === 0 ? (
              <div className="p-5">
                <LoadingState label="Loading student performance…" />
              </div>
            ) : studentPerformance.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Users size={20} />}
                  title="No student performance to show"
                  message="Student averages for the selected filters will appear here."
                />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Class</Th>
                    <Th className="text-right">Subjects</Th>
                    <Th className="text-right">Marks</Th>
                    <Th className="text-right">Average</Th>
                  </tr>
                </thead>
                <tbody>
                  {studentPerformance.map((student) => (
                    <tr key={student.id}>
                      <Td>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </p>
                        <p className="font-mono text-[11px] text-gray-400">
                          {student.matricule}
                        </p>
                      </Td>
                      <Td>{student.className}</Td>
                      <Td className="text-right">{student.subjects}</Td>
                      <Td className="text-right">{student.marks}</Td>
                      <Td className="text-right font-semibold">{student.average}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </>
      ) : null}

      {/* =========================================================
          PUBLICATION TAB
      ========================================================= */}

      {tab === "PUBLICATION" ? (
        <>
          {publications?.summary ? (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Classes"
                value={publications.summary.classes}
                icon={<Users size={20} />}
                tone="purple"
                loading={loading && !publications}
              />
              <StatCard
                label="Sequences published"
                value={`${publications.summary.sequencesPublished}/${publications.summary.sequences}`}
                icon={<Layers size={20} />}
                tone="emerald"
                loading={loading && !publications}
              />
              <StatCard
                label="Sequences pending"
                value={publications.summary.sequencesPending}
                icon={<AlertTriangle size={20} />}
                tone={publications.summary.sequencesPending ? "amber" : "gray"}
                loading={loading && !publications}
              />
              <StatCard
                label="Terms published"
                value={`${publications.summary.termsPublished}/${publications.summary.classes}`}
                icon={<Megaphone size={20} />}
                tone="blue"
                loading={loading && !publications}
              />
            </div>
          ) : null}

          <Card bodyClassName="p-4" className="mb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Term" className="sm:max-w-xs">
                <Select
                  value={publishTermId}
                  onChange={(event) => setPublishTermId(event.target.value)}
                >
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.academicYear?.name
                        ? `${term.academicYear.name} · `
                        : ""}
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <p className="text-xs text-gray-500 sm:pb-4 dark:text-gray-400">
                Publish or unpublish a full term or individual sequences.
                Parents and teachers are notified when results are published.
              </p>
            </div>
          </Card>

          {loading ? (
            <Card title="Loading the publication state">
              <LoadingState label="Loading the publication state…" />
            </Card>
          ) : !publications?.term ? (
            <Card>
              <EmptyState
                icon={<Megaphone size={20} />}
                title="No term selected"
                message={
                  publications?.message ??
                  "Choose a term to manage the publication of its results."
                }
              />
            </Card>
          ) : publications.classes.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Users size={20} />}
                title="No class yet"
                message="Create classes before publishing results."
              />
            </Card>
          ) : (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Academic year: {publications.term.academicYear.name}
              </p>
              {publicationSections.map((sectionGroup) => (
                <section key={sectionGroup.name}>
                  <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-bold text-gray-800 dark:border-gray-800 dark:text-gray-200">
                    Section: {sectionGroup.name}
                  </h2>
                  <div className="space-y-5">
                    {sectionGroup.classes.map((classroom) => {
                      const termPublished =
                        classroom.termPublication?.status === "PUBLISHED";

                      return (
                        <Card
                          key={classroom.id}
                          title={classroom.name}
                          description={`${classroom.students} student(s) · ${
                            classroom.marks
                          } mark(s) in ${publications.term?.name}`}
                          action={
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={termPublished ? "green" : "gray"}>
                                {termPublished
                                  ? "Term published"
                                  : "Term not published"}
                              </Badge>
                              <Button
                                size="sm"
                                variant={termPublished ? "secondary" : "primary"}
                                onClick={() =>
                                  setPending({
                                    scope: "TERM",
                                    classroomId: classroom.id,
                                    className: `${classroom.name} · ${sectionGroup.name}`,
                                    action: termPublished ? "UNPUBLISH" : "PUBLISH",
                                  })
                                }
                              >
                                {termPublished ? (
                                  <>
                                    <Undo2 size={14} />
                                    Unpublish term
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    Publish term
                                  </>
                                )}
                              </Button>
                            </div>
                          }
                        >
                    {classroom.termPublication?.publishedAt ? (
                      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                        Term published on{" "}
                        {new Date(
                          classroom.termPublication.publishedAt
                        ).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {classroom.termPublication.publishedBy
                          ? ` by ${classroom.termPublication.publishedBy}`
                          : ""}
                      </p>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {classroom.sequences.map((sequence) => {
                        const published =
                          sequence.publication?.status === "PUBLISHED";

                        return (
                          <div
                            key={sequence.id}
                            className={`rounded-xl border p-3 transition ${
                              published
                                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                                : "border-gray-200 dark:border-gray-800"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {sequence.name}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {sequence.publication?.publishedAt
                                    ? `Published ${new Date(
                                        sequence.publication.publishedAt
                                      ).toLocaleDateString("en-GB")}`
                                    : "Not published"}
                                </p>
                              </div>

                              <Badge tone={published ? "green" : "gray"}>
                                {published ? (
                                  <>
                                    <Lock size={11} /> Released
                                  </>
                                ) : (
                                  "Pending"
                                )}
                              </Badge>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant={published ? "secondary" : "primary"}
                                className="flex-1"
                                onClick={() =>
                                  setPending({
                                    scope: "SEQUENCE",
                                    classroomId: classroom.id,
                                    className: classroom.name,
                                    sequenceId: sequence.id,
                                    sequenceName: sequence.name,
                                    action: published ? "UNPUBLISH" : "PUBLISH",
                                  })
                                }
                              >
                                {published ? (
                                  <>
                                    <Undo2 size={14} />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    Publish sequence
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : null}

      {tab === "ATTENDANCE" ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Present"
              value={attendanceSummary?.PRESENT ?? 0}
              icon={<CheckCircle2 size={20} />}
              tone="emerald"
              loading={loading && !attendanceSummary}
            />
            <StatCard
              label="Absent"
              value={attendanceSummary?.ABSENT ?? 0}
              icon={<AlertTriangle size={20} />}
              tone="amber"
              loading={loading && !attendanceSummary}
            />
            <StatCard
              label="Late"
              value={attendanceSummary?.LATE ?? 0}
              icon={<CalendarCheck size={20} />}
              tone="blue"
              loading={loading && !attendanceSummary}
            />
            <StatCard
              label="Excused"
              value={attendanceSummary?.EXCUSED ?? 0}
              icon={<CheckCircle2 size={20} />}
              tone="purple"
              loading={loading && !attendanceSummary}
            />
            <StatCard
              label="Presence rate"
              value={
                attendanceSummary?.rate === null || attendanceSummary?.rate === undefined
                  ? "—"
                  : `${attendanceSummary.rate}%`
              }
              icon={<Users size={20} />}
              tone="gray"
              loading={loading && !attendanceSummary}
              hint={`${attendanceSummary?.total ?? 0} attendance record(s)`}
            />
          </div>

          <Card bodyClassName="p-4" className="mb-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Term">
                <Select
                  value={attendanceTermId}
                  onChange={(event) => {
                    setAttendanceTermId(event.target.value);
                    setAttendancePage(1);
                  }}
                >
                  <option value="">All terms</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.academicYear?.name ? `${term.academicYear.name} · ` : ""}
                      {term.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Section">
                <Select
                  value={attendanceSectionId}
                  onChange={(event) => {
                    setAttendanceSectionId(event.target.value);
                    setAttendanceClassroomId("");
                    setAttendancePage(1);
                  }}
                >
                  <option value="">All sections</option>
                  {attendanceSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Class">
                <Select
                  value={attendanceClassroomId}
                  onChange={(event) => {
                    setAttendanceClassroomId(event.target.value);
                    setAttendancePage(1);
                  }}
                >
                  <option value="">All classes</option>
                  {classes
                    .filter(
                      (classroom) =>
                        !attendanceSectionId ||
                        classroom.sectionId === attendanceSectionId
                    )
                    .map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                </Select>
              </Field>

              <Field label="Subject">
                <Select
                  value={attendanceSubjectId}
                  onChange={(event) => {
                    setAttendanceSubjectId(event.target.value);
                    setAttendancePage(1);
                  }}
                >
                  <option value="">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Teacher">
                <Select
                  value={attendanceTeacherId}
                  onChange={(event) => {
                    setAttendanceTeacherId(event.target.value);
                    setAttendancePage(1);
                  }}
                >
                  <option value="">All teachers</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Status">
                <Select
                  value={attendanceStatus}
                  onChange={(event) => {
                    setAttendanceStatus(event.target.value);
                    setAttendancePage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </Select>
              </Field>

              <Field label="From date">
                <Input
                  type="date"
                  value={attendanceFrom}
                  onChange={(event) => {
                    setAttendanceFrom(event.target.value);
                    setAttendancePage(1);
                  }}
                />
              </Field>

              <Field label="To date">
                <Input
                  type="date"
                  value={attendanceTo}
                  onChange={(event) => {
                    setAttendanceTo(event.target.value);
                    setAttendancePage(1);
                  }}
                />
              </Field>

              <Field label="Search student">
                <Input
                  value={attendanceSearch}
                  onChange={(event) => {
                    setAttendanceSearch(event.target.value);
                    setAttendancePage(1);
                  }}
                  placeholder="Name or matricule"
                />
              </Field>
            </div>
          </Card>

          <Card bodyClassName="p-0">
            {loading ? (
              <div className="p-5">
                <LoadingState label="Loading attendance records…" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CalendarCheck size={20} />}
                  title="No attendance records found"
                  message="Teacher-saved attendance records will appear here. Adjust the filters or check back after attendance is saved."
                />
              </div>
            ) : (
              <>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      <Th>Section</Th>
                      <Th>Class</Th>
                      <Th>Term</Th>
                      <Th>Subject</Th>
                      <Th>Student</Th>
                      <Th>Status</Th>
                      <Th>Recorded by</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <Td className="whitespace-nowrap text-sm">
                          {new Date(record.date).toLocaleDateString("en-GB")}
                        </Td>
                        <Td className="text-sm">{record.sectionName ?? "—"}</Td>
                        <Td className="text-sm">{record.className ?? "—"}</Td>
                        <Td className="text-sm">
                          {record.termName}
                          <span className="block text-[11px] text-gray-400">
                            {record.academicYearName} · {record.sequenceName}
                          </span>
                        </Td>
                        <Td className="text-sm">{record.subjectName}</Td>
                        <Td>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {record.studentName}
                          </p>
                          <p className="font-mono text-[11px] text-gray-400">
                            {record.matricule}
                          </p>
                        </Td>
                        <Td>
                          <Badge
                            tone={{
                              PRESENT: "green",
                              ABSENT: "red",
                              LATE: "amber",
                              EXCUSED: "blue",
                            }[record.status]}
                          >
                            {record.status.toLowerCase()}
                          </Badge>
                        </Td>
                        <Td className="text-sm text-gray-600 dark:text-gray-300">
                          {record.teacherName}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>

                <Pagination
                  page={attendancePage}
                  pageSize={attendancePageSize}
                  total={attendanceTotal}
                  onPageChange={setAttendancePage}
                />
              </>
            )}
          </Card>
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={applyPublication}
        title={
          pending
            ? `${
                pending.action === "PUBLISH" ? "Publish" : "Unpublish"
              } ${pending.scope === "TERM" ? "the whole term" : "the sequence"}`
            : ""
        }
        message={
          pending
            ? `${pending.action === "PUBLISH" ? "Publishing" : "Unpublishing"} ${
                pending.scope === "TERM"
                  ? `every sequence of ${pending.className}`
                  : `${pending.sequenceName} for ${pending.className}`
              }. ${
                pending.action === "PUBLISH"
                  ? "Parents and teachers of the class will be notified and the results become visible to them."
                  : "The results will no longer be visible to parents and teachers."
              }`
            : ""
        }
        confirmLabel={pending?.action === "PUBLISH" ? "Publish" : "Unpublish"}
        loading={working}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </AdminShell>
  );
}
