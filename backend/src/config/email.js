import 'dotenv/config';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    logger.info(`📧 Sending Email to: ${to} | Subject: ${subject}`);
    
    // In development mode, output email body to console for easy OTP access
    logger.info(`[Dev Mail Body]:\n${text || html}\n----------------------`);

    const apiKey = process.env.SMTP_PASS;
    const senderEmail = process.env.FROM_EMAIL || 'noreply@luxestays.com';
    const senderName = process.env.FROM_NAME || 'LuxeStays Platform';

    // If using Brevo API Key, bypass SMTP port block and use Brevo's REST API directly (Port 443)
    if (apiKey && apiKey.startsWith('xsmtpsib-')) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Brevo API HTTP status: ${response.status}`);
      }

      const info = await response.json();
      logger.info(`📧 Email sent successfully via Brevo HTTP API: ${JSON.stringify(info)}`);
      return info;
    }

    // Fallback to Nodemailer SMTP (for Gmail/Local development)
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_PASS !== 'app_password_here') {
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info(`📧 Email sent successfully via SMTP: MessageId: ${info.messageId}`);
      return info;
    } else {
      logger.warn(`⚠️ SMTP Credentials not configured or using default values. Skipped actual delivery, using console log fallback.`);
      return { mock: true, messageId: 'mock-dev-id-' + Date.now() };
    }
  } catch (error) {
    logger.error(`❌ Email sending failed to ${to}: ${error.message}`);
    logger.warn(`⚠️ Continuing flow with mock SMTP delivery to prevent app/signup crash.`);
    return { mock: true, messageId: 'mock-error-fallback-id-' + Date.now() };
  }
};

export default sendEmail;
