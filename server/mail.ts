import nodemailer from 'nodemailer';

export async function sendEmail(mail: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<'accepted' | 'not_configured' | 'failed'> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) return 'not_configured';

  const port = Number(SMTP_PORT || 587);
  const secure = SMTP_SECURE === undefined ? port === 465 : SMTP_SECURE === 'true';
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    requireTLS: !secure && SMTP_HOST !== '127.0.0.1' && SMTP_HOST !== 'localhost',
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  try {
    const result = await transport.sendMail({
      from: SMTP_FROM,
      to: { name: '', address: mail.to },
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo ? { name: '', address: mail.replyTo } : undefined,
    });
    return result.accepted.length ? 'accepted' : 'failed';
  } catch {
    return 'failed';
  }
}

export function isEmailAddress(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value);
}
