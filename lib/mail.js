import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send an email using Resend.
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!resend) {
    console.error('RESEND_API_KEY is missing. Email not sent.');
    return { error: 'RESEND_API_KEY is missing' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'PAAV School <portal@paav.school>', // You might need to verify this domain in Resend
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return { error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email send catch error:', err);
    return { error: err.message };
  }
}

/**
 * Generate a simple fee receipt HTML template.
 */
export function getReceiptTemplate({ learnerName, adm, amount, term, date, ref, balance }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #1e293b; text-align: center;">Fee Payment Receipt</h2>
      <p>Dear Parent,</p>
      <p>We have successfully recorded a payment for <strong>${learnerName}</strong>.</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0; color: #64748b;">Learner Name:</td><td style="padding: 5px 0; font-weight: bold;">${learnerName}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b;">Admission No:</td><td style="padding: 5px 0; font-weight: bold;">${adm}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b;">Amount Paid:</td><td style="padding: 5px 0; font-weight: bold; color: #16a34a;">KSH ${Number(amount).toLocaleString()}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b;">Term:</td><td style="padding: 5px 0; font-weight: bold;">${term}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b;">Date:</td><td style="padding: 5px 0; font-weight: bold;">${date}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b;">Reference:</td><td style="padding: 5px 0; font-weight: bold;">${ref || 'N/A'}</td></tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <p style="font-size: 18px;">Remaining Balance: <strong style="color: ${balance <= 0 ? '#16a34a' : '#dc2626'}">KSH ${Number(balance).toLocaleString()}</strong></p>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        PAAV-Gitombo Community School Portal<br />
        This is an automated receipt.
      </p>
    </div>
  `;
}

/**
 * Generate a report card summary HTML template.
 */
export function getReportCardTemplate({ learnerName, term, year, totalPts, maxPts, pct, promoStatus, link }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #1e293b; text-align: center;">Termly Progress Report</h2>
      <p>Dear Parent,</p>
      <p>The academic report for <strong>${learnerName}</strong> for <strong>Term ${term} ${year}</strong> is now available.</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Overall Performance</div>
        <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${totalPts} / ${maxPts} Points</div>
        <div style="font-size: 16px; color: #1e293b; margin-top: 5px;">Grade Average: <strong>${pct}%</strong></div>
        <div style="margin-top: 10px; font-weight: bold; color: ${promoStatus === 'promote' ? '#16a34a' : '#d97706'}">
          ${promoStatus === 'promote' ? '✅ PROMOTED' : '⚠ UNDER REVIEW'}
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background: #1e293b; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          View Full Report Card
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        You can also log in to the school portal at any time to view detailed marks and fee statements.
      </p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        PAAV-Gitombo Community School Portal<br />
        "More Than Academics!"
      </p>
    </div>
  `;
}
