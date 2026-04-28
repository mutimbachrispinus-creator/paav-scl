import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Sandbox default

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send a WhatsApp message using Twilio.
 */
export async function sendWhatsApp({ to, body }) {
  if (!client) {
    console.error('Twilio credentials missing. WhatsApp message not sent.');
    return { error: 'Twilio credentials missing' };
  }

  try {
    // Ensure 'to' is in the format 'whatsapp:+254...'
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to.startsWith('+') ? to : '+' + to}`;
    
    const message = await client.messages.create({
      from: fromNumber,
      to: formattedTo,
      body,
    });

    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('Twilio WhatsApp error:', err);
    return { error: err.message };
  }
}

/**
 * Fee reminder template
 */
export function getFeeReminderMessage(learnerName, balance) {
  return `Jambo! This is a reminder from PAAV-Gitombo School. 
The fee balance for ${learnerName} is KSH ${Number(balance).toLocaleString()}. 
Kindly settle it to ensure smooth learning. Asante!`;
}

/**
 * Result notification template
 */
export function getResultNotificationMessage(learnerName, term, totalPts, maxPts) {
  return `Jambo! The Term ${term} results for ${learnerName} are out. 
Performance: ${totalPts} / ${maxPts} points. 
Log in to the school portal to view the full report card. Asante!`;
}
