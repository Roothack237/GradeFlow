
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

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

  await transporter.sendMail({
    from: `"GradeFlow School" <${process.env.EMAIL_USER}>`,
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

