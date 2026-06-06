const poConfirmationTemplate = ({ vendorName, poNumber, grandTotal, expectedDelivery, clientUrl }) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #111827; padding: 24px;">
  <h2 style="color: #4F46E5;">Purchase Order Confirmed — ${poNumber}</h2>
  <p>Dear ${vendorName},</p>
  <p>A Purchase Order has been issued to you. Please find the details below:</p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr><td style="padding: 8px; font-weight: bold;">PO Number:</td><td style="padding: 8px;">${poNumber}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Total Amount:</td><td style="padding: 8px;">₹${grandTotal.toLocaleString()}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Expected Delivery:</td><td style="padding: 8px;">${expectedDelivery ? new Date(expectedDelivery).toDateString() : 'TBD'}</td></tr>
  </table>
  <a href="${clientUrl}/purchase-orders/${poNumber}" style="background:#4F46E5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">View Purchase Order</a>
  <p style="margin-top: 24px; color: #6B7280;">VendorBridge Procurement Team</p>
</body>
</html>`;

module.exports = poConfirmationTemplate;
