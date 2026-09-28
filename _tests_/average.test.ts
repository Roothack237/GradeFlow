describe("Student Average Calculation", () => {
  test("calculates average correctly", () => {
    const scores = [12, 14, 16];

    const average =
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length;

    expect(average).toBe(14);
  });

  test("returns 0 when there are no marks", () => {
    const scores: number[] = [];

    const average =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) /
          scores.length
        : 0;

    expect(average).toBe(0);
  });
});