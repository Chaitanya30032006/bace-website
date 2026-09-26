const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD // Gmail App Password
  }
});

async function sendPasswordResetEmail(toEmail, resetToken, userName) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password?token=${resetToken}`;

  const mailOptions = {
    from: `"BACE Devotee Portal" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: 'Password Reset Request - BACE Devotee Portal',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #c2410c; margin-bottom: 8px;">Hare Krishna${userName ? `, ${userName}` : ''}!</h2>
        <p style="color: #475569; font-size: 14px;">You requested a password reset for your BACE Devotee Portal account.</p>
        <p style="color: #475569; font-size: 14px;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 28px; background: linear-gradient(to right, #ea580c, #d97706); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
          — BACE Devotee Portal Team
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
