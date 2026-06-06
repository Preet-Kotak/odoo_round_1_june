const puppeteer = require('puppeteer');

const generatePdf = async (htmlContent) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
  });
  await browser.close();
  return pdfBuffer;
};

const generatePOPdf = async (po) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head><style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
    h1 { color: #4F46E5; } table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #F3F4F6; padding: 10px; text-align: left; border: 1px solid #E5E7EB; }
    td { padding: 10px; border: 1px solid #E5E7EB; }
    .total { font-weight: bold; font-size: 16px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
  </style></head>
  <body>
    <h1>PURCHASE ORDER</h1>
    <div class="header">
      <div><strong>PO Number:</strong> ${po.poNumber}<br><strong>Date:</strong> ${new Date(po.createdAt).toDateString()}</div>
      <div><strong>Status:</strong> ${po.status.toUpperCase()}</div>
    </div>
    <h3>Vendor Details</h3>
    <p>${po.vendorId?.companyName || ''}<br>${po.vendorId?.email || ''}<br>GST: ${po.vendorId?.gstNumber || ''}</p>
    <h3>Line Items</h3>
    <table>
      <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
      ${po.lineItems.map(item => `
        <tr>
          <td>${item.itemName}</td>
          <td>${item.quantity}</td>
          <td>₹${item.unitPrice.toLocaleString()}</td>
          <td>₹${item.totalPrice.toLocaleString()}</td>
        </tr>`).join('')}
    </table>
    <table style="width:300px;margin-left:auto;">
      <tr><td>Subtotal</td><td>₹${po.subtotal.toLocaleString()}</td></tr>
      <tr><td>Discount</td><td>₹${po.discount.toLocaleString()}</td></tr>
      <tr><td>Tax (GST ${po.taxRate}%)</td><td>₹${po.taxAmount.toLocaleString()}</td></tr>
      <tr class="total"><td>Grand Total</td><td>₹${po.grandTotal.toLocaleString()}</td></tr>
    </table>
    ${po.termsAndConditions ? `<h3>Terms & Conditions</h3><p>${po.termsAndConditions}</p>` : ''}
  </body></html>`;
  return generatePdf(html);
};

const generateInvoicePdf = async (invoice) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head><style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
    h1 { color: #4F46E5; } table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #F3F4F6; padding: 10px; text-align: left; border: 1px solid #E5E7EB; }
    td { padding: 10px; border: 1px solid #E5E7EB; }
    .total { font-weight: bold; font-size: 16px; }
  </style></head>
  <body>
    <h1>INVOICE</h1>
    <div>
      <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br>
      <strong>Date:</strong> ${new Date(invoice.createdAt).toDateString()}<br>
      <strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toDateString() : 'N/A'}<br>
      <strong>PO Reference:</strong> ${invoice.poId?.poNumber || ''}
    </div>
    <h3>Vendor</h3>
    <p>${invoice.vendorId?.companyName || ''}<br>GST: ${invoice.vendorId?.gstNumber || ''}</p>
    <h3>Line Items</h3>
    <table>
      <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
      ${invoice.lineItems.map(item => `
        <tr>
          <td>${item.itemName}</td>
          <td>${item.quantity}</td>
          <td>₹${item.unitPrice.toLocaleString()}</td>
          <td>₹${item.totalPrice.toLocaleString()}</td>
        </tr>`).join('')}
    </table>
    <table style="width:300px;margin-left:auto;">
      <tr><td>Subtotal</td><td>₹${invoice.subtotal.toLocaleString()}</td></tr>
      <tr><td>Discount</td><td>₹${invoice.discount.toLocaleString()}</td></tr>
      <tr><td>GST (${invoice.taxRate}%)</td><td>₹${invoice.taxAmount.toLocaleString()}</td></tr>
      <tr class="total"><td>Grand Total</td><td>₹${invoice.grandTotal.toLocaleString()}</td></tr>
    </table>
  </body></html>`;
  return generatePdf(html);
};

module.exports = { generatePOPdf, generateInvoicePdf };
