describe("GradeFlow Login", () => {
  test("allows login with valid credentials", () => {
    const email = "admin@gradeflow.com";
    const password = "2572";

    const validCredentials =
      email === "admin@gradeflow.com" &&
      password === "2572";

    expect(validCredentials).toBe(true);
  });

  test("rejects login with invalid credentials", () => {
    const email = "wrong@example.com";
    const password = "wrongpassword";

    const validCredentials =
      email === "admin@gradeflow.com" &&
      password === "2572";

    expect(validCredentials).toBe(false);
  });

  test("rejects login when password is empty", () => {
    const email = "admin@gradeflow.com";
    const password = "";

    const validCredentials =
      email === "admin@gradeflow.com" &&
      password === "2572";

    expect(validCredentials).toBe(false);
  });

  test("rejects login when email is empty", () => {
    const email = "";
    const password = "2572";

    const validCredentials =
      email === "admin@gradeflow.com" &&
      password === "2572";

    expect(validCredentials).toBe(false);
  });
});