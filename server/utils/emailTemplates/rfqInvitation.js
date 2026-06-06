const rfqInvitationTemplate = ({ vendorName, rfqNumber, rfqTitle, deadline, clientUrl }) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #111827; padding: 24px;">
  <h2 style="color: #4F46E5;">New RFQ Invitation — ${rfqNumber}</h2>
  <p>Dear ${vendorName},</p>
  <p>You have been invited to submit a quotation for the following request:</p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr><td style="padding: 8px; font-weight: bold;">RFQ Number:</td><td style="padding: 8px;">${rfqNumber}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Title:</td><td style="padding: 8px;">${rfqTitle}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Response Deadline:</td><td style="padding: 8px;">${new Date(deadline).toDateString()}</td></tr>
  </table>
  <a href="${clientUrl}/quotations/submit/${rfqNumber}" style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Submit Quotation</a>
  <p style="margin-top: 24px; color: #6B7280;">VendorBridge Procurement Team</p>
</body>
</html>`;

module.exports = rfqInvitationTemplate;
