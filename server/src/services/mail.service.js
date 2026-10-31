import { mailConfig, transporter } from '../config/mail.js';

/**
 * Sends a password reset email.
 *
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.name
 * @param {string} params.resetUrl
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = 'Reset Your Brightloop Password';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Hello ${name || 'there'},</p>
      <p>We received a request to reset your password for your Brightloop account. Click the button below to set a new password. This link is valid for 30 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b;">Or copy and paste this URL into your browser: <br />${resetUrl}</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
    });
  } else {
    // In dev / test when SMTP is not configured, log to console
    console.log(`\n📨 [Email Simulation - Password Reset]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset Link: ${resetUrl}\n`);
  }
};

/**
 * Sends an invitation / setup email to newly invited staff.
 *
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.name
 * @param {string} params.inviteUrl
 */
export const sendStaffInviteEmail = async ({ to, name, inviteUrl }) => {
  const subject = 'Welcome to Brightloop - Set Up Your Staff Account';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to Brightloop Staff Team</h2>
      <p>Hello ${name},</p>
      <p>You have been invited to join the Brightloop operations team. Click the link below to activate your account and choose your password.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Activate Account
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b;">Or copy and paste this URL into your browser: <br />${inviteUrl}</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
    });
  } else {
    console.log(`\n📨 [Email Simulation - Staff Invite]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Invite Link: ${inviteUrl}\n`);
  }
};
