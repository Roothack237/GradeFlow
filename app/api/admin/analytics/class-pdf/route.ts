import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const classroomId =
      searchParams.get("classroomId") || "";

    const academicYearId =
      searchParams.get("academicYearId") || "";

    const className =
      searchParams.get("className") ||
      "Class Performance";

    const section =
      searchParams.get("section") ||
      "";

    /*
     * We deliberately don't query Prisma here.
     *
     * This avoids making assumptions about your current
     * Classroom, Student, Mark and Attendance fields.
     *
     * The page is designed to be opened from your
     * Analytics page and printed/saved as PDF.
     */

    const html = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  ${escapeHtml(className)} Performance Report
</title>

<style>

@page {
  size: A4;
  margin: 18mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: white;
  color: #111827;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.header {
  text-align: center;
  border-bottom: 3px solid #6d28d9;
  padding-bottom: 18px;
  margin-bottom: 25px;
}

.school-name {
  font-size: 25px;
  font-weight: 800;
}

.report-title {
  margin-top: 8px;
  color: #6d28d9;
  font-size: 21px;
  font-weight: 800;
}

.report-subtitle {
  margin-top: 5px;
  color: #6b7280;
  font-size: 13px;
}

.info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 25px;
}

.info-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 13px;
}

.info-label {
  color: #6b7280;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.info-value {
  margin-top: 5px;
  font-size: 15px;
  font-weight: 700;
}

.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 25px;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.card-title {
  color: #6b7280;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.card-value {
  margin-top: 7px;
  color: #6d28d9;
  font-size: 22px;
  font-weight: 800;
}

.section-title {
  margin-top: 25px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 800;
}

.empty {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 25px;
  color: #6b7280;
  text-align: center;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.table th {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 9px;
  font-size: 11px;
  text-align: left;
}

.table td {
  border: 1px solid #e5e7eb;
  padding: 9px;
  font-size: 11px;
}

.footer {
  display: flex;
  justify-content: space-between;
  margin-top: 35px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 10px;
}

.print-button {
  position: fixed;
  right: 20px;
  top: 20px;
  border: none;
  border-radius: 7px;
  padding: 10px 18px;
  background: #6d28d9;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

@media print {
  .print-button {
    display: none;
  }
}

</style>

</head>

<body>

<button
  class="print-button"
  onclick="window.print()"
>
  Print / Save as PDF
</button>

<div class="header">

  <div class="school-name">
    ALL NATIONS SECONDARY SCHOOL
  </div>

  <div class="report-title">
    Class Performance Report
  </div>

  <div class="report-subtitle">
    GradeFlow Academic Performance Analysis
  </div>

</div>

<div class="info">

  <div class="info-card">

    <div class="info-label">
      Class
    </div>

    <div class="info-value">
      ${escapeHtml(className)}
    </div>

  </div>

  <div class="info-card">

    <div class="info-label">
      Section
    </div>

    <div class="info-value">
      ${escapeHtml(section || "—")}
    </div>

  </div>

  <div class="info-card">

    <div class="info-label">
      Classroom ID
    </div>

    <div class="info-value">
      ${escapeHtml(classroomId || "—")}
    </div>

  </div>

  <div class="info-card">

    <div class="info-label">
      Academic Year
    </div>

    <div class="info-value">
      ${escapeHtml(academicYearId || "Current")}
    </div>

  </div>

</div>

<div class="summary">

  <div class="card">

    <div class="card-title">
      Students
    </div>

    <div class="card-value">
      —
    </div>

  </div>

  <div class="card">

    <div class="card-title">
      Class Average
    </div>

    <div class="card-value">
      —
    </div>

  </div>

  <div class="card">

    <div class="card-title">
      Pass Rate
    </div>

    <div class="card-value">
      —
    </div>

  </div>

  <div class="card">

    <div class="card-title">
      Attendance
    </div>

    <div class="card-value">
      —
    </div>

  </div>

</div>

<div class="section-title">
  Student Performance
</div>

<table class="table">

<thead>

<tr>

<th>
  #
</th>

<th>
  Student
</th>

<th>
  Average
</th>

<th>
  Grade
</th>

<th>
  Attendance
</th>

</tr>

</thead>

<tbody>

<tr>

<td>
  —
</td>

<td>
  Student performance data
</td>

<td>
  —
</td>

<td>
  —
</td>

<td>
  —
</td>

</tr>

</tbody>

</table>

<div class="section-title">
  Subject Performance
</div>

<div class="empty">
  Subject performance information will appear here.
</div>

<div class="section-title">
  Attendance Analysis
</div>

<div class="empty">
  Attendance information will appear here.
</div>

<div class="footer">

<span>
  GradeFlow — Student Result Management System
</span>

<span>
  Generated ${new Date().toLocaleDateString()}
</span>

</div>

</body>

</html>
`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {

    console.error(
      "CLASS PDF ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate class performance report.",
      },
      {
        status: 500,
      }
    );
  }
}