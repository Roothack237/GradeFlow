
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// --------------------------------------------------
// Generic Email Function
// --------------------------------------------------
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!to) {
    throw new Error("Recipient email is missing.");
  }

  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured.");
  }

  if (!process.env.EMAIL_APP_PASSWORD) {
    throw new Error("EMAIL_APP_PASSWORD is not configured.");
  }

  await transporter.sendMail({
    from: `"GradeFlow School" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// --------------------------------------------------
// Parent Login Email
// --------------------------------------------------
export async function sendParentLoginCode(
  parentEmail: string,
  parentName: string,
  parentId: string,
  loginCode: string
) {
  if (!parentEmail) {
    throw new Error("Parent email is missing.");
  }

  if (!loginCode) {
    throw new Error("Parent login code is missing.");
  }

  await sendEmail({
    to: parentEmail,
    subject: "Your GradeFlow Parent Login Credentials",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f8fafc;">

        <div style="background: #2563eb; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">
            GradeFlow
          </h1>

          <p style="color: #dbeafe; margin: 5px 0 0;">
            School Management System
          </p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">

          <h2>Hello ${parentName},</h2>

          <p>
            Your parent account has been successfully created on GradeFlow.
          </p>

          <p>
            You can use the credentials below to access your parent account:
          </p>

          <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 20px 0;">

            <p style="margin: 8px 0;">
              <strong>Parent ID:</strong>
              ${parentId}
            </p>

            <p style="margin: 8px 0;">
              <strong>Login Code:</strong>
            </p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 8px;
              text-align: center;
              padding: 15px;
            ">
              ${loginCode}
            </div>

          </div>

          <p>
            Please keep this information secure and do not share your login
            credentials with anyone.
          </p>

          <p>
            If you did not expect this account, please contact the school
            administration.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br />
            <strong>GradeFlow Administration</strong>
          </p>

        </div>
      </div>
    `,
  });
}

// --------------------------------------------------
// Teacher Login Email
// --------------------------------------------------
export async function sendTeacherLoginCode(
  teacherEmail: string,
  teacherName: string,
  loginCode: string
) {
  if (!teacherEmail) {
    throw new Error("Teacher email is missing.");
  }

  if (!loginCode) {
    throw new Error("Teacher login code is missing.");
  }

  await sendEmail({
    to: teacherEmail,
    subject: "Your GradeFlow Teacher Login Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f8fafc;">

        <div style="background: #2563eb; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">
            GradeFlow
          </h1>

          <p style="color: #dbeafe; margin: 5px 0 0;">
            School Management System
          </p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">

          <h2>Hello ${teacherName},</h2>

          <p>
            Your teacher account has been successfully created on GradeFlow.
          </p>

          <p>
            Use the login code below to access your teacher account.
          </p>

          <div style="
            background: #f1f5f9;
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            text-align: center;
          ">

            <p style="margin: 0 0 10px 0;">
              <strong>Your 4-digit Login Code</strong>
            </p>

            <div style="
              font-size: 36px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 10px;
              padding: 15px;
            ">
              ${loginCode}
            </div>

          </div>

          <p>
            Use your email address and this 4-digit code to log in to GradeFlow.
          </p>

          <p>
            Please keep this code secure and do not share it with anyone.
          </p>

          <p>
            If you did not expect this account, please contact the school
            administration.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br />
            <strong>GradeFlow Administration</strong>
          </p>

        </div>
      </div>
    `,
  });
}
