const { Resend } = require('resend');

let resend;
const getResend = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — emails will be skipped');
      return null;
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const client = getResend();
    if (!client) return null;
    const data = await client.emails.send({
      from: process.env.EMAIL_FROM || 'VendorBridge <noreply@yourdomain.com>',
      to: to,
      subject: subject,
      html: htmlContent,
    });
    return data;
  } catch (error) {
    console.error('Email utility failed:', error);
    return null;
  }
};

module.exports = { sendEmail };
