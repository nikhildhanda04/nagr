type Email = { to: string; subject: string; html: string };

// Provider-agnostic sender. Uses Resend (raw REST, no SDK) when RESEND_API_KEY
// is set; otherwise logs to the console so auth flows still work in dev.
export async function sendEmail({ to, subject, html }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "whatstodo <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email:dev] to=${to} subject=${JSON.stringify(subject)}\n${html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    console.error("email send failed", res.status, await res.text());
  }
}
