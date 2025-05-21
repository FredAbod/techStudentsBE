import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../../../utils/log/logger.js';

dotenv.config();

/**
 * Send password reset email with token
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @returns {Promise} - Email sending result
 */
export const sendPasswordResetEmail = async (email, token) => {
  try {
    // Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_NODEMAILER,
        pass: process.env.PASSWORD_NODEMAILER
      }
    });
    
    // Frontend URL for password reset page (this should be configurable)
    const resetUrl = `https://class-spark-achieve-certify.com/reset-password?token=${token}`;
    
    // Email content
    const mailOptions = {
      from: `Class Spark <${process.env.EMAIL_NODEMAILER}>`,
      to: email,
      subject: 'Password Reset for Class Spark',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a4a4a;">Password Reset Request</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <p>Hello,</p>
            <p>You requested a password reset for your Class Spark account. Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </div>
            <p>This link will expire in 30 minutes.</p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Thank you,<br>The Class Spark Team</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
            <p>© ${new Date().getFullYear()} Class Spark Achieve Certify. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
    throw new Error('Failed to send password reset email');
  }
};
