/**
 * GradeFlow grading scale — single source of truth.
 *
 * Teachers record marks on the 20-point scale (the teacher marks form and
 * its API both validate 0–20). Every pass/grade computation in the app must
 * use these constants so that analytics, report cards, predictions and the
 * AI assistants agree on one scale.
 */

/** Maximum mark for a single assessment. */
export const MAX_MARK = 20;

/** Pass mark on the 20-point scale. */
export const PASS_MARK = 10;

/** Whether a mark/average on the 20-point scale is a pass. */
export function isPass(average: number): boolean {
  return average >= PASS_MARK;
}

/** Share of the class that passed, in percent (0–100). */
export function passRateOf(averages: number[]): number | null {
  if (!averages.length) return null;
  return round2((averages.filter(isPass).length / averages.length) * 100);
}

/**
 * The grading scale, highest band first. `min` is inclusive and the next band
 * down starts just under it, so `gradeOf()` and the scale printed on the
 * report cards can never disagree.
 */
export const GRADE_SCALE: { grade: string; min: number; remark: string }[] = [
  { grade: "A", min: 16, remark: "Excellent" },
  { grade: "B", min: 14, remark: "Very good" },
  { grade: "C", min: 12, remark: "Good" },
  { grade: "D", min: 10, remark: "Fair" },
  { grade: "E", min: 8, remark: "Weak" },
  { grade: "F", min: 0, remark: "Very weak" },
];

/** Letter grade for an average on the 20-point scale. */
export function gradeOf(average: number): string {
  return (
    GRADE_SCALE.find((band) => average >= band.min)?.grade ?? "F"
  );
}

/**
 * "A 16-20 · B 14-15.99 · ..." — printed as the legend of the report card.
 */
export function gradeScaleLegend(): string {
  return GRADE_SCALE.map((band, index) => {
    const upper = index === 0 ? MAX_MARK : GRADE_SCALE[index - 1].min - 0.01;

    return `${band.grade} ${band.min}-${Number(upper.toFixed(2))}`;
  }).join("  ·  ");
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Appreciation printed next to a mark or a term average on a report card.
 * Kept on the same scale as gradeOf() so remarks and grades always agree.
 */
export function remarkOf(average: number | null | undefined): string | null {
  if (average === null || average === undefined || Number.isNaN(average)) {
    return null;
  }

  if (average >= 16) return "Excellent work";
  if (average >= 14) return "Very good work";
  if (average >= 12) return "Good work";
  if (average >= 10) return "Fair result";
  if (average >= 8) return "Weak result";
  return "Very weak result";
}

/** Promotion decision used by the report cards (same rule as before). */
export function decisionOf(average: number | null | undefined): string | null {
  if (average === null || average === undefined || Number.isNaN(average)) {
    return null;
  }

  return isPass(average) ? "PROMOTED" : "REPEAT";
}
