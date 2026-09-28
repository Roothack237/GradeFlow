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

    const section = searchParams.get("section") || "Section";
    const academicYearId =
      searchParams.get("academicYearId") || "";

    /*
     * This page is intentionally printable HTML.
     * The browser can print/save it as PDF.
     *
     * We do NOT guess Prisma fields here.
     * The analytics page can pass the section information
     * through the query string.
     */

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>${escapeHtml(section)} Performance Report</title>

<style>

@page {
  size: A4;
  margin: 18mm;
}

* {
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  color: #111827;
  margin: 0;
  background: white;
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
  color: #111827;
}

.report-title {
  margin-top: 8px;
  font-size: 21px;
  font-weight: 700;
  color: #6d28d9;
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
  padding: 12px;
}

.info-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 700;
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
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 700;
}

.card-value {
  margin-top: 7px;
  font-size: 22px;
  font-weight: 800;
  color: #6d28d9;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  margin: 25px 0 10px;
  color: #111827;
}

.empty {
  border: 1px dashed #d1d5db;
  padding: 25px;
  text-align: center;
  color: #6b7280;
  border-radius: 8px;
}

.footer {
  margin-top: 35px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 10px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}

.print-button {
  position: fixed;
  right: 20px;
  top: 20px;
  background: #6d28d9;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 7px;
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

<button class="print-button" onclick="window.print()">
  Print / Save as PDF
</button>

<div class="header">

  <div class="school-name">
    ALL NATIONS SECONDARY SCHOOL
  </div>

  <div class="report-title">
    Section Performance Report
  </div>

  <div class="report-subtitle">
    Academic Performance Analysis
  </div>

</div>

<div class="info">

  <div class="info-card">
    <div class="info-label">
      Section
    </div>

    <div class="info-value">
      ${escapeHtml(section)}
    </div>
  </div>

  <div class="info-card">
    <div class="info-label">
      Academic Year
    </div>

    <div class="info-value">
      ${escapeHtml(academicYearId || "Current Academic Year")}
    </div>
  </div>

</div>

<div class="summary">

  <div class="card">
    <div class="card-title">
      Classes
    </div>

    <div class="card-value">
      —
    </div>
  </div>

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
      Average
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

</div>

<div class="section-title">
  Section Performance
</div>

<div class="empty">
  Section performance data will be displayed here.
</div>

<div class="section-title">
  Class Performance
</div>

<div class="empty">
  Select a class from the Analytics page to view detailed
  class performance.
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
    console.error("SECTION PDF ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to generate section performance report.",
      },
      {
        status: 500,
      }
    );
  }
}