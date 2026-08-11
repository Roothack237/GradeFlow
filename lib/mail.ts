import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function sendTeacherLoginCode(
  email: string,
  firstName: string,
  loginCode: string
) {
  await transporter.sendMail({
    from: `"GradeFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to GradeFlow - Your Login Code",

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">

        <h1 style="color: #6d28d9;">
          Welcome to GradeFlow 🎓
        </h1>

        <p>
          Hello <strong>${firstName}</strong>,
        </p>

        <p>
          Your teacher account has been created by your school administrator.
        </p>

        <p>
          Use the email address associated with this account and the login
          code below to access GradeFlow.
        </p>

        <div style="
          background: #f3f0ff;
          padding: 20px;
          text-align: center;
          border-radius: 10px;
          margin: 25px 0;
        ">
          <p style="margin: 0; color: #666;">
            Your Login Code
          </p>

          <h2 style="
            color: #6d28d9;
            letter-spacing: 3px;
            margin-bottom: 0;
          ">
            ${loginCode}
          </h2>
        </div>

        <p>
          Keep this code secure and do not share it with anyone.
        </p>

        <p>
          Regards,<br />
          <strong>GradeFlow Administration</strong>
        </p>

      </div>
    `,
  });
}