import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type ReportEmailParams = {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  reasonCode: string;
  comment: string | null;
  reporterUserId: string | null;
  reporterEmail?: string | null;
};

export async function sendReportEmail(params: ReportEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn('Resend not configured - RESEND_API_KEY missing');
    return false;
  }

  const {
    articleId,
    articleTitle,
    articleSlug,
    reasonCode,
    comment,
    reporterUserId,
    reporterEmail,
  } = params;

  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/articles/${articleSlug}`;
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/articles/${articleId}`;

  try {
    await resend.emails.send({
      from: 'Nexus Med News Reports <reports@nexusmednews.com>',
      to: 'here@coghorizon.com',
      subject: `Article Report: ${reasonCode} - ${articleTitle}`,
      html: `
        <h2>Article Report Received</h2>
        <p>A user has reported an article on Nexus Med News.</p>

        <h3>Article Details</h3>
        <ul>
          <li><strong>Title:</strong> ${articleTitle}</li>
          <li><strong>Article ID:</strong> ${articleId}</li>
          <li><strong>Slug:</strong> ${articleSlug}</li>
          <li><strong>URL:</strong> <a href="${articleUrl}">${articleUrl}</a></li>
          <li><strong>Admin URL:</strong> <a href="${adminUrl}">${adminUrl}</a></li>
        </ul>

        <h3>Report Details</h3>
        <ul>
          <li><strong>Reason:</strong> ${reasonCode}</li>
          ${comment ? `<li><strong>Comment:</strong> ${comment}</li>` : ''}
          ${reporterUserId ? `<li><strong>Reporter User ID:</strong> ${reporterUserId}</li>` : '<li><strong>Reporter:</strong> Anonymous</li>'}
          ${reporterEmail ? `<li><strong>Reporter Email:</strong> ${reporterEmail}</li>` : ''}
        </ul>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          This is an automated notification from Nexus Med News.
        </p>
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending report email:', error);
    return false;
  }
}

export type ContactEmailParams = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function sendContactEmail(params: ContactEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn('Resend not configured - RESEND_API_KEY missing');
    return false;
  }

  const { name, email, subject, message } = params;

  try {
    await resend.emails.send({
      from: 'Nexus Med News Contact <info@nexusmednews.com>',
      to: 'here@coghorizon.com',
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>

        <h3>Sender Details</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
        </ul>

        <h3>Message</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 10px;">
          ${message.replace(/\n/g, '<br>')}
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          This message was sent via the Nexus Med News contact form.
        </p>
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
}
