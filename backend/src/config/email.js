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
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'LuxeStays'}" <${process.env.FROM_EMAIL || 'noreply@luxestays.com'}>`,
      to,
      subject,
      text,
      html,
    };

    logger.info(`📧 Sending Email to: ${to} | Subject: ${subject}`);
    
    // In development mode, output email body to console for easy OTP access
    logger.info(`[Dev Mail Body]:\n${text || html}\n----------------------`);

    // Only attempt delivery if SMTP credentials look set
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_PASS !== 'app_password_here') {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`📧 Email sent successfully: MessageId: ${info.messageId}`);
      return info;
    } else {
      logger.warn(`⚠️ SMTP Credentials not configured or using default values. Skipped actual delivery, using console log fallback.`);
      return { mock: true, messageId: 'mock-dev-id-' + Date.now() };
    }
  } catch (error) {
    logger.error(`❌ Email sending failed to ${to}: ${error.message}`);
    // If in development mode, continue execution instead of crashing the signup/forgot password flow
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ Continuing flow with mock SMTP delivery because we are in development.`);
      return { mock: true, messageId: 'mock-dev-error-id' };
    }
    throw error;
  }
};

export default sendEmail;
