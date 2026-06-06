const invoiceApprovedTemplate = ({ vendorName, invoiceNumber, grandTotal }) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #111827; padding: 24px;">
  <h2 style="color: #16A34A;">Invoice Approved — ${invoiceNumber}</h2>
  <p>Dear ${vendorName},</p>
  <p>Your invoice <strong>${invoiceNumber}</strong> for ₹${grandTotal.toLocaleString()} has been approved and is being processed for payment.</p>
  <p style="color: #6B7280;">VendorBridge Procurement Team</p>
</body>
</html>`;

const invoiceRejectedTemplate = ({ vendorName, invoiceNumber, reason }) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #111827; padding: 24px;">
  <h2 style="color: #DC2626;">Invoice Rejected — ${invoiceNumber}</h2>
  <p>Dear ${vendorName},</p>
  <p>Your invoice <strong>${invoiceNumber}</strong> has been rejected for the following reason:</p>
  <blockquote style="border-left: 4px solid #DC2626; padding-left: 16px; color: #DC2626;">${reason}</blockquote>
  <p>Please review and resubmit the corrected invoice.</p>
  <p style="color: #6B7280;">VendorBridge Procurement Team</p>
</body>
</html>`;

module.exports = { invoiceApprovedTemplate, invoiceRejectedTemplate };
