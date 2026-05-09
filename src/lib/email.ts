/**
 * Email gönderim katmanı — Resend wrapper.
 * Dev ortamında RESEND_API_KEY yoksa konsola log (PRD §5.1).
 */

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log("[email:dev]", { to, subject, html })
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "no-reply@example.com",
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[email:resend-error]", res.status, body)
    throw new Error("Email service unavailable")
  }
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Parolanızı sıfırlayın",
    html: `
      <p>Parolanızı sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Bu bağlantı 1 saat içinde geçersiz olacaktır. İsteği siz yapmadıysanız bu emaili yok sayabilirsiniz.</p>
    `,
  }
}
