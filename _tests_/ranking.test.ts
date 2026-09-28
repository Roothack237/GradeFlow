describe("Student Ranking", () => {
  test("highest average gets first position", () => {
    const students = [
      { name: "John", average: 12 },
      { name: "Mary", average: 18 },
      { name: "Peter", average: 15 },
    ];

    students.sort(
      (a, b) => b.average - a.average
    );

    expect(students[0].name).toBe("Mary");
  });
});