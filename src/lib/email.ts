import nodemailer from "nodemailer";

// Sends transactional email (new book requests, return recalls) via Gmail
// SMTP using a free "App Password" — no paid email service needed.
// Requires GMAIL_USER and GMAIL_APP_PASSWORD env vars. If they're not set
// (e.g. running locally before you've configured them), this quietly
// no-ops instead of throwing, so the rest of the app keeps working.
function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text: string;
}) {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      "GMAIL_USER/GMAIL_APP_PASSWORD not configured — skipping email:",
      options.subject
    );
    return;
  }

  try {
    await transport.sendMail({
      from: `"Tabor Street Books" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
  } catch (err) {
    // Never let an email failure break the user-facing action that
    // triggered it (e.g. submitting a book request should still succeed).
    console.error("Failed to send email:", err);
  }
}
