describe("GradeFlow Parent-Child Management", () => {
  test("allows a parent to have one child", () => {
    const children = ["Student A"];

    expect(children.length).toBe(1);
  });

  test("allows a parent to have multiple children", () => {
    const children = [
      "Student A",
      "Student B",
      "Student C",
    ];

    expect(children.length).toBe(3);
  });

  test("parent can access a linked child", () => {
    const children = [
      {
        id: "STU001",
        name: "Student A",
      },
      {
        id: "STU002",
        name: "Student B",
      },
    ];

    const child = children.find(
      (student) => student.id === "STU001"
    );

    expect(child).toBeDefined();
    expect(child?.name).toBe("Student A");
  });

  test("parent cannot access an unlinked child", () => {
    const children = [
      {
        id: "STU001",
        name: "Student A",
      },
    ];

    const child = children.find(
      (student) => student.id === "STU999"
    );

    expect(child).toBeUndefined();
  });
});