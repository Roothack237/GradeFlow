import crypto from "crypto";

export function generateLoginCode() {
  const part1 = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  const part2 = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `GF-${part1}-${part2}`;
}