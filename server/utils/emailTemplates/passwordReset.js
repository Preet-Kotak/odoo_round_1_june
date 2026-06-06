const passwordResetTemplate = ({ name, resetUrl }) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #111827; padding: 24px;">
  <h2 style="color: #4F46E5;">Reset Your Password</h2>
  <p>Hi ${name},</p>
  <p>We received a request to reset your VendorBridge password. Click the button below to reset it. This link expires in 1 hour.</p>
  <a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Reset Password</a>
  <p style="margin-top: 16px; color: #6B7280;">If you didn't request this, you can safely ignore this email.</p>
  <p style="color: #6B7280;">VendorBridge Team</p>
</body>
</html>`;

module.exports = passwordResetTemplate;
