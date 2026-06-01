import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter;

// Bootstrap Mailer securely. Uses mock console transporter in development if SMTP is unconfigured.
if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
  // Mock local SMTP for free sandbox offline developer testing
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
} else {
  // Production SMTP Server configuration
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

/**
 * Dispatches an Account Verification email
 */
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Secure Platform Team" <security@secureauth.com>',
    to: email,
    subject: 'Action Required: Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4F46E5; margin-bottom: 20px;">Welcome, ${name}!</h2>
        <p>Thank you for creating an account with us. To secure your profile, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 0.85rem; color: #666;">This link is valid for 24 hours. If you did not register for an account, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 0.8rem; color: #999; text-align: center;">Secure Auth Portal Inc.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (env.NODE_ENV === 'development') {
    // Write email to stdout to let developers complete tests offline without server configuration
    console.log('\n--- 📧 DEVELOPER MAIL INTERCEPTOR ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Verification Link`);
    console.log(`Verification URL: ${verifyUrl}`);
    console.log('-------------------------------------\n');
  }
}

/**
 * Dispatches a Password Reset link
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: '"Secure Platform Team" <security@secureauth.com>',
    to: email,
    subject: 'Action Required: Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #EF4444; margin-bottom: 20px;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the secure link below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 0.85rem; color: #666;">This link is valid for 1 hour. If you did not request this, please secure your account immediately.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 0.8rem; color: #999; text-align: center;">Secure Auth Portal Inc.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (env.NODE_ENV === 'development') {
    console.log('\n--- 📧 DEVELOPER MAIL INTERCEPTOR ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('-------------------------------------\n');
  }
}
