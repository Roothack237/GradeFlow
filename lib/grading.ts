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

/** Letter grade for an average on the 20-point scale. */
export function gradeOf(average: number): string {
  if (average >= 16) return "A";
  if (average >= 14) return "B";
  if (average >= 12) return "C";
  if (average >= 10) return "D";
  if (average >= 8) return "E";
  return "F";
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
